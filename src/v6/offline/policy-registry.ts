import type { OfflineMutationPolicy, OfflineMutationRisk } from './outbox.ts';

export interface NamedOfflineMutationPolicy extends OfflineMutationPolicy {
  readonly rationale: string;
}

const definePolicy = (
  domain: string,
  operation: string,
  risk: OfflineMutationRisk,
  queueable: boolean,
  rationale: string,
): NamedOfflineMutationPolicy => Object.freeze({
  domain,
  operation,
  risk,
  queueable,
  rationale,
});

export const V6_OFFLINE_MUTATION_POLICIES = Object.freeze([
  definePolicy(
    'reader-progress',
    'record-read',
    'unknown',
    false,
    'Chapter completion is tied to canonical progress and trusted leaderboard authority; offline replay stays disabled until the domain owner supplies an end-to-end idempotency contract.',
  ),
  definePolicy(
    'assignment-response',
    'submit',
    'unknown',
    false,
    'Assignment responses may contain private authored content and require a server-authorized tenant/context check at submission time.',
  ),
  definePolicy(
    'leader-announcement',
    'publish',
    'privileged',
    false,
    'Leader publishing changes congregation-visible content and must be live-authorized.',
  ),
  definePolicy(
    'notification-publish',
    'publish',
    'privileged',
    false,
    'Server notification delivery is privileged congregation-scoped work and must not be blindly replayed from a client outbox.',
  ),
  definePolicy(
    'assignment',
    'publish',
    'privileged',
    false,
    'Publishing assignments changes member-visible ministry state and requires current live authorization.',
  ),
  definePolicy(
    'assignment',
    'delete',
    'destructive',
    false,
    'Destructive assignment changes are never queued offline.',
  ),
  definePolicy(
    'admin-user',
    'set-role',
    'privileged',
    false,
    'Role changes are privileged server-authoritative operations.',
  ),
  definePolicy(
    'admin-user',
    'suspend',
    'privileged',
    false,
    'Account suspension is privileged and may revoke active sessions immediately.',
  ),
  definePolicy(
    'admin-user',
    'delete',
    'destructive',
    false,
    'Account deletion is destructive and must require live authorization and current ownership checks.',
  ),
  definePolicy(
    'admin-user',
    'set-temporary-password',
    'privileged',
    false,
    'Emergency credential changes are privileged, audited, and must execute against a live authorization context.',
  ),
  definePolicy(
    'account',
    'recover',
    'privileged',
    false,
    'Account recovery changes credentials and must never be queued for later replay.',
  ),
  definePolicy(
    'account',
    'change-password',
    'privileged',
    false,
    'Credential changes require live authorization and immediate session semantics.',
  ),
] as const satisfies readonly NamedOfflineMutationPolicy[]);

function key(domain: string, operation: string): string {
  return `${String(domain ?? '').trim()}\u0000${String(operation ?? '').trim()}`;
}

const index = new Map<string, NamedOfflineMutationPolicy>();
for (const policy of V6_OFFLINE_MUTATION_POLICIES) {
  const policyKey = key(policy.domain, policy.operation);
  if (!policy.domain || !policy.operation || !policy.rationale) {
    throw new Error('V6 offline mutation policy entries require domain, operation and rationale.');
  }
  if (index.has(policyKey)) {
    throw new Error(`Duplicate V6 offline mutation policy: ${policy.domain}/${policy.operation}`);
  }
  if (policy.queueable && policy.risk !== 'safe-idempotent') {
    throw new Error(`Unsafe V6 offline mutation policy cannot be queueable: ${policy.domain}/${policy.operation}`);
  }
  index.set(policyKey, policy);
}

export function resolveV6OfflineMutationPolicy(
  domain: string,
  operation: string,
): NamedOfflineMutationPolicy | null {
  return index.get(key(domain, operation)) ?? null;
}

export function v6OfflineQueueablePolicies(): readonly NamedOfflineMutationPolicy[] {
  return Object.freeze(V6_OFFLINE_MUTATION_POLICIES.filter((policy) => (
    policy.queueable && policy.risk === 'safe-idempotent'
  )));
}

export function isExplicitlyDeniedV6OfflineMutation(domain: string, operation: string): boolean {
  const policy = resolveV6OfflineMutationPolicy(domain, operation);
  return policy !== null && policy.queueable === false;
}
