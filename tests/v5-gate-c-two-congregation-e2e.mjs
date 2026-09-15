#!/usr/bin/env node
import assert from 'node:assert/strict';

const STATIC_MODE = process.argv.includes('--static-readiness');
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function required(name) {
  const value = String(process.env[name] ?? '').trim();
  assert(value, `Missing required environment variable: ${name}`);
  return value;
}

function parseHttpsOrigin(value, label) {
  const url = new URL(value);
  assert.equal(url.protocol, 'https:', `${label} must use https`);
  assert(!url.username && !url.password, `${label} must not contain credentials`);
  return url.origin;
}

function decodeJwtPayload(token) {
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function assertNotServiceRoleKey(key) {
  const payload = decodeJwtPayload(key);
  assert.notEqual(payload?.role, 'service_role', 'The test key must not be a service-role JWT');
}

function assertUuid(value, label) {
  assert(UUID_RE.test(value), `${label} must be a UUID`);
}

function restHeaders(anonKey, accessToken) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };
}

async function readJson(response, label) {
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`${label} returned non-JSON HTTP ${response.status}`);
    }
  }
  if (!response.ok) {
    const message = typeof body?.message === 'string' ? body.message : `HTTP ${response.status}`;
    throw new Error(`${label} failed: ${message}`);
  }
  return body;
}

async function signIn(origin, anonKey, email, password, label) {
  const response = await fetch(`${origin}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const body = await readJson(response, `${label} sign-in`);
  assert(body?.access_token, `${label} sign-in did not return an access token`);
  assert(body?.user?.id, `${label} sign-in did not return a user id`);
  const payload = decodeJwtPayload(body.access_token);
  assert.equal(payload?.role, 'authenticated', `${label} access token is not an authenticated-user JWT`);
  return { id: String(body.user.id), accessToken: body.access_token };
}

async function selectRows(origin, anonKey, actor, table, params, label) {
  const url = new URL(`${origin}/rest/v1/${table}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, { headers: restHeaders(anonKey, actor.accessToken) });
  const rows = await readJson(response, label);
  assert(Array.isArray(rows), `${label} did not return an array`);
  return rows;
}

async function loadMemberships(origin, anonKey, actor, label) {
  return selectRows(origin, anonKey, actor, 'bible_congregation_members', {
    select: 'congregation_id,role,active',
    user_id: `eq.${actor.id}`,
    active: 'eq.true',
  }, `${label} active memberships`);
}

function assertIsolatedMemberships(rows, ownCongregationId, otherCongregationId, label) {
  const own = rows.filter((row) => row.congregation_id === ownCongregationId && row.active === true);
  assert(own.length >= 1, `${label} must have an active membership in its expected congregation`);
  assert(
    !rows.some((row) => row.congregation_id === otherCongregationId && row.active === true),
    `${label} must not have an active membership in the opposite congregation`,
  );
}

async function assertFixtureBoundary({
  origin,
  anonKey,
  actorOwn,
  actorOther,
  table,
  fixtureId,
  congregationId,
  select,
  label,
  validateOwn,
}) {
  const ownRows = await selectRows(origin, anonKey, actorOwn, table, {
    select,
    id: `eq.${fixtureId}`,
  }, `${label} own-scope read`);
  assert.equal(ownRows.length, 1, `${label} fixture must be visible to its intended congregation actor`);
  assert.equal(ownRows[0].id, fixtureId, `${label} returned an unexpected fixture id`);
  assert.equal(ownRows[0].congregation_id, congregationId, `${label} fixture is seeded in the wrong congregation`);
  validateOwn?.(ownRows[0]);

  const crossRows = await selectRows(origin, anonKey, actorOther, table, {
    select,
    id: `eq.${fixtureId}`,
  }, `${label} cross-scope read`);
  assert.equal(crossRows.length, 0, `${label} leaked across congregation RLS`);
}

async function assertForeignScopeFilterEmpty({
  origin,
  anonKey,
  actor,
  table,
  foreignCongregationId,
  select,
  label,
}) {
  const rows = await selectRows(origin, anonKey, actor, table, {
    select,
    congregation_id: `eq.${foreignCongregationId}`,
    limit: '20',
  }, `${label} foreign congregation filter`);
  assert.equal(rows.length, 0, `${label}: changing the client congregation filter exposed foreign rows`);
}

if (STATIC_MODE) {
  console.log('Gate-C STATIC/readiness: harness parsed successfully; no backend request was made.');
  process.exit(0);
}

const allowed = required('BIBLEQUEST_GATE_C_BACKEND_E2E_ALLOWED');
assert.equal(allowed, 'true', 'BIBLEQUEST_GATE_C_BACKEND_E2E_ALLOWED must be exactly true');
assert(
  !process.env.BIBLEQUEST_TEST_SUPABASE_SERVICE_ROLE_KEY,
  'Do not provide BIBLEQUEST_TEST_SUPABASE_SERVICE_ROLE_KEY to this user-boundary harness',
);

const testOrigin = parseHttpsOrigin(required('BIBLEQUEST_TEST_SUPABASE_URL'), 'BIBLEQUEST_TEST_SUPABASE_URL');
const productionOrigin = parseHttpsOrigin(required('BIBLEQUEST_PRODUCTION_SUPABASE_URL'), 'BIBLEQUEST_PRODUCTION_SUPABASE_URL');
assert.notEqual(testOrigin, productionOrigin, 'Refusing to run: test and production Supabase origins are identical');

