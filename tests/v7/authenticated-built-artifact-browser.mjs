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
  const realtimeEvidence={roomChanges:0,opens:0,errors:0,closes:[],frames:0,events:{},subscribed:0};
  // Bridge actual Realtime traffic to the disposable stack; no fabricated events.
  await context.routeWebSocket('wss://zkfmgezvzugchcwppreq.supabase.co/**', socket=>{
    const source=new URL(socket.url()),target=new URL(source.pathname+source.search,endpoint);
    target.protocol='ws:';target.searchParams.set('apikey',status.ANON_KEY);
    const upstream=new WebSocket(target);const pending=[];
    socket.onMessage(message=>{if(upstream.readyState===WebSocket.OPEN)upstream.send(message);else if(upstream.readyState===WebSocket.CONNECTING)pending.push(message)});
    upstream.addEventListener('open',()=>{realtimeEvidence.opens++;for(const message of pending)upstream.send(message);pending.length=0});
    upstream.addEventListener('message',event=>{try{const raw=JSON.parse(event.data),message=Array.isArray(raw)?{event:raw[3],payload:raw[4]}:raw;realtimeEvidence.frames++;const name=['phx_reply','postgres_changes','system','phx_error','phx_close'].includes(message.event)?message.event:'other';realtimeEvidence.events[name]=(realtimeEvidence.events[name]||0)+1;if(message.event==='phx_reply'&&message.payload?.status==='ok'&&message.payload.response?.postgres_changes?.length)realtimeEvidence.subscribed++;if(message.event==='postgres_changes'&&message.payload?.data?.table==='bible_shared_sessions')realtimeEvidence.roomChanges++}catch{}socket.send(event.data)});
    upstream.addEventListener('error',()=>{realtimeEvidence.errors++;socket.close()});
    upstream.addEventListener('close',event=>{realtimeEvidence.closes.push(event.code);socket.close()});
    socket.onClose(()=>upstream.close());
  });
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
    if (['/rest/v1/bible_congregation_members', '/rest/v1/bible_congregations', '/auth/v1/user', '/auth/v1/token', '/auth/v1/logout'].includes(source.pathname)) {
      let rowCount = null;
      try { const body = await response.json(); rowCount = Array.isArray(body) ? body.length : null; } catch {}
      backendMembershipReads.push({
        resource: source.pathname.split('/').pop(), status: response.status(), rowCount,
        authMode: /^Bearer\s+eyJ/i.test(headers.authorization || '') ? 'signed-jwt' : 'anonymous-or-publishable',
      });
    }
    await route.fulfill({ response });
  });
  return realtimeEvidence;
}

async function openRoute(page, route, selector) {
  await page.goto(`${baseUrl}/#/${route}`, { waitUntil: 'domcontentloaded' });
  try{await page.locator(selector).waitFor({ state: 'visible' })}catch(error){const visible=await page.locator('#bq-view').innerText().catch(()=>'view unavailable');throw new Error(`${route} missing ${selector}: ${visible.slice(0,500)}; redacted backend=${JSON.stringify(backendMembershipReads.slice(-10))}`,{cause:error})}
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
  // Account can re-render its guest form during the intermediate
  // `authenticating` state, before Supabase credentials are verified. Form
  // detachment alone is not a successful sign-in signal and races a reload.
  // The account page only calls onHome() after await account.signIn() succeeds.
  await page.waitForURL(url => url.hash === '#/home', { timeout: 30000 });
  await openRoute(page, 'account', '[data-account-signout]');
  assert.ok((await page.locator('.bq-account-signed-hero').textContent()).includes(actorRecord.email));
  await activateCongregation(page, actorRecord.congregationId);
}

