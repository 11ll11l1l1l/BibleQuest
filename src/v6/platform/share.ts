export interface SharePayload {
  readonly title?: string;
  readonly text?: string;
  readonly url?: string;
}

export interface ShareNavigator {
  readonly share?: (payload: SharePayload) => Promise<void>;
  readonly clipboard?: { readonly writeText?: (value: string) => Promise<void> };
}

export type ShareResult = Readonly<{ ok: boolean; mode: 'native' | 'clipboard' | 'unavailable' | 'cancelled' }>;

function fallbackText(payload: SharePayload): string {
  return [payload.title, payload.text, payload.url].map((value) => String(value ?? '').trim()).filter(Boolean).join('\n');
}

export function createShareAdapter(navigatorLike: ShareNavigator | null | undefined) {
  return Object.freeze({
    async share(payload: SharePayload): Promise<ShareResult> {
      if (typeof navigatorLike?.share === 'function') {
        try {
          await navigatorLike.share(payload);
          return Object.freeze({ ok: true, mode: 'native' as const });
        } catch (error) {
          if (error && typeof error === 'object' && (error as { name?: unknown }).name === 'AbortError') {
            return Object.freeze({ ok: false, mode: 'cancelled' as const });
          }
        }
      }

      const text = fallbackText(payload);
      if (text && typeof navigatorLike?.clipboard?.writeText === 'function') {
        try {
          await navigatorLike.clipboard.writeText(text);
          return Object.freeze({ ok: true, mode: 'clipboard' as const });
        } catch {}
      }
      return Object.freeze({ ok: false, mode: 'unavailable' as const });
    },
  });
}
