import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const HOST = String(process.env.BQ_FIELD_HOST || 'https://mybiblequest.pages.dev').replace(/\/$/, '');
const MUTATE = process.env.BQ_FIELD_ALLOW_MUTATION === '1';
const EVIDENCE_PATH = String(process.env.BQ_FIELD_EVIDENCE_PATH || '').trim();
const HEADLESS = process.env.BQ_FIELD_HEADED !== '1';
const RUN_ID = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const evidence = [];

const credential = alias => Object.freeze({
  alias,
  email: String(process.env[`BQ_FIELD_${alias}_EMAIL`] || '').trim(),
  password: String(process.env[`BQ_FIELD_${alias}_PASSWORD`] || '')
});

const accounts = Object.freeze({ A: credential('A'), B: credential('B'), C: credential('C') });

function requireCredentials() {
  const missing = [];
  for (const alias of ['A', 'B', 'C']) {
    if (!accounts[alias].email) missing.push(`BQ_FIELD_${alias}_EMAIL`);
    if (!accounts[alias].password) missing.push(`BQ_FIELD_${alias}_PASSWORD`);
  }
  if (missing.length) throw new Error(`Missing required field-test secrets: ${missing.join(', ')}. Secrets must be supplied only through the environment.`);
}

function jstNow() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(new Date()).replace(' ', 'T') + '+09:00';
}

function record(alias, action, pass, detail = '') {
  const row = Object.freeze({
    timestampJst: jstNow(), host: HOST, alias, scenario: 'A6 Live Room', action,
    pass: Boolean(pass), detail: String(detail || '').slice(0, 240)
  });
  evidence.push(row);
  console.log(`${row.pass ? 'PASS' : 'FAIL'} [${alias}] A6 Live Room: ${action}${row.detail ? ` — ${row.detail}` : ''}`);
}

async function saveEvidence() {
  if (!EVIDENCE_PATH) return;
  await writeFile(EVIDENCE_PATH, JSON.stringify({
    runId: RUN_ID,
    mutationEnabled: MUTATE,
    scenario: 'live-room',
    evidence
  }, null, 2) + '\n', 'utf8');
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
  record(account.alias, 'separate authenticated browser context established', true);
  return { context, page, pageErrors };
}

async function waitForActiveRoom(page, title) {
  await page.locator('[data-live-room-active]').waitFor({ state: 'visible' });
  await page.getByRole('heading', { name: title, exact: true }).waitFor();
  const code = (await page.locator('[data-live-room-code]').textContent())?.trim() || '';
  assert.match(code, /^[A-Z0-9]{4,8}$/, 'Active Live Room must expose a valid short room code');
  return code;
}

async function participantCount(page) {
  return page.locator('[data-live-room-participant]').count();
}

