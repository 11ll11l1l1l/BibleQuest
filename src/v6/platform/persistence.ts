export interface KeyValueStorage {
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => void;
  readonly removeItem: (key: string) => void;
}

export type StorageResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; reason: 'unavailable' | 'malformed' | 'version' }>;

interface StoredEnvelope<T> {
  readonly version: number;
  readonly value: T;
}

const SAFE_KEY = /^[a-z0-9._:-]+$/i;

export function createVersionedJsonStore(storage: KeyValueStorage | null | undefined, namespace = 'biblequest.v6') {
  const normalizedNamespace = String(namespace ?? '').trim().replace(/\.+$/, '');
  if (!normalizedNamespace || !SAFE_KEY.test(normalizedNamespace)) throw new Error('Safe storage namespace required.');

  const fullKey = (name: string): string => {
    const safeName = String(name ?? '').trim();
    if (!safeName || !SAFE_KEY.test(safeName)) throw new Error('Invalid storage key.');
    return `${normalizedNamespace}.${safeName}`;
  };

  return Object.freeze({
    read<T>(name: string, version: number): StorageResult<T> {
      if (!storage) return Object.freeze({ ok: false, reason: 'unavailable' as const });
      try {
        const raw = storage.getItem(fullKey(name));
        if (raw === null) return Object.freeze({ ok: false, reason: 'unavailable' as const });
        const parsed = JSON.parse(raw) as StoredEnvelope<T>;
        if (!parsed || typeof parsed !== 'object') return Object.freeze({ ok: false, reason: 'malformed' as const });
        if (parsed.version !== version) return Object.freeze({ ok: false, reason: 'version' as const });
        return Object.freeze({ ok: true, value: parsed.value });
      } catch {
        return Object.freeze({ ok: false, reason: 'malformed' as const });
      }
    },
    write<T>(name: string, version: number, value: T): StorageResult<T> {
      if (!storage) return Object.freeze({ ok: false, reason: 'unavailable' as const });
      try {
        const envelope: StoredEnvelope<T> = Object.freeze({ version, value });
        storage.setItem(fullKey(name), JSON.stringify(envelope));
        return Object.freeze({ ok: true, value });
      } catch {
        return Object.freeze({ ok: false, reason: 'unavailable' as const });
      }
    },
    remove(name: string): boolean {
      if (!storage) return false;
      try {
        storage.removeItem(fullKey(name));
        return true;
      } catch {
        return false;
      }
    },
  });
}
