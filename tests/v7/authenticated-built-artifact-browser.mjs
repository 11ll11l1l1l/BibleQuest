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
const baseUrl = process.env.BQ_PREVIEW_URL || 'http://127.0.0.2:4173';
assert.equal(new URL(baseUrl).hostname, '127.0.0.2');

const productionSupabaseOrigin = 'https://zkfmgezvzugchcwppreq.supabase.co';
const scope = randomUUID(); // Per-run tenant: do not inherit V6 seed ownership or memberships.
const marker = randomUUID();
const now = new Date().toISOString();
const checks = [];
const backendMembershipReads = []; // Redacted request status only; never persist tokens or response bodies.
let stage = 'seed-disposable-data';

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
  const data = raw ? JSON.parse(raw) : null;
  assert.ok(response.ok, `${method} ${path.split('?')[0]}: HTTP ${response.status}, code ${data?.code || data?.error_code || 'unknown'}`);
  return data;
}

const insert = (table, row) => request(`/rest/v1/${table}`, status.SERVICE_ROLE_KEY, 'POST', row);
const update = (table, filter, row) => request(`/rest/v1/${table}?${filter}`, status.SERVICE_ROLE_KEY, 'PATCH', row);
const select = (table, token, filter) => request(`/rest/v1/${table}?${filter}`, token);

async function actor(label, role) {
  const password = `${randomUUID()}!A9`;
  const email = `${label}-${marker}@bq-v7.invalid`;
  const user = await request('/auth/v1/admin/users', status.SERVICE_ROLE_KEY, 'POST', {
    email,
    password,
    email_confirm: true,
  });
  assert.ok(user.id);
  await insert('bible_app_access', { user_id: user.id, role, active: true });
  const session = await request('/auth/v1/token?grant_type=password', status.ANON_KEY, 'POST', { email, password }, null);
  assert.equal(session.user?.id, user.id, 'Disposable real-password auth must return the intended user.');
  return { id: user.id, email, password, token: session.access_token, congregationId: scope };
}

const mentor = await actor('mentor', 'leader');
const mentee = await actor('mentee', 'member');
// The fixture owns exactly one fresh congregation. Privileged writes establish
// synthetic membership; real user JWT reads below prove production RLS behavior.
await insert('bible_congregations', {
  id: scope, owner_id: mentor.id, name: `V7 integrated browser ${marker.slice(0, 8)}`, timezone: 'Asia/Tokyo', active: true,
});
for (const [member, role, label] of [[mentor, 'leader', 'mentor'], [mentee, 'member', 'mentee']]) {
  await insert('bible_congregation_members', {
    congregation_id: scope, user_id: member.id, role, display_name: `V7 browser ${label}`, active: true,
  });
  const memberships = await select('bible_congregation_members', member.token, `congregation_id=eq.${scope}&user_id=eq.${member.id}&active=eq.true`);
  assert.equal(memberships.length, 1, `${label} must see own authenticated active membership under RLS.`);
  assert.equal(memberships[0].role, role);
  const congregations = await select('bible_congregations', member.token, `id=eq.${scope}&active=eq.true`);
  assert.equal(congregations.length, 1, `${label} must see the active congregation under RLS.`);
}
checks.push('isolated-owned-congregation-and-authenticated-mentor-mentee-rls-visibility');

const libraryItemId = randomUUID();
const libraryRevisionId = randomUUID();
const taxonomyId = `ci.browser.${marker.replaceAll('-', '')}`;
await insert('v7_library_items', {
  id: libraryItemId,
  content_type: 'book',
  congregation_id: scope,
  publication_state: 'draft',
  created_by: mentor.id,
});
await insert('v7_library_revisions', {
  id: libraryRevisionId,
  item_id: libraryItemId,
  revision_number: 1,
  source_locale: 'en',
  title: 'V7 CI Populated Library Book',
  summary: 'Synthetic reviewed content used only for disposable browser acceptance.',
  body: { paragraphs: ['Synthetic CI content.'] },
  reading_minutes: 2,
  source_kind: 'first_party',
  source_title: 'BibleQuest disposable CI source',
  source_catalog_id: `ci:${marker}`,
  source_revision: candidateSha,
  source_checksum: candidateSha,
  creator: 'BibleQuest CI',
  originating_organization: 'BibleQuest CI',
  rights_status: 'verified',
  rights_holder: 'BibleQuest CI synthetic data',
  rights_basis: 'Synthetic disposable CI content; not release editorial evidence.',
  attribution: 'Synthetic CI only',
  allowed_uses: ['automated_ci'],
  publication_state: 'published',
  review_status: 'approved',
  reviewer_id: mentor.id,
  reviewed_at: now,
  created_by: mentor.id,
});
await insert('v7_library_translations', {
  revision_id: libraryRevisionId,
  locale: 'tl',
  title: 'V7 CI Aklatan na Aklat',
  summary: 'Sintetikong nilalaman para lamang sa disposable browser acceptance.',
  body: { paragraphs: ['Sintetikong CI content.'] },
  translated_from_revision_id: libraryRevisionId,
  translator: 'BibleQuest CI',
  review_status: 'reviewed',
  reviewer_id: mentor.id,
  reviewed_at: now,
});
await insert('v7_library_taxonomy', {
  id: taxonomyId,
  kind: 'topic',
  labels: { en: 'CI browser topic', tl: 'CI browser paksa' },
  congregation_id: scope,
  created_by: mentor.id,
});
await insert('v7_library_revision_taxonomy', {
  revision_id: libraryRevisionId,
  taxonomy_id: taxonomyId,
  display_order: 0,
});
await update('v7_library_items', `id=eq.${libraryItemId}`, {
  current_revision_id: libraryRevisionId,
  publication_state: 'published',
});

