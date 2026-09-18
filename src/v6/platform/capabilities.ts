export interface CapabilityEnvironment {
  readonly navigator?: {
    readonly userAgent?: string;
    readonly standalone?: boolean;
    readonly serviceWorker?: unknown;
    readonly share?: unknown;
    readonly canShare?: unknown;
    readonly clipboard?: { readonly writeText?: unknown };
    readonly storage?: { readonly persist?: unknown; readonly estimate?: unknown };
    readonly setAppBadge?: unknown;
    readonly clearAppBadge?: unknown;
  };
  readonly Notification?: unknown;
  readonly PushManager?: unknown;
  readonly matchMedia?: (query: string) => { readonly matches?: boolean };
}

export interface ClientCapabilities {
  readonly serviceWorker: boolean;
  readonly notifications: boolean;
  readonly push: boolean;
  readonly nativeShare: boolean;
  readonly clipboardWrite: boolean;
  readonly persistentStorage: boolean;
  readonly storageEstimate: boolean;
  readonly appBadge: boolean;
  readonly standalone: boolean;
  readonly ios: boolean;
}

function functionAvailable(value: unknown): boolean {
  return typeof value === 'function';
}

export function detectClientCapabilities(environment: CapabilityEnvironment = globalThis as CapabilityEnvironment): ClientCapabilities {
  const navigator = environment.navigator;
  const ua = String(navigator?.userAgent ?? '');
  const ios = /iPad|iPhone|iPod/i.test(ua) || (navigator?.standalone !== undefined && /Mac/i.test(ua));
  let mediaStandalone = false;
  try {
    mediaStandalone = Boolean(environment.matchMedia?.('(display-mode: standalone)')?.matches);
  } catch {}

  return Object.freeze({
    serviceWorker: Boolean(navigator?.serviceWorker),
    notifications: Boolean(environment.Notification),
    push: Boolean(environment.PushManager),
    nativeShare: functionAvailable(navigator?.share),
    clipboardWrite: functionAvailable(navigator?.clipboard?.writeText),
    persistentStorage: functionAvailable(navigator?.storage?.persist),
    storageEstimate: functionAvailable(navigator?.storage?.estimate),
    appBadge: functionAvailable(navigator?.setAppBadge) && functionAvailable(navigator?.clearAppBadge),
    standalone: Boolean(navigator?.standalone) || mediaStandalone,
    ios,
  });
}
