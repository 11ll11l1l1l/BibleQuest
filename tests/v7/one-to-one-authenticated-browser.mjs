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
const scopeA = randomUUID(); // An isolated rights-valid test tenant, not the shared V6 seed.
const marker = randomUUID();
const scopeB = randomUUID();
const checks = [];
const backendReads = []; // Status-only diagnostics; never record response data or access tokens.
let stage = 'bootstrap';

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
    if (['/rest/v1/bible_congregation_members', '/rest/v1/bible_congregations'].includes(source.pathname)) {
      let returnedRows = null;
      try { const body = await response.json(); returnedRows = Array.isArray(body) ? body.length : null; } catch {}
      backendReads.push({
        resource: source.pathname.split('/').pop(),
        status: response.status(),
        returnedRows,
        authMode: /^Bearer eyJ/i.test(headers.authorization || '') ? 'signed-jwt' : 'anonymous-or-publishable',
      });
    }
    await route.fulfill({ response });
  });
}

function captureErrors(page, label) {
  const errors = [];
  page.on('pageerror', error => errors.push(`${label}: ${error?.message || error}`));
  return {
    errors,
    assertNone() { assert.deepEqual(errors, [], errors.join(' | ')); },
  };
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

async function chooseCongregation(page, congregationId = scopeA) {
  await page.goto(`${baseUrl}/#/congregation`, { waitUntil: 'networkidle' });
  const current = page.locator(`[data-congregation-row="${congregationId}"][data-congregation-current="true"]`);
  if (!(await current.count())) {
    const choose = page.locator(`[data-congregation-switch="${congregationId}"]`);
    await choose.waitFor({ state: 'visible' });
    await choose.click();
  }
  await current.waitFor({ state: 'visible' });
}

async function signOut(page) {
  await page.goto(`${baseUrl}/#/account`, { waitUntil: 'networkidle' });
  const button = page.locator('[data-account-signout]');
  await button.waitFor({ state: 'visible' });
  await button.click();
  await page.locator('[data-account-login]').waitFor({ state: 'visible' });
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

async function pageSummary(page) {
  if (page.isClosed()) return { closed: true };
  return {
    closed: false,
    url: page.url(),
    title: await page.title().catch(() => ''),
    text: (await page.locator('body').innerText().catch(() => '')).slice(0, 12000),
  };
}

stage = 'synthetic-actors';
const mentor = await actor('mentor', 'leader');
const mentee = await actor('mentee', 'member');
const foreign = await actor('foreign', 'member');
// Create congregations owned by this test's real signed-in leader before
// granting membership. No fixture inherits a V6 seed owner's permissions.
for (const [id, label] of [[scopeA, 'primary'], [scopeB, 'alternate']]) {
  await insert('bible_congregations', status.SERVICE_ROLE_KEY, {
    id, owner_id: mentor.id, name: `Lane C ${label} ${marker.slice(0, 8)}`, timezone: 'Asia/Tokyo', active: true,
  });
}
for (const [id, member, role, label] of [
  [scopeA, mentor, 'leader', 'mentor'],
  [scopeA, mentee, 'member', 'mentee'],
  [scopeA, foreign, 'member', 'foreign'],
  [scopeB, mentor, 'leader', 'mentor alternate'],
  [scopeB, mentee, 'member', 'mentee alternate'],
]) {
  await insert('bible_congregation_members', status.SERVICE_ROLE_KEY, {
    congregation_id: id, user_id: member.id, role, display_name: `V7 Browser ${label}`, active: true,
  });
}
// Verify service-role writes are actually visible under each user's JWT,
// including the congregation record required by the real application UI.
for (const member of [mentor, mentee, foreign]) {
  const memberships = await select('bible_congregation_members', member.token, `user_id=eq.${member.id}&active=eq.true`);
  const expectedIds = member.id === foreign.id ? [scopeA] : [scopeA, scopeB];
  assert.deepEqual(memberships.map(row => row.congregation_id).sort(), expectedIds.slice().sort(), 'Authenticated membership RLS visibility');
  const congregations = await select('bible_congregations', member.token, `id=in.(${expectedIds.join(',')})&active=eq.true`);
  assert.deepEqual(congregations.map(row => row.id).sort(), expectedIds.slice().sort(), 'Authenticated congregation RLS visibility');
}
checks.push('isolated-two-congregation-password-auth-and-real-jwt-rls-fixture');

stage = 'browser-launch';
const browser = await chromium.launch({ headless: true });
const mentorContext = await browser.newContext({ viewport: { width: 390, height: 900 } });
const menteeContext = await browser.newContext({ viewport: { width: 390, height: 900 } });
await installDisposableBackend(mentorContext);
await installDisposableBackend(menteeContext);
const mentorPage = await mentorContext.newPage();
const menteePage = await menteeContext.newPage();
const mentorErrors = captureErrors(mentorPage, 'mentor');
const menteeErrors = captureErrors(menteePage, 'mentee');

try {
  stage = 'mentor-sign-in';
  await signIn(mentorPage, mentor);

  stage = 'mentor-congregation';
  await chooseCongregation(mentorPage);

  stage = 'mentor-invite';
  await mentorPage.goto(`${baseUrl}/#/one-to-one-pair`, { waitUntil: 'networkidle' });
  const invite = mentorPage.locator('[data-pair-invite]');
  await invite.waitFor({ state: 'visible' });
  await invite.locator('select[name="otherUserId"]').selectOption(mentee.id);
  await invite.locator('select[name="role"]').selectOption('mentor');
  await invite.locator('button[type="submit"]').click();

  stage = 'mentor-resolve-invite';
  const pair = await waitForBackend(async () => {
    const rows = await select('v7_mentor_pairs', status.SERVICE_ROLE_KEY,
      `mentor_id=eq.${mentor.id}&mentee_id=eq.${mentee.id}&order=created_at.desc`);
    return rows.find(row => row.state === 'invited') || null;
  });
  assert.ok(pair.id);

  stage = 'mentor-open-pair';
  await mentorPage.goto(`${baseUrl}/#/one-to-one-pair?id=${pair.id}`, { waitUntil: 'networkidle' });
  const mentorAccept = mentorPage.locator('[data-pair-action="accept"]');
  await mentorAccept.waitFor({ state: 'visible' });

  stage = 'mentor-accept';
  await mentorAccept.click();
  await waitForBackend(async () => {
    const rows = await select('v7_mentor_pairs', status.SERVICE_ROLE_KEY, `id=eq.${pair.id}`);
    return rows[0]?.mentor_accepted_at ? rows[0] : null;
  });
  checks.push('mentor-ui-invitation-and-acceptance');

  stage = 'mentee-sign-in';
  await signIn(menteePage, mentee);

  stage = 'mentee-congregation';
  await chooseCongregation(menteePage);

  stage = 'mentee-overview';
  await menteePage.goto(`${baseUrl}/#/one-to-one`, { waitUntil: 'networkidle' });
  const overviewPair = menteePage.locator(`[data-open-pair="${pair.id}"]`);
  await overviewPair.waitFor({ state: 'visible' });
  await overviewPair.click();
  await menteePage.waitForFunction(id => location.hash === `#/one-to-one-pair?id=${encodeURIComponent(id)}`, pair.id);

  stage = 'mentee-accept';
  const menteeAccept = menteePage.locator('[data-pair-action="accept"]');
  await menteeAccept.waitFor({ state: 'visible' });
  await menteeAccept.click();
  await menteePage.locator('[data-pair-action="lessons"]').waitFor({ state: 'visible' });
  await waitForBackend(async () => {
    const rows = await select('v7_mentor_pairs', status.SERVICE_ROLE_KEY, `id=eq.${pair.id}`);
    return rows[0]?.state === 'active' ? rows[0] : null;
  });
  checks.push('mentee-overview-open-and-ui-acceptance');

  stage = 'mentor-ui-authoring';
  await mentorPage.goto(`${baseUrl}/#/one-to-one?view=authoring`, { waitUntil: 'networkidle' });
  const trackForm = mentorPage.locator('[data-authoring-form="track-create"]');
  await trackForm.waitFor({ state: 'visible' });
  await trackForm.locator('input[name="title"]').fill(`Browser certification track ${marker.slice(0, 8)}`);
  await trackForm.locator('textarea[name="summary"]').fill('Lane C authenticated browser curriculum');
  await trackForm.locator('input[name="locale"]').fill('en');
  await trackForm.locator('input[name="audience"]').fill('ONE 2 ONE');
  await trackForm.locator('input[name="position"]').fill('0');
  await trackForm.locator('button[type="submit"]').click();
  await mentorPage.locator('[data-authoring-select="track"][aria-current="true"]').waitFor({ state: 'visible' });

  const moduleForm = mentorPage.locator('[data-authoring-form="module-create"]');
  await moduleForm.locator('input[name="title"]').fill('Browser certification module');
  await moduleForm.locator('textarea[name="summary"]').fill('Authenticated module');
  await moduleForm.locator('input[name="position"]').fill('0');
  await moduleForm.locator('button[type="submit"]').click();
  await mentorPage.locator('[data-authoring-select="module"][aria-current="true"]').waitFor({ state: 'visible' });

  const lessonForm = mentorPage.locator('[data-authoring-form="lesson-create"]');
  await lessonForm.locator('input[name="title"]').fill('Browser certification lesson');
  await lessonForm.locator('input[name="position"]').fill('0');
  await lessonForm.locator('button[type="submit"]').click();
  await mentorPage.locator('[data-authoring-select="lesson"][aria-current="true"]').waitFor({ state: 'visible' });

  const revisionForm = mentorPage.locator('[data-authoring-form="revision-create"]');
  await revisionForm.locator('input[name="locale"]').fill('en');
  await revisionForm.locator('textarea[name="summary"]').fill('Synthetic browser acceptance lesson');
  await revisionForm.locator('button[type="submit"]').click();
  await mentorPage.locator('[data-authoring-select="revision"][aria-current="true"]').waitFor({ state: 'visible' });

  const stepTypes = ['scripture', 'understand', 'discuss', 'reflect', 'apply', 'pray', 'action'];
  for (let position = 0; position < stepTypes.length; position += 1) {
    const detail = mentorPage.locator(`details[data-authoring-step="${position}"]`);
    await detail.waitFor({ state: 'visible' });
    if (!(await detail.evaluate(node => node.open))) await detail.locator('summary').click();
    const form = detail.locator('form[data-authoring-form="step-save"]');
    await form.waitFor({ state: 'visible' });
    await form.locator('textarea[name="content"]').fill(JSON.stringify({ text: `Browser certification ${stepTypes[position]}` }));
    await form.locator('textarea[name="scriptureRefs"]').fill(position === 0 ? JSON.stringify(['John 3:16']) : '[]');
    await form.locator('button[type="submit"]').click();
    await mentorPage.waitForFunction(expected => [...document.querySelectorAll('ol li')].filter(node => /Saved|Na-save|Natipigan/.test(node.textContent || '')).length >= expected, position + 1);
  }

  const ids = {
    track: await mentorPage.locator('[data-authoring-select="track"][aria-current="true"]').getAttribute('data-id'),
    module: await mentorPage.locator('[data-authoring-select="module"][aria-current="true"]').getAttribute('data-id'),
    lesson: await mentorPage.locator('[data-authoring-select="lesson"][aria-current="true"]').getAttribute('data-id'),
    revision: await mentorPage.locator('[data-authoring-select="revision"][aria-current="true"]').getAttribute('data-id'),
  };
  for (const [name, id] of Object.entries(ids)) assert.match(id || '', /^[0-9a-f-]{36}$/i, name);
  const publish = mentorPage.locator('[data-publication-handoff-action="publish"]');
  await publish.waitFor({ state: 'visible' });
  await publish.click();
  await mentorPage.locator('[data-publication-published]').waitFor({ state: 'visible' });
  const steps = await select('v7_lesson_steps', mentor.token, `lesson_revision_id=eq.${ids.revision}&order=position.asc`);
  assert.deepEqual(steps.map(row => row.step_type), stepTypes);
  checks.push('mentor-ui-track-module-lesson-seven-step-authoring-and-publication');

  stage = 'mentor-assignment-options';
  await mentorPage.goto(`${baseUrl}/#/one-to-one?view=assignment`, { waitUntil: 'networkidle' });
  for (const [kind, id] of [['pair', pair.id], ['track', ids.track], ['module', ids.module], ['lesson', ids.lesson]]) {
    const option = mentorPage.locator(`[data-assignment-select="${kind}"][data-id="${id}"]`);
    await option.waitFor({ state: 'visible' });
    await option.click();
  }

  stage = 'mentor-create-assignment';
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

  stage = 'mentee-open-assigned-curriculum';
  await menteePage.goto(`${baseUrl}/#/one-to-one-pair?id=${pair.id}`, { waitUntil: 'networkidle' });
  await menteePage.locator('[data-pair-action="lessons"]').click();
  await menteePage.locator('[data-assigned-curriculum]').waitFor({ state: 'visible' });
  for (let depth = 0; depth < 3; depth += 1) {
    const option = menteePage.locator('[data-assigned-index="0"]');
    await option.waitFor({ state: 'visible' });
    await option.click();
  }

  const lessonLink = `${baseUrl}/#/one-to-one-lesson?pairId=${encodeURIComponent(pair.id)}&trackId=${encodeURIComponent(ids.track)}&moduleId=${encodeURIComponent(ids.module)}&revisionId=${encodeURIComponent(ids.revision)}`;

  stage = 'mentee-scripture-safe-return';
  await menteePage.locator('[data-lesson-runner]').waitFor({ state: 'visible' });
  await menteePage.locator('[data-lesson-heading][data-step-type="scripture"]').waitFor({ state: 'visible' });
  const scriptureButton = menteePage.locator('[data-lesson-scripture]').first();
  await scriptureButton.waitFor({ state: 'visible' });
  await scriptureButton.click();
  await menteePage.locator('[data-reader-lesson-back]').waitFor({ state: 'visible' });
  assert.match(menteePage.url(), /returnTo=one-to-one-lesson/);
  await menteePage.locator('[data-reader-lesson-back]').click();
  await menteePage.locator('[data-lesson-heading][data-step-type="scripture"]').waitFor({ state: 'visible' });
  checks.push('scripture-reader-allowlisted-safe-return');

  stage = 'mentee-private-response';
  await menteePage.locator('[data-lesson-next]').click();
  await menteePage.locator('[data-lesson-heading][data-step-type="understand"]').waitFor({ state: 'visible' });
  const privateText = `Browser private response ${marker}`;
  await menteePage.locator('[data-lesson-response]').fill(privateText);
  await menteePage.locator('[data-lesson-next]').click();
  await menteePage.locator('[data-lesson-heading][data-step-type="discuss"]').waitFor({ state: 'visible' });
  const persistedPrivate = await waitForBackend(async () => {
    const rows = await select('v7_lesson_responses', mentee.token, `assignment_id=eq.${assignment.id}&learner_id=eq.${mentee.id}`);
    return rows.find(row => (typeof row.response === 'string' ? row.response : row.response?.text) === privateText) || null;
  });
  assert.ok(persistedPrivate.id);
  const mentorPrivateRows = await select('v7_lesson_responses', mentor.token, `id=eq.${persistedPrivate.id}`);
  assert.deepEqual(mentorPrivateRows, []);
  const progress = await waitForBackend(async () => {
    const rows = await select('v7_learner_progress', mentee.token, `assignment_id=eq.${assignment.id}&learner_id=eq.${mentee.id}`);
    return rows[0]?.status === 'in_progress' ? rows[0] : null;
  });
  assert.equal(progress.current_step_id, steps[2].id);
  checks.push('private-response-persistence-and-mentor-denial');

  stage = 'mentor-private-preview';
  await mentorPage.goto(`${lessonLink}&stepId=${encodeURIComponent(steps[2].id)}`, { waitUntil: 'networkidle' });
  await mentorPage.locator('[data-lesson-heading][data-step-type="discuss"]').waitFor({ state: 'visible' });
  await mentorPage.locator('text=Mentor preview').waitFor({ state: 'visible' });
  assert.equal(await mentorPage.locator('[data-lesson-response]').count(), 0);
  assert.equal(await mentorPage.locator('[data-lesson-shared-response]').count(), 0);
  assert.equal((await mentorPage.locator('body').innerText()).includes(privateText), false);
  checks.push('mentor-read-only-private-response-boundary');

  stage = 'mentee-explicit-share';
  const sharedText = `Browser explicitly shared discussion ${marker}`;
  await menteePage.locator('[data-lesson-response]').fill(sharedText);
  await menteePage.locator('[data-lesson-share-confirm]').check();
  await menteePage.locator('[data-lesson-share]').click();
  await menteePage.locator('[data-lesson-share-state="shared"]').waitFor({ state: 'visible' });
  const sharedResponse = await waitForBackend(async () => {
    const rows = await select('v7_lesson_responses', mentee.token, `assignment_id=eq.${assignment.id}&lesson_step_id=eq.${steps[2].id}`);
    return rows.find(row => (typeof row.response === 'string' ? row.response : row.response?.text) === sharedText) || null;
  });
  await waitForBackend(async () => {
    const rows = await select('v7_response_shares', status.SERVICE_ROLE_KEY, `response_id=eq.${sharedResponse.id}&recipient_id=eq.${mentor.id}`);
    return rows[0]?.share_state === 'shared' ? rows[0] : null;
  });
  const mentorSharedRows = await select('v7_lesson_responses', mentor.token, `id=eq.${sharedResponse.id}`);
  assert.equal(mentorSharedRows.length, 1);

  stage = 'mentor-shared-preview';
  await mentorPage.goto(`${lessonLink}&stepId=${encodeURIComponent(steps[2].id)}`, { waitUntil: 'networkidle' });
  const disclosed = mentorPage.locator(`[data-lesson-shared-response="${steps[2].id}"]`);
  await disclosed.waitFor({ state: 'visible' });
  assert.equal((await disclosed.innerText()).includes(marker), true);
  assert.equal(await mentorPage.locator('[data-lesson-response]').count(), 0);
  checks.push('explicit-share-visible-only-to-paired-mentor');

  stage = 'mentee-progress-resume-locales';
  await menteePage.locator('[data-lesson-next]').click();
  await menteePage.locator('[data-lesson-heading][data-step-type="reflect"]').waitFor({ state: 'visible' });
  await menteePage.locator('[data-lesson-response]').fill(`Reflection ${marker}`);
  await menteePage.locator('[data-lesson-next]').click();
  await menteePage.locator('[data-lesson-heading][data-step-type="apply"]').waitFor({ state: 'visible' });

  await menteePage.goto(lessonLink, { waitUntil: 'networkidle' });
  await menteePage.locator('[data-lesson-heading][data-step-type="apply"]').waitFor({ state: 'visible' });
  checks.push('qr-compatible-direct-deep-link-resumes-pinned-progress');

  const localeExpectations = { en: 'Apply', tl: 'Isabuhay', ceb: 'Ikinabuhi' };
  for (const [locale, label] of Object.entries(localeExpectations)) {
    const selector = menteePage.locator('[data-locale-select]');
    await selector.waitFor({ state: 'visible' });
    if ((await selector.inputValue()) !== locale) {
      await Promise.all([
        menteePage.waitForEvent('load'),
        selector.selectOption(locale),
      ]);
      await menteePage.waitForLoadState('networkidle');
    }
    // A language reload must retain the bounded ONE 2 ONE identity before the
    // lesson view hydrates; fail immediately instead of timing out on the heading.
    assert.match(menteePage.url(), /pairId=.*revisionId=/);
    const heading = menteePage.locator('[data-lesson-heading][data-step-type="apply"]');
    await heading.waitFor({ state: 'visible' });
    assert.equal((await heading.textContent())?.trim(), label);
  }
  const localeSelector = menteePage.locator('[data-locale-select]');
  await Promise.all([
    menteePage.waitForEvent('load'),
    localeSelector.selectOption('en'),
  ]);
  await menteePage.waitForLoadState('networkidle');
  await menteePage.locator('[data-lesson-heading][data-step-type="apply"]').waitFor({ state: 'visible' });
  checks.push('supported-locales-en-tl-ceb-with-deep-link-preservation-on-mobile-width');

  stage = 'mentee-mobile-responsive-reading';
  for (const width of [320, 390, 430]) {
    await menteePage.setViewportSize({ width, height: 900 });
    const metrics = await menteePage.locator('[data-lesson-runner]').evaluate(root => {
      const reading = root.querySelector('.bq-lesson-reading')?.getBoundingClientRect();
      const response = root.querySelector('[data-lesson-response]')?.getBoundingClientRect();
      const primary = root.querySelector('[data-lesson-next], [data-lesson-complete]')?.getBoundingClientRect();
      const copy = root.querySelector('.bq-lesson-copy');
      return {
        width: innerWidth, documentWidth: document.documentElement.scrollWidth,
        readingLeft: reading?.left, readingRight: reading?.right, readingWidth: reading?.width,
        responseLeft: response?.left, responseRight: response?.right,
        primaryHeight: primary?.height, primaryLeft: primary?.left, primaryRight: primary?.right,
        copyFontSize: copy ? parseFloat(getComputedStyle(copy).fontSize) : 0,
      };
    });
    assert.equal(metrics.width, width, 'Unexpected mobile viewport width.');
    assert.ok(metrics.documentWidth <= width + 1, `Lesson overflows the ${width}px viewport.`);
    assert.ok(metrics.readingWidth >= 200 && metrics.readingLeft >= -1 && metrics.readingRight <= width + 1,
      `Lesson reading card clips at ${width}px.`);
    assert.ok(metrics.responseLeft >= -1 && metrics.responseRight <= width + 1, `Private-response editor clips at ${width}px.`);
    assert.ok(metrics.primaryHeight >= 44 && metrics.primaryLeft >= -1 && metrics.primaryRight <= width + 1,
      `Next-step action is not touch-safe at ${width}px.`);
    assert.ok(metrics.copyFontSize >= 16, `Lesson text is too small at ${width}px.`);
  }
  await menteePage.setViewportSize({ width: 390, height: 900 });
  checks.push('authenticated-320-390-430-reading-editor-and-primary-action-layout');

  stage = 'mentee-complete-seven-step-journey';
  for (const [type, next] of [['apply', true], ['pray', true], ['action', false]]) {
    const heading = menteePage.locator(`[data-lesson-heading][data-step-type="${type}"]`);
    await heading.waitFor({ state: 'visible' });
    await menteePage.locator('[data-lesson-response]').fill(`${type} response ${marker}`);
    if (next) await menteePage.locator('[data-lesson-next]').click();
    else await menteePage.locator('[data-lesson-complete]').click();
  }
  await menteePage.locator('text=Lesson completed').waitFor({ state: 'visible' });
  const completed = await waitForBackend(async () => {
    const rows = await select('v7_learner_progress', mentee.token, `assignment_id=eq.${assignment.id}&learner_id=eq.${mentee.id}`);
    return rows[0]?.status === 'completed' ? rows[0] : null;
  });
  assert.equal(completed.current_step_id, steps[6].id);
  checks.push('seven-step-completion-and-progress-persistence');

  stage = 'mentee-revoke-share';
  await menteePage.goto(`${lessonLink}&stepId=${encodeURIComponent(steps[2].id)}`, { waitUntil: 'networkidle' });
  await menteePage.locator('[data-lesson-heading][data-step-type="discuss"]').waitFor({ state: 'visible' });
  await menteePage.locator('[data-lesson-unshare]').click();
  await menteePage.locator('[data-lesson-share-state="private"]').waitFor({ state: 'visible' });
  await waitForBackend(async () => {
    const rows = await select('v7_response_shares', status.SERVICE_ROLE_KEY, `response_id=eq.${sharedResponse.id}&recipient_id=eq.${mentor.id}`);
    return rows[0]?.share_state === 'revoked' ? rows[0] : null;
  });
  await mentorPage.goto(`${lessonLink}&stepId=${encodeURIComponent(steps[2].id)}`, { waitUntil: 'networkidle' });
  await mentorPage.locator('[data-lesson-heading][data-step-type="discuss"]').waitFor({ state: 'visible' });
  assert.equal(await mentorPage.locator('[data-lesson-shared-response]').count(), 0);
  assert.deepEqual(await select('v7_lesson_responses', mentor.token, `id=eq.${sharedResponse.id}`), []);
  checks.push('explicit-share-revocation-removes-mentor-visibility');

  stage = 'congregation-switch-denial';
  await chooseCongregation(menteePage, scopeB);
  await menteePage.goto(lessonLink, { waitUntil: 'networkidle' });
  const congregationDenial = menteePage.locator('[data-lesson-runner] [role="status"]');
  await congregationDenial.waitFor({ state: 'visible' });
  await menteePage.waitForFunction(() => /unavailable|congregation|pair/i.test(
    document.querySelector('[data-lesson-runner] [role="status"]')?.textContent || ''
  ), null, { timeout: 30000 });
  assert.equal(await menteePage.locator('[data-lesson-heading]').count(), 0);
  assert.match(await congregationDenial.innerText(), /unavailable|congregation|pair/i);
  await chooseCongregation(menteePage, scopeA);
  await menteePage.goto(`${lessonLink}&stepId=${encodeURIComponent(steps[6].id)}`, { waitUntil: 'networkidle' });
  await menteePage.locator('[data-lesson-heading][data-step-type="action"]').waitFor({ state: 'visible' });
  checks.push('congregation-switch-invalidates-old-one-to-one-scope');

  stage = 'account-switch-denial';
  await signOut(menteePage);
  await signIn(menteePage, foreign);
  await chooseCongregation(menteePage, scopeA);
  await menteePage.goto(lessonLink, { waitUntil: 'networkidle' });
  const accountDenial = menteePage.locator('[data-lesson-runner] [role="status"]');
  await accountDenial.waitFor({ state: 'visible' });
  await menteePage.waitForFunction(() => /unavailable|congregation|pair/i.test(
    document.querySelector('[data-lesson-runner] [role="status"]')?.textContent || ''
  ), null, { timeout: 30000 });
  assert.equal(await menteePage.locator('[data-lesson-heading]').count(), 0);
  assert.deepEqual(await select('v7_mentor_pairs', foreign.token, `id=eq.${pair.id}`), []);
  checks.push('account-switch-and-cross-participant-denial');

  stage = 'browser-error-boundary';
  mentorErrors.assertNone();
  menteeErrors.assertNone();
  checks.push('no-browser-page-errors');

  stage = 'write-pass-evidence';
  await mkdir('artifacts/v7', { recursive: true });
  await writeFile('artifacts/v7/authenticated-browser-journey.json', `${JSON.stringify({
    schemaVersion: 1,
    candidateSha,
    result: 'PASS',
    environment: 'exact-built-artifact-plus-disposable-local-supabase',
    observedAt: new Date().toISOString(),
    viewport: '390x900',
    actors: ['leader-mentor', 'member-mentee', 'foreign-member'],
    locales: ['en', 'tl', 'ceb'],
    evidenceClass: 'authenticated-built-browser',
    checks,
    exclusions: ['production-backend', 'physical-device'],
  }, null, 2)}\n`);
  console.log(`PASS V7 authenticated built-browser ONE 2 ONE journey (${checks.length} checks; synthetic disposable data only)`);
} catch (error) {
  await mkdir('artifacts/v7', { recursive: true });
  await Promise.allSettled([
    mentorPage.screenshot({ path: 'artifacts/v7/authenticated-browser-mentor-failure.png', fullPage: true }),
    menteePage.screenshot({ path: 'artifacts/v7/authenticated-browser-mentee-failure.png', fullPage: true }),
  ]);
  const failure = {
    schemaVersion: 1,
    candidateSha,
    result: 'FAIL',
    stage,
    observedAt: new Date().toISOString(),
    error: error?.stack || error?.message || String(error),
    checks,
    browserErrors: { mentor: mentorErrors.errors, mentee: menteeErrors.errors },
    backendReads: backendReads.slice(-40),
    mentor: await pageSummary(mentorPage),
    mentee: await pageSummary(menteePage),
  };
  await writeFile('artifacts/v7/authenticated-browser-failure.json', `${JSON.stringify(failure, null, 2)}\n`);
  console.error(`FAIL V7 authenticated built-browser ONE 2 ONE journey at stage=${stage}`);
  console.error(failure.error);
  throw error;
} finally {
  await mentorContext.close();
  await menteeContext.close();
  await browser.close();
}
