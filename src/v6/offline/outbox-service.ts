import {
  createOfflineMutationEnvelope,
  envelopeMatchesActiveIdentity,
  scheduleOfflineMutationRetry,
  type OfflineMutationEnvelope,
  type OfflineMutationIdentity,
  type OfflineMutationPolicy,
  type OfflineMutationRequest,
} from './outbox.ts';
import {
  parsePersistedOfflineMutation,
  recoverOfflineOutbox,
  toPersistedOfflineMutation,
  type OfflineOutboxPersistence,
  type PersistedOfflineMutation,
  type RecoveredOfflineOutbox,
} from './outbox-persistence.ts';
import { V6_OFFLINE_MUTATION_POLICIES } from './policy-registry.ts';

function findPolicy(
  policies: readonly OfflineMutationPolicy[],
  domain: string,
  operation: string,
): OfflineMutationPolicy | undefined {
  return policies.find((policy) => policy.domain === domain && policy.operation === operation);
}

function assertActiveEnvelopeIdentity(
  envelope: Pick<OfflineMutationEnvelope, 'schemaVersion' | 'identity'>,
  active: OfflineMutationIdentity | null | undefined,
): void {
  if (!envelopeMatchesActiveIdentity(envelope, active)) {
    throw new Error('Offline mutation no longer belongs to the active account and congregation.');
  }
}

type LogicalMutationReference = Pick<
  OfflineMutationEnvelope,
  'schemaVersion' | 'id' | 'domain' | 'operation' | 'idempotencyKey' | 'identity'
>;

function matchesLogicalMutation(
  record: PersistedOfflineMutation,
  envelope: LogicalMutationReference,
): boolean {
  return envelopeMatchesActiveIdentity(record, envelope.identity)
    && record.domain === envelope.domain
    && record.operation === envelope.operation
    && record.idempotencyKey === envelope.idempotencyKey;
}

function samePersistablePayload(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  try {
    const leftJson = JSON.stringify(left);
    const rightJson = JSON.stringify(right);
    return typeof leftJson === 'string' && leftJson === rightJson;
  } catch {
    return false;
  }
}

function matchesImmutableMutation(
  record: PersistedOfflineMutation,
  envelope: OfflineMutationEnvelope,
): boolean {
  return record.id === envelope.id
    && matchesLogicalMutation(record, envelope)
    && record.createdAt === envelope.createdAt
    && samePersistablePayload(record.payload, envelope.payload);
}

async function findCurrentDurableMutation<TPayload>(
  persistence: OfflineOutboxPersistence,
  envelope: OfflineMutationEnvelope<TPayload>,
): Promise<PersistedOfflineMutation<TPayload>> {
  for (const candidate of await persistence.list()) {
    const record = parsePersistedOfflineMutation(candidate);
    if (!record || record.id !== envelope.id) continue;
    if (!matchesImmutableMutation(record, envelope)) {
      throw new Error('Offline mutation id now belongs to a different queued mutation.');
    }
    return record as PersistedOfflineMutation<TPayload>;
  }
  throw new Error('Offline mutation is no longer queued.');
}

export class OfflineOutboxService {
  readonly #persistence: OfflineOutboxPersistence;
  readonly #policies: readonly OfflineMutationPolicy[];
  readonly #now: () => Date;

  constructor(
    persistence: OfflineOutboxPersistence,
    policies: readonly OfflineMutationPolicy[],
    now: () => Date = () => new Date(),
  ) {
    this.#persistence = persistence;
    this.#policies = Object.freeze([...policies]);
    this.#now = now;
  }

  async enqueue<TPayload>(request: OfflineMutationRequest<TPayload>): Promise<PersistedOfflineMutation<TPayload>> {
    const policy = findPolicy(this.#policies, request.domain, request.operation);
    const envelope = createOfflineMutationEnvelope(request, policy);

    for (const candidate of await this.#persistence.list()) {
      const existing = parsePersistedOfflineMutation(candidate);
      if (!existing) continue;
      if (existing.id === envelope.id) {
        if (!matchesImmutableMutation(existing, envelope)) {
          throw new Error('Offline mutation id conflicts with an existing queued mutation.');
        }
        return existing as PersistedOfflineMutation<TPayload>;
      }
      if (matchesLogicalMutation(existing, envelope)) {
        throw new Error('Offline mutation idempotency key conflicts with an existing queued mutation.');
      }
    }

    const persisted = toPersistedOfflineMutation(envelope);
    await this.#persistence.put(persisted);
    return persisted;
  }

  async recover(active: OfflineMutationIdentity | null | undefined): Promise<RecoveredOfflineOutbox> {
    return recoverOfflineOutbox(this.#persistence, active, this.#policies, this.#now());
  }

  async retry<TPayload>(
    envelope: OfflineMutationEnvelope<TPayload>,
    active: OfflineMutationIdentity | null | undefined,
    baseMs = 1_000,
    maxMs = 60_000,
  ): Promise<PersistedOfflineMutation<TPayload>> {
    assertActiveEnvelopeIdentity(envelope, active);

    const durable = await findCurrentDurableMutation(this.#persistence, envelope);
    assertActiveEnvelopeIdentity(durable, active);

    const policy = findPolicy(this.#policies, durable.domain, durable.operation);
    createOfflineMutationEnvelope({
      id: durable.id,
      domain: durable.domain,
      operation: durable.operation,
      idempotencyKey: durable.idempotencyKey,
      identity: durable.identity,
      createdAt: durable.createdAt,
      payload: durable.payload,
    }, policy);

    const scheduled = scheduleOfflineMutationRetry(durable, this.#now(), baseMs, maxMs);
    const persisted = toPersistedOfflineMutation(scheduled.envelope, scheduled.retryAt);
    const applied = await this.#persistence.compareAndPut(durable, persisted);
    if (!applied) {
      throw new Error('Offline mutation changed concurrently before retry persistence; recover current outbox state before retrying.');
    }
    return persisted;
  }

  async complete<TPayload>(
    envelope: OfflineMutationEnvelope<TPayload>,
    active: OfflineMutationIdentity | null | undefined,
  ): Promise<void> {
    assertActiveEnvelopeIdentity(envelope, active);

    for (const candidate of await this.#persistence.list()) {
      const durable = parsePersistedOfflineMutation(candidate);
      if (!durable || durable.id !== envelope.id) continue;
      if (!matchesImmutableMutation(durable, envelope)) {
        throw new Error('Offline mutation completion no longer matches the queued mutation.');
      }
      assertActiveEnvelopeIdentity(durable, active);
      const applied = await this.#persistence.compareAndDelete(durable);
      if (!applied) {
        throw new Error('Offline mutation changed concurrently before completion; recover current outbox state before completing.');
      }
      return;
    }
  }
}


export function createV6OfflineOutboxService(
  persistence: OfflineOutboxPersistence,
  now: () => Date = () => new Date(),
): OfflineOutboxService {
  return new OfflineOutboxService(persistence, V6_OFFLINE_MUTATION_POLICIES, now);
}
