import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

// Only the existing disposable CI stack is supported. Never accept a remote
// project URL or put its bootstrap key/passwords in an evidence artifact.
const status = JSON.parse(await readFile(process.env.BQ_LOCAL_STATUS_FILE, 'utf8'));
const endpoint = new URL(status.API_URL);
assert.equal(endpoint.protocol, 'http:');
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname));
assert.ok(status.ANON_KEY && status.SERVICE_ROLE_KEY);
const candidateSha = process.env.BQ_EXACT_SHA;
assert.match(candidateSha, /^[a-f0-9]{40}$/);
const checks = [];
const scopeA = '10000000-0000-4000-8000-000000000001';
const scopeB = '20000000-0000-4000-8000-000000000002';
const marker = randomUUID();

async function request(path, token, method = 'GET', body, prefer) {
  const response = await fetch(new URL(path, endpoint), {
    method,
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
    headers: {
      apikey: status.ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : null;
  return { ok: response.ok, status: response.status, data };
}

async function ok(path, token, method = 'GET', body, prefer = 'return=representation') {
  const result = await request(path, token, method, body, prefer);
  // Report only endpoint/status/error code; response bodies may contain secrets.
  assert.ok(result.ok, `${method} ${path.split('?')[0]}: HTTP ${result.status}, code ${result.data?.code || result.data?.error_code || 'unknown'}`);
  return result.data;
}

async function denied(path, token, method, body, code = '42501') {
  const result = await request(path, token, method, body);
  assert.ok([401, 403].includes(result.status), `Expected authorization denial: ${method} ${path.split('?')[0]}, HTTP ${result.status}`);
  assert.equal(result.data?.code, code);
}

const rpc = (name, token, body) => ok(`/rest/v1/rpc/${name}`, token, 'POST', body);
function one(result) {
  if (!Array.isArray(result)) return result;
  assert.equal(result.length, 1);
  return result[0];
}
const insert = (table, token, row) => ok(`/rest/v1/${table}`, token, 'POST', row);
const select = (table, token, filter) => ok(`/rest/v1/${table}?${filter}`, token);
const update = (table, token, filter, row) => ok(`/rest/v1/${table}?${filter}`, token, 'PATCH', row);

async function actor(label, role, congregationId) {
  const password = `${randomUUID()}!A9`;
  const email = `${label}-${marker}@bq-v7.invalid`;
  const user = await ok('/auth/v1/admin/users', status.SERVICE_ROLE_KEY, 'POST', { email, password, email_confirm: true });
  assert.ok(user.id);
  // Privileged bootstrap is limited to synthetic identities and membership;
  // every feature read and mutation below uses a real signed-in user's JWT.
  await insert('bible_app_access', status.SERVICE_ROLE_KEY, { user_id: user.id, role, active: true });
  await insert('bible_congregation_members', status.SERVICE_ROLE_KEY, {
    congregation_id: congregationId, user_id: user.id, role, display_name: `V7 CI ${label}`, active: true,
  });
  const session = await ok('/auth/v1/token?grant_type=password', status.ANON_KEY, 'POST', { email, password });
  assert.equal(session.user.id, user.id);
  assert.ok(session.access_token);
  const verified = await ok('/auth/v1/user', session.access_token);
  assert.equal(verified.id, user.id);
  const membership = await select('bible_congregation_members', session.access_token, `congregation_id=eq.${congregationId}&user_id=eq.${user.id}`);
  assert.equal(membership.length, 1);
  assert.equal(membership[0].role, role);
  return { id: user.id, token: session.access_token };
}

const mentor = await actor('mentor', 'leader', scopeA);
const mentee = await actor('mentee', 'member', scopeA);
const foreign = await actor('foreign-leader', 'leader', scopeB);
checks.push('real-password-authentication-and-user-validation');

const ids = Object.fromEntries(['pair', 'track', 'trackRevision', 'module', 'moduleRevision', 'lesson', 'lessonVersion', 'revision'].map(name => [name, randomUUID()]));
const types = ['scripture', 'understand', 'discuss', 'reflect', 'apply', 'pray', 'action'];
const steps = types.map((type, position) => ({
  id: randomUUID(), lesson_revision_id: ids.revision, position, step_type: type,
  content: { text: `Synthetic CI ${type}` },
}));

await insert('v7_mentor_pairs', mentor.token, {
  id: ids.pair, congregation_id: scopeA, mentor_id: mentor.id, mentee_id: mentee.id, initiated_by: mentor.id,
});
const transition = { p_pair_id: ids.pair, p_action: 'accept' };
assert.equal(one(await rpc('bible_v7_transition_mentor_pair', mentor.token, transition)).state, 'invited');
assert.equal(one(await rpc('bible_v7_transition_mentor_pair', mentee.token, transition)).state, 'active');
await denied('/rest/v1/rpc/bible_v7_transition_mentor_pair', foreign.token, 'POST', transition);
assert.deepEqual(await select('v7_mentor_pairs', foreign.token, `id=eq.${ids.pair}`), []);
checks.push('mutual-pair-acceptance-and-foreign-participant-denial');

await insert('v7_tracks', mentor.token, {
  id: ids.track, congregation_id: scopeA, title: 'V7 CI track', locale: 'en', revision_id: ids.trackRevision, created_by: mentor.id,
});
await insert('v7_modules', mentor.token, {
  id: ids.module, track_id: ids.track, title: 'V7 CI module', revision_id: ids.moduleRevision, display_order: 0,
});
await insert('v7_lessons', mentor.token, {
  id: ids.lesson, module_id: ids.module, title: 'V7 CI lesson', revision_id: ids.lessonVersion, display_order: 0,
});
await insert('v7_lesson_revisions', mentor.token, {
  id: ids.revision, lesson_id: ids.lesson, revision_number: 1, locale: 'en', created_by: mentor.id,
});
await insert('v7_lesson_steps', mentor.token, steps);
const publication = {
  p_congregation_id: scopeA, p_track_id: ids.track, p_module_id: ids.module, p_lesson_id: ids.lesson,
  p_lesson_revision_id: ids.revision, p_expected_track_revision_id: ids.trackRevision,
  p_expected_module_revision_id: ids.moduleRevision, p_expected_lesson_revision_id: ids.lessonVersion,
  p_library_revision_ids: [],
};
await denied('/rest/v1/rpc/bible_v7_publish_curriculum_path', mentee.token, 'POST', publication);
await denied('/rest/v1/rpc/bible_v7_publish_curriculum_path', foreign.token, 'POST', publication);
await denied(`/rest/v1/v7_tracks?id=eq.${ids.track}`, mentor.token, 'PATCH', { publication_state: 'published' });
const [published] = await rpc('bible_v7_publish_curriculum_path', mentor.token, publication);
assert.equal(published.lesson_revision_id, ids.revision);
assert.equal(published.track_publication_state, 'published');
assert.equal(published.module_publication_state, 'published');
assert.equal(published.lesson_publication_state, 'published');
assert.ok(published.published_at);
assert.deepEqual((await select('v7_lesson_steps', mentee.token, `lesson_revision_id=eq.${ids.revision}&order=position`)).map(step => step.step_type), types);
checks.push('authenticated-seven-step-authoring-and-atomic-publication');
checks.push('member-foreign-publication-and-direct-publication-denial');

const assignment = {
  p_pair_id: ids.pair, p_track_id: ids.track, p_module_id: ids.module, p_lesson_id: ids.lesson, p_lesson_revision_id: ids.revision,
};
await denied('/rest/v1/rpc/bible_v7_create_pair_assignment', mentee.token, 'POST', assignment);
await denied('/rest/v1/rpc/bible_v7_create_pair_assignment', foreign.token, 'POST', assignment);
const [assigned] = await rpc('bible_v7_create_pair_assignment', mentor.token, assignment);
assert.equal(assigned.assignment_status, 'assigned');
const [retry] = await rpc('bible_v7_create_pair_assignment', mentor.token, assignment);
assert.equal(retry.assignment_id, assigned.assignment_id);
assert.equal((await select('v7_pair_assignments', mentee.token, `id=eq.${assigned.assignment_id}`))[0].lesson_revision_id, ids.revision);
assert.deepEqual(await select('v7_pair_assignments', foreign.token, `id=eq.${assigned.assignment_id}`), []);
checks.push('immutable-assignment-identity-idempotency-and-role-tenant-denial');

const progress = {
  assignment_id: assigned.assignment_id, learner_id: mentee.id, lesson_revision_id: ids.revision,
  current_step_id: steps[3].id, status: 'in_progress', started_at: new Date().toISOString(),
};
const [savedProgress] = await insert('v7_learner_progress', mentee.token, progress);
assert.equal((await select('v7_learner_progress', mentee.token, `id=eq.${savedProgress.id}`))[0].current_step_id, steps[3].id);
assert.equal((await select('v7_learner_progress', mentor.token, `id=eq.${savedProgress.id}`))[0].status, 'in_progress');
assert.deepEqual(await select('v7_learner_progress', foreign.token, `id=eq.${savedProgress.id}`), []);
assert.deepEqual(await update('v7_learner_progress', mentor.token, `id=eq.${savedProgress.id}`, { current_step_id: steps[6].id }), []);
assert.equal((await select('v7_learner_progress', mentee.token, `id=eq.${savedProgress.id}`))[0].current_step_id, steps[3].id);

const [response] = await insert('v7_lesson_responses', mentee.token, {
  assignment_id: assigned.assignment_id, lesson_revision_id: ids.revision, lesson_step_id: steps[3].id,
  learner_id: mentee.id, response: { text: 'Synthetic private CI response' },
});
assert.deepEqual(await select('v7_lesson_responses', mentor.token, `id=eq.${response.id}`), []);
assert.deepEqual(await select('v7_lesson_responses', foreign.token, `id=eq.${response.id}`), []);
const [share] = await insert('v7_response_shares', mentee.token, { response_id: response.id, recipient_id: mentor.id });
assert.equal((await select('v7_lesson_responses', mentor.token, `id=eq.${response.id}`))[0].id, response.id);
await update('v7_response_shares', mentee.token, `id=eq.${share.id}`, { share_state: 'revoked', revoked_at: new Date().toISOString() });
assert.deepEqual(await select('v7_lesson_responses', mentor.token, `id=eq.${response.id}`), []);
assert.equal((await select('v7_lesson_responses', mentee.token, `id=eq.${response.id}`))[0].id, response.id);
checks.push('persisted-resume-mentor-read-only-and-private-response-isolation');
checks.push('explicit-response-sharing-and-immediate-revocation');

await update('v7_learner_progress', mentee.token, `id=eq.${savedProgress.id}`, {
  current_step_id: steps[6].id, status: 'completed', completed_at: new Date().toISOString(),
});
assert.equal((await select('v7_learner_progress', mentee.token, `id=eq.${savedProgress.id}`))[0].status, 'completed');
await update('bible_congregation_members', status.SERVICE_ROLE_KEY,
  `congregation_id=eq.${scopeA}&user_id=eq.${mentor.id}`, { active: false });
await denied('/rest/v1/rpc/bible_v7_create_pair_assignment', mentor.token, 'POST', assignment);
await update('bible_congregation_members', status.SERVICE_ROLE_KEY,
  `congregation_id=eq.${scopeA}&user_id=eq.${mentor.id}`, { active: true });
checks.push('membership-revocation-invalidates-existing-session-authority');
await rpc('bible_v7_transition_mentor_pair', mentor.token, { p_pair_id: ids.pair, p_action: 'end' });
await denied('/rest/v1/rpc/bible_v7_create_pair_assignment', mentor.token, 'POST', assignment);
assert.equal((await select('v7_lesson_responses', mentee.token, `id=eq.${response.id}`))[0].id, response.id);
assert.deepEqual(await select('v7_lesson_responses', mentor.token, `id=eq.${response.id}`), []);
checks.push('completion-reentry-ended-pair-denial-and-owner-history');

await mkdir('artifacts/v7', { recursive: true });
await writeFile('artifacts/v7/authenticated-api-journey.json', `${JSON.stringify({
  schemaVersion: 1, candidateSha, result: 'PASS', environment: 'disposable-local-supabase',
  observedAt: new Date().toISOString(), actors: ['leader-mentor', 'member-mentee', 'foreign-leader'],
  evidenceClass: 'authenticated-api-backend', checks,
  exclusions: ['built-artifact-browser', 'production-backend', 'physical-device', 'representative-content-review'],
}, null, 2)}\n`);
console.log(`PASS V7 authenticated API journey (${checks.length} checks; synthetic disposable data only)`);
