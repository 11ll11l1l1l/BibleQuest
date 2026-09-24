import type {
  MediaPlayerInstance,
  MediaPlayerState,
  MediaProviderAdapter,
  MediaProviderCreateInput,
  MediaSource,
} from './contracts.ts';

const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,20}$/;

export interface YouTubeIframePlayerLike {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  destroy(): void;
  getCurrentTime?(): number;
}

export interface YouTubeIframePlayerEvents {
  readonly onReady: () => void;
  readonly onStateChange: (state: number) => void;
  readonly onError: (code?: number) => void;
}

export type YouTubeIframePlayerFactory = (input: {
  readonly host: unknown;
  readonly videoId: string;
  readonly title: string;
  readonly events: YouTubeIframePlayerEvents;
}) => YouTubeIframePlayerLike;

function normalizeSource(source: MediaSource): MediaSource {
  const mediaId = String(source?.mediaId ?? '').trim();
  const title = String(source?.title ?? '').trim().slice(0, 180);
  if (source?.provider !== 'youtube' || !YOUTUBE_ID.test(mediaId)) {
    throw new Error('YouTube media source is invalid.');
  }
  if (!title) throw new Error('YouTube media source requires a title.');
  return Object.freeze({ provider: 'youtube', mediaId, title });
}

function statusFromYouTubeState(value: number): MediaPlayerState['status'] {
  if (value === 0) return 'ended';
  if (value === 1) return 'playing';
  if (value === 2) return 'paused';
  if (value === 3) return 'loading';
  if (value === 5) return 'ready';
  return 'ready';
}

export function createYouTubeIframeProviderAdapter({
  createPlayer,
}: {
  readonly createPlayer: YouTubeIframePlayerFactory;
}): MediaProviderAdapter {
  if (typeof createPlayer !== 'function') throw new Error('YouTube IFrame provider requires a player factory.');

  return Object.freeze({
    id: 'youtube' as const,
    canHandle(source: MediaSource) {
      return source?.provider === 'youtube' && YOUTUBE_ID.test(String(source.mediaId ?? ''));
    },
    create(input: MediaProviderCreateInput): MediaPlayerInstance {
      const instanceId = String(input?.instanceId ?? '').trim();
      if (!instanceId || instanceId.length > 100) throw new Error('Media instance id is invalid.');
      const source = normalizeSource(input.source);
      let destroyed = false;
      let state: MediaPlayerState = Object.freeze({
        instanceId,
        source,
        status: 'loading',
        positionSeconds: 0,
        error: '',
      });

      const publish = (patch: Partial<MediaPlayerState>) => {
        state = Object.freeze({ ...state, ...patch });
        return state;
      };
      const ensureAlive = () => {
        if (destroyed) throw new Error('Media player has been destroyed.');
      };

      const player = createPlayer({
        host: input.host,
        videoId: source.mediaId,
        title: source.title,
        events: Object.freeze({
          onReady: () => {
            if (!destroyed) publish({ status: 'ready', error: '' });
          },
          onStateChange: (youtubeState: number) => {
            if (!destroyed) {
              const position = Number(player.getCurrentTime?.());
              publish({
                status: statusFromYouTubeState(Number(youtubeState)),
                positionSeconds: Number.isFinite(position) && position >= 0 ? position : state.positionSeconds,
              });
            }
          },
          onError: (code?: number) => {
            if (!destroyed) publish({ status: 'error', error: `YouTube player error ${Number(code) || 0}.` });
          },
        }),
      });

      return Object.freeze({
        instanceId,
        source,
        getState: () => state,
        play() {
          ensureAlive();
          player.playVideo();
          publish({ status: 'playing', error: '' });
        },
        pause() {
          ensureAlive();
          player.pauseVideo();
          publish({ status: 'paused', error: '' });
        },
        stop() {
          ensureAlive();
          player.stopVideo();
          publish({ status: 'stopped', positionSeconds: 0, error: '' });
        },
        seek(seconds: number) {
          ensureAlive();
          const value = Number(seconds);
          if (!Number.isFinite(value) || value < 0 || value > 86400) {
            throw new Error('Media seek position must be between 0 and 86400 seconds.');
          }
          player.seekTo(value, true);
          publish({ positionSeconds: value, error: '' });
        },
        destroy() {
          if (destroyed) return;
          destroyed = true;
          player.destroy();
          publish({ status: 'destroyed', error: '' });
        },
      });
    },
  });
}