const ids = Object.fromEntries(['pair', 'track', 'trackRevision', 'module', 'moduleRevision', 'lesson', 'lessonVersion', 'revision']
  .map(key => [key, randomUUID()]));
const stepTypes = ['scripture', 'understand', 'discuss', 'reflect', 'apply', 'pray', 'action'];
const steps = stepTypes.map((stepType, position) => ({
  id: randomUUID(),
  lesson_revision_id: ids.revision,
  position,
  step_type: stepType,
  content: { text: `V7 browser ${stepType}` },
}));
await insert('v7_mentor_pairs', {
  id: ids.pair,
  congregation_id: scope,
  mentor_id: mentor.id,
  mentee_id: mentee.id,
  initiated_by: mentor.id,
  state: 'active',
  mentor_accepted_at: now,
  mentee_accepted_at: now,
});
await insert('v7_tracks', {
  id: ids.track,
  congregation_id: scope,
  title: 'V7 CI Browser Track',
  locale: 'en',
  revision_id: ids.trackRevision,
  publication_state: 'published',
  created_by: mentor.id,
});
await insert('v7_modules', {
  id: ids.module,
  track_id: ids.track,
  title: 'V7 CI Browser Module',
  revision_id: ids.moduleRevision,
  display_order: 0,
  publication_state: 'published',
});
await insert('v7_lessons', {
  id: ids.lesson,
  module_id: ids.module,
  title: 'V7 CI Browser Lesson',
  revision_id: ids.lessonVersion,
  display_order: 0,
  publication_state: 'published',
});
await insert('v7_lesson_revisions', {
  id: ids.revision,
  lesson_id: ids.lesson,
  revision_number: 1,
  locale: 'en',
  created_by: mentor.id,
});
await insert('v7_lesson_steps', steps);
await update('v7_lesson_revisions', `id=eq.${ids.revision}`, { published_at: now });
await insert('v7_pair_assignments', {
  pair_id: ids.pair,
  lesson_revision_id: ids.revision,
  assigned_by: mentor.id,
  status: 'assigned',
});
checks.push('synthetic-populated-library-and-one-to-one-seed');

async function installDisposableBackendRoute(context) {
  await context.route(`${productionSupabaseOrigin}/**`, async route => {
    const requestRecord = route.request();
    const source = new URL(requestRecord.url());
    const target = new URL(source.pathname + source.search, endpoint);
    const headers = { ...requestRecord.headers(), apikey: status.ANON_KEY };
    delete headers.host;
    if (/^Bearer\s+sb_publishable_/i.test(headers.authorization || '')) {
      headers.authorization = `Bearer ${status.ANON_KEY}`;
    }
    const response = await route.fetch({
      url: target.href,
      method: requestRecord.method(),
      headers,
      postData: requestRecord.postDataBuffer() || undefined,
      timeout: 15000,
    });
    if (['/rest/v1/bible_congregation_members', '/rest/v1/bible_congregations'].includes(source.pathname)) {
      let rowCount = null;
      try { const body = await response.json(); rowCount = Array.isArray(body) ? body.length : null; } catch {}
      backendMembershipReads.push({
        resource: source.pathname.split('/').pop(), status: response.status(), rowCount,
        authMode: /^Bearer\s+eyJ/i.test(headers.authorization || '') ? 'signed-jwt' : 'anonymous-or-publishable',
      });
    }
    await route.fulfill({ response });
  });
}

async function openRoute(page, route, selector) {
  await page.goto(`${baseUrl}/#/${route}`, { waitUntil: 'domcontentloaded' });
  await page.locator(selector).waitFor({ state: 'visible' });
  if (await page.locator('[data-startup-failure]').count()) throw new Error(`${route}: startup failure`);
}

