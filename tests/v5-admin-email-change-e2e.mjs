import assert from 'node:assert/strict';

const env = process.env;
const required = [
  'BQ_V5_TEST_SUPABASE_URL', 'BQ_V5_PRODUCTION_SUPABASE_URL', 'BQ_V5_TEST_ANON_KEY',
  'BQ_V5_TEST_SERVICE_ROLE_KEY', 'BQ_V5_OWNER_EMAIL', 'BQ_V5_OWNER_PASSWORD',
  'BQ_V5_ADMIN_EMAIL', 'BQ_V5_ADMIN_PASSWORD', 'BQ_V5_TARGET_EMAIL',
  'BQ_V5_TARGET_PASSWORD', 'BQ_V5_TARGET_NEW_EMAIL',
];
for (const key of required) assert.ok(env[key], `Missing required environment variable: ${key}`);
assert.equal(env.BQ_V5_E2E_CONFIRM_NONPROD, 'I_UNDERSTAND_NONPROD_ONLY', 'Refusing to run without explicit non-production confirmation');

const testUrl = new URL(env.BQ_V5_TEST_SUPABASE_URL);
const productionUrl = new URL(env.BQ_V5_PRODUCTION_SUPABASE_URL);
assert.equal(testUrl.protocol, 'https:', 'Test Supabase URL must use HTTPS');
assert.notEqual(testUrl.origin, productionUrl.origin, 'Refusing to run against the production Supabase project');
assert.ok(testUrl.hostname.endsWith('.supabase.co') || ['localhost', '127.0.0.1'].includes(testUrl.hostname), 'Unexpected Supabase host');
assert.notEqual(env.BQ_V5_TEST_SERVICE_ROLE_KEY, env.BQ_V5_TEST_ANON_KEY, 'Service-role key must not equal anon key');
assert.notEqual(env.BQ_V5_TARGET_EMAIL.toLowerCase(), env.BQ_V5_TARGET_NEW_EMAIL.toLowerCase(), 'Replacement email must differ from original');

