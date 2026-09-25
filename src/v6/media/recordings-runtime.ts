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
  const session = createMediaSessionManager({ providers, maxInstances: 1 });
  const baseAudio = createRecordingsAudioCompatibility({
    session,
    host,
    instanceId,
    routeKey,
  });

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
          if (id === instanceId) return baseAudio.pause();
          return session.pause(id);
        },
      },
      visibilityTarget,
      pageTarget,
    })
    : null;

  let disposed = false;
  const dispose = async () => {
    if (disposed) return baseAudio.getState();
    disposed = true;
    visibility?.dispose();
    await visibility?.flush();
    const state = await baseAudio.dispose();
    host.dispose();
    return state;
  };

  const audio = Object.freeze({
    getState: baseAudio.getState,
    mount: baseAudio.mount,
    play: baseAudio.play,
    pause: baseAudio.pause,
    stop: baseAudio.stop,
    seek: baseAudio.seek,
    unload: baseAudio.unload,
    dispose,
    flush: baseAudio.flush,
    getPlayerCount: baseAudio.getPlayerCount,
  });

  return Object.freeze({
    audio,
    session,
    host,
    visibility,
    dispose,
  });
}
