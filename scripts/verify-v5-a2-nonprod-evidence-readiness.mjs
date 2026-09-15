#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const STATIC_ONLY = !process.argv.includes('--runtime-preflight');
const ACK = 'BIBLEQUEST_NONPROD_EVIDENCE_ONLY';

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function read(rel) {
  const full = path.join(ROOT, rel);
  assert(fs.existsSync(full), `${rel} must exist`);
  if (!fs.existsSync(full)) return '';
  return fs.readFileSync(full, 'utf8');
}

function includesAll(source, snippets, label) {
  for (const snippet of snippets) {
    assert(source.includes(snippet), `${label} must retain: ${snippet}`);
  }
}

function uuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());
}

function email(value) {
  const v = String(value || '').trim();
  return v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function safeSupabaseUrl(value, label) {
  try {
    const url = new URL(String(value || '').trim());
    assert(url.protocol === 'https:', `${label} must use HTTPS`);
    assert(!url.username && !url.password && !url.hash, `${label} must not contain credentials or fragments`);
    assert(url.pathname === '/' || url.pathname === '', `${label} must be a project origin, not a function/path URL`);
    assert(/^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname), `${label} must be a hosted Supabase project origin`);
    return url;
  } catch {
    fail(`${label} must be a valid Supabase project origin`);
    return null;
  }
}

function presentSecret(name) {
  const value = process.env[name];
  assert(typeof value === 'string' && value.trim().length >= 20, `${name} must be present in the operator environment`);
  return Boolean(value && value.trim().length >= 20);
}

function staticContract() {
  const admin = read('supabase/functions/bq-admin-ops/index.ts');
  const revocation = read('supabase/migrations/20260915183000_admin_session_revocation.sql');
  const push = read('supabase/functions/bq-push-delivery/index.ts');
  const pushStorage = read('supabase/migrations/20260914072000_push_subscriptions.sql');

  includesAll(admin, [
    "if(action==='change_email')",
    "if(r!=='owner')",
    "if(target===u.id)",
    "a.auth.admin.updateUserById(target,{email})",
    "a.rpc('bible_revoke_auth_sessions',{target_user_id:targetUserId})",
    'async function requireSessionRevocation(a:ReturnType<typeof db>,targetUserId:string)',
    'await requireSessionRevocation(a,target)',
    "await audit(a,u.id,target,'change_email',{emailChanged:true,sessionsRevoked:true})",
    'return json(req,{ok:true,changed:true,revoked:true})',
  ], 'bq-admin-ops email-change fail-closed contract');
  assert(!/\/auth\/v1\/admin\/users\/.*\/logout/.test(admin), 'admin ops must not depend on an unsupported admin logout-by-user-id HTTP route');
  assert(!/change_email[^]*audit\([^)]*(?:oldEmail|newEmail|email\s*:)/.test(admin), 'change_email audit path must not add email values');
  assert(!/change_email[^]*force-sign-out-on-email-change/.test(admin), 'change_email must not swallow session-revocation failures');

  includesAll(revocation, [
    'create or replace function private.bible_revoke_auth_sessions_impl(',
    'security definer',
    'delete from auth.sessions',
    'where user_id = target_user_id',
    'create or replace function public.bible_revoke_auth_sessions(',
    'security invoker',
    'select private.bible_revoke_auth_sessions_impl(target_user_id)',
    'from public, anon, authenticated',
    'to service_role',
  ], 'admin session-revocation migration contract');

  includesAll(push, [
    'await requireAdmin(req, adminDb)',
    ".from('bible_notifications')",
    'isNotificationFresh(notification.created_at)',
    ".from('bible_push_subscriptions')",
    ".contains('enabled_categories', [category])",
    "Deno.env.get('VAPID_PRIVATE_KEY')",
    'safePushEndpoint(subscription.endpoint)',
    'statusCode === 404 || statusCode === 410',
  ], 'bq-push-delivery security contract');

  includesAll(pushStorage, [
    'enabled_categories text[] not null default',
    'enable row level security',
    'revoke all on table public.bible_push_subscriptions from public, anon',
    'to authenticated',
    'using ((select auth.uid()) = user_id)',
    'with check ((select auth.uid()) = user_id)',
  ], 'push subscription storage/RLS contract');

  if (!process.exitCode) console.log('PASS: STATIC non-production evidence prerequisites match current V5 owners.');
}

