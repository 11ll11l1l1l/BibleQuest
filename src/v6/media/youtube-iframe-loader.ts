import type { YouTubePlayerApi } from './youtube-iframe-adapter.ts';

export const YOUTUBE_IFRAME_API_URL = 'https://www.youtube.com/iframe_api';
const DEFAULT_TIMEOUT_MS = 15000;
const MAX_TIMEOUT_MS = 60000;

export interface YouTubeIframeApiGlobal {
  YT?: YouTubePlayerApi;
  onYouTubeIframeAPIReady?: () => void;
}

export interface YouTubeIframeApiLoaderOptions {
  readonly global?: YouTubeIframeApiGlobal;
  readonly document?: Document;
  readonly scriptUrl?: string;
  readonly timeoutMs?: number;
  readonly setTimeout?: (callback: () => void, milliseconds: number) => unknown;
  readonly clearTimeout?: (handle: unknown) => void;
}

const pendingByGlobal = new WeakMap<object, Promise<YouTubePlayerApi>>();

function hasPlayerApi(value: YouTubePlayerApi | undefined): value is YouTubePlayerApi {
  return Boolean(value && typeof value.Player === 'function');
}

function normalizeTimeout(value: number | undefined): number {
  const timeout = value ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > MAX_TIMEOUT_MS) {
    throw new Error(`YouTube IFrame API timeout must be from 1 to ${MAX_TIMEOUT_MS} milliseconds.`);
  }
  return timeout;
}

function browserGlobal(): YouTubeIframeApiGlobal {
  return globalThis as unknown as YouTubeIframeApiGlobal;
}

function browserDocument(): Document | undefined {
  return globalThis.document;
}

export function loadYouTubeIframeApi(
  options: YouTubeIframeApiLoaderOptions = {},
): Promise<YouTubePlayerApi> {
  const global = options.global ?? browserGlobal();
  if (hasPlayerApi(global.YT)) return Promise.resolve(global.YT);

  const key = global as object;
  const existing = pendingByGlobal.get(key);
  if (existing) return existing;

  let timeoutMs: number;
  try {
    timeoutMs = normalizeTimeout(options.timeoutMs);
  } catch (error) {
    return Promise.reject(error);
  }

  const document = options.document ?? browserDocument();
  if (!document || typeof document.createElement !== 'function') {
    return Promise.reject(new Error('YouTube IFrame API requires a browser document.'));
  }

  const scriptUrl = String(options.scriptUrl ?? YOUTUBE_IFRAME_API_URL).trim();
  if (!/^https:\/\/www\.youtube\.com\/iframe_api$/.test(scriptUrl)) {
    return Promise.reject(new Error('YouTube IFrame API script URL is invalid.'));
  }

  const schedule = options.setTimeout
    ?? ((callback: () => void, milliseconds: number) => globalThis.setTimeout(callback, milliseconds));
  const cancel = options.clearTimeout
    ?? ((handle: unknown) => globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>));

  let wrapped: Promise<YouTubePlayerApi>;
  const promise = new Promise<YouTubePlayerApi>((resolve, reject) => {
    let settled = false;
    let timer: unknown = null;
    let script: HTMLScriptElement | null = null;
    let createdScript: HTMLScriptElement | null = null;
    const previousReady = global.onYouTubeIframeAPIReady;

    const restoreReady = () => {
      if (global.onYouTubeIframeAPIReady !== ready) return;
      if (previousReady) global.onYouTubeIframeAPIReady = previousReady;
      else delete global.onYouTubeIframeAPIReady;
    };

    const cleanup = () => {
      restoreReady();
      if (timer !== null) {
        cancel(timer);
        timer = null;
      }
      script?.removeEventListener('error', onScriptError);
    };

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      createdScript?.remove();
      reject(error);
    };

    const succeed = () => {
      if (settled) return;
      if (!hasPlayerApi(global.YT)) {
        fail(new Error('YouTube IFrame Player API finished loading without YT.Player.'));
        return;
      }
      settled = true;
      cleanup();
      resolve(global.YT);
    };

    const ready = () => {
      try {
        previousReady?.();
      } catch {
        // Another consumer's callback must not prevent BibleQuest from resolving
        // the shared API singleton.
      }
      succeed();
    };

    const onScriptError = () => {
      fail(new Error('YouTube IFrame Player API script failed to load.'));
    };

    global.onYouTubeIframeAPIReady = ready;

    script = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`);
    if (!script) {
      createdScript = document.createElement('script');
      createdScript.src = scriptUrl;
      createdScript.async = true;
      createdScript.dataset.bqYoutubeIframeApi = '1';
      script = createdScript;
      const parent = document.head ?? document.documentElement;
      if (!parent) {
        fail(new Error('YouTube IFrame API script has no document insertion target.'));
        return;
      }
      parent.append(createdScript);
    }

    script.addEventListener('error', onScriptError, { once: true });
    timer = schedule(
      () => fail(new Error('YouTube IFrame Player API timed out while loading.')),
      timeoutMs,
    );

    if (hasPlayerApi(global.YT)) succeed();
  });

  wrapped = promise.finally(() => {
    if (pendingByGlobal.get(key) === wrapped) pendingByGlobal.delete(key);
  });
  pendingByGlobal.set(key, wrapped);
  return wrapped;
}
