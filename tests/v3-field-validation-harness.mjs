import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const HOST = String(process.env.BQ_FIELD_HOST || 'https://mybiblequest.pages.dev').replace(/\/$/, '');
const MUTATE = process.env.BQ_FIELD_ALLOW_MUTATION === '1';
const SCENARIOS = new Set(String(process.env.BQ_FIELD_SCENARIOS || '').split(',').map(value => value.trim()).filter(Boolean));
const EVIDENCE_PATH = String(process.env.BQ_FIELD_EVIDENCE_PATH || '').trim();
const HEADLESS = process.env.BQ_FIELD_HEADED !== '1';
const RUN_ID = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const evidence = [];

const credential = alias => Object.freeze({
  alias,
  email: String(process.env[`BQ_FIELD_${alias}_EMAIL`] || '').trim(),
  password: String(process.env[`BQ_FIELD_${alias}_PASSWORD`] || '')
});

const accounts = Object.freeze({
  A: credential('A'),
  B: credential('B'),
  C: credential('C'),
  D: credential('D')
});

function requireCredentials(aliases) {
  const missing = [];
  for (const alias of aliases) {
    if (!accounts[alias]?.email) missing.push(`BQ_FIELD_${alias}_EMAIL`);
    if (!accounts[alias]?.password) missing.push(`BQ_FIELD_${alias}_PASSWORD`);
  }
  if (missing.length) throw new Error(`Missing required field-test secrets: ${missing.join(', ')}. Secrets must be supplied only through the environment.`);
}

function jstNow() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(new Date()).replace(' ', 'T') + '+09:00';
}

function record(alias, scenario, action, pass, detail = '') {
  const row = Object.freeze({ timestampJst: jstNow(), host: HOST, alias, scenario, action, pass: Boolean(pass), detail: String(detail || '').slice(0, 240) });
  evidence.push(row);
  console.log(`${row.pass ? 'PASS' : 'FAIL'} [${alias}] ${scenario}: ${action}${row.detail ? ` — ${row.detail}` : ''}`);
  return row;
}

async function saveEvidence() {
  if (!EVIDENCE_PATH) return;
  await writeFile(EVIDENCE_PATH, JSON.stringify({ runId: RUN_ID, mutationEnabled: MUTATE, scenarios: [...SCENARIOS], evidence }, null, 2) + '\n', 'utf8');
}