const anonKey = required('BIBLEQUEST_TEST_SUPABASE_ANON_KEY');
assertNotServiceRoleKey(anonKey);

const congregationA = required('BIBLEQUEST_GATE_C_CONGREGATION_A_ID');
const congregationB = required('BIBLEQUEST_GATE_C_CONGREGATION_B_ID');
const assignmentA = required('BIBLEQUEST_GATE_C_ASSIGNMENT_A_ID');
const assignmentB = required('BIBLEQUEST_GATE_C_ASSIGNMENT_B_ID');
const calendarA = required('BIBLEQUEST_GATE_C_CALENDAR_A_ID');
const calendarB = required('BIBLEQUEST_GATE_C_CALENDAR_B_ID');
for (const [value, label] of [
  [congregationA, 'Congregation A'],
  [congregationB, 'Congregation B'],
  [assignmentA, 'Assignment A'],
  [assignmentB, 'Assignment B'],
  [calendarA, 'Calendar A'],
  [calendarB, 'Calendar B'],
]) assertUuid(value, label);
assert.notEqual(congregationA, congregationB, 'Gate-C requires two distinct congregation ids');
assert.notEqual(assignmentA, assignmentB, 'Gate-C requires two distinct assignment fixtures');
assert.notEqual(calendarA, calendarB, 'Gate-C requires two distinct calendar fixtures');

const emailA = required('BIBLEQUEST_GATE_C_ACTOR_A_EMAIL');
const passwordA = required('BIBLEQUEST_GATE_C_ACTOR_A_PASSWORD');
const emailB = required('BIBLEQUEST_GATE_C_ACTOR_B_EMAIL');
const passwordB = required('BIBLEQUEST_GATE_C_ACTOR_B_PASSWORD');
assert.notEqual(emailA.toLowerCase(), emailB.toLowerCase(), 'Gate-C actors must be distinct accounts');

console.log(`Gate-C BACKEND-E2E target: ${testOrigin} (explicit non-production authorization present)`);
console.log('Authenticating two dedicated user identities with the anon key; service-role access is prohibited.');

const actorA = await signIn(testOrigin, anonKey, emailA, passwordA, 'Actor A');
const actorB = await signIn(testOrigin, anonKey, emailB, passwordB, 'Actor B');
assert.notEqual(actorA.id, actorB.id, 'Gate-C actors resolved to the same auth user');

const [membershipsA, membershipsB] = await Promise.all([
  loadMemberships(testOrigin, anonKey, actorA, 'Actor A'),
  loadMemberships(testOrigin, anonKey, actorB, 'Actor B'),
]);
assertIsolatedMemberships(membershipsA, congregationA, congregationB, 'Actor A');
assertIsolatedMemberships(membershipsB, congregationB, congregationA, 'Actor B');

await assertFixtureBoundary({
  origin: testOrigin,
  anonKey,
  actorOwn: actorA,
  actorOther: actorB,
  table: 'bible_assignments',
  fixtureId: assignmentA,
  congregationId: congregationA,
  select: 'id,congregation_id,title,target_scope,active,schedule_at',
  label: 'Assignment A',
  validateOwn: (row) => {
    assert.equal(row.active, true, 'Assignment A fixture must be active');
    assert.equal(row.target_scope, 'all', 'Assignment A fixture must target all members for deterministic visibility');
  },
});
await assertFixtureBoundary({
  origin: testOrigin,
  anonKey,
  actorOwn: actorB,
  actorOther: actorA,
  table: 'bible_assignments',
  fixtureId: assignmentB,
  congregationId: congregationB,
  select: 'id,congregation_id,title,target_scope,active,schedule_at',
  label: 'Assignment B',
  validateOwn: (row) => {
    assert.equal(row.active, true, 'Assignment B fixture must be active');
    assert.equal(row.target_scope, 'all', 'Assignment B fixture must target all members for deterministic visibility');
  },
});
await assertFixtureBoundary({
  origin: testOrigin,
  anonKey,
  actorOwn: actorA,
  actorOther: actorB,
  table: 'bible_calendar_events',
  fixtureId: calendarA,
  congregationId: congregationA,
  select: 'id,congregation_id,title,event_date',
  label: 'Calendar A',
});
await assertFixtureBoundary({
  origin: testOrigin,
  anonKey,
  actorOwn: actorB,
  actorOther: actorA,
  table: 'bible_calendar_events',
  fixtureId: calendarB,
  congregationId: congregationB,
  select: 'id,congregation_id,title,event_date',
  label: 'Calendar B',
});

for (const check of [
  { actor: actorA, table: 'bible_assignments', foreignCongregationId: congregationB, label: 'Actor A assignments' },
  { actor: actorB, table: 'bible_assignments', foreignCongregationId: congregationA, label: 'Actor B assignments' },
  { actor: actorA, table: 'bible_calendar_events', foreignCongregationId: congregationB, label: 'Actor A calendar' },
  { actor: actorB, table: 'bible_calendar_events', foreignCongregationId: congregationA, label: 'Actor B calendar' },
]) {
  await assertForeignScopeFilterEmpty({
    origin: testOrigin,
    anonKey,
    actor: check.actor,
    table: check.table,
    foreignCongregationId: check.foreignCongregationId,
    select: 'id,congregation_id',
    label: check.label,
  });
}

console.log('Gate-C BACKEND-E2E PASS: memberships are isolated and assignment/calendar fixtures do not cross congregation RLS.');
console.log('Scope: authenticated read isolation only. This does not certify authoring workflows, push delivery, or production deployment parity.');
