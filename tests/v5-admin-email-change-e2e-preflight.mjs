import assert from 'node:assert/strict';

// STATIC/PREFLIGHT ONLY. This file deliberately performs no network requests and
// cannot be used as BACKEND-E2E evidence.
const env = process.env;
const required = [
  'BQ_V5_TEST_SUPABASE_URL',
  'BQ_V5_PRODUCTION_SUPABASE_URL',
  'BQ_V5_TEST_ANON_KEY',
  'BQ_V5_TEST_SERVICE_ROLE_KEY',
  'BQ_V5_OWNER_EMAIL',
  'BQ_V5_OWNER_PASSWORD',
  'BQ_V5_ADMIN_EMAIL',
  'BQ_V5_ADMIN_PASSWORD',
  'BQ_V5_TARGET_EMAIL',
  'BQ_V5_TARGET_PASSWORD',
  'BQ_V5_TARGET_NEW_EMAIL',
];

for (const key of required) {
  assert.ok(env[key]?.trim(), `Missing required environment variable: ${key}`);
}
assert.equal(
  env.BQ_V5_E2E_CONFIRM_NONPROD,
  'I_UNDERSTAND_NONPROD_ONLY',
  'Refusing readiness certification without explicit non-production acknowledgement',
);

const testUrl = new URL(env.BQ_V5_TEST_SUPABASE_URL);
const productionUrl = new URL(env.BQ_V5_PRODUCTION_SUPABASE_URL);
assert.equal(testUrl.protocol, 'https:', 'Controlled Supabase project must use HTTPS');
assert.equal(productionUrl.protocol, 'https:', 'Production comparison URL must use HTTPS');
assert.notEqual(testUrl.origin, productionUrl.origin, 'Controlled project must not be production');
assert.ok(
  testUrl.hostname.endsWith('.supabase.co') || ['localhost', '127.0.0.1'].includes(testUrl.hostname),
  'Unexpected controlled Supabase host',
);
assert.notEqual(env.BQ_V5_TEST_SERVICE_ROLE_KEY, env.BQ_V5_TEST_ANON_KEY, 'Service-role and anon keys must differ');

const emails = [env.BQ_V5_OWNER_EMAIL, env.BQ_V5_ADMIN_EMAIL, env.BQ_V5_TARGET_EMAIL]
  .map((value) => value.trim().toLowerCase());
assert.equal(new Set(emails).size, 3, 'Owner, admin, and target must be three distinct controlled identities');
assert.notEqual(
  env.BQ_V5_TARGET_EMAIL.trim().toLowerCase(),
  env.BQ_V5_TARGET_NEW_EMAIL.trim().toLowerCase(),
  'Temporary target email must differ from the original',
);
assert.equal(
  emails.includes(env.BQ_V5_TARGET_NEW_EMAIL.trim().toLowerCase()),
  false,
  'Temporary target email must not collide with owner/admin/target identities',
);

const harnessUrl = new URL('./v5-admin-email-change-e2e.mjs', import.meta.url);
const harnessSource = await (await import('node:fs/promises')).readFile(harnessUrl, 'utf8');
assert.match(harnessSource, /finally\s*\{/, 'E2E harness must restore the target in finally');
assert.match(harnessSource, /serviceUpdateUser\(targetId,\s*\{\s*email:\s*env\.BQ_V5_TARGET_EMAIL\s*\}\)/, 'E2E harness must restore the original target email');
assert.match(harnessSource, /assert\.equal\(restored,\s*true/, 'E2E harness must fail if restoration fails');
assert.match(harnessSource, /assert\.equal\(adminAttempt\.response\.status,\s*403\)/, 'E2E harness must prove non-owner admin rejection');
assert.match(harnessSource, /assert\.equal\(ownerSelfAttempt\.response\.status,\s*409\)/, 'E2E harness must prove owner-self rejection');
assert.match(harnessSource, /assert\.equal\(reuse\.response\.ok,\s*false\)/, 'E2E harness must prove prior target refresh token cannot be reused');
assert.match(harnessSource, /\['emailChanged',\s*'sessionsRevoked'\]/, 'E2E harness must constrain audit detail to approved boolean markers');

console.log('PASS: Admin email-change BACKEND-E2E preflight is fail-closed and restoration-bound. No network request executed.');