async function activateCongregation(page, congregationId) {
  await openRoute(page, 'congregation', '[data-congregation-view]');
  const row = page.locator(`[data-congregation-row="${congregationId}"]`);
  try {
    await row.waitFor({ state: 'visible' });
  } catch (error) {
    const state = await page.locator('[data-congregation-list]').innerText().catch(() => 'congregation list unavailable');
    throw new Error(`Authenticated congregation selection failed: ${state.slice(0, 180)}; reads=${JSON.stringify(backendMembershipReads.slice(-8))}`, { cause: error });
  }
  const switchButton = row.locator('[data-congregation-switch]');
  if (await switchButton.count()) {
    await switchButton.click();
    await row.locator('[data-congregation-active]').waitFor({ state: 'visible' });
  }
  assert.equal(await row.getAttribute('data-congregation-current'), 'true');
}

async function login(page, actorRecord) {
  await openRoute(page, 'account', '[data-account-login]');
  await page.locator('[data-account-login] input[name="email"]').fill(actorRecord.email);
  await page.locator('[data-account-login] input[name="password"]').fill(actorRecord.password);
  await page.locator('[data-account-login] button[type="submit"]').click();
  // Successful sign-in navigates Home. Wait for Account to unmount, then reopen it
  // to assert the persisted authenticated session before selecting the seeded tenant.
  await page.locator('[data-account-login]').waitFor({ state: 'detached', timeout: 30000 });
  await openRoute(page, 'account', '[data-account-signout]');
  assert.ok((await page.locator('.bq-account-signed-hero').textContent()).includes(actorRecord.email));
  await activateCongregation(page, actorRecord.congregationId);
}

async function signOut(page) {
  await openRoute(page, 'account', '[data-account-signout]');
  await page.locator('[data-account-signout]').click();
  await page.locator('[data-account-login]').waitFor({ state: 'visible' });
}

async function assertNoHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    widest: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
  }));
  assert.ok(dimensions.widest <= dimensions.viewport + 1, `${label}: horizontal overflow ${dimensions.widest}/${dimensions.viewport}`);
}

async function writeEvidence(result, error = null) {
  await mkdir('artifacts/v7', { recursive: true });
  await writeFile('artifacts/v7/authenticated-built-browser-journey.json', `${JSON.stringify({
    schemaVersion: 2,
    candidateSha,
    result,
    stage,
    environment: 'exact-built-artifact-with-disposable-local-supabase-routing',
    observedAt: new Date().toISOString(),
    actors: ['leader-mentor', 'member-mentee'],
    viewport: '390x900',
    evidenceClass: 'authenticated-built-browser-disposable-backend',
    checks,
    backendMembershipReads: backendMembershipReads.slice(-30),
    ...(error ? { error: { name: error.name || 'Error', message: String(error.message || error) } } : {}),
    exclusions: [
      'production-backend',
      'physical-device',
      'representative-content-editorial-approval',
      'representative-content-rights-approval',
      'production-promotion',
    ],
    notes: [
      'The application build is unchanged. Browser routing redirects only the configured production Supabase origin to the disposable loopback stack and substitutes its anonymous key.',
      'Synthetic reviewed content is test data only and is not representative-content release evidence.',
    ],
  }, null, 2)}\n`);
}

