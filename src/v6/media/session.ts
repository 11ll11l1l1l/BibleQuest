import type {
  MediaInstanceState,
  MediaLifecycleEvent,
  MediaLifecycleEventType,
  MediaLifecycleListener,
  MediaProviderHandle,
  MediaProviderKind,
  MediaProviderRegistry,
  MediaQueueEntry,
  MediaSessionSnapshot,
  MediaSource,
} from './contracts.ts';
import { normalizeMediaSource } from './registry.ts';

const INSTANCE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$/;
const ROUTE_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_INSTANCES = 8;
const MAX_QUEUE_ITEMS = 100;
const MAX_POSITION_SECONDS = 604800;

interface MutableInstance {
  instanceId: string;
  routeKey: string;
  status: MediaInstanceState['status'];
  queue: MediaQueueEntry[];
  index: number;
  positionSeconds: number;
  error: string;
  providerKind: MediaProviderKind | null;
  handle: MediaProviderHandle | null;
}

function freezeEntry(entry: MediaQueueEntry): MediaQueueEntry {
  return Object.freeze({
    source: normalizeMediaSource(entry.source),
    resumeSeconds: entry.resumeSeconds,
  });
}

function normalizePosition(value: unknown, source: MediaSource | null): number {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > MAX_POSITION_SECONDS) {
    throw new Error('Media position is invalid.');
  }
  const duration = source?.durationSeconds;
  if (typeof duration === 'number' && seconds > duration) {
    throw new Error('Media position exceeds source duration.');
  }
  return seconds;
}

function normalizeQueue(input: readonly MediaQueueEntry[]): MediaQueueEntry[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_QUEUE_ITEMS) {
    throw new Error(`Media queue requires 1 to ${MAX_QUEUE_ITEMS} items.`);
  }
  const seen = new Set<string>();
  return input.map((entry) => {
    const source = normalizeMediaSource(entry?.source);
    if (seen.has(source.id)) throw new Error(`Duplicate media source id: ${source.id}.`);
    seen.add(source.id);
    const resumeSeconds = normalizePosition(entry?.resumeSeconds ?? 0, source);
    return freezeEntry({ source, resumeSeconds });
  });
}

function currentSource(entry: MutableInstance): MediaSource | null {
  return entry.queue[entry.index]?.source ?? null;
}

function freezeInstance(entry: MutableInstance): MediaInstanceState {
  return Object.freeze({
    instanceId: entry.instanceId,
    routeKey: entry.routeKey,
    status: entry.status,
    queue: Object.freeze(entry.queue.map(freezeEntry)),
    index: entry.index,
    activeSource: currentSource(entry),
    positionSeconds: entry.positionSeconds,
    error: entry.error,
  });
}