async function runLiveRoomScenario(sessions) {
  assert.equal(MUTATE, true, 'Live Room field scenario requires BQ_FIELD_ALLOW_MUTATION=1');
  const A = sessions.A.page, B = sessions.B.page, C = sessions.C.page;
  const title = `Field Live Room ${RUN_ID}`;

  await visit(A, 'live-rooms', '[data-live-rooms-view]');
  const create = A.locator('[data-live-room-create]');
  await create.waitFor({ state: 'visible' });
  await create.locator('input[name="title"]').fill(title);
  await create.locator('button[type="submit"]').click();
  const roomCode = await waitForActiveRoom(A, title);
  assert.equal(await participantCount(A), 1, 'New room must initially show exactly the host participant');
  assert.equal(await A.locator('[data-live-room-end]').count(), 1, 'Host must receive the End room control');
  record('A', 'created congregation-backed room through production UI', true, 'Room code intentionally omitted from evidence.');

  await visit(B, 'live-rooms', '[data-live-rooms-view]');
  const join = B.locator('[data-live-room-join]');
  await join.waitFor({ state: 'visible' });
  assert.equal(await join.locator('button[type="submit"]:not([disabled])').count(), 1, 'Account B must have congregation membership allowing the join attempt');
  await join.locator('input[name="code"]').fill(roomCode);
  await join.locator('button[type="submit"]').click();
  assert.equal(await waitForActiveRoom(B, title), roomCode, 'Account B must enter the exact host room');
  await B.waitForFunction(() => document.querySelectorAll('[data-live-room-participant]').length === 2);
  assert.equal(await B.locator('[data-live-room-end]').count(), 0, 'Non-host Account B must not receive the End room control');
  record('B', 'joined host room from an independent browser context', true);

  await A.waitForFunction(() => document.querySelectorAll('[data-live-room-participant]').length === 2);
  record('A', 'realtime participant propagation observed after Account B joined', true);

  await visit(B, 'account', '.bq-account-panel');
  await visit(B, 'live-rooms', '[data-live-rooms-view]');
  assert.equal(await waitForActiveRoom(B, title), roomCode, 'Route teardown/re-entry must reconnect to the same in-memory room');
  await B.getByText('Connected', { exact: true }).waitFor();
  assert.equal(await participantCount(B), 2, 'Reconnect must preserve the two unique participants');
  record('B', 'route disconnect/re-entry reconnected without stale room state', true);

  await B.reload({ waitUntil: 'domcontentloaded' });
  await B.waitForSelector('[data-live-rooms-view]');
  const rejoin = B.locator('[data-live-room-join]');
  await rejoin.waitFor({ state: 'visible' });
  await rejoin.locator('input[name="code"]').fill(roomCode);
  await rejoin.locator('button[type="submit"]').click();
  assert.equal(await waitForActiveRoom(B, title), roomCode, 'Hard refresh recovery must allow rejoining the active room');
  await B.waitForFunction(() => document.querySelectorAll('[data-live-room-participant]').length === 2);
  await A.waitForFunction(() => document.querySelectorAll('[data-live-room-participant]').length === 2);
  assert.equal(await participantCount(A), 2, 'Rejoining the same account must not duplicate the participant row');
  record('B', 'hard refresh then supported rejoin recovered the active room', true);
  record('A', 'same-account rejoin did not duplicate participant membership', true);

  await visit(C, 'live-rooms', '[data-live-rooms-view]');
  const cJoin = C.locator('[data-live-room-join]');
  if (await cJoin.count() && await cJoin.locator('button[type="submit"]:not([disabled])').count()) {
    await cJoin.locator('input[name="code"]').fill(roomCode);
    await cJoin.locator('button[type="submit"]').click();
    await C.waitForTimeout(800);
    assert.equal(await C.locator('[data-live-room-active]').count(), 0, 'Unrelated Account C must not enter the host congregation room');
    record('C', 'valid-code cross-congregation room access denied', true);
  } else {
    assert.equal(await C.locator('[data-live-room-active]').count(), 0, 'Unrelated Account C must not have active room state');
    record('C', 'room join unavailable without eligible congregation membership', true);
  }

  await visit(A, 'live-rooms', '[data-live-rooms-view]');
  await A.locator('[data-live-room-end]').click();
  await A.getByText('Live Room ended.', { exact: true }).waitFor();
  assert.equal(await A.locator('[data-live-room-active]').count(), 0, 'Host end must clear local active-room state');
  record('A', 'ended temporary room through production UI', true, 'Ended harness-tagged rows remain for operator cleanup; no privileged deletion is attempted.');

  await B.getByText('Room ended', { exact: true }).waitFor({ timeout: 20_000 });
  assert.equal(await B.locator('[data-live-room-reconnect]').count(), 0, 'Ended room must not offer reconnect');
  record('B', 'host end propagated to joined client through realtime subscription', true);

  await B.locator('[data-live-room-leave]').click();
  await B.locator('[data-live-room-join]').waitFor({ state: 'visible' });
  const expired = B.locator('[data-live-room-join]');
  await expired.locator('input[name="code"]').fill(roomCode);
  await expired.locator('button[type="submit"]').click();
  await B.getByText('Live Room not found or already ended.', { exact: true }).waitFor();
  assert.equal(await B.locator('[data-live-room-active]').count(), 0, 'Ended room code must not restore private room state');
  record('B', 'ended room code rejected without restoring room state', true);

  await expired.locator('input[name="code"]').fill('0000');
  await expired.locator('button[type="submit"]').click();
  await B.getByText('Live Room not found or already ended.', { exact: true }).waitFor();
  assert.equal(await B.locator('[data-live-room-active]').count(), 0, 'Unknown room code must not create active room state');
  record('B', 'unknown syntactically valid room code rejected safely', true);
}

async function main() {
  if (!/^https:\/\//i.test(HOST) && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(HOST)) {
    throw new Error('BQ_FIELD_HOST must be HTTPS, except an explicit localhost/127.0.0.1 test host.');
  }
  requireCredentials();
  if (!MUTATE) throw new Error('Mutation scenarios are fail-closed. Set BQ_FIELD_ALLOW_MUTATION=1 only for dedicated field-test accounts.');

  const browser = await chromium.launch({ headless: HEADLESS });
  const sessions = {};
  try {
    for (const alias of ['A', 'B', 'C']) sessions[alias] = await makeSession(browser, accounts[alias]);
    await runLiveRoomScenario(sessions);

    for (const [alias, session] of Object.entries(sessions)) {
      assert.equal(session.pageErrors.length, 0, `${alias} page errors: ${session.pageErrors.join(' | ')}`);
    }
    record('ALL', 'guarded Live Room field harness completed without browser/page assertion failures', true,
      'Supplemental evidence only: physical-device/network/PWA checks and the complete RELEASE_FIELD_VALIDATION_V3.md matrix remain mandatory.');
  } catch (error) {
    record('ALL', 'guarded Live Room field harness stopped on reproducible failure', false, error?.message || String(error));
    throw error;
  } finally {
    await saveEvidence().catch(error => console.error(`Could not save sanitized evidence: ${error.message}`));
    await Promise.all(Object.values(sessions).map(session => session.context.close().catch(() => {})));
    await browser.close();
  }
}

await main();
