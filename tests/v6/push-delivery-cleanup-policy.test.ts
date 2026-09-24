import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { isPermanentPushEndpointFailure } from '../../supabase/functions/_shared/push-delivery-policy.ts';

test('only terminal missing/gone push responses retire a subscription', () => {
  assert.equal(isPermanentPushEndpointFailure(404), true);
  assert.equal(isPermanentPushEndpointFailure(410), true);
  for (const status of [0, 200, 301, 307, 400, 401, 403, 408, 409, 429, 500, 503]) {
    assert.equal(isPermanentPushEndpointFailure(status), false, `status ${status} must remain retryable/non-destructive`);
  }
});

test('push sender routes permanent cleanup through exact-material RPC', () => {
  const source = fs.readFileSync(
    new URL('../../supabase/functions/bq-push-delivery/index.ts', import.meta.url),
    'utf8',
  );
  assert.match(source, /isPermanentPushEndpointFailure\(statusCode\)/);
  assert.match(source, /rpc\('bible_retire_push_subscription'/);
  assert.match(source, /expected_endpoint:\s*subscription\.endpoint/);
  assert.match(source, /expected_p256dh:\s*subscription\.p256dh/);
  assert.match(source, /expected_auth:\s*subscription\.auth/);
  assert.doesNotMatch(
    source,
    /\.from\('bible_push_subscriptions'\)[\s\S]{0,250}\.delete\(\)[\s\S]{0,250}statusCode === 404/,
  );
});


test('push sender records backoff before releasing a transient delivery claim', () => {
  const source = fs.readFileSync(
    new URL('../../supabase/functions/bq-push-delivery/index.ts', import.meta.url),
    'utf8',
  );
  assert.match(source, /rpc\('bible_claim_push_delivery_rate_limited'/);
  assert.match(source, /rpc\('bible_record_push_retry_failure'/);
  assert.match(source, /rpc\('bible_clear_push_retry_state'/);

  const recordIndex = source.indexOf('await recordRetryFailure');
  const releaseIndex = source.indexOf('await releaseFailedDeliveryClaim');
  assert.ok(recordIndex >= 0, 'sender must record retry backoff');
  assert.ok(releaseIndex > recordIndex, 'sender must record backoff before releasing the idempotency claim');

  const remoteAcceptedIndex = source.indexOf('if (remoteAccepted)');
  const retryIndex = source.indexOf('await recordRetryFailure');
  assert.ok(remoteAcceptedIndex >= 0 && remoteAcceptedIndex < retryIndex,
    'remote-accepted failures must stay locked instead of entering retry release flow');
});


test('push sender preserves V5 until explicit V6 server enforcement cutover', () => {
  const source = fs.readFileSync(
    new URL('../../supabase/functions/bq-push-delivery/index.ts', import.meta.url),
    'utf8',
  );

  assert.match(source, /server_enforcement_enabled/);
  assert.match(source, /delivery_category/);
  assert.match(source, /v6_enabled_categories/);
  assert.match(source, /rpc\('bible_claim_push_delivery_v6_rate_limited'/);
  assert.match(source, /rpc\('bible_claim_push_delivery_rate_limited'/);
  assert.match(source, /localMinuteForUtcOffset/);

  const explicitCutover = source.indexOf('server_enforcement_enabled === true');
  const v6Claim = source.indexOf("rpc('bible_claim_push_delivery_v6_rate_limited'");
  const legacyClaim = source.indexOf("rpc('bible_claim_push_delivery_rate_limited'");
  assert.ok(explicitCutover >= 0, 'sender must require an explicit V6 enforcement flag');
  assert.ok(v6Claim >= 0 && legacyClaim >= 0, 'sender must retain both explicit V6 and released V5 claim paths');
  assert.match(
    source,
    /serverEnforced\s*\?\s*subscriptionsQuery\.contains\('v6_enabled_categories',[\s\S]*?:\s*subscriptionsQuery\.contains\('enabled_categories'/,
  );
});

test('server-enforced quiet hours require synchronized UTC offset context', () => {
  const source = fs.readFileSync(
    new URL('../../supabase/functions/bq-push-delivery/index.ts', import.meta.url),
    'utf8',
  );

  assert.match(source, /quiet_hours_enabled/);
  assert.match(source, /utc_offset_minutes/);
  assert.match(source, /localMinuteForUtcOffset\(preferenceResult\.data\.utc_offset_minutes\)/);
});
