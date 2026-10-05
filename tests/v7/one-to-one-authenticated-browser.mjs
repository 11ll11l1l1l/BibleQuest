import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const status = JSON.parse(await readFile(process.env.BQ_LOCAL_STATUS_FILE, 'utf8'));
const endpoint = new URL(status.API_URL);
assert.equal(endpoint.protocol, 'http:');
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname));
assert.ok(status.ANON_KEY && status.SERVICE_ROLE_KEY);
const candidateSha = process.env.BQ_EXACT_SHA;
assert.match(candidateSha, /^[a-f0-9]{40}$/);
const baseUrl = process.env.BQ_PREVIEW_URL || 'http://bq.localhost:4173';
assert.equal(new URL(baseUrl).hostname.endsWith('.localhost'), true);
const productionSupabaseOrigin = 'https://zkfmgezvzugchcwppreq.supabase.co';
const scopeA = '10000000-0000-4000-8000-000000000001';
const marker = randomUUID();
const checks = [];

async function request(path, token, method = 'GET', body, prefer = 'return=representation') {
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
  let data = null;
  if (raw) {
    try { data = JSON.parse(raw); } catch { data = raw; }
  }
  assert.ok(response.ok, `${method} ${path.split('?')[0]}: HTTP ${response.status}, code ${data?.code || data?.error_code || 'unknown'}`);
  return data;
}

const insert = (table, token, row) => request(`/rest/v1/${table}`, token, 'POST', row);
const select = (table, token, filter) => request(`/rest/v1/${table}?${filter}`, token);
const rpc = (name, token, body) => request(`/rest/v1/rpc/${name}`, token, 'POST', body);

async function actor(label, role) {
  const password = `${randomUUID()}!A9`;
  const email = `${label}-${marker}@bq-v7-browser.invalid`;
  const user = await request('/auth/v1/admin/users', status.SERVICE_ROLE_KEY, 'POST', { email, password, email_confirm: true });
  assert.ok(user.id);
  await insert('bible_app_access', status.SERVICE_ROLE_KEY, { user_id: user.id, role, active: true });
  await insert('bible_congregation_members', status.SERVICE_ROLE_KEY, {
    congregation_id: scopeA,
    user_id: user.id,
    role,
    display_name: `V7 Browser ${label}`,
    active: true,
  });
  const session = await request('/auth/v1/token?grant_type=password', status.ANON_KEY, 'POST', { email, password }, null);
  assert.equal(session.user.id, user.id);
  return Object.freeze({ id: user.id, email, password, token: session.access_token });
}

async function installDisposableBackend(context) {
  await context.route(`${productionSupabaseOrigin}/**`, async route => {
    const original = route.request();
    const source = new URL(original.url());
    const target = new URL(`${source.pathname}${source.search}`, endpoint);
    const headers = { ...original.headers(), apikey: status.ANON_KEY };
    if ((headers.authorization || '').includes('sb_publishable_')) headers.authorization = `Bearer ${status.ANON_KEY}`;
    delete headers.host;
    const response = await route.fetch({ url: target.href, headers });
    await route.fulfill({ response });
  });
}

function captureErrors(page, label) {
  const errors = [];
  page.on('pageerror', error => errors.push(`${label}: ${error?.message || error}`));
  return () => assert.deepEqual(errors, [], errors.join(' | '));
}

async function signIn(page, actorInfo) {
  await page.goto(`${baseUrl}/#/account`, { waitUntil: 'networkidle' });
  const form = page.locator('[data-account-login]');
  await form.waitFor({ state: 'visible' });
  await form.locator('input[name="email"]').fill(actorInfo.email);
  await form.locator('input[name="password"]').fill(actorInfo.password);
  await form.locator('button[type="submit"]').click();
  await page.waitForFunction(() => location.hash === '#/home');
  await page.locator('[data-startup-failure]').waitFor({ state: 'detached' }).catch(() => {});
}

async function chooseCongregation(page) {
  await page.goto(`${baseUrl}/#/congregation`, { waitUntil: 'networkidle' });
  const current = page.locator(`[data-congregation-row="${scopeA}"][data-congregation-current="true"]`);
  if (!(await current.count())) {
    const choose = page.locator(`[data-congregation-switch="${scopeA}"]`);
    await choose.waitFor({ state: 'visible' });
    await choose.click();
  }
  await current.waitFor({ state: 'visible' });
}

async function waitForBackend(check, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    try {
      const value = await check();
      if (value) return value;
    } catch (error) { last = error; }
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  if (last) throw last;
  throw new Error('Timed out waiting for disposable backend state.');
}

const mentor = await actor('mentor', 'leader');
const mentee = await actor('mentee', 'member');
checks.push('synthetic-two-user-password-auth-fixture');