async function visit(page, route, readySelector) {
  await page.goto(`${HOST}/#/${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(readySelector, { state: 'attached' });
}

async function signIn(page, account) {
  await visit(page, 'account', '.bq-account-panel');
  const signed = page.locator('.bq-account-signed-hero');
  if (await signed.count()) return;
  const form = page.locator('[data-account-login]');
  await form.waitFor({ state: 'visible' });
  await form.locator('input[name="email"]').fill(account.email);
  await form.locator('input[name="password"]').fill(account.password);
  await form.locator('button[type="submit"]').click();
  await page.waitForURL(url => /#\/home(?:$|[/?])/.test(url.hash || '#/home'), { timeout: 20_000 }).catch(() => {});
  await visit(page, 'account', '.bq-account-panel');
  await signed.waitFor({ state: 'visible', timeout: 15_000 });
  assert.equal(await page.locator('[data-account-login]').count(), 0, `${account.alias} should be authenticated in its own browser context`);
}

async function makeSession(browser, account) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.setDefaultNavigationTimeout(25_000);
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await signIn(page, account);
  record(account.alias, 'auth', 'separate authenticated browser context established', true);
  return { context, page, pageErrors };
}

async function readiness(alias, session) {
  const { page } = session;

  await visit(page, 'journey-groups', '[data-journey-groups-view]');
  await page.waitForTimeout(500);
  record(alias, 'readiness', 'Journey Groups loaded', true,
    `groups=${await page.locator('[data-journey-group]').count()}, canCreate=${await page.locator('[data-journey-groups-create]').count() === 1}`);

  await visit(page, 'team-center', '[data-team-center-view]');
  await page.waitForTimeout(500);
  record(alias, 'readiness', 'Team Center loaded', true,
    `teams=${await page.locator('[data-team-card]').count()}, canCreate=${await page.locator('[data-team-create]').count() === 1}`);

  await visit(page, 'live-rooms', '[data-live-rooms-view]');
  await page.waitForTimeout(500);
  record(alias, 'readiness', 'Live Rooms loaded', true,
    `canHost=${await page.locator('[data-live-room-create]').count() === 1}, canJoin=${await page.locator('[data-live-room-join] button[type="submit"]:not([disabled])').count() === 1}`);

  await visit(page, 'couples-cloud', '[data-couples-cloud-view]');
  await page.waitForTimeout(500);
  const pairState = await page.locator('[data-couple-cloud-step]').count() ? 'active'
    : await page.locator('.bq-couple-code').count() ? 'pending'
    : await page.locator('[data-couple-cloud-join]').count() ? 'unpaired'
    : 'unavailable';
  record(alias, 'readiness', 'Couple Journey loaded', true, `pairState=${pairState}`);
}

async function journeyGroupScenario(sessions) {
  assert.equal(MUTATE, true, 'Journey Group field scenario requires BQ_FIELD_ALLOW_MUTATION=1');
  const name = `Field A1 ${RUN_ID}`;
  const A = sessions.A.page, B = sessions.B.page, C = sessions.C.page;

  await visit(A, 'journey-groups', '[data-journey-groups-view]');
  const create = A.locator('[data-journey-groups-create]');
  await create.waitFor({ state: 'visible' });
  await create.locator('input[name="name"]').fill(name);
  await create.locator('input[name="schedule_text"]').fill('Release field validation');
  await create.locator('textarea[name="description"]').fill('Temporary release field-validation group.');
  await create.locator('select[name="max_members"]').selectOption('6');
  await create.locator('button[type="submit"]').click();
  await A.getByRole('heading', { name, exact: true }).waitFor();
  record('A', 'A1 Journey Group', 'created group through production UI', true);

  let code = (await A.locator('.bq-journey-group-code code').textContent().catch(() => ''))?.trim();
  if (!code) {
    const card = A.locator('[data-journey-group]').filter({ has: A.getByRole('heading', { name, exact: true }) });
    await card.locator('[data-journey-group-code]').click();
    code = (await A.locator('.bq-journey-group-code code').textContent())?.trim();
  }
  assert.match(code || '', /^[A-Za-z0-9]{8}$/, 'Journey Group must expose an 8-character UI invite code');

  await visit(B, 'journey-groups', '[data-journey-groups-view]');
  const join = B.locator('[data-journey-groups-join]');
  await join.locator('input[name="code"]').fill(code);
  await join.locator('button[type="submit"]').click();
  await B.getByRole('heading', { name, exact: true }).waitFor();
  record('B', 'A1 Journey Group', 'joined group through production UI', true);

  await visit(C, 'journey-groups', '[data-journey-groups-view]');
  await C.waitForTimeout(500);
  assert.equal(await C.getByRole('heading', { name, exact: true }).count(), 0, 'Unrelated Account C must not see the private Journey Group');
  record('C', 'A1 Journey Group', 'private group not visible to unrelated account', true);

  const cJoin = C.locator('[data-journey-groups-join]');
  if (await cJoin.count()) {
    await cJoin.locator('input[name="code"]').fill(code);
    await cJoin.locator('button[type="submit"]').click();
    await C.waitForTimeout(700);
    assert.equal(await C.getByRole('heading', { name, exact: true }).count(), 0, 'Unrelated Account C must not join a congregation-scoped group');
    record('C', 'A1 Journey Group', 'cross-congregation join denied', true);
  }

  for (const alias of ['A', 'B']) {
    const page = sessions[alias].page;
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-journey-groups-view]');
    await page.getByRole('heading', { name, exact: true }).waitFor();
    record(alias, 'A1 Journey Group', 'membership persisted after reload', true);
  }
}

async function teamScenario(sessions) {
  assert.equal(MUTATE, true, 'Team field scenario requires BQ_FIELD_ALLOW_MUTATION=1');
  const memberLabel = String(process.env.BQ_FIELD_B_DISPLAY || '').trim();
  assert.ok(memberLabel, 'Team scenario requires BQ_FIELD_B_DISPLAY to identify Account B without storing an email in evidence.');
  const name = `Field A3 ${RUN_ID}`;
  const A = sessions.A.page, B = sessions.B.page, C = sessions.C.page;

  await visit(A, 'team-center', '[data-team-center-view]');
  const create = A.locator('[data-team-create]');
  await create.waitFor({ state: 'visible' });
  await create.locator('input[name="name"]').fill(name);
  await create.locator('button[type="submit"]').click();
  const card = A.locator('[data-team-card]').filter({ has: A.getByRole('heading', { name, exact: true }) });
  await card.waitFor();
  record('A', 'A3 Cloud Team', 'created team through production UI', true);

  const add = card.locator('[data-team-add]');
  const option = add.locator('select[name="user_id"] option').filter({ hasText: memberLabel }).first();
  assert.equal(await option.count(), 1, 'Account B must be selectable from the congregation roster');
  await add.locator('select[name="user_id"]').selectOption(await option.getAttribute('value'));
  await add.locator('button[type="submit"]').click();
  await A.waitForTimeout(600);
  record('A', 'A3 Cloud Team', 'added Account B through roster UI', true);

  await visit(B, 'team-center', '[data-team-center-view]');
  await B.getByRole('heading', { name, exact: true }).waitFor();
  record('B', 'A3 Cloud Team', 'team visible to intended member', true);

  await visit(C, 'team-center', '[data-team-center-view]');
  await C.waitForTimeout(500);
  assert.equal(await C.getByRole('heading', { name, exact: true }).count(), 0, 'Unrelated Account C must not see the private team');
  record('C', 'A3 Cloud Team', 'team isolated from unrelated account', true);
}

async function coupleLinkScenario(sessions) {
  assert.equal(MUTATE, true, 'Couple-link field scenario requires BQ_FIELD_ALLOW_MUTATION=1');
  assert.ok(sessions.D, 'Couple-link scenario requires Account D credentials in a separate session.');
  const A = sessions.A.page, D = sessions.D.page;
  await visit(A, 'couples-cloud', '[data-couples-cloud-view]');
  await visit(D, 'couples-cloud', '[data-couples-cloud-view]');
  assert.equal(await D.locator('[data-couple-cloud-join]').count(), 1, 'Account D must be unpaired before linking.');

  let code = (await A.locator('.bq-couple-code').textContent().catch(() => ''))?.trim();
  if (!code) {
    const create = A.locator('[data-couple-cloud-create]');
    await create.waitFor({ state: 'visible' });
    await create.click();
    await A.locator('.bq-couple-code').waitFor();
    code = (await A.locator('.bq-couple-code').textContent())?.trim();
  }
  assert.match(code || '', /^[A-Za-z0-9]{8}$/, 'Couple UI must expose an 8-character pair code');

  const join = D.locator('[data-couple-cloud-join]');
  await join.locator('input[name="code"]').fill(code);
  await join.locator('button[type="submit"]').click();
  await D.locator('[data-couple-cloud-step]').first().waitFor();
  record('D', 'A4 linked couple', 'accepted pair code through production UI', true);

  await A.locator('[data-couple-cloud-reload]').click();
  await A.locator('[data-couple-cloud-step]').first().waitFor();
  record('A', 'A4 linked couple', 'pair became active for creator', true);

  for (const [alias, page] of [['A', A], ['D', D]]) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-couples-cloud-view]');
    await page.locator('[data-couple-cloud-step]').first().waitFor();
    record(alias, 'A4 linked couple', 'active pair persisted after reload', true);
  }
}

async function liveRoomScenario(sessions) {
  assert.equal(MUTATE, true, 'Live Room field scenario requires BQ_FIELD_ALLOW_MUTATION=1');
  const A = sessions.A.page, B = sessions.B.page, C = sessions.C.page;
  await visit(A, 'live-rooms', '[data-live-rooms-view]');
  const create = A.locator('[data-live-room-create]');
  await create.waitFor({ state: 'visible' });
  await create.locator('input[name="title"]').fill(`Field A6 ${RUN_ID}`);
  await create.locator('button[type="submit"]').click();
  await A.locator('[data-live-room-active]').waitFor();
  const code = (await A.locator('[data-live-room-code]').textContent())?.trim();
  assert.match(code || '', /^[A-Za-z0-9]{4,8}$/, 'Live Room must expose a short UI room code');
  record('A', 'A6 Live Room', 'created room through production UI', true);

  try {
    await visit(B, 'live-rooms', '[data-live-rooms-view]');
    const join = B.locator('[data-live-room-join]');
    await join.locator('input[name="code"]').fill(code);
    await join.locator('button[type="submit"]').click();
    await B.locator('[data-live-room-active]').waitFor();
    record('B', 'A6 Live Room', 'joined from independent browser context', true);

    await A.waitForFunction(() => document.querySelectorAll('[data-live-room-participant]').length >= 2);
    record('A', 'A6 Live Room', 'host observed at least two participants', true);

    await B.locator('[data-live-room-reconnect]').click();
    await B.getByText('Reconnected to the latest room state.').waitFor();
    record('B', 'A6 Live Room', 'explicit reconnect succeeded', true);

    await visit(C, 'live-rooms', '[data-live-rooms-view]');
    const cJoin = C.locator('[data-live-room-join]');
    if (await cJoin.count()) {
      const submit = cJoin.locator('button[type="submit"]');
      if (await submit.isEnabled()) {
        await cJoin.locator('input[name="code"]').fill('BAD0CODE');
        await submit.click();
        await C.waitForTimeout(700);
        assert.equal(await C.locator('[data-live-room-active]').count(), 0, 'Invalid room code must not enter a room');
        record('C', 'A6 Live Room', 'invalid room code rejected', true);
      } else record('C', 'A6 Live Room', 'unrelated account lacks congregation membership needed to join', true);
    }
  } finally {
    if (await A.locator('[data-live-room-end]').count()) {
      await A.locator('[data-live-room-end]').click().catch(() => {});
      await A.waitForTimeout(300);
    }
  }
}

async function main() {
  if (!/^https:\/\//i.test(HOST) && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(HOST)) {
    throw new Error('BQ_FIELD_HOST must be HTTPS, except an explicit localhost/127.0.0.1 test host.');
  }
  requireCredentials(['A', 'B', 'C']);
  if (SCENARIOS.has('couple-link')) requireCredentials(['D']);
  if (SCENARIOS.size && !MUTATE) throw new Error('Mutation scenarios are fail-closed. Set BQ_FIELD_ALLOW_MUTATION=1 only for dedicated field-test accounts.');

  const browser = await chromium.launch({ headless: HEADLESS });
  const sessions = {};
  try {
    for (const alias of ['A', 'B', 'C', ...(accounts.D.email && accounts.D.password ? ['D'] : [])]) {
      sessions[alias] = await makeSession(browser, accounts[alias]);
    }
    for (const alias of Object.keys(sessions)) await readiness(alias, sessions[alias]);

    if (SCENARIOS.has('journey-group')) await journeyGroupScenario(sessions);
    if (SCENARIOS.has('team')) await teamScenario(sessions);
    if (SCENARIOS.has('couple-link')) await coupleLinkScenario(sessions);
    if (SCENARIOS.has('live-room')) await liveRoomScenario(sessions);

    for (const [alias, session] of Object.entries(sessions)) {
      assert.equal(session.pageErrors.length, 0, `${alias} page errors: ${session.pageErrors.join(' | ')}`);
    }
    record('ALL', 'summary', 'field harness completed without browser/page assertion failures', true,
      MUTATE ? 'Mutation evidence is partial until the complete RELEASE_FIELD_VALIDATION_V3.md matrix is observed.' : 'Readiness only; no production relationship data was intentionally changed.');
  } catch (error) {
    record('ALL', 'summary', 'field harness stopped on reproducible failure', false, error?.message || String(error));
    throw error;
  } finally {
    await saveEvidence().catch(error => console.error(`Could not save sanitized evidence: ${error.message}`));
    await Promise.all(Object.values(sessions).map(session => session.context.close().catch(() => {})));
    await browser.close();
  }
}

await main();
