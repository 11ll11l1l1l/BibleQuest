export const OFFLINE_OUTBOX_SCHEMA_VERSION = 1 as const;

export type OfflineMutationRisk = 'safe-idempotent' | 'privileged' | 'destructive' | 'unknown';

export interface OfflineMutationPolicy {
  readonly domain: string;
  readonly operation: string;
  readonly risk: OfflineMutationRisk;
  readonly queueable: boolean;
}

export interface OfflineMutationIdentity {
  readonly accountId: string;
  readonly congregationId: string;
}

export interface OfflineMutationEnvelope<TPayload = unknown> {
  readonly schemaVersion: typeof OFFLINE_OUTBOX_SCHEMA_VERSION;
  readonly id: string;
  readonly domain: string;
  readonly operation: string;
  readonly idempotencyKey: string;
  readonly identity: OfflineMutationIdentity;
  readonly createdAt: string;
  readonly attempt: number;
  readonly payload: TPayload;
}

export interface OfflineMutationRequest<TPayload = unknown> {
  readonly id: string;
  readonly domain: string;
  readonly operation: string;
  readonly idempotencyKey: string;
  readonly identity: OfflineMutationIdentity;
  readonly createdAt: string;
  readonly payload: TPayload;
}

function required(value: string): string {
  return String(value ?? '').trim();
}

export function canQueueOfflineMutation(
  policy: OfflineMutationPolicy | null | undefined,
  domain: string,
  operation: string,
): boolean {
  if (!policy) return false;
  return policy.queueable === true
    && policy.risk === 'safe-idempotent'
    && required(policy.domain) === required(domain)
    && required(policy.operation) === required(operation);
}

export function createOfflineMutationEnvelope<TPayload>(
  request: OfflineMutationRequest<TPayload>,
  policy: OfflineMutationPolicy | null | undefined,
): OfflineMutationEnvelope<TPayload> {
  const accountId = required(request.identity?.accountId);
  const congregationId = required(request.identity?.congregationId);
  const id = required(request.id);
  const domain = required(request.domain);
  const operation = required(request.operation);
  const idempotencyKey = required(request.idempotencyKey);
  const createdAt = required(request.createdAt);

  if (!accountId || !congregationId) throw new Error('Offline mutation requires explicit account and congregation identity.');
  if (!id || !domain || !operation || !idempotencyKey || !createdAt) throw new Error('Offline mutation metadata is incomplete.');
  if (!canQueueOfflineMutation(policy, domain, operation)) throw new Error('Offline mutation is not explicitly allowlisted as safe and idempotent.');

  return Object.freeze({
    schemaVersion: OFFLINE_OUTBOX_SCHEMA_VERSION,
    id,
    domain,
    operation,
    idempotencyKey,
    identity: Object.freeze({ accountId, congregationId }),
    createdAt,
    attempt: 0,
    payload: request.payload,
  });
}

export function envelopeMatchesActiveIdentity(
  envelope: Pick<OfflineMutationEnvelope, 'schemaVersion' | 'identity'>,
  active: OfflineMutationIdentity | null | undefined,
): boolean {
  if (envelope.schemaVersion !== OFFLINE_OUTBOX_SCHEMA_VERSION || !active) return false;
  return required(envelope.identity.accountId) === required(active.accountId)
    && required(envelope.identity.congregationId) === required(active.congregationId)
    && Boolean(required(active.accountId))
    && Boolean(required(active.congregationId));
}

export function selectReplayableOfflineMutations(
  envelopes: readonly OfflineMutationEnvelope[],
  active: OfflineMutationIdentity | null | undefined,
  policies: readonly OfflineMutationPolicy[],
): readonly OfflineMutationEnvelope[] {
  if (!active) return Object.freeze([]);
  const replayable = envelopes.filter((envelope) => {
    const policy = policies.find((candidate) => candidate.domain === envelope.domain && candidate.operation === envelope.operation);
    return envelopeMatchesActiveIdentity(envelope, active)
      && canQueueOfflineMutation(policy, envelope.domain, envelope.operation);
  });
  return Object.freeze(replayable);
}

export function nextOfflineMutationAttempt<TPayload>(
  envelope: OfflineMutationEnvelope<TPayload>,
): OfflineMutationEnvelope<TPayload> {
  if (!Number.isSafeInteger(envelope.attempt) || envelope.attempt < 0) throw new Error('Invalid offline mutation attempt counter.');
  return Object.freeze({ ...envelope, attempt: envelope.attempt + 1 });
}
