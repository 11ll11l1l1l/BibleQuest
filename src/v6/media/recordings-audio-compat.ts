import type {
  MediaQueueEntry,
  MediaSessionSnapshot,
} from './contracts.ts';

export interface RecordingsAudioSource {
  readonly kind: 'youtube';
  readonly id: string;
  readonly title?: string;
}

export interface RecordingsAudioHostOwner {
  readonly mount: (instanceId: string, host: unknown) => void;
  readonly release: (instanceId: string) => void;
}

export interface RecordingsMediaSession {
  readonly snapshot: () => MediaSessionSnapshot;
  readonly register: (instanceId: string, routeKey: string) => void | Promise<unknown>;
  readonly unregister: (instanceId: string) => void | Promise<unknown>;
  readonly setQueue: (
    instanceId: string,
    queue: readonly MediaQueueEntry[],
    startIndex?: number,
  ) => void | Promise<unknown>;
  readonly play: (instanceId: string) => void | Promise<unknown>;
  readonly pause: (instanceId: string) => void | Promise<unknown>;
  readonly stop: (instanceId: string) => void | Promise<unknown>;
  readonly seek: (instanceId: string, seconds: number) => void | Promise<unknown>;
}

export interface RecordingsAudioState {
  readonly status: 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'stopped' | 'error';
  readonly source: RecordingsAudioSource | null;
  readonly position: number;
  readonly error: string;
  readonly instance: number;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,20}$/;

function freezeState(state: RecordingsAudioState): RecordingsAudioState {
  return Object.freeze({
    ...state,
    source: state.source ? Object.freeze({ ...state.source }) : null,
  });
}

function normalizeSource(input: RecordingsAudioSource): RecordingsAudioSource {
  if (!input || input.kind !== 'youtube' || !YOUTUBE_ID.test(String(input.id ?? ''))) {
    throw new Error('Recordings audio compatibility requires a valid YouTube source.');
  }
  return Object.freeze({
    kind: 'youtube',
    id: String(input.id),
    title: String(input.title || 'Recording').trim().slice(0, 180),
  });
}

export function createRecordingsAudioCompatibility(input: {
  readonly session: RecordingsMediaSession;
  readonly host: RecordingsAudioHostOwner;
  readonly instanceId?: string;
  readonly routeKey?: string;
}) {
  const session = input?.session;
  const hostOwner = input?.host;
  const instanceId = String(input?.instanceId || 'recordings-player').trim();
  const routeKey = String(input?.routeKey || 'recordings').trim();

  if (!session || typeof session.snapshot !== 'function') {
    throw new Error('Recordings audio compatibility requires a media session.');
  }
  if (!hostOwner
    || typeof hostOwner.mount !== 'function'
    || typeof hostOwner.release !== 'function') {
    throw new Error('Recordings audio compatibility requires a host owner.');
  }
  if (!instanceId || !routeKey) {
    throw new Error('Recordings audio compatibility requires instance and route identity.');
  }

  let disposed = false;
  let request = 0;
  let attached = false;
  let state = freezeState({
    status: 'idle',
    source: null,
    position: 0,
    error: '',
    instance: 0,
  });
  let tail: Promise<unknown> = Promise.resolve();

  const getState = () => state;
  const publish = (patch: Partial<RecordingsAudioState>) => {
    state = freezeState({ ...state, ...patch });
    return state;
  };
  const hasInstance = () => session.snapshot().instances.some(
    (entry) => entry.instanceId === instanceId,
  );
  const serialize = <T>(task: () => Promise<T>): Promise<T> => {
    const result = tail.then(task, task);
    tail = result.then(() => undefined, () => undefined);
    return result;
  };
  const safeUnregister = async () => {
    if (!hasInstance()) return;
    await session.unregister(instanceId);
  };
  const requireReady = () => {
    if (disposed) throw new Error('Recordings audio compatibility has been disposed.');
    if (!attached || !state.source) throw new Error('Choose a recording before using playback controls.');
  };

  function mount(host: unknown, sourceInput: RecordingsAudioSource) {
    if (disposed) return Promise.reject(new Error('Recordings audio compatibility has been disposed.'));
    const source = normalizeSource(sourceInput);
    const generation = ++request;
    const instance = state.instance + 1;

    hostOwner.mount(instanceId, host);
    attached = false;
    publish({
      status: 'loading',
      source,
      position: 0,
      error: '',
      instance,
    });

    return serialize(async () => {
      if (disposed || generation !== request) return getState();

      try {
        await safeUnregister();
        if (disposed || generation !== request) return getState();

        await session.register(instanceId, routeKey);
        if (disposed || generation !== request) {
          await safeUnregister();
          return getState();
        }

        const queue: readonly MediaQueueEntry[] = Object.freeze([
          Object.freeze({
            source: Object.freeze({
              id: `recording-${source.id}`,
              provider: 'youtube' as const,
              externalId: source.id,
              title: source.title || 'Recording',
              durationSeconds: null,
            }),
            resumeSeconds: 0,
          }),
        ]);

        await session.setQueue(instanceId, queue, 0);
        if (disposed || generation !== request) {
          await safeUnregister();
          return getState();
        }

        attached = true;
        return publish({
          status: 'ready',
          source,
          position: 0,
          error: '',
          instance,
        });
      } catch (error) {
        attached = false;
        try {
          await safeUnregister();
        } catch {
          // Host cleanup remains authoritative even if provider teardown fails.
        }
        if (generation === request && !disposed) {
          hostOwner.release(instanceId);
          publish({
            status: 'error',
            source,
            position: 0,
            error: error instanceof Error ? error.message : String(error || 'Recording player failed.'),
            instance,
          });
        }
        throw error;
      }
    });
  }

  function playback(
    operation: 'play' | 'pause' | 'stop',
    status: RecordingsAudioState['status'],
  ) {
    requireReady();
    return serialize(async () => {
      requireReady();
      await session[operation](instanceId);
      return publish({
        status,
        position: operation === 'stop' ? 0 : state.position,
        error: '',
      });
    });
  }

  function seek(seconds: number) {
    requireReady();
    const position = Number(seconds);
    if (!Number.isFinite(position) || position < 0 || position > 86400) {
      return Promise.reject(new Error('Seek position must be from 0 to 86400 seconds.'));
    }
    return serialize(async () => {
      requireReady();
      await session.seek(instanceId, position);
      return publish({ position, error: '' });
    });
  }

  function unload() {
    request += 1;
    attached = false;
    hostOwner.release(instanceId);
    publish({ status: 'idle', source: null, position: 0, error: '' });

    return serialize(async () => {
      try {
        await safeUnregister();
      } catch {
        // The visible host is already released. Route cleanup must remain
        // fail-safe even if a provider teardown reports an error.
      }
      return getState();
    });
  }

  function dispose() {
    if (disposed) return Promise.resolve(getState());
    const cleanup = unload();
    disposed = true;
    return cleanup;
  }

  return Object.freeze({
    getState,
    mount,
    play: () => playback('play', 'playing'),
    pause: () => playback('pause', 'paused'),
    stop: () => playback('stop', 'stopped'),
    seek,
    unload,
    dispose,
    flush: () => tail,
    getPlayerCount: () => (attached ? 1 : 0),
  });
}
