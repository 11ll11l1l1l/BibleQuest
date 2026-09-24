export type MediaProviderId = 'youtube';

export type MediaPlaybackStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'ended'
  | 'error'
  | 'destroyed';

export interface MediaSource {
  readonly provider: MediaProviderId;
  readonly mediaId: string;
  readonly title: string;
}

export interface MediaPlayerState {
  readonly instanceId: string;
  readonly source: MediaSource;
  readonly status: MediaPlaybackStatus;
  readonly positionSeconds: number;
  readonly error: string;
}

export interface MediaPlayerInstance {
  readonly instanceId: string;
  readonly source: MediaSource;
  getState(): MediaPlayerState;
  play(): void | Promise<void>;
  pause(): void | Promise<void>;
  stop(): void | Promise<void>;
  seek(seconds: number): void | Promise<void>;
  destroy(): void | Promise<void>;
  requestPictureInPicture?(): void | Promise<void>;
}

export interface MediaProviderCreateInput {
  readonly instanceId: string;
  readonly source: MediaSource;
  readonly host: unknown;
}

export interface MediaProviderAdapter {
  readonly id: MediaProviderId;
  canHandle(source: MediaSource): boolean;
  create(input: MediaProviderCreateInput): MediaPlayerInstance;
}