function runtimePreflight() {
  assert(process.env.BQ_EVIDENCE_NONPROD_ACK === ACK, `BQ_EVIDENCE_NONPROD_ACK must equal ${ACK}`);

  const testUrl = safeSupabaseUrl(process.env.BQ_EVIDENCE_TEST_SUPABASE_URL, 'BQ_EVIDENCE_TEST_SUPABASE_URL');
  const prodUrl = safeSupabaseUrl(process.env.BQ_EVIDENCE_PROD_SUPABASE_URL, 'BQ_EVIDENCE_PROD_SUPABASE_URL');
  if (testUrl && prodUrl) assert(testUrl.origin !== prodUrl.origin, 'test and production Supabase project origins must be different');

  const ownerId = process.env.BQ_EVIDENCE_OWNER_USER_ID;
  const adminId = process.env.BQ_EVIDENCE_ADMIN_USER_ID;
  const targetId = process.env.BQ_EVIDENCE_TARGET_USER_ID;
  assert(uuid(ownerId), 'BQ_EVIDENCE_OWNER_USER_ID must be a controlled UUID');
  assert(uuid(adminId), 'BQ_EVIDENCE_ADMIN_USER_ID must be a controlled UUID');
  assert(uuid(targetId), 'BQ_EVIDENCE_TARGET_USER_ID must be a controlled UUID');
  if (uuid(ownerId) && uuid(adminId) && uuid(targetId)) {
    assert(new Set([ownerId, adminId, targetId]).size === 3, 'owner/admin/target identities must be three distinct controlled users');
  }

  const originalEmail = process.env.BQ_EVIDENCE_TARGET_ORIGINAL_EMAIL;
  const temporaryEmail = process.env.BQ_EVIDENCE_TARGET_TEMP_EMAIL;
  assert(email(originalEmail), 'BQ_EVIDENCE_TARGET_ORIGINAL_EMAIL must be a controlled valid email');
  assert(email(temporaryEmail), 'BQ_EVIDENCE_TARGET_TEMP_EMAIL must be a controlled valid email');
  if (email(originalEmail) && email(temporaryEmail)) {
    assert(originalEmail.trim().toLowerCase() !== temporaryEmail.trim().toLowerCase(), 'original and temporary target emails must differ');
  }

  presentSecret('BQ_EVIDENCE_OWNER_ACCESS_TOKEN');
  presentSecret('BQ_EVIDENCE_ADMIN_ACCESS_TOKEN');
  presentSecret('BQ_EVIDENCE_TARGET_REFRESH_TOKEN');

  assert(process.env.BQ_EVIDENCE_RESTORE_TARGET_EMAIL === 'yes', 'BQ_EVIDENCE_RESTORE_TARGET_EMAIL=yes is required');
  assert(process.env.BQ_EVIDENCE_DELETE_TEST_PUSH_SUBSCRIPTIONS === 'yes', 'BQ_EVIDENCE_DELETE_TEST_PUSH_SUBSCRIPTIONS=yes is required');
  assert(process.env.BQ_EVIDENCE_VAPID_CONFIGURED === 'yes', 'BQ_EVIDENCE_VAPID_CONFIGURED=yes must be operator-confirmed without exposing the private key');
  assert(process.env.BQ_EVIDENCE_TEST_DEVICE_READY === 'yes', 'BQ_EVIDENCE_TEST_DEVICE_READY=yes is required for Phase 4 field evidence');
  assert(process.env.BQ_EVIDENCE_PRODUCTION_MUTATION_ALLOWED !== 'yes', 'production mutation must remain prohibited');

  if (!process.exitCode) {
    console.log('PASS: runtime preflight is structurally ready for controlled non-production evidence.');
    console.log('No credential, email, token, project identifier, VAPID value, or user identifier was printed.');
    console.log('This preflight performed zero network calls and is not BACKEND-E2E or DEVICE/FIELD evidence.');
  }
}

staticContract();
if (!STATIC_ONLY && !process.exitCode) runtimePreflight();

if (process.exitCode) process.exit(process.exitCode);
