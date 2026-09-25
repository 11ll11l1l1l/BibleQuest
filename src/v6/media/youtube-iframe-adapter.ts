import type { MediaProviderAdapter, MediaProviderHandle, MediaSource } from './contracts.ts';

export interface YouTubePlayer {
  cueVideoById(input: { videoId: string; startSeconds?: number }): void;
  loadVideoById(input: { videoId: string; startSeconds?: number }): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
}

export interface YouTubePlayerReadyEvent {
  readonly target: YouTubePlayer;
}

export interface YouTubePlayerErrorEvent {
  readonly target?: YouTubePlayer;
  readonly data?: number;
}

export interface YouTubePlayerApi {
  Player: new (element: HTMLElement | string, options?: Record<string, unknown>) => YouTubePlayer;
}

export interface YouTubeIframeAdapterOptions {
  readonly api: YouTubePlayerApi | (() => YouTubePlayerApi | Promise<YouTubePlayerApi>);
  readonly resolveElement: (instanceId: string) => HTMLElement | string;
  readonly readyTimeoutMs?: number;
  readonly setTimeout?: (callback: () => void, milliseconds: number) => unknown;
  readonly clearTimeout?: (handle: unknown) => void;
}

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{6,32}$/;
const DEFAULT_READY_TIMEOUT_MS = 15000;
const MAX_READY_TIMEOUT_MS = 60000;

function normalizeYouTubeId(source: MediaSource): string {
  if (source.provider !== 'youtube') throw new Error('YouTube adapter requires a YouTube source.');
  const videoId = String(source.externalId ?? '').trim();
  if (!YOUTUBE_ID_PATTERN.test(videoId)) throw new Error('YouTube source id is invalid.');
  return videoId;
}

function normalizeStart(value: number): number {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 604800) {
    throw new Error('YouTube start position is invalid.');
  }
  return seconds;
}

function normalizeReadyTimeout(value: number | undefined): number {
  const milliseconds = value ?? DEFAULT_READY_TIMEOUT_MS;
  if (!Number.isInteger(milliseconds) || milliseconds < 1 || milliseconds > MAX_READY_TIMEOUT_MS) {
    throw new Error(`YouTube player ready timeout must be from 1 to ${MAX_READY_TIMEOUT_MS} milliseconds.`);
  }
  return milliseconds;
}

async function resolveApi(
  input: YouTubeIframeAdapterOptions['api'],
): Promise<YouTubePlayerApi> {
  const api = typeof input === 'function' ? await input() : input;
  if (!api || typeof api.Player !== 'function') {
    throw new Error('YouTube IFrame Player API is unavailable.');
  }
  return api;
}

export function createYouTubeIframeAdapter(
  options: YouTubeIframeAdapterOptions,
): MediaProviderAdapter {
  if (!options || !options.api || typeof options.resolveElement !== 'function') {
    throw new Error('YouTube adapter requires API and element resolution.');
  }

  const readyTimeoutMs = normalizeReadyTimeout(options.readyTimeoutMs);
  const schedule = options.setTimeout
    ?? ((callback: () => void, milliseconds: number) => globalThis.setTimeout(callback, milliseconds));
  const cancel = options.clearTimeout
    ?? ((handle: unknown) => globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>));

  return Object.freeze({
    kind: 'youtube' as const,
    capabilities: Object.freeze({ seek: true, pictureInPicture: false }),
    create(instanceId: string): MediaProviderHandle {
      const id = String(instanceId ?? '').trim();
      if (!id) throw new Error('YouTube adapter requires an instance id.');

      let player: YouTubePlayer | null = null;
      let candidate: YouTubePlayer | null = null;
      let pending: Promise<YouTubePlayer> | null = null;
      let rejectPending: ((error: Error) => void) | null = null;
      let disposed = false;

      const requirePlayer = () => {
        if (disposed) throw new Error('YouTube player handle is unloaded.');
        if (!player) throw new Error('YouTube player is not loaded.');
        return player;
      };

      const ensurePlayer = async () => {
        if (disposed) throw new Error('YouTube player handle is unloaded.');
        if (player) return player;
        if (pending) return pending;

        pending = (async () => {
          const api = await resolveApi(options.api);
          if (disposed) throw new Error('YouTube player handle is unloaded.');

          const target = options.resolveElement(id);
          if (!target) throw new Error('YouTube player target is unavailable.');

          return new Promise<YouTubePlayer>((resolve, reject) => {
            let settled = false;
            let timer: unknown = null;

            const cleanup = () => {
              if (timer !== null) {
                cancel(timer);
                timer = null;
              }
              rejectPending = null;
            };

            const fail = (error: Error) => {
              if (settled) return;
              settled = true;
              cleanup();
              const current = candidate;
              candidate = null;
              try {
                current?.destroy();
              } catch {
                // A readiness failure must still reject even if provider cleanup fails.
              }
              reject(error);
            };

            const ready = (event: YouTubePlayerReadyEvent) => {
              if (settled) return;
              const current = event?.target ?? candidate;
              if (!current) {
                fail(new Error('YouTube player became ready without a player instance.'));
                return;
              }
              if (disposed) {
                candidate = current;
                fail(new Error('YouTube player handle is unloaded.'));
                return;
              }
              settled = true;
              cleanup();
              candidate = current;
              player = current;
              resolve(current);
            };

            rejectPending = fail;
            timer = schedule(
              () => fail(new Error('YouTube player timed out before becoming ready.')),
              readyTimeoutMs,
            );

            try {
              const created = new api.Player(target, {
                playerVars: {
                  enablejsapi: 1,
                  playsinline: 1,
                },
                events: {
                  onReady: ready,
                  onError: (event: YouTubePlayerErrorEvent) => {
                    const code = Number.isFinite(Number(event?.data)) ? String(event?.data) : 'unknown';
                    fail(new Error(`YouTube player failed before ready (code ${code}).`));
                  },
                },
              });
              candidate = created;
              if (disposed) fail(new Error('YouTube player handle is unloaded.'));
            } catch (error) {
              fail(error instanceof Error ? error : new Error(String(error || 'YouTube player creation failed.')));
            }
          });
        })();

        try {
          return await pending;
        } catch (error) {
          pending = null;
          throw error;
        }
      };

      return Object.freeze({
        async load(source: MediaSource, startAtSeconds: number) {
          const videoId = normalizeYouTubeId(source);
          const startSeconds = normalizeStart(startAtSeconds);
          const current = await ensurePlayer();
          current.cueVideoById({ videoId, startSeconds });
        },
        play() {
          requirePlayer().playVideo();
        },
        pause() {
          requirePlayer().pauseVideo();
        },
        stop() {
          requirePlayer().stopVideo();
        },
        seek(seconds: number) {
          requirePlayer().seekTo(normalizeStart(seconds), true);
        },
        unload() {
          if (disposed) return;
          disposed = true;
          const current = player ?? candidate;
          player = null;
          candidate = null;
          pending = null;
          const reject = rejectPending;
          rejectPending = null;
          reject?.(new Error('YouTube player handle is unloaded.'));
          try {
            current?.destroy();
          } catch {
            // Unload is idempotent and must not retain a half-created player.
          }
        },
      });
    },
  });
}
