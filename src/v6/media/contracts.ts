export type MediaProviderKind = 'youtube' | 'native';

export type MediaPlaybackStatus =
  | 'idle'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'error';

export interface MediaSource {
  readonly id: string;
  readonly provider: MediaProviderKind;
  readonly externalId: string;
  readonly title: string;
  readonly durationSeconds?: number | null;
}

export interface MediaQueueEntry {
  readonly source: MediaSource;
  readonly resumeSeconds: number;
}

export interface MediaProviderCapabilities {
  readonly seek: boolean;
  readonly pictureInPicture: boolean;
}

export interface MediaProviderHandle {
  readonly load: (source: MediaSource, startAtSeconds: number) => void | Promise<void>;
  readonly play: () => void | Promise<void>;
  readonly pause: () => void | Promise<void>;
  readonly stop: () => void | Promise<void>;
  readonly seek: (seconds: number) => void | Promise<void>;
  readonly unload: () => void | Promise<void>;
  readonly requestPictureInPicture?: () => void | Promise<void>;
}

export interface MediaProviderAdapter {
  readonly kind: MediaProviderKind;
  readonly capabilities: MediaProviderCapabilities;
  readonly create: (instanceId: string) => MediaProviderHandle;
}

export interface MediaProviderRegistry {
  readonly list: () => readonly MediaProviderAdapter[];
  readonly get: (kind: MediaProviderKind) => MediaProviderAdapter | null;
  readonly require: (kind: MediaProviderKind) => MediaProviderAdapter;
}

export interface MediaInstanceState {
  readonly instanceId: string;
  readonly routeKey: string;
  readonly status: MediaPlaybackStatus;
  readonly queue: readonly MediaQueueEntry[];
  readonly index: number;
  readonly activeSource: MediaSource | null;
  readonly positionSeconds: number;
  readonly error: string;
}

export interface MediaSessionSnapshot {
  readonly activeAudibleInstanceId: string | null;
  readonly instances: readonly MediaInstanceState[];
}

export type MediaLifecycleEventType =
  | 'registered'
  | 'loaded'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'seeked'
  | 'advanced'
  | 'provider-switched'
  | 'picture-in-picture'
  | 'teardown'
  | 'unregistered'
  | 'error';

export interface MediaLifecycleEvent {
  readonly type: MediaLifecycleEventType;
  readonly instanceId: string;
  readonly provider: MediaProviderKind | null;
  readonly sourceId: string | null;
}

export type MediaLifecycleListener = (event: MediaLifecycleEvent, snapshot: MediaSessionSnapshot) => void;
