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

export interface YouTubePlayerApi {
  Player: new (element: HTMLElement | string, options?: Record<string, unknown>) => YouTubePlayer;
}

export interface YouTubeIframeAdapterOptions {
  readonly api: YouTubePlayerApi | (() => YouTubePlayerApi | Promise<YouTubePlayerApi>);
  readonly resolveElement: (instanceId: string) => HTMLElement | string;
}

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{6,32}$/;

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

  return Object.freeze({
    kind: 'youtube' as const,
    capabilities: Object.freeze({ seek: true, pictureInPicture: false }),
    create(instanceId: string): MediaProviderHandle {
      const id = String(instanceId ?? '').trim();
      if (!id) throw new Error('YouTube adapter requires an instance id.');

      let player: YouTubePlayer | null = null;
      let disposed = false;

      const requirePlayer = () => {
        if (disposed) throw new Error('YouTube player handle is unloaded.');
        if (!player) throw new Error('YouTube player is not loaded.');
        return player;
      };

      const ensurePlayer = async () => {
        if (disposed) throw new Error('YouTube player handle is unloaded.');
        if (player) return player;
        const api = await resolveApi(options.api);
        const target = options.resolveElement(id);
        if (!target) throw new Error('YouTube player target is unavailable.');
        player = new api.Player(target, {
          playerVars: {
            enablejsapi: 1,
            playsinline: 1,
          },
        });
        return player;
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
          const current = player;
          player = null;
          current?.destroy();
        },
      });
    },
  });
}