const browser = await chromium.launch({ headless: true });
const mentorContext = await browser.newContext({ viewport: { width: 390, height: 900 } });
const menteeContext = await browser.newContext({ viewport: { width: 390, height: 900 } });
await installDisposableBackend(mentorContext);
await installDisposableBackend(menteeContext);
const mentorPage = await mentorContext.newPage();
const menteePage = await menteeContext.newPage();
const assertMentorErrors = captureErrors(mentorPage, 'mentor');
const assertMenteeErrors = captureErrors(menteePage, 'mentee');

try {
  await signIn(mentorPage, mentor);
  await chooseCongregation(mentorPage);
  await mentorPage.goto(`${baseUrl}/#/one-to-one-pair`, { waitUntil: 'networkidle' });
  const invite = mentorPage.locator('[data-pair-invite]');
  await invite.waitFor({ state: 'visible' });
  await invite.locator('select[name="otherUserId"]').selectOption(mentee.id);
  await invite.locator('select[name="role"]').selectOption('mentor');
  await invite.locator('button[type="submit"]').click();
  await mentorPage.locator('[data-pair-action="accept"]').waitFor({ state: 'visible' });

  const pair = await waitForBackend(async () => {
    const rows = await select('v7_mentor_pairs', status.SERVICE_ROLE_KEY,
      `mentor_id=eq.${mentor.id}&mentee_id=eq.${mentee.id}&order=created_at.desc`);
    return rows.find(row => row.state === 'invited') || null;
  });
  assert.ok(pair.id);
  await mentorPage.locator('[data-pair-action="accept"]').click();
  await waitForBackend(async () => {
    const rows = await select('v7_mentor_pairs', status.SERVICE_ROLE_KEY, `id=eq.${pair.id}`);
    return rows[0]?.mentor_accepted_at ? rows[0] : null;
  });
  checks.push('mentor-ui-invitation-and-acceptance');

  await signIn(menteePage, mentee);
  await chooseCongregation(menteePage);
  await menteePage.goto(`${baseUrl}/#/one-to-one`, { waitUntil: 'networkidle' });
  const overviewPair = menteePage.locator(`[data-open-pair="${pair.id}"]`);
  await overviewPair.waitFor({ state: 'visible' });
  await overviewPair.click();
  await menteePage.waitForFunction(id => location.hash === `#/one-to-one-pair?id=${encodeURIComponent(id)}`, pair.id);
  await menteePage.locator('[data-pair-action="accept"]').waitFor({ state: 'visible' });
  await menteePage.locator('[data-pair-action="accept"]').click();
  await menteePage.locator('[data-pair-action="lessons"]').waitFor({ state: 'visible' });
  await waitForBackend(async () => {
    const rows = await select('v7_mentor_pairs', status.SERVICE_ROLE_KEY, `id=eq.${pair.id}`);
    return rows[0]?.state === 'active' ? rows[0] : null;
  });
  checks.push('mentee-overview-open-and-ui-acceptance');

  const ids = Object.fromEntries(['track', 'trackRevision', 'module', 'moduleRevision', 'lesson', 'lessonVersion', 'revision'].map(name => [name, randomUUID()]));
  const stepTypes = ['scripture', 'understand', 'discuss', 'reflect', 'apply', 'pray', 'action'];
  const steps = stepTypes.map((type, position) => ({
    id: randomUUID(),
    lesson_revision_id: ids.revision,
    position,
    step_type: type,
    content: { text: `Browser certification ${type}` },
    scripture_refs: type === 'scripture' ? ['John 3:16'] : [],
  }));
  await insert('v7_tracks', mentor.token, {
    id: ids.track, congregation_id: scopeA, title: 'Browser certification track', locale: 'en', revision_id: ids.trackRevision, display_order: 0, created_by: mentor.id,
  });
  await insert('v7_modules', mentor.token, {
    id: ids.module, track_id: ids.track, title: 'Browser certification module', revision_id: ids.moduleRevision, display_order: 0,
  });
  await insert('v7_lessons', mentor.token, {
    id: ids.lesson, module_id: ids.module, title: 'Browser certification lesson', revision_id: ids.lessonVersion, display_order: 0,
  });
  await insert('v7_lesson_revisions', mentor.token, {
    id: ids.revision, lesson_id: ids.lesson, revision_number: 1, locale: 'en', summary: 'Synthetic browser acceptance lesson', created_by: mentor.id,
  });
  await insert('v7_lesson_steps', mentor.token, steps);
  await rpc('bible_v7_publish_curriculum_path', mentor.token, {
    p_congregation_id: scopeA,
    p_track_id: ids.track,
    p_module_id: ids.module,
    p_lesson_id: ids.lesson,
    p_lesson_revision_id: ids.revision,
    p_expected_track_revision_id: ids.trackRevision,
    p_expected_module_revision_id: ids.moduleRevision,
    p_expected_lesson_revision_id: ids.lessonVersion,
    p_library_revision_ids: [],
  });
  checks.push('published-curriculum-fixture-through-authenticated-authority');

  await mentorPage.goto(`${baseUrl}/#/one-to-one?view=assignment`, { waitUntil: 'networkidle' });
  for (const [kind, id] of [['pair', pair.id], ['track', ids.track], ['module', ids.module], ['lesson', ids.lesson]]) {
    const option = mentorPage.locator(`[data-assignment-select="${kind}"][data-id="${id}"]`);
    await option.waitFor({ state: 'visible' });
    await option.click();
  }
  const create = mentorPage.locator('[data-assignment-action="create"]');
  await create.waitFor({ state: 'visible' });
  await create.click();
  await mentorPage.locator('[data-assignment-created]').waitFor({ state: 'visible' });
  const assignment = await waitForBackend(async () => {
    const rows = await select('v7_pair_assignments', mentor.token, `pair_id=eq.${pair.id}&lesson_revision_id=eq.${ids.revision}`);
    return rows[0] || null;
  });
  assert.equal(assignment.status, 'assigned');
  checks.push('mentor-ui-authoritative-assignment-creation');

  await menteePage.goto(`${baseUrl}/#/one-to-one-pair?id=${pair.id}`, { waitUntil: 'networkidle' });
  await menteePage.locator('[data-pair-action="lessons"]').click();
  await menteePage.locator('[data-assigned-curriculum]').waitFor({ state: 'visible' });
  for (let depth = 0; depth < 3; depth += 1) {
    const option = menteePage.locator('[data-assigned-index="0"]');
    await option.waitFor({ state: 'visible' });
    await option.click();
  }
  await menteePage.locator('[data-lesson-runner]').waitFor({ state: 'visible' });
  await menteePage.locator('[data-lesson-heading]').waitFor({ state: 'visible' });
  assert.equal((await menteePage.locator('[data-lesson-heading]').textContent())?.trim(), 'scripture');
  await menteePage.locator('[data-lesson-next]').click();
  await menteePage.locator('[data-lesson-heading]').filter({ hasText: 'understand' }).waitFor({ state: 'visible' });
  const responseText = `Browser private response ${marker}`;
  const response = menteePage.locator('[data-lesson-response]');
  await response.fill(responseText);
  await menteePage.locator('[data-lesson-next]').click();
  await menteePage.locator('[data-lesson-heading]').filter({ hasText: 'discuss' }).waitFor({ state: 'visible' });
  await waitForBackend(async () => {
    const rows = await select('v7_lesson_responses', mentee.token, `assignment_id=eq.${assignment.id}&learner_id=eq.${mentee.id}`);
    return rows.some(row => row.response?.text === responseText) ? rows : null;
  });
  const progress = await waitForBackend(async () => {
    const rows = await select('v7_learner_progress', mentee.token, `assignment_id=eq.${assignment.id}&learner_id=eq.${mentee.id}`);
    return rows[0]?.status === 'in_progress' ? rows[0] : null;
  });
  assert.equal(progress.current_step_id, steps[2].id);
  checks.push('mentee-ui-assigned-lesson-resume-and-private-response-persistence');

  await mentorPage.goto(`${baseUrl}/#/one-to-one-lesson?pairId=${pair.id}&trackId=${ids.track}&moduleId=${ids.module}&revisionId=${ids.revision}`, { waitUntil: 'networkidle' });
  await mentorPage.locator('[data-lesson-heading]').waitFor({ state: 'visible' });
  await mentorPage.locator('text=Mentor preview').waitFor({ state: 'visible' });
  assert.equal(await mentorPage.locator('[data-lesson-response]').count(), 0);
  checks.push('mentor-ui-lesson-read-only-boundary');

  assertMentorErrors();
  assertMenteeErrors();
  checks.push('no-browser-page-errors');

  await mkdir('artifacts/v7', { recursive: true });
  await writeFile('artifacts/v7/authenticated-browser-journey.json', `${JSON.stringify({
    schemaVersion: 1,
    candidateSha,
    result: 'PASS',
    environment: 'exact-built-artifact-plus-disposable-local-supabase',
    observedAt: new Date().toISOString(),
    viewport: '390x900',
    actors: ['leader-mentor', 'member-mentee'],
    evidenceClass: 'authenticated-built-browser',
    checks,
    exclusions: ['production-backend', 'physical-device', 'representative-content-review'],
  }, null, 2)}\n`);
  console.log(`PASS V7 authenticated built-browser ONE 2 ONE journey (${checks.length} checks; synthetic disposable data only)`);
} finally {
  await mentorContext.close();
  await menteeContext.close();
  await browser.close();
}
