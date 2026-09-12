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

const accounts = Object.freeze({
  A: credential('A'),
  C: credential('C'),
  D: credential('D')
});

function requireCredentials() {
  const missing = [];
  for (const alias of ['A', 'C', 'D']) {
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
    timestampJst: jstNow(), host: HOST, alias, scenario: 'A4/A5 Couple Journey shared state',
    action, pass: Boolean(pass), detail: String(detail || '').slice(0, 240)
  });
  evidence.push(row);
  console.log(`${row.pass ? 'PASS' : 'FAIL'} [${alias}] ${action}${row.detail ? ` — ${row.detail}` : ''}`);
  return row;
}

async function saveEvidence() {
  if (!EVIDENCE_PATH) return;
  await writeFile(EVIDENCE_PATH, JSON.stringify({ runId: RUN_ID, mutationEnabled: MUTATE, evidence }, null, 2) + '\n', 'utf8');
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

async function coupleState(page) {
  await visit(page, 'couples-cloud', '[data-couples-cloud-view]');
  await page.waitForTimeout(500);
  if (await page.locator('[data-couple-cloud-step]').count()) return 'active';
  if (await page.locator('.bq-couple-code').count()) return 'pending';
  if (await page.locator('[data-couple-cloud-join]').count()) return 'unpaired';
  return 'unavailable';
}

async function ensurePair(A, D) {
  let aState = await coupleState(A);
  let dState = await coupleState(D);

  if (aState === 'active' && dState === 'active') {
    record('A+D', 'dedicated pair already active', true, 'The shared-state write below proves whether these sessions are the same pair.');
    return;
  }

  if (dState !== 'unpaired') {
    throw new Error(`Account D must be unpaired when a new field pair is needed; observed D=${dState}, A=${aState}.`);
  }

  await visit(A, 'couples-cloud', '[data-couples-cloud-view]');
  if (aState === 'unpaired') {
    const create = A.locator('[data-couple-cloud-create]');
    await create.waitFor({ state: 'visible' });
    await create.click();
    await A.locator('.bq-couple-code').waitFor();
    aState = 'pending';
    record('A', 'created dedicated pair code through production UI', true);
  }

  if (aState !== 'pending') throw new Error(`Account A cannot establish the dedicated test pair from state ${aState}.`);
  const code = (await A.locator('.bq-couple-code').textContent())?.trim();
  assert.match(code || '', /^[A-Za-z0-9]{8}$/, 'Couple UI must expose an 8-character pair code');

  await visit(D, 'couples-cloud', '[data-couples-cloud-view]');
  const join = D.locator('[data-couple-cloud-join]');
  await join.locator('input[name="code"]').fill(code);
  await join.locator('button[type="submit"]').click();
  await D.locator('[data-couple-cloud-step]').first().waitFor();
  record('D', 'accepted pair code through production UI', true);

  await visit(A, 'couples-cloud', '[data-couples-cloud-view]');
  if (await A.locator('[data-couple-cloud-reload]').count()) await A.locator('[data-couple-cloud-reload]').click();
  await A.locator('[data-couple-cloud-step]').first().waitFor();
  record('A', 'pair became active for creator', true);
}

async function sharedJourneyScenario(sessions) {
  assert.equal(MUTATE, true, 'Couple Journey field scenario requires BQ_FIELD_ALLOW_MUTATION=1');
  const A = sessions.A.page, C = sessions.C.page, D = sessions.D.page;
  await ensurePair(A, D);

  await visit(A, 'couples-cloud', '[data-couples-cloud-view]');
  await A.locator('[data-couple-cloud-step]').first().waitFor();
  const incomplete = A.locator('[data-couple-cloud-step]:not(.done)');
  const target = (await incomplete.count()) ? incomplete.first() : A.locator('[data-couple-cloud-step]').first();
  const stepIndex = Number(await target.getAttribute('data-couple-cloud-step'));
  assert.ok(Number.isInteger(stepIndex) && stepIndex >= 0 && stepIndex <= 6, 'Couple Journey step index must be valid');
  const wasDone = (await target.getAttribute('class') || '').split(/\s+/).includes('done');
  const commitment = `Field A5 ${RUN_ID} pair-shared commitment`;

  await target.click();
  const form = A.locator('[data-couple-cloud-complete]');
  await form.waitFor({ state: 'visible' });
  await form.locator('textarea[name="commitment"]').fill(commitment);
  await form.locator('button[type="submit"]').click();
  await A.locator('[data-couple-cloud-step]').first().waitFor();
  await A.getByText(commitment, { exact: true }).waitFor();
  assert.ok((await A.locator(`[data-couple-cloud-step="${stepIndex}"]`).getAttribute('class') || '').includes('done'), 'Saved Journey step must render completed for Account A');
  record('A', 'saved shared Journey conversation and uniquely labeled commitment through production UI', true,
    `step=${stepIndex + 1}, newJourneyStep=${!wasDone}`);

  await visit(D, 'couples-cloud', '[data-couples-cloud-view]');
  await D.getByText(commitment, { exact: true }).waitFor();
  assert.ok((await D.locator(`[data-couple-cloud-step="${stepIndex}"]`).getAttribute('class') || '').includes('done'), 'Partner must observe the same completed Journey step');
  record('D', 'partner observed the same shared commitment and Journey completion', true, `step=${stepIndex + 1}`);

  const cState = await coupleState(C);
  assert.notEqual(cState, 'unavailable', 'Unrelated Account C must reach a valid Couple Journey state before isolation can PASS');
  assert.equal(await C.getByText(commitment, { exact: true }).count(), 0, 'Unrelated Account C must not see the pair-shared commitment');
  record('C', 'unrelated account could not read pair-shared commitment', true, `pairState=${cState}`);

  for (const [alias, page] of [['A', A], ['D', D]]) {
    await visit(page, 'couples-cloud', '[data-couples-cloud-view]');
    await page.getByText(commitment, { exact: true }).waitFor();
    assert.ok((await page.locator(`[data-couple-cloud-step="${stepIndex}"]`).getAttribute('class') || '').includes('done'), `${alias} must retain the shared Journey completion after reload`);
    record(alias, 'shared Journey state persisted after full route reload', true, `step=${stepIndex + 1}`);
  }

  record('ALL', 'append-only field artifact intentionally retained', true,
    `The commitment is labeled with run ${RUN_ID}; the production UI intentionally has no shared-history delete action.`);
}

async function main() {
  if (!/^https:\/\//i.test(HOST) && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(HOST)) {
    throw new Error('BQ_FIELD_HOST must be HTTPS, except an explicit localhost/127.0.0.1 test host.');
  }
  assert.equal(MUTATE, true, 'This harness changes dedicated pair state. Set BQ_FIELD_ALLOW_MUTATION=1 only for dedicated field-test accounts.');
  requireCredentials();

  const browser = await chromium.launch({ headless: HEADLESS });
  const sessions = {};
  try {
    for (const alias of ['A', 'C', 'D']) sessions[alias] = await makeSession(browser, accounts[alias]);
    await sharedJourneyScenario(sessions);
    for (const [alias, session] of Object.entries(sessions)) {
      assert.equal(session.pageErrors.length, 0, `${alias} page errors: ${session.pageErrors.join(' | ')}`);
    }
    record('ALL', 'field harness completed without browser/page assertion failures', true,
      'This validates Couple Journey shared state/commitment persistence and unrelated-account isolation. It does not by itself close challenge-day A5 or Issue #68.');
  } catch (error) {
    record('ALL', 'field harness stopped on reproducible failure', false, error?.message || String(error));
    throw error;
  } finally {
    await saveEvidence().catch(error => console.error(`Could not save sanitized evidence: ${error.message}`));
    await Promise.all(Object.values(sessions).map(session => session.context.close().catch(() => {})));
    await browser.close();
  }
}

await main();
