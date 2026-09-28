import { createMediaProviderRegistry } from './registry.ts';
import { createRecordingsAudioCompatibility, type RecordingsAudioHostOwner } from './recordings-audio-compat.ts';
import { createMediaSessionManager } from './session.ts';
import {
  createMediaVisibilityLifecycle,
  type MediaLifecycleEventTarget,
  type MediaVisibilityTarget,
} from './visibility-lifecycle.ts';
import {
  createYouTubeIframeAdapter,
  type YouTubeIframeAdapterOptions,
} from './youtube-iframe-adapter.ts';
import {
  loadYouTubeIframeApi,
  type YouTubeIframeApiGlobal,
} from './youtube-iframe-loader.ts';

interface HostElementLike {
  readonly replaceChildren: (...nodes: unknown[]) => void;
  readonly getAttribute: (name: string) => string | null;
  readonly setAttribute: (name: string, value: string) => void;
  readonly removeAttribute: (name: string) => void;
}

interface TargetElementLike extends HTMLElement {
  dataset: DOMStringMap;
}

export interface RecordingsMediaHostOwner extends RecordingsAudioHostOwner {
  readonly resolve: (instanceId: string) => HTMLElement;
  readonly dispose: () => void;
  readonly getTargetCount: () => number;
}

export interface RecordingsMediaRuntimeOptions {
  readonly document?: Document;
  readonly global?: YouTubeIframeApiGlobal;
  readonly visibilityTarget?: MediaVisibilityTarget | null;
  readonly pageTarget?: MediaLifecycleEventTarget | null;
  readonly enableVisibilityLifecycle?: boolean;
  readonly apiLoadTimeoutMs?: number;
  readonly playerReadyTimeoutMs?: number;
  readonly setTimeout?: YouTubeIframeAdapterOptions['setTimeout'];
  readonly clearTimeout?: YouTubeIframeAdapterOptions['clearTimeout'];
  readonly instanceId?: string;
  readonly routeKey?: string;
  /** Maximum mounted session instances. The media manager enforces its own hard cap. */
  readonly maxInstances?: number;
  readonly sessionOwner?: () => string;
  readonly storage?: {
    readonly read: (key: string, fallback?: unknown) => unknown;
    readonly write: (key: string, value: unknown) => unknown;
  };
  readonly positionPollMs?: number;
}

const HOST_OWNER_ATTRIBUTE = 'data-bq-media-host-owner';

function isHostElement(value: unknown): value is HostElementLike {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<HostElementLike>;
  return typeof candidate.replaceChildren === 'function'
    && typeof candidate.getAttribute === 'function'
    && typeof candidate.setAttribute === 'function'
    && typeof candidate.removeAttribute === 'function';
}

function browserDocument(): Document | undefined {
  return globalThis.document;
}

function browserGlobal(): YouTubeIframeApiGlobal {
  return globalThis as unknown as YouTubeIframeApiGlobal;
}

function browserPageTarget(): MediaLifecycleEventTarget | null {
  const candidate = globalThis as unknown as Partial<MediaLifecycleEventTarget>;
  if (typeof candidate.addEventListener !== 'function'
    || typeof candidate.removeEventListener !== 'function') return null;
  return candidate as MediaLifecycleEventTarget;
}

export function createRecordingsMediaHostOwner(input: {
  readonly document: Document;
}): RecordingsMediaHostOwner {
  const document = input?.document;
  if (!document || typeof document.createElement !== 'function') {
    throw new Error('Recordings Media host owner requires a document.');
  }

  const entries = new Map<string, {
    readonly host: HostElementLike;
    readonly target: HTMLElement;
  }>();

  const release = (instanceId: string) => {
    const id = String(instanceId ?? '').trim();
    const entry = entries.get(id);
    if (!entry) return;
    entries.delete(id);

    if (entry.host.getAttribute(HOST_OWNER_ATTRIBUTE) === id) {
      entry.host.replaceChildren();
      entry.host.removeAttribute(HOST_OWNER_ATTRIBUTE);
    }
  };

  return Object.freeze({
    mount(instanceId: string, rawHost: unknown) {
      const id = String(instanceId ?? '').trim();
      if (!id) throw new Error('Recordings Media host requires an instance id.');
      if (!isHostElement(rawHost)) throw new Error('Recordings Media host is invalid.');

      release(id);
      const target = document.createElement('div') as TargetElementLike;
      target.dataset.bqMediaTarget = id;
      target.setAttribute('data-bq-media-target', id);
      target.setAttribute('aria-label', 'YouTube video player');

      rawHost.setAttribute(HOST_OWNER_ATTRIBUTE, id);
      rawHost.replaceChildren(target);
      entries.set(id, Object.freeze({ host: rawHost, target }));
    },
    release,
    resolve(instanceId: string) {
      const id = String(instanceId ?? '').trim();
      const target = entries.get(id)?.target;
      if (!target) throw new Error('Recordings Media player target is unavailable.');
      return target;
    },
    dispose() {
      for (const id of [...entries.keys()]) release(id);
    },
    getTargetCount: () => entries.size,
  });
}