async function signOut(page) {
  await openRoute(page, 'account', '[data-account-signout]');
  await page.locator('[data-account-signout]').click();
  try{await page.locator('[data-account-login]').waitFor({state:'visible'})}catch(error){const visible=await page.locator('#bq-view').innerText().catch(()=>'view unavailable');throw new Error(`Sign-out did not finish: ${visible.slice(0,500)}; redacted backend=${JSON.stringify(backendMembershipReads.slice(-10))}`,{cause:error})}
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
      'Service workers are blocked only in this network-routed disposable auth harness (Playwright recommendation); existing exact-built PWA/offline certification remains separate and unchanged.',
      'The application build is unchanged. Browser routing redirects only the configured production Supabase origin to the disposable loopback stack and substitutes its anonymous key.',
      'Synthetic reviewed content is test data only and is not representative-content release evidence.',
    ],
  }, null, 2)}\n`);
}

const browser = await chromium.launch({ headless: true });
try {
  stage = 'mentor-sign-in';
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, serviceWorkers:'block' });
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
  await page.locator('[data-library-type="devotional"]').focus();
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.libraryType), 'devotional');
  await assertNoHorizontalOverflow(page, 'mentor public Library');
  checks.push('authenticated-reviewed-public-library-isolation-search-focus-mobile');

  stage = 'library-locale-reload';
  await Promise.all([
    page.waitForEvent('load'),
    page.locator('[data-locale-select]').selectOption('tl'),
  ]);
  await page.locator('[data-library-page]').waitFor({ state: 'visible' });
  // A locale-triggered full reload can display a ready snapshot just before
  // session hydration re-mounts the filtered catalog. Observe the restored
  // search form and its reviewed result together rather than sampling a
  // transient DOM between the route and session render passes.
  await page.waitForFunction(itemId => {
    const library = document.querySelector('[data-library-page]');
    const routedQuery = new URLSearchParams(location.hash.split('?').slice(1).join('?')).get('query');
    return Boolean(library
      && routedQuery === 'concern'
      && library.querySelector('[data-library-status]')?.dataset.libraryState === 'ready'
      && library.querySelector('#bq-library-query')?.value === 'concern'
      && library.querySelector('#bq-library-type')?.value === 'devotional'
      && Array.from(library.querySelectorAll('[data-library-results] [data-library-item]'))
        .some(node => node.getAttribute('data-library-item') === itemId));
  }, approvedPublicItemId, { timeout: 30000 });
  const reloadEvidence = await page.evaluate(() => ({
    route: location.hash,
    language: document.querySelector('[data-locale-select]')?.value,
    query: document.querySelector('#bq-library-query')?.value,
    contentType: document.querySelector('#bq-library-type')?.value,
    resultIds: Array.from(document.querySelectorAll('[data-library-results] [data-library-item]'))
      .slice(0, 25).map(node => node.getAttribute('data-library-item')),
    status: document.querySelector('[data-library-status]')?.textContent?.trim(),
  }));
  assert.equal(new URLSearchParams(reloadEvidence.route.split('?').slice(1).join('?')).get('query'), 'concern',
    'Authenticated locale reload must retain the routed public Library query: ' + JSON.stringify(reloadEvidence));
  assert.equal(reloadEvidence.query, 'concern');
  assert.equal(reloadEvidence.contentType, 'devotional');
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
  const mentorTools = page.locator('[data-pair-mentor-tools]');
  await mentorTools.waitFor({ state: 'visible' });
  await mentorTools.locator('summary').click();
  await page.locator('[data-pair-authoring]').click();
  await page.locator('[data-curriculum-authoring]').waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => location.hash), '#/one-to-one?view=authoring');
  await assertNoHorizontalOverflow(page, 'mentor authoring');
  await page.locator('[data-authoring-nav="back"]').click();
  await mentorTools.waitFor({ state: 'visible' });
  await mentorTools.locator('summary').click();
  await page.locator('[data-pair-assignments]').click();
  await page.locator('[data-assignment-preparation]').waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(() => location.hash), '#/one-to-one?view=assignment');
  await assertNoHorizontalOverflow(page, 'mentor assignment preparation');
  checks.push('authenticated-mentor-pair-authoring-assignment-surfaces');

  stage = 'v7-1-two-phone-session';
  {
  const hostContext=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'});
  await installDisposableBackendRoute(hostContext);
  const page=await hostContext.newPage();
  page.on('pageerror',error=>pageErrors.push(error.message));
  await login(page,mentor);
  await openRoute(page,'one-to-one','[data-pair-conversation]');
  await page.locator('[data-pair-conversation]').click();
  await page.locator('[data-live-room-create]').waitFor({state:'visible'});
  await page.locator('[data-live-room-create] button[type=submit]').click();
  await page.locator('[data-deck-next]').waitFor({state:'visible'});
  const headerColors=await page.locator('.bq-conversation-session .bq-community-head').evaluate(node=>({background:getComputedStyle(node).backgroundColor,colors:[node.querySelector('h1'),node.querySelector('[data-live-room-connection]')].map(n=>getComputedStyle(n).color)}));
  const luminance=color=>{const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4});return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722};
  for(const color of headerColors.colors){const levels=[luminance(color),luminance(headerColors.background)].sort((a,b)=>b-a);assert.ok((levels[0]+0.05)/(levels[1]+0.05)>=4.5,'Session header text must retain 4.5:1 contrast');}

  const sessionCode=new URLSearchParams((await page.evaluate(()=>location.hash)).split('?')[1]).get('code');
  assert.match(sessionCode,/^[A-Z0-9]{4,8}$/);
  await page.locator('[data-deck-next]').click();
  assert.match(await page.locator('[data-deck-preview]').textContent(),/Bring it into prayer/);
  assert.match(await page.locator('[data-deck-current]').textContent(),/Waiting/);
  await page.locator('[data-deck-send]').click();
  await page.locator('[data-deck-current] h3').filter({hasText:'Bring it into prayer'}).waitFor();
  const participantContext=await browser.newContext({viewport:{width:320,height:760},serviceWorkers:'block'});
  const participantRealtime=await installDisposableBackendRoute(participantContext);
  const participant=await participantContext.newPage();
  participant.on('pageerror',error=>pageErrors.push(error.message));
  await login(participant,mentee);
  await openRoute(participant,`conversation-deck?code=${sessionCode}`,'[data-deck-current] h3');
  assert.match(await participant.locator('[data-deck-current]').textContent(),/Bring it into prayer/);
  assert.equal(await participant.locator('[data-deck-send]').count(),0);
  await assertNoHorizontalOverflow(participant,'V7.1 participant 320px');
  // Keep the host controls mounted across presence/recovery updates.
  await page.locator('[data-deck-send]').evaluate(node=>{node.dataset.focusSentinel='same-node'});
  await page.locator('[data-deck-refresh]').click();
  assert.equal(await page.locator('[data-deck-send]').getAttribute('data-focus-sentinel'),'same-node');
  await page.locator('[data-deck-gesture]').focus();
  await page.keyboard.press('ArrowRight');
  assert.match(await page.locator('[data-deck-preview]').textContent(),/Courage to obey/);
  assert.match(await participant.locator('[data-deck-current]').textContent(),/Bring it into prayer/);
  for(let attempt=0;attempt<100&&!participantRealtime.subscribed;attempt++)await new Promise(resolve=>setTimeout(resolve,100));
  assert.ok(participantRealtime.subscribed,'Participant Realtime subscription must acknowledge: '+JSON.stringify(participantRealtime));
  const realtimeBefore=participantRealtime.roomChanges;
  await page.locator('[data-deck-send]').focus();
  await page.keyboard.press('Enter');
  await participant.locator('[data-deck-current] h3').filter({hasText:'Courage to obey'}).waitFor({timeout:20000});
  assert.equal(await page.evaluate(()=>document.activeElement?.hasAttribute('data-deck-send')),true,'Sending must preserve keyboard focus');
  assert.ok(participantRealtime.roomChanges>realtimeBefore,'Participant must receive an actual disposable Supabase Realtime room event: '+JSON.stringify(participantRealtime));
  await participant.reload();
  await participant.locator('[data-deck-current] h3').filter({hasText:'Courage to obey'}).waitFor({timeout:20000});
  if(!await participant.locator('[data-live-room-details]').evaluate(node=>node.open))await participant.locator('[data-live-room-details] summary').click();
  await participant.locator('[data-live-room-reconnect]').click();
  await participant.locator('[data-deck-current] h3').filter({hasText:'Courage to obey'}).waitFor();
  if(!await participant.locator('[data-live-room-details]').evaluate(node=>node.open))await participant.locator('[data-live-room-details] summary').click();
  await participant.locator('[data-live-room-reconnect]').click();
  await participant.locator('[data-deck-current] h3').filter({hasText:'Courage to obey'}).waitFor();
  await page.reload();
  await page.locator('[data-deck-send]').waitFor();
  assert.match(await page.locator('[data-deck-current]').textContent(),/Courage to obey/);
  const gesture=page.locator('[data-deck-gesture]');
  await gesture.dispatchEvent('pointerdown',{pointerId:1,isPrimary:true,button:0,clientX:100,clientY:150});
  await gesture.dispatchEvent('pointerup',{pointerId:1,isPrimary:true,button:0,clientX:200,clientY:150});
  assert.match(await page.locator('[data-deck-preview]').textContent(),/Bring it into prayer/);
  await gesture.dispatchEvent('pointerdown',{pointerId:1,isPrimary:true,button:0,clientX:100,clientY:150});
  await gesture.dispatchEvent('pointerup',{pointerId:1,isPrimary:true,button:0,clientX:100,clientY:50});
  await participant.locator('[data-deck-current] h3').filter({hasText:'Bring it into prayer'}).waitFor({timeout:20000});
  await page.locator('[data-deck-setup] summary').click();
  await page.locator('[data-deck-series]').selectOption('together');
  await page.locator('[data-deck-choices] input').last().uncheck();
  assert.match(await page.locator('[data-deck-position]').textContent(),/of 2/);
  assert.match(await participant.locator('[data-deck-current]').textContent(),/Bring it into prayer/);
  await page.locator('[data-deck-send]').click();
  await participant.locator('[data-deck-current] h3').filter({hasText:'Listen before answering'}).waitFor({timeout:20000});
  await page.locator('[data-deck-series]').selectOption('trust');
  await page.locator('[data-deck-next]').click();
  await page.locator('[data-deck-send]').click();
  await participant.locator('[data-deck-current] h3').filter({hasText:'Bring it into prayer'}).waitFor({timeout:20000});
  const targets=await page.locator('[data-live-rooms-view] button,[data-live-rooms-view] summary,[data-live-rooms-view] select').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>({text:n.textContent.trim().slice(0,32),height:n.getBoundingClientRect().height})));
  assert.deepEqual(targets.filter(t=>t.height<44),[],'V7.1 phone targets must be 44px');
  await page.setViewportSize({width:320,height:760});
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  await assertNoHorizontalOverflow(page,'V7.1 host 320px 200%');
  await page.evaluate(()=>document.documentElement.style.fontSize='');
  await page.setViewportSize({width:390,height:900});
  for(const [locale,title] of [['tl','Idalangin ito'],['ceb','Dad-a kini sa pag-ampo'],['en','Bring it into prayer']]){
    await Promise.all([page.waitForEvent('load'),page.locator('[data-locale-select]').selectOption(locale)]);
    await page.locator('[data-deck-current] h3').filter({hasText:title}).waitFor();
    await assertNoHorizontalOverflow(page,`V7.1 ${locale}`);
  }
  await mkdir('artifacts/v7',{recursive:true});
  await page.screenshot({path:'artifacts/v7/v7-1-host-phone.png',fullPage:true});
  await participant.locator('[data-deck-read]').click();
  await participant.waitForURL('**/#/reader');
  await openRoute(participant,`conversation-deck?code=${sessionCode}`,'[data-deck-current] h3');
  await page.locator('[data-live-room-details] summary').click();
  await page.locator('[data-live-room-end]').click();
  await participant.locator('[data-deck-current]').waitFor({state:'detached',timeout:20000});
  await participantContext.close();
  await hostContext.close();
  checks.push('v7-1-two-phone-explicit-preview-send-late-join-reload-reconnect-keyboard-swipe-locales-reader-ended-focus-stability');
  }

  stage = 'account-switch-to-mentee';
  await signOut(page);
  await login(page, mentee);
  checks.push('browser-account-switch-to-mentee');

  stage = 'mentee-assigned-curriculum';
  await openRoute(page, 'one-to-one', '[data-pair-results]');
  const menteePair = page.locator(`[data-open-pair="${ids.pair}"]`);
  await menteePair.waitFor({ state: 'visible' });
  assert.equal(await page.locator('[data-pair-mentor-tools]').isVisible(), false,
    'member account must not inherit stale leader tools after account switching');
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
