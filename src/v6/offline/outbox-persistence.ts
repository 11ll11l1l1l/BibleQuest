import {
  OFFLINE_OUTBOX_SCHEMA_VERSION,
  envelopeMatchesActiveIdentity,
  canQueueOfflineMutation,
  type OfflineMutationEnvelope,
  type OfflineMutationIdentity,
  type OfflineMutationPolicy,
} from './outbox.ts';

export const OFFLINE_OUTBOX_DB_NAME = 'biblequest-v6-offline';
export const OFFLINE_OUTBOX_DB_VERSION = 1;
export const OFFLINE_OUTBOX_STORE_NAME = 'outbox';

export interface PersistedOfflineMutation<TPayload = unknown> extends OfflineMutationEnvelope<TPayload> {
  readonly retryAt: string | null;
}

export interface OfflineOutboxPersistence {
  list(): Promise<readonly unknown[]>;
  put(record: PersistedOfflineMutation): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

function required(value: unknown): string {
  return String(value ?? '').trim();
}

function validIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

export function parsePersistedOfflineMutation(value: unknown): PersistedOfflineMutation | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const identity = record.identity;
  if (!identity || typeof identity !== 'object' || Array.isArray(identity)) return null;
  const identityRecord = identity as Record<string, unknown>;

  const schemaVersion = record.schemaVersion;
  const id = required(record.id);
  const domain = required(record.domain);
  const operation = required(record.operation);
  const idempotencyKey = required(record.idempotencyKey);
  const accountId = required(identityRecord.accountId);
  const congregationId = required(identityRecord.congregationId);
  const createdAt = record.createdAt;
  const attempt = record.attempt;
  const retryAt = record.retryAt;

  if (schemaVersion !== OFFLINE_OUTBOX_SCHEMA_VERSION) return null;
  if (!id || !domain || !operation || !idempotencyKey || !accountId || !congregationId) return null;
  if (!validIsoDate(createdAt)) return null;
  if (!Number.isSafeInteger(attempt) || Number(attempt) < 0) return null;
  if (retryAt !== null && retryAt !== undefined && !validIsoDate(retryAt)) return null;

  return Object.freeze({
    schemaVersion: OFFLINE_OUTBOX_SCHEMA_VERSION,
    id,
    domain,
    operation,
    idempotencyKey,
    identity: Object.freeze({ accountId, congregationId }),
    createdAt,
    attempt: Number(attempt),
    payload: record.payload,
    retryAt: retryAt == null ? null : retryAt,
  });
}

export function toPersistedOfflineMutation<TPayload>(
  envelope: OfflineMutationEnvelope<TPayload>,
  retryAt: string | null = null,
): PersistedOfflineMutation<TPayload> {
  const parsed = parsePersistedOfflineMutation({ ...envelope, retryAt });
  if (!parsed) throw new Error('Offline mutation cannot be persisted because its durable record is invalid.');
  return parsed as PersistedOfflineMutation<TPayload>;
}

export interface RecoveredOfflineOutbox {
  readonly replayable: readonly PersistedOfflineMutation[];
  readonly rejectedRecords: number;
  readonly deferredRecords: number;
}

export async function recoverOfflineOutbox(
  persistence: OfflineOutboxPersistence,
  active: OfflineMutationIdentity | null | undefined,
  policies: readonly OfflineMutationPolicy[],
  now: Date = new Date(),
): Promise<RecoveredOfflineOutbox> {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new Error('Offline outbox recovery requires a valid clock value.');
  const raw = await persistence.list();
  const valid: PersistedOfflineMutation[] = [];
  let rejectedRecords = 0;

  for (const candidate of raw) {
    const record = parsePersistedOfflineMutation(candidate);
    if (!record) {
      rejectedRecords += 1;
      continue;
    }
    const policy = policies.find((item) => item.domain === record.domain && item.operation === record.operation);
    if (!envelopeMatchesActiveIdentity(record, active) || !canQueueOfflineMutation(policy, record.domain, record.operation)) {
      continue;
    }
    valid.push(record);
  }

  let deferredRecords = 0;
  const replayable = valid.filter((record) => {
    if (!record.retryAt) return true;
    const due = new Date(record.retryAt).getTime() <= now.getTime();
    if (!due) deferredRecords += 1;
    return due;
  });

  return Object.freeze({
    replayable: Object.freeze(replayable),
    rejectedRecords,
    deferredRecords,
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
  });
}

export class IndexedDbOfflineOutboxPersistence implements OfflineOutboxPersistence {
  readonly #factory: IDBFactory;
  readonly #dbPromise: Promise<IDBDatabase>;

  constructor(factory: IDBFactory | undefined = globalThis.indexedDB) {
    if (!factory) throw new Error('IndexedDB is unavailable; durable offline mutation queueing is disabled.');
    this.#factory = factory;
    this.#dbPromise = this.#open();
  }

  async #open(): Promise<IDBDatabase> {
    const request = this.#factory.open(OFFLINE_OUTBOX_DB_NAME, OFFLINE_OUTBOX_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OFFLINE_OUTBOX_STORE_NAME)) {
        db.createObjectStore(OFFLINE_OUTBOX_STORE_NAME, { keyPath: 'id' });
      }
    };
    return requestResult(request);
  }

  async list(): Promise<readonly unknown[]> {
    const db = await this.#dbPromise;
    const transaction = db.transaction(OFFLINE_OUTBOX_STORE_NAME, 'readonly');
    const completed = transactionComplete(transaction);
    const values = await requestResult(transaction.objectStore(OFFLINE_OUTBOX_STORE_NAME).getAll());
    await completed;
    return Object.freeze(values);
  }

  async put(record: PersistedOfflineMutation): Promise<void> {
    const valid = parsePersistedOfflineMutation(record);
    if (!valid) throw new Error('Refusing to persist an invalid offline mutation record.');
    const db = await this.#dbPromise;
    const transaction = db.transaction(OFFLINE_OUTBOX_STORE_NAME, 'readwrite');
    const completed = transactionComplete(transaction);
    transaction.objectStore(OFFLINE_OUTBOX_STORE_NAME).put(valid);
    await completed;
  }

  async delete(id: string): Promise<void> {
    const key = required(id);
    if (!key) throw new Error('Offline mutation id is required.');
    const db = await this.#dbPromise;
    const transaction = db.transaction(OFFLINE_OUTBOX_STORE_NAME, 'readwrite');
    const completed = transactionComplete(transaction);
    transaction.objectStore(OFFLINE_OUTBOX_STORE_NAME).delete(key);
    await completed;
  }

  async clear(): Promise<void> {
    const db = await this.#dbPromise;
    const transaction = db.transaction(OFFLINE_OUTBOX_STORE_NAME, 'readwrite');
    const completed = transactionComplete(transaction);
    transaction.objectStore(OFFLINE_OUTBOX_STORE_NAME).clear();
    await completed;
  }
}
