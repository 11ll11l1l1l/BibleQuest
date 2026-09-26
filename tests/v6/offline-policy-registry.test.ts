import assert from 'node:assert/strict';
import test from 'node:test';

import {
  V6_OFFLINE_MUTATION_POLICIES,
  isExplicitlyDeniedV6OfflineMutation,
  resolveV6OfflineMutationPolicy,
  v6OfflineQueueablePolicies,
} from '../../src/v6/offline/policy-registry.ts';

test('V6 offline mutation inventory is explicit, unique and fail-closed', () => {
  const identities = V6_OFFLINE_MUTATION_POLICIES.map((policy) => `${policy.domain}/${policy.operation}`);
  assert.equal(new Set(identities).size, identities.length);
  assert.equal(resolveV6OfflineMutationPolicy('unknown-domain', 'unknown-operation'), null);
  assert.equal(v6OfflineQueueablePolicies().length, 0, 'No production server mutation is certified queueable yet.');
});

test('privileged and destructive operations are never queueable', () => {
  for (const policy of V6_OFFLINE_MUTATION_POLICIES) {
    if (policy.risk === 'privileged' || policy.risk === 'destructive') {
      assert.equal(policy.queueable, false, `${policy.domain}/${policy.operation} must remain live-authorized`);
    }
  }

  for (const [domain, operation] of [
    ['leader-announcement', 'publish'],
    ['notification-publish', 'publish'],
    ['assignment', 'publish'],
    ['assignment', 'delete'],
    ['admin-user', 'set-role'],
    ['admin-user', 'suspend'],
    ['admin-user', 'delete'],
    ['admin-user', 'set-temporary-password'],
    ['account', 'recover'],
    ['account', 'change-password'],
  ] as const) {
    assert.equal(isExplicitlyDeniedV6OfflineMutation(domain, operation), true);
  }
});

test('uncertified potentially safe writes remain disabled until their domain idempotency contract exists', () => {
  const reader = resolveV6OfflineMutationPolicy('reader-progress', 'record-read');
  assert.ok(reader);
  assert.equal(reader.risk, 'unknown');
  assert.equal(reader.queueable, false);
  assert.match(reader.rationale, /idempotency contract/i);

  const response = resolveV6OfflineMutationPolicy('assignment-response', 'submit');
  assert.ok(response);
  assert.equal(response.risk, 'unknown');
  assert.equal(response.queueable, false);
  assert.match(response.rationale, /private authored content/i);
});
