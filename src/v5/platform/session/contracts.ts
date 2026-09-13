export type SessionStatus = 'booting' | 'guest' | 'authenticated' | 'unavailable';

export interface SessionUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
}

export interface SessionSnapshot {
  readonly status: SessionStatus;
  readonly authenticated: boolean;
  readonly remoteAvailable: boolean;
  readonly user: SessionUser | null;
  readonly error: string;
}

export interface SessionSource {
  read(): Promise<SessionSnapshot>;
  subscribe?(listener: (snapshot: SessionSnapshot) => void): () => void;
}

export interface SessionService {
  boot(): Promise<SessionSnapshot>;
  getSnapshot(): SessionSnapshot;
  subscribe(listener: (snapshot: SessionSnapshot) => void): () => void;
  dispose(): void;
}

export const guestSession = (remoteAvailable = true, error = ''): SessionSnapshot => Object.freeze({
  status: remoteAvailable ? 'guest' : 'unavailable',
  authenticated: false,
  remoteAvailable,
  user: null,
  error
});