export function createMediaSessionManager(input: {
  readonly providers: MediaProviderRegistry;
  readonly maxInstances?: number;
}) {
  const providers = input?.providers;
  if (!providers) throw new Error('Media session manager requires a provider registry.');

  const requestedLimit = input.maxInstances ?? MAX_INSTANCES;
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > MAX_INSTANCES) {
    throw new Error(`Media session limit must be from 1 to ${MAX_INSTANCES}.`);
  }

  const instances = new Map<string, MutableInstance>();
  const listeners = new Set<MediaLifecycleListener>();
  let activeAudibleInstanceId: string | null = null;

  const snapshot = (): MediaSessionSnapshot => Object.freeze({
    activeAudibleInstanceId,
    instances: Object.freeze([...instances.values()].map(freezeInstance)),
  });

  const emit = (type: MediaLifecycleEventType, entry: MutableInstance) => {
    const source = currentSource(entry);
    const event: MediaLifecycleEvent = Object.freeze({
      type,
      instanceId: entry.instanceId,
      provider: entry.providerKind,
      sourceId: source?.id ?? null,
    });
    const state = snapshot();
    for (const listener of listeners) listener(event, state);
  };

  const requireInstance = (instanceId: string) => {
    const id = String(instanceId ?? '').trim();
    const entry = instances.get(id);
    if (!entry) throw new Error(`Unknown media instance: ${id || 'missing'}.`);
    return entry;
  };

  const markError = (entry: MutableInstance, error: unknown) => {
    entry.status = 'error';
    entry.error = error instanceof Error ? error.message : String(error || 'Media operation failed.');
    emit('error', entry);
  };

  const unloadHandle = async (entry: MutableInstance) => {
    if (!entry.handle) return;
    await entry.handle.unload();
    entry.handle = null;
    entry.providerKind = null;
  };

  const ensureProvider = async (entry: MutableInstance, provider: MediaProviderKind) => {
    if (entry.handle && entry.providerKind === provider) return entry.handle;

    const switched = entry.providerKind !== null && entry.providerKind !== provider;
    await unloadHandle(entry);
    const adapter = providers.require(provider);
    const handle = adapter.create(entry.instanceId);
    if (!handle || typeof handle.load !== 'function' || typeof handle.play !== 'function'
      || typeof handle.pause !== 'function' || typeof handle.stop !== 'function'
      || typeof handle.seek !== 'function' || typeof handle.unload !== 'function') {
      throw new Error(`Media provider ${provider} returned an invalid handle.`);
    }
    entry.handle = handle;
    entry.providerKind = provider;
    if (switched) emit('provider-switched', entry);
    return handle;
  };

  const loadCurrent = async (entry: MutableInstance) => {
    const queueEntry = entry.queue[entry.index];
    if (!queueEntry) throw new Error('Media instance has no active queue item.');
    const handle = await ensureProvider(entry, queueEntry.source.provider);
    await handle.load(queueEntry.source, queueEntry.resumeSeconds);
    entry.positionSeconds = queueEntry.resumeSeconds;
    entry.status = 'ready';
    entry.error = '';
    emit('loaded', entry);
  };

  const pauseAudibleIfNeeded = async (target: MutableInstance) => {
    if (!activeAudibleInstanceId || activeAudibleInstanceId === target.instanceId) return;
    const current = instances.get(activeAudibleInstanceId);
    if (!current) {
      activeAudibleInstanceId = null;
      return;
    }
    if (!current.handle) {
      activeAudibleInstanceId = null;
      current.status = 'paused';
      return;
    }
    try {
      await current.handle.pause();
      current.status = 'paused';
      current.error = '';
      activeAudibleInstanceId = null;
      emit('paused', current);
    } catch (error) {
      markError(current, error);
      throw error;
    }
  };

  async function register(instanceId: string, routeKey: string) {
    const id = String(instanceId ?? '').trim();
    const route = String(routeKey ?? '').trim();
    if (!INSTANCE_ID_PATTERN.test(id)) throw new Error('Media instance id is invalid.');
    if (!ROUTE_KEY_PATTERN.test(route)) throw new Error('Media route key is invalid.');
    if (instances.has(id)) throw new Error(`Media instance already registered: ${id}.`);
    if (instances.size >= requestedLimit) throw new Error('Media instance resource limit reached.');

    const entry: MutableInstance = {
      instanceId: id,
      routeKey: route,
      status: 'idle',
      queue: [],
      index: 0,
      positionSeconds: 0,
      error: '',
      providerKind: null,
      handle: null,
    };
    instances.set(id, entry);
    emit('registered', entry);
    return freezeInstance(entry);
  }

  async function setQueue(instanceId: string, queue: readonly MediaQueueEntry[], startIndex = 0) {
    const entry = requireInstance(instanceId);
    const normalized = normalizeQueue(queue);
    const index = Number(startIndex);
    if (!Number.isInteger(index) || index < 0 || index >= normalized.length) {
      throw new Error('Media queue start index is invalid.');
    }

    if (activeAudibleInstanceId === entry.instanceId) activeAudibleInstanceId = null;
    await unloadHandle(entry);
    entry.queue = normalized;
    entry.index = index;
    entry.positionSeconds = normalized[index].resumeSeconds;
    entry.status = 'idle';
    entry.error = '';
    await loadCurrent(entry);
    return freezeInstance(entry);
  }

  async function play(instanceId: string) {
    const entry = requireInstance(instanceId);
    if (!currentSource(entry)) throw new Error('Media instance has no queued source.');
    await pauseAudibleIfNeeded(entry);
    try {
      const handle = await ensureProvider(entry, currentSource(entry)!.provider);
      await handle.play();
      entry.status = 'playing';
      entry.error = '';
      activeAudibleInstanceId = entry.instanceId;
      emit('playing', entry);
      return freezeInstance(entry);
    } catch (error) {
      markError(entry, error);
      throw error;
    }
  }

  async function pause(instanceId: string) {
    const entry = requireInstance(instanceId);
    if (!entry.handle) throw new Error('Media instance is not loaded.');
    try {
      await entry.handle.pause();
      entry.status = 'paused';
      entry.error = '';
      if (activeAudibleInstanceId === entry.instanceId) activeAudibleInstanceId = null;
      emit('paused', entry);
      return freezeInstance(entry);
    } catch (error) {
      markError(entry, error);
      throw error;
    }
  }

  async function stop(instanceId: string) {
    const entry = requireInstance(instanceId);
    if (!entry.handle) throw new Error('Media instance is not loaded.');
    try {
      await entry.handle.stop();
      entry.status = 'stopped';
      entry.positionSeconds = 0;
      const current = entry.queue[entry.index];
      if (current) entry.queue[entry.index] = freezeEntry({ ...current, resumeSeconds: 0 });
      if (activeAudibleInstanceId === entry.instanceId) activeAudibleInstanceId = null;
      entry.error = '';
      emit('stopped', entry);
      return freezeInstance(entry);
    } catch (error) {
      markError(entry, error);
      throw error;
    }
  }

  async function seek(instanceId: string, seconds: number) {
    const entry = requireInstance(instanceId);
    const source = currentSource(entry);
    if (!entry.handle || !source) throw new Error('Media instance is not loaded.');
    const adapter = providers.require(source.provider);
    if (!adapter.capabilities.seek) throw new Error(`Media provider ${source.provider} does not support seeking.`);
    const position = normalizePosition(seconds, source);

    try {
      await entry.handle.seek(position);
      entry.positionSeconds = position;
      const current = entry.queue[entry.index];
      entry.queue[entry.index] = freezeEntry({ ...current, resumeSeconds: position });
      entry.error = '';
      emit('seeked', entry);
      return freezeInstance(entry);
    } catch (error) {
      markError(entry, error);
      throw error;
    }
  }

  function updatePosition(instanceId: string, seconds: number) {
    const entry = requireInstance(instanceId);
    const source = currentSource(entry);
    if (!source) throw new Error('Media instance has no active source.');
    const position = normalizePosition(seconds, source);
    entry.positionSeconds = position;
    const current = entry.queue[entry.index];
    entry.queue[entry.index] = freezeEntry({ ...current, resumeSeconds: position });
    return freezeInstance(entry);
  }

  async function move(instanceId: string, direction: 1 | -1) {
    const entry = requireInstance(instanceId);
    const nextIndex = entry.index + direction;
    if (nextIndex < 0 || nextIndex >= entry.queue.length) return freezeInstance(entry);

    if (activeAudibleInstanceId === entry.instanceId) activeAudibleInstanceId = null;
    await unloadHandle(entry);
    entry.index = nextIndex;
    entry.positionSeconds = entry.queue[nextIndex].resumeSeconds;
    entry.status = 'idle';
    entry.error = '';
    await loadCurrent(entry);
    emit('advanced', entry);
    return freezeInstance(entry);
  }

  const next = (instanceId: string) => move(instanceId, 1);
  const previous = (instanceId: string) => move(instanceId, -1);

  async function requestPictureInPicture(instanceId: string) {
    const entry = requireInstance(instanceId);
    const source = currentSource(entry);
    if (!entry.handle || !source) throw new Error('Media instance is not loaded.');
    const adapter = providers.require(source.provider);
    if (!adapter.capabilities.pictureInPicture || typeof entry.handle.requestPictureInPicture !== 'function') {
      throw new Error(`Media provider ${source.provider} does not support picture-in-picture.`);
    }
    await entry.handle.requestPictureInPicture();
    emit('picture-in-picture', entry);
    return freezeInstance(entry);
  }

  async function unregister(instanceId: string, eventType: MediaLifecycleEventType = 'unregistered') {
    const entry = requireInstance(instanceId);
    if (activeAudibleInstanceId === entry.instanceId) activeAudibleInstanceId = null;
    try {
      await unloadHandle(entry);
    } finally {
      instances.delete(entry.instanceId);
      emit(eventType, entry);
    }
  }

  async function teardownRoute(routeKey: string) {
    const route = String(routeKey ?? '').trim();
    const targets = [...instances.values()].filter((entry) => entry.routeKey === route);
    for (const entry of targets) await unregister(entry.instanceId, 'teardown');
    return snapshot();
  }

  function subscribe(listener: MediaLifecycleListener) {
    if (typeof listener !== 'function') throw new Error('Media lifecycle listener is required.');
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return Object.freeze({
    snapshot,
    register,
    unregister,
    setQueue,
    play,
    pause,
    stop,
    seek,
    updatePosition,
    next,
    previous,
    requestPictureInPicture,
    teardownRoute,
    subscribe,
  });
}
