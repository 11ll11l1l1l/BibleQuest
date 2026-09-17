import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';

const env = process.env;
for (const key of ['BQ_LOCAL_SUPABASE_URL', 'BQ_LOCAL_ANON_KEY', 'BQ_LOCAL_SERVICE_ROLE_KEY']) {
  assert.ok(env[key], `Missing local-stack environment variable: ${key}`);
}

const base = new URL(env.BQ_LOCAL_SUPABASE_URL);
assert.ok(['localhost', '127.0.0.1'].includes(base.hostname), 'Local Admin E2E wrapper refuses non-loopback Supabase URLs');
const apiBase = base.origin.replace(/\/$/, '');
const anonKey = env.BQ_LOCAL_ANON_KEY;
const serviceKey = env.BQ_LOCAL_SERVICE_ROLE_KEY;
const serviceHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
};
const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
const credentials = {
  owner: { email: `owner-${suffix}@bq-local.invalid`, password: `Owner-${crypto.randomUUID()}!Aa1` },
  admin: { email: `admin-${suffix}@bq-local.invalid`, password: `Admin-${crypto.randomUUID()}!Aa1` },
  target: { email: `target-${suffix}@bq-local.invalid`, password: `Target-${crypto.randomUUID()}!Aa1` },
  replacement: { email: `target-new-${suffix}@bq-local.invalid` },
};
const createdIds = [];

async function jsonFetch(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  return { response, body };
}

async function createUser(email, password) {
  const { response, body } = await jsonFetch(`${apiBase}/auth/v1/admin/users`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  assert.equal(response.ok, true, `Local Auth user creation failed (${response.status})`);
  assert.ok(body?.id, 'Local Auth user creation returned no user id');
  createdIds.push(body.id);
  return body.id;
}

async function insertAccess(rows) {
  const { response } = await jsonFetch(`${apiBase}/rest/v1/bible_app_access`, {
    method: 'POST',
    headers: { ...serviceHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify(rows),
  });
  assert.equal(response.ok, true, `Local app-access fixture insert failed (${response.status})`);
}

async function deleteUser(id) {
  await jsonFetch(`${apiBase}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: serviceHeaders });
}

let childStatus = 1;
try {
  const ownerId = await createUser(credentials.owner.email, credentials.owner.password);
  const adminId = await createUser(credentials.admin.email, credentials.admin.password);
  const targetId = await createUser(credentials.target.email, credentials.target.password);

  await insertAccess([
    { user_id: ownerId, role: 'owner', active: true },
    { user_id: adminId, role: 'admin', active: true },
    { user_id: targetId, role: 'member', active: true },
  ]);

  const child = spawnSync(process.execPath, ['tests/v5-admin-email-change-e2e.mjs'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      BQ_V5_TEST_SUPABASE_URL: apiBase,
      BQ_V5_TEST_ANON_KEY: anonKey,
      BQ_V5_TEST_SERVICE_ROLE_KEY: serviceKey,
      BQ_V5_OWNER_EMAIL: credentials.owner.email,
      BQ_V5_OWNER_PASSWORD: credentials.owner.password,
      BQ_V5_ADMIN_EMAIL: credentials.admin.email,
      BQ_V5_ADMIN_PASSWORD: credentials.admin.password,
      BQ_V5_TARGET_EMAIL: credentials.target.email,
      BQ_V5_TARGET_PASSWORD: credentials.target.password,
      BQ_V5_TARGET_NEW_EMAIL: credentials.replacement.email,
      BQ_V5_E2E_CONFIRM_NONPROD: 'I_UNDERSTAND_NONPROD_ONLY',
      BQ_V5_E2E_CONFIRM_LOCALSTACK: 'I_UNDERSTAND_LOCALSTACK_ONLY',
    },
  });
  childStatus = child.status ?? 1;
  assert.equal(childStatus, 0, 'Local-stack Admin email-change harness failed');
  console.log('PASS: isolated local Supabase Admin email-change BACKEND-E2E completed with disposable identities.');
} finally {
  for (const id of createdIds.reverse()) {
    try { await deleteUser(id); } catch {}
  }
}