export function createRecordingsMediaRuntime(
  options: RecordingsMediaRuntimeOptions = {},
) {
  const document = options.document ?? browserDocument();
  if (!document) throw new Error('Recordings Media runtime requires a browser document.');

  const global = options.global ?? browserGlobal();
  const instanceId = String(options.instanceId || 'recordings-player').trim();
  const routeKey = String(options.routeKey || 'recordings').trim();
  if (!instanceId || !routeKey) {
    throw new Error('Recordings Media runtime requires instance and route identity.');
  }

  const host = createRecordingsMediaHostOwner({ document });
  const youtube = createYouTubeIframeAdapter({
    api: () => loadYouTubeIframeApi({
      global,
      document,
      timeoutMs: options.apiLoadTimeoutMs,
      setTimeout: options.setTimeout,
      clearTimeout: options.clearTimeout,
    }),
    resolveElement: (id) => host.resolve(id),
    readyTimeoutMs: options.playerReadyTimeoutMs,
    setTimeout: options.setTimeout,
    clearTimeout: options.clearTimeout,
  });
  const providers = createMediaProviderRegistry([youtube]);
  const maxInstances = options.maxInstances ?? 4;
  const session = createMediaSessionManager({ providers, maxInstances });
  const positionPollMs = options.positionPollMs ?? 5000;
  if (!Number.isInteger(positionPollMs) || positionPollMs < 1000 || positionPollMs > 60000) {
    throw new Error('Media position polling interval must be from 1000 to 60000 milliseconds.');
  }
  const owner = () => String(options.sessionOwner?.() || 'guest').trim().slice(0, 160) || 'guest';
  const playbackOwners = new Map<string, string>();
  const audioInstances = new Map<string, ReturnType<typeof createRecordingsAudioCompatibility>>();
  const retiredInstanceIds = new Set<string>();
  const positionKey = (ownerId: string, sourceId: string) => `recordings-resume:${encodeURIComponent(ownerId)}:${encodeURIComponent(sourceId)}`;
  const loadPosition = (instance: string, sourceId: string, ownerId = playbackOwners.get(instance) ?? owner()) => {
    if (!sourceId || sourceId.length > 180) return 0;
    const key = positionKey(ownerId, sourceId);
    let saved: { owner?: unknown; sourceId?: unknown; seconds?: unknown } | null = null;
    try {
      saved = options.storage?.read(key, null) as { owner?: unknown; sourceId?: unknown; seconds?: unknown } | null;
    } catch {
      return 0;
    }
    const seconds = Number(saved?.seconds);
    if (saved?.owner === ownerId && saved?.sourceId === sourceId && Number.isFinite(seconds) && seconds >= 0 && seconds <= 604800) {
      return seconds;
    }
    return 0;
  };
  const persistPosition = (id: string, snapshot = session.snapshot()) => {
    const current = snapshot.instances.find((entry) => entry.instanceId === id);
    const source = current?.activeSource;
    if (!current || !source) return;
    const ownerId = playbackOwners.get(id) ?? owner();
    const sourceId = source.externalId;
    const key = positionKey(ownerId, sourceId);
    const seconds = current.positionSeconds;
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 604800) return;
    try {
      options.storage?.write(key, { schema: 1, owner: ownerId, sourceId, seconds });
    } catch {
      // Playback remains available when device storage is full or unavailable.
    }
  };
  const unsubscribeSession = session.subscribe((event, snapshot) => {
    if (['paused', 'stopped', 'seeked', 'position', 'unregistered', 'teardown'].includes(event.type)) {
      persistPosition(event.instanceId, snapshot);
    }
    if (event.type === 'stopped') {
      const source = snapshot.instances.find((entry) => entry.instanceId === event.instanceId)?.activeSource;
      if (source) {
        const ownerId = playbackOwners.get(event.instanceId) ?? owner();
        const sourceId = source.externalId;
        const key = positionKey(ownerId, sourceId);
        try {
          options.storage?.write(key, { schema: 1, owner: ownerId, sourceId, seconds: 0 });
        } catch {
          // Resetting playback must not fail when device storage is unavailable.
        }
      }
    }
  });
  const createAudio = (id: string, route: string) => {
    if (audioInstances.has(id) || retiredInstanceIds.has(id)) throw new Error(`Media audio instance id cannot be reused: ${id}`);
    if (audioInstances.size >= maxInstances) throw new Error(`Media runtime supports at most ${maxInstances} audio instances.`);
    const base = createRecordingsAudioCompatibility({
      session,
      host,
      instanceId: id,
      routeKey: route,
      getResumeSeconds: (sourceId) => loadPosition(id, sourceId),
    });
    const audio = Object.freeze({
      getState() {
        const state = base.getState();
        const current = session.snapshot().instances.find((entry) => entry.instanceId === id);
        return current
          ? Object.freeze({ ...state, status: current.status, position: current.positionSeconds })
          : state;
      },
      getSavedPosition(sourceId: string) {
        // A UI lookup always uses the currently authenticated owner. Do not let
        // a stale instance expose the previous account's resume data after A→B.
        return loadPosition(id, String(sourceId ?? '').trim(), owner());
      },
      mount(hostElement: unknown, source: Parameters<typeof base.mount>[1]) {
        // Bind progress to the identity that initiated this source load. An account
        // switch during playback must not move resume data to the next account.
        playbackOwners.set(id, owner());
        return base.mount(hostElement, source);
      },
      play: base.play,
      pause: base.pause,
      stop: base.stop,
      seek: base.seek,
      unload: base.unload,
      async dispose() {
        const state = await base.dispose();
        if (id !== instanceId && audioInstances.get(id) === audio) {
          audioInstances.delete(id);
          retiredInstanceIds.add(id);
          playbackOwners.delete(id);
        }
        return state;
      },
      flush: base.flush,
      getPlayerCount: base.getPlayerCount,
    });
    audioInstances.set(id, audio);
    return audio;
  };
  const baseAudio = createAudio(instanceId, routeKey);

  const enableVisibility = options.enableVisibilityLifecycle !== false;
  const visibilityTarget = options.visibilityTarget === null
    ? null
    : options.visibilityTarget ?? (
      typeof (document as unknown as Partial<MediaVisibilityTarget>).addEventListener === 'function'
        ? document as unknown as MediaVisibilityTarget
        : null
    );
  const pageTarget = options.pageTarget === null
    ? null
    : options.pageTarget ?? browserPageTarget() ?? visibilityTarget;

  const visibility = enableVisibility && visibilityTarget && pageTarget
    ? createMediaVisibilityLifecycle({
      session: {
        snapshot: session.snapshot,
        pause(id: string) {
          const player = audioInstances.get(id);
          if (player?.getPlayerCount()) return player.pause();
          return session.pause(id);
        },
      },
      visibilityTarget,
      pageTarget,
    })
    : null;

  let disposed = false;
  const poll = globalThis.setInterval(() => {
    const current = session.snapshot();
    for (const player of current.instances) {
      if (player.status !== 'playing') continue;
      try {
        session.samplePosition(player.instanceId);
        persistPosition(player.instanceId);
      } catch {
        // A provider position read must not interrupt playback or the runtime loop.
      }
    }
  }, positionPollMs);
  const dispose = async () => {
    if (disposed) return baseAudio.getState();
    disposed = true;
    globalThis.clearInterval(poll);
    for (const id of audioInstances.keys()) {
      try {
        session.samplePosition(id);
        persistPosition(id);
      } catch {
        // A runtime may be disposed before its media instance was registered.
      }
    }
    unsubscribeSession();
    visibility?.dispose();
    await visibility?.flush();
    let state = baseAudio.getState();
    for (const [id, player] of audioInstances) {
      const next = await player.dispose();
      if (id === instanceId) state = next;
    }
    host.dispose();
    return state;
  };

  const audio = Object.freeze({ ...baseAudio, dispose });

  return Object.freeze({
    audio,
    createAudioInstance(id: string, route = routeKey) {
      const normalizedId = String(id ?? '').trim();
      const normalizedRoute = String(route ?? '').trim();
      if (!normalizedId || !normalizedRoute) throw new Error('Media audio instance requires instance and route identity.');
      if (normalizedId === instanceId) throw new Error('Media audio instance id is reserved for the primary player.');
      if (disposed) throw new Error('Media runtime has been disposed.');
      return createAudio(normalizedId, normalizedRoute);
    },
    session,
    host,
    visibility,
    dispose,
  });
}
