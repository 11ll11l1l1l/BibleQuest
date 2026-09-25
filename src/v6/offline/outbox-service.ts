import {
  createOfflineMutationEnvelope,
  scheduleOfflineMutationRetry,
  type OfflineMutationEnvelope,
  type OfflineMutationIdentity,
  type OfflineMutationPolicy,
  type OfflineMutationRequest,
} from './outbox.ts';
import {
  recoverOfflineOutbox,
  toPersistedOfflineMutation,
  type OfflineOutboxPersistence,
  type PersistedOfflineMutation,
  type RecoveredOfflineOutbox,
} from './outbox-persistence.ts';

function findPolicy(
  policies: readonly OfflineMutationPolicy[],
  domain: string,
  operation: string,
): OfflineMutationPolicy | undefined {
  return policies.find((policy) => policy.domain === domain && policy.operation === operation);
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
    const persisted = toPersistedOfflineMutation(envelope);
    await this.#persistence.put(persisted);
    return persisted;
  }

  async recover(active: OfflineMutationIdentity | null | undefined): Promise<RecoveredOfflineOutbox> {
    return recoverOfflineOutbox(this.#persistence, active, this.#policies, this.#now());
  }

  async retry<TPayload>(
    envelope: OfflineMutationEnvelope<TPayload>,
    baseMs = 1_000,
    maxMs = 60_000,
  ): Promise<PersistedOfflineMutation<TPayload>> {
    const policy = findPolicy(this.#policies, envelope.domain, envelope.operation);
    // Re-create the durable policy gate before persisting another attempt.
    createOfflineMutationEnvelope({
      id: envelope.id,
      domain: envelope.domain,
      operation: envelope.operation,
      idempotencyKey: envelope.idempotencyKey,
      identity: envelope.identity,
      createdAt: envelope.createdAt,
      payload: envelope.payload,
    }, policy);

    const scheduled = scheduleOfflineMutationRetry(envelope, this.#now(), baseMs, maxMs);
    const persisted = toPersistedOfflineMutation(scheduled.envelope, scheduled.retryAt);
    await this.#persistence.put(persisted);
    return persisted;
  }

  async complete(id: string): Promise<void> {
    await this.#persistence.delete(id);
  }
}