const base = testUrl.origin.replace(/\/$/, '');
const anonHeaders = { apikey: env.BQ_V5_TEST_ANON_KEY, 'Content-Type': 'application/json' };
const serviceHeaders = { apikey: env.BQ_V5_TEST_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.BQ_V5_TEST_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' };

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  return { response, body };
}
async function signIn(email, password) {
  const { response, body } = await jsonFetch(`${base}/auth/v1/token?grant_type=password`, { method: 'POST', headers: anonHeaders, body: JSON.stringify({ email, password }) });
  assert.equal(response.ok, true, `Controlled test sign-in failed (${response.status})`);
  assert.ok(body?.access_token && body?.refresh_token && body?.user?.id, 'Controlled test sign-in returned incomplete session');
  return body;
}
async function invoke(jwt, payload) {
  return jsonFetch(`${base}/functions/v1/bq-admin-ops`, { method: 'POST', headers: { ...anonHeaders, Authorization: `Bearer ${jwt}` }, body: JSON.stringify(payload) });
}
async function serviceGetUser(id) { return jsonFetch(`${base}/auth/v1/admin/users/${id}`, { headers: serviceHeaders }); }
async function serviceUpdateUser(id, attributes) { return jsonFetch(`${base}/auth/v1/admin/users/${id}`, { method: 'PUT', headers: serviceHeaders, body: JSON.stringify(attributes) }); }
async function latestAudit(targetUserId) {
  const params = new URLSearchParams({ select: 'actor_id,target_user_id,action,detail,created_at', target_user_id: `eq.${targetUserId}`, action: 'eq.change_email', order: 'created_at.desc', limit: '1' });
  return jsonFetch(`${base}/rest/v1/bible_admin_audit_log?${params}`, { headers: serviceHeaders });
}
async function refresh(refreshToken) { return jsonFetch(`${base}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', headers: anonHeaders, body: JSON.stringify({ refresh_token: refreshToken }) }); }

const sensitiveKeys = /email|password|token|secret|credential/i;
function assertAuditSafe(detail) {
  assert.equal(detail?.emailChanged, true, 'Audit must record that email changed');
  assert.equal(detail?.sessionsRevoked, true, 'Audit must record that sessions were revoked');
  for (const key of Object.keys(detail || {})) assert.equal(sensitiveKeys.test(key), false, `Sensitive audit key detected: ${key}`);
  const encoded = JSON.stringify(detail || {}).toLowerCase();
  for (const sensitiveValue of [env.BQ_V5_TARGET_EMAIL, env.BQ_V5_TARGET_NEW_EMAIL, env.BQ_V5_TARGET_PASSWORD]) assert.equal(encoded.includes(String(sensitiveValue).toLowerCase()), false, 'Sensitive value leaked into audit detail');
}

let targetId = null;
let restored = false;
try {
  const [owner, admin, target] = await Promise.all([signIn(env.BQ_V5_OWNER_EMAIL, env.BQ_V5_OWNER_PASSWORD), signIn(env.BQ_V5_ADMIN_EMAIL, env.BQ_V5_ADMIN_PASSWORD), signIn(env.BQ_V5_TARGET_EMAIL, env.BQ_V5_TARGET_PASSWORD)]);
  targetId = target.user.id;
  assert.notEqual(owner.user.id, targetId, 'Owner and target identities must be distinct');
  assert.notEqual(admin.user.id, targetId, 'Admin and target identities must be distinct');
  assert.notEqual(owner.user.id, admin.user.id, 'Owner and admin identities must be distinct');

  const adminAttempt = await invoke(admin.access_token, { action: 'change_email', targetUserId: targetId, email: env.BQ_V5_TARGET_NEW_EMAIL });
  assert.equal(adminAttempt.response.status, 403, 'Admin must be denied owner-only email change');
  const ownerSelfAttempt = await invoke(owner.access_token, { action: 'change_email', targetUserId: owner.user.id, email: env.BQ_V5_TARGET_NEW_EMAIL });
  assert.equal(ownerSelfAttempt.response.status, 409, 'Owner must be denied changing the active owner account through emergency recovery');

  const change = await invoke(owner.access_token, { action: 'change_email', targetUserId: targetId, email: env.BQ_V5_TARGET_NEW_EMAIL });
  assert.equal(change.response.ok, true, `Owner email change failed (${change.response.status})`);
  assert.equal(change.body?.ok, true, 'Owner email-change response must report success');
  assert.equal(change.body?.changed, true, 'Owner email-change response must report changed=true');
  assert.equal(change.body?.revoked, true, 'Owner email-change response must report revoked=true');
  assert.equal(Object.prototype.hasOwnProperty.call(change.body || {}, 'email'), false, 'Success response must not echo email');

  const got = await serviceGetUser(targetId);
  assert.equal(got.response.ok, true, `Unable to verify target Auth account (${got.response.status})`);
  assert.equal(String(got.body?.email || '').toLowerCase(), env.BQ_V5_TARGET_NEW_EMAIL.toLowerCase(), 'Supabase Auth email was not changed');
  const reuse = await refresh(target.refresh_token);
  assert.equal(reuse.response.ok, false, 'Pre-change target refresh token still works after required session revocation');

  const audit = await latestAudit(targetId);
  assert.equal(audit.response.ok, true, `Unable to verify audit log (${audit.response.status})`);
  assert.equal(Array.isArray(audit.body) && audit.body.length, 1, 'Expected exactly one latest change_email audit row');
  assert.equal(audit.body[0].actor_id, owner.user.id, 'Audit actor must be the controlled owner');
  assert.equal(audit.body[0].target_user_id, targetId, 'Audit target must be the controlled target account');
  assertAuditSafe(audit.body[0].detail);
  console.log('PASS: controlled non-production owner email-change E2E, denial boundaries, Auth mutation, session revocation, and privacy-safe audit verified.');
} finally {
  if (targetId) {
    const restore = await serviceUpdateUser(targetId, { email: env.BQ_V5_TARGET_EMAIL });
    restored = restore.response.ok;
    if (!restored) console.error(`RESTORE FAILED (${restore.response.status}); controlled test account requires operator cleanup.`);
  }
}
assert.equal(restored, true, 'Controlled target email was not restored after E2E verification');