const browser = await chromium.launch({ headless: true });
try {
  stage = 'mentor-sign-in';
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  await installDisposableBackendRoute(context);
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await login(page, mentor);
  checks.push('mentor-real-password-browser-sign-in');

  stage = 'mentor-public-library-and-backend-isolation';
  // V7 intentionally browses the signed-out approved static catalog even
  // after authentication. Disposable Supabase fixtures must remain protected,
  // never leak into the public reader to make this journey superficially pass.
  const seededLibraryRows = await request(
    `/rest/v1/v7_library_items?select=id,current_revision_id&id=eq.${libraryItemId}`,
    status.SERVICE_ROLE_KEY,
  );
  assert.equal(seededLibraryRows.length, 1, 'synthetic protected record was not seeded');
  assert.equal(seededLibraryRows[0].current_revision_id, libraryRevisionId);

  const approvedPublicItemId = 'devotional.biblequest.anxiety_worry.01';
  await openRoute(page, 'library?query=concern&contentType=devotional&emotion=anxious', '[data-library-page]');
  await page.waitForFunction(() => ['ready', 'empty', 'error'].includes(document.querySelector('[data-library-status]')?.dataset.libraryState || ''));
  const libraryState = await page.locator('[data-library-status]').evaluate(node => ({
    state: node.dataset.libraryState || '',
    text: node.textContent || '',
  }));
  assert.equal(libraryState.state, 'ready', `Reviewed public Library did not become ready: ${libraryState.state} — ${libraryState.text}`);
  const libraryCard = page.locator(`[data-library-item="${approvedPublicItemId}"]`);
  await libraryCard.waitFor({ state: 'visible' });
  assert.ok((await libraryCard.textContent()).includes('One concern at a time'));
  assert.equal(await page.locator(`[data-library-item="${libraryItemId}"]`).count(), 0,
    'private disposable tenant fixture leaked into the approved public catalog');
  assert.equal(await page.locator('#bq-library-query').inputValue(), 'concern');
  assert.equal(await page.locator('#bq-library-type').inputValue(), 'devotional');
  // Public browse's full Tab sequence is exercised separately across
  // 320–430px and locales. In this authenticated journey assert each input
  // remains keyboard-focusable without assuming no session-driven rerender.
  await page.locator('#bq-library-query').focus();
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'bq-library-query');
  await page.locator('#bq-library-type').focus();
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'bq-library-type');
  await assertNoHorizontalOverflow(page, 'mentor public Library');
  checks.push('authenticated-reviewed-public-library-isolation-search-focus-mobile');

  stage = 'library-locale-reload';
  await Promise.all([
    page.waitForEvent('load'),
    page.locator('[data-locale-select]').selectOption('tl'),
  ]);
  await page.locator('[data-library-page]').waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelector('[data-library-status]')?.dataset.libraryState === 'ready');
  const reloadEvidence = await page.evaluate(() => ({
    route: location.hash,
    language: document.querySelector('[data-locale-select]')?.value,
    query: document.querySelector('#bq-library-query')?.value,
    contentType: document.querySelector('#bq-library-type')?.value,
    resultIds: Array.from(document.querySelectorAll('[data-library-results] [data-library-item]'))
      .slice(0, 25).map(node => node.getAttribute('data-library-item')),
    status: document.querySelector('[data-library-status]')?.textContent?.trim(),
  }));
  assert.ok(reloadEvidence.resultIds.includes(approvedPublicItemId),
    'Reviewed public Library card missing after locale reload: ' + JSON.stringify(reloadEvidence));
  await libraryCard.waitFor({ state: 'visible' });
  assert.equal(await page.locator('[data-locale-select]').inputValue(), 'tl');
  assert.notEqual((await libraryCard.textContent()).includes('One concern at a time'), true,
    'reviewed Tagalog localization must update the public catalog after reload');
  checks.push('authenticated-public-library-reviewed-translation-reload');

  stage = 'mentor-one-to-one-surfaces';
  await openRoute(page, 'one-to-one', '[data-pair-results]');
  const mentorPair = page.locator(`[data-open-pair="${ids.pair}"]`);
  await mentorPair.waitFor({ state: 'visible' });
  await openRoute(page, 'one-to-one?view=authoring', '[data-curriculum-authoring]');
  await assertNoHorizontalOverflow(page, 'mentor authoring');
  await openRoute(page, 'one-to-one?view=assignment', '[data-assignment-preparation]');
  await assertNoHorizontalOverflow(page, 'mentor assignment preparation');
  checks.push('authenticated-mentor-pair-authoring-assignment-surfaces');

  stage = 'account-switch-to-mentee';
  await signOut(page);
  await login(page, mentee);
  checks.push('browser-account-switch-to-mentee');

  stage = 'mentee-assigned-curriculum';
  await openRoute(page, 'one-to-one', '[data-pair-results]');
  const menteePair = page.locator(`[data-open-pair="${ids.pair}"]`);
  await menteePair.waitFor({ state: 'visible' });
  await openRoute(page, `one-to-one-track?pairId=${ids.pair}`, '[data-assigned-curriculum]');
  const assignedTrack = page.getByRole('button', { name: 'V7 CI Browser Track' });
  await assignedTrack.waitFor({ state: 'visible' });
  await assignedTrack.click();
  await page.locator('[data-assigned-curriculum]').waitFor({ state: 'visible' });
  const assignedModule = page.getByRole('button', { name: 'V7 CI Browser Module' });
  await assignedModule.waitFor({ state: 'visible' });
  await assignedModule.click();
  await page.locator('[data-assigned-curriculum]').waitFor({ state: 'visible' });
  const assignedLesson = page.getByRole('button', { name: 'V7 CI Browser Lesson' });
  await assignedLesson.waitFor({ state: 'visible' });
  await assertNoHorizontalOverflow(page, 'mentee assigned curriculum');
  checks.push('authenticated-mentee-assigned-curriculum-mobile');

  stage = 'browser-console-errors';
  assert.deepEqual(pageErrors, []);
  checks.push('built-browser-no-page-errors');
  await context.close();
  stage = 'complete';
  await writeEvidence('PASS');
} catch (error) {
  await writeEvidence('FAIL', error);
  console.error(`FAIL V7 authenticated built-browser journey at stage ${stage}: ${error.stack || error.message || error}`);
  throw error;
} finally {
  await browser.close();
}

console.log(`PASS V7 authenticated built-browser journey (${checks.length} checks; disposable synthetic data only)`);
