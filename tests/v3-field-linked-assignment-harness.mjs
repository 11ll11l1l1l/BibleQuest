import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const HOST = String(process.env.BQ_FIELD_HOST || 'https://mybiblequest.pages.dev').replace(/\/$/, '');
const MUTATE = process.env.BQ_FIELD_ALLOW_MUTATION === '1';
const SCENARIOS = new Set(String(process.env.BQ_FIELD_SCENARIOS || '').split(',').map(value => value.trim()).filter(Boolean));
const EVIDENCE_PATH = String(process.env.BQ_FIELD_EVIDENCE_PATH || '').trim();
const HEADLESS = process.env.BQ_FIELD_HEADED !== '1';
const RUN_ID = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const B_DISPLAY = String(process.env.BQ_FIELD_B_DISPLAY || '').trim();
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

function record(alias, scenario, action, pass, detail = '') {
  const row = Object.freeze({ timestampJst: jstNow(), host: HOST, alias, scenario, action, pass: Boolean(pass), detail: String(detail || '').slice(0, 240) });
  evidence.push(row);
  console.log(`${row.pass ? 'PASS' : 'FAIL'} [${alias}] ${scenario}: ${action}${row.detail ? ` — ${row.detail}` : ''}`);
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

async function publishTargetedAssignment(page, { scope, targetLabel, title, scenario }) {
  await visit(page, 'assignments', '[data-assignments-view]');
  const publisher = page.locator('[data-assignment-publisher]');
  await publisher.waitFor({ state: 'visible' });
  await page.locator('[data-assignment-targets]').click();
  await page.getByText('Audience directory refreshed.', { exact: true }).waitFor();

  const form = page.locator('[data-assignment-publish]');
  await form.locator('input[name="title"]').fill(title);
  await form.locator('textarea[name="instructions"]').fill('Temporary release field-validation assignment.');
  await form.locator('select[name="assignmentType"]').selectOption('custom');
  await form.locator('[data-assignment-target-scope]').selectOption(scope);

  const target = form.locator('[data-assignment-target-id]');
  const option = target.locator('option').filter({ hasText: targetLabel }).first();
  assert.equal(await option.count(), 1, `${scope} target must be available in the assignment audience directory`);
  const targetId = await option.getAttribute('value');
  assert.ok(targetId, `${scope} target option must expose a stable id`);
  await target.selectOption(targetId);
  await form.locator('input[name="points"]').fill('0');
  await form.locator('button[type="submit"]').click();
  await page.getByText('Assignment published. Server truth has been refreshed.', { exact: true }).waitFor();
  await page.locator('[data-assignment-row]').filter({ hasText: title }).waitFor();
  record('A', scenario, `published ${scope}-targeted assignment through production UI`, true);
}

async function completeAndVerifyAssignment(sessions, { title, scenario }) {
  const B = sessions.B.page, C = sessions.C.page, A = sessions.A.page;

  await visit(B, 'assignments', '[data-assignments-view]');
  const row = B.locator('[data-assignment-row]').filter({ hasText: title });
  await row.waitFor();
  await row.locator('[data-assignment-open]').click();
  const completion = B.locator('[data-assignment-complete]');
  await completion.waitFor();
  await completion.locator('button[type="submit"]').click();
  await B.getByText(/Task completed(?: · \+0 pts)?\./).waitFor();
  record('B', scenario, 'completed targeted assignment through production UI', true);

  await B.reload({ waitUntil: 'domcontentloaded' });
  await B.waitForSelector('[data-assignments-view]');
  const persisted = B.locator('[data-assignment-row]').filter({ hasText: title });
  await persisted.waitFor();
  assert.match(await persisted.textContent(), /Completed/, 'Assignment completion must persist after reload');
  record('B', scenario, 'completion persisted after reload', true);

  await visit(C, 'assignments', '[data-assignments-view]');
  await C.waitForTimeout(600);
  assert.equal(await C.locator('[data-assignment-row]').filter({ hasText: title }).count(), 0, 'Unrelated Account C must not receive the targeted assignment');
  record('C', scenario, 'targeted assignment isolated from unrelated account', true);

  await visit(A, 'assignments', '[data-assignments-view]');
  const leaderRow = A.locator('[data-assignment-row]').filter({ hasText: title });
  await leaderRow.waitFor();
  await leaderRow.locator('[data-assignment-open]').click();
  const review = A.locator('[data-assignment-response-review]');
  await review.waitFor();
  assert.match(await review.textContent(), /1 member completed this task\./, 'Leader response review must show the member completion');
  record('A', scenario, 'leader response review observed one completion', true);
}

async function journeyGroupAssignmentScenario(sessions) {
  assert.equal(MUTATE, true, 'Journey Group assignment field scenario requires BQ_FIELD_ALLOW_MUTATION=1');
  const A = sessions.A.page, B = sessions.B.page, C = sessions.C.page;
  const groupName = `Field A1A2 ${RUN_ID}`;
  const title = `Field Group Assignment ${RUN_ID}`;

  await visit(A, 'journey-groups', '[data-journey-groups-view]');
  const create = A.locator('[data-journey-groups-create]');
  await create.waitFor({ state: 'visible' });
  await create.locator('input[name="name"]').fill(groupName);
  await create.locator('input[name="schedule_text"]').fill('Release field validation');
  await create.locator('textarea[name="description"]').fill('Temporary group for assignment field validation.');
  await create.locator('select[name="max_members"]').selectOption('6');
  await create.locator('button[type="submit"]').click();
  await A.getByRole('heading', { name: groupName, exact: true }).waitFor();
  record('A', 'A1+A2 Journey Group assignment', 'created Journey Group through production UI', true);

  let code = (await A.locator('.bq-journey-group-code code').textContent().catch(() => ''))?.trim();
  if (!code) {
    const card = A.locator('[data-journey-group]').filter({ has: A.getByRole('heading', { name: groupName, exact: true }) });
    await card.locator('[data-journey-group-code]').click();
    code = (await A.locator('.bq-journey-group-code code').textContent())?.trim();
  }
  assert.match(code || '', /^[A-Za-z0-9]{8}$/, 'Journey Group must expose an 8-character UI invite code');

  await visit(B, 'journey-groups', '[data-journey-groups-view]');
  const join = B.locator('[data-journey-groups-join]');
  await join.locator('input[name="code"]').fill(code);
  await join.locator('button[type="submit"]').click();
  await B.getByRole('heading', { name: groupName, exact: true }).waitFor();
  record('B', 'A1+A2 Journey Group assignment', 'joined Journey Group through production UI', true);
  await B.reload({ waitUntil: 'domcontentloaded' });
  await B.waitForSelector('[data-journey-groups-view]');
  await B.getByRole('heading', { name: groupName, exact: true }).waitFor();
  record('B', 'A1+A2 Journey Group assignment', 'Journey Group membership persisted after reload', true);

  await visit(C, 'journey-groups', '[data-journey-groups-view]');
  await C.waitForTimeout(500);
  assert.equal(await C.getByRole('heading', { name: groupName, exact: true }).count(), 0, 'Unrelated Account C must not see the private Journey Group');
  record('C', 'A1+A2 Journey Group assignment', 'private group hidden from unrelated account', true);
  const cJoin = C.locator('[data-journey-groups-join]');
  if (await cJoin.count()) {
    await cJoin.locator('input[name="code"]').fill(code);
    await cJoin.locator('button[type="submit"]').click();
    await C.waitForTimeout(700);
    assert.equal(await C.getByRole('heading', { name: groupName, exact: true }).count(), 0, 'Unrelated Account C must not join a congregation-scoped group');
    record('C', 'A1+A2 Journey Group assignment', 'valid-code cross-congregation join denied', true);
  }

  await publishTargetedAssignment(A, { scope: 'group', targetLabel: groupName, title, scenario: 'A1+A2 Journey Group assignment' });
  await completeAndVerifyAssignment(sessions, { title, scenario: 'A1+A2 Journey Group assignment' });

  await visit(B, 'journey-groups', '[data-journey-groups-view]');
  const card = B.locator('[data-journey-group]').filter({ has: B.getByRole('heading', { name: groupName, exact: true }) });
  if (await card.count()) {
    const leave = card.locator('[data-journey-group-leave]');
    if (await leave.count()) {
      B.once('dialog', dialog => dialog.accept());
      await leave.click();
      await B.getByText('You left the Journey Group.', { exact: true }).waitFor();
      record('B', 'cleanup', 'left temporary Journey Group through production UI', true,
        'Owner-created group and assignment remain for operator cleanup under RELEASE_FIELD_VALIDATION_V3.md.');
    }
  }
}

async function teamAssignmentScenario(sessions) {
  assert.equal(MUTATE, true, 'Team assignment field scenario requires BQ_FIELD_ALLOW_MUTATION=1');
  assert.ok(B_DISPLAY, 'Team assignment scenario requires BQ_FIELD_B_DISPLAY to identify Account B without storing an email in evidence.');
  const A = sessions.A.page, B = sessions.B.page, C = sessions.C.page;
  const teamName = `Field A3 ${RUN_ID}`;
  const title = `Field Team Assignment ${RUN_ID}`;

  await visit(A, 'team-center', '[data-team-center-view]');
  const create = A.locator('[data-team-create]');
  await create.waitFor({ state: 'visible' });
  await create.locator('input[name="name"]').fill(teamName);
  await create.locator('button[type="submit"]').click();
  let card = A.locator('[data-team-card]').filter({ has: A.getByRole('heading', { name: teamName, exact: true }) });
  await card.waitFor();
  record('A', 'A3 Cloud Team assignment', 'created Cloud Team through production UI', true);

  const add = card.locator('[data-team-add]');
  const option = add.locator('select[name="user_id"] option').filter({ hasText: B_DISPLAY }).first();
  assert.equal(await option.count(), 1, 'Account B must be selectable from the congregation roster');
  const userId = await option.getAttribute('value');
  assert.ok(userId, 'Account B roster option must expose a stable user id');
  await add.locator('select[name="user_id"]').selectOption(userId);
  await add.locator('button[type="submit"]').click();
  await A.getByText('Member added.', { exact: true }).waitFor();
  record('A', 'A3 Cloud Team assignment', 'added Account B through production roster UI', true);

  await visit(B, 'team-center', '[data-team-center-view]');
  await B.getByRole('heading', { name: teamName, exact: true }).waitFor();
  let memberCard = B.locator('[data-team-card]').filter({ has: B.getByRole('heading', { name: teamName, exact: true }) });
  await memberCard.waitFor();
  assert.equal(await memberCard.locator('[data-team-add], [data-team-rename], [data-team-archive]').count(), 0, 'Ordinary Account B must not receive team-management controls');
  record('B', 'A3 Cloud Team assignment', 'team visible without unauthorized management controls', true);
  await B.reload({ waitUntil: 'domcontentloaded' });
  await B.waitForSelector('[data-team-center-view]');
  await B.getByRole('heading', { name: teamName, exact: true }).waitFor();
  memberCard = B.locator('[data-team-card]').filter({ has: B.getByRole('heading', { name: teamName, exact: true }) });
  assert.equal(await memberCard.locator('[data-team-add], [data-team-rename], [data-team-archive]').count(), 0, 'Unauthorized team-management controls must remain absent after reload');
  record('B', 'A3 Cloud Team assignment', 'team membership and permission boundary persisted after reload', true);

  await visit(C, 'team-center', '[data-team-center-view]');
  await C.waitForTimeout(500);
  assert.equal(await C.getByRole('heading', { name: teamName, exact: true }).count(), 0, 'Unrelated Account C must not see the private team');
  record('C', 'A3 Cloud Team assignment', 'team isolated from unrelated account', true);

  await publishTargetedAssignment(A, { scope: 'team', targetLabel: teamName, title, scenario: 'A3 Cloud Team assignment' });
  await completeAndVerifyAssignment(sessions, { title, scenario: 'A3 Cloud Team assignment' });

  await visit(A, 'team-center', '[data-team-center-view]');
  card = A.locator('[data-team-card]').filter({ has: A.getByRole('heading', { name: teamName, exact: true }) });
  await card.waitFor();
  const remove = card.locator(`[data-team-remove][data-team-user="${userId}"]`);
  if (await remove.count()) {
    A.once('dialog', dialog => dialog.accept());
    await remove.click();
    await A.getByText('Member removed.', { exact: true }).waitFor();
    record('A', 'A3 Cloud Team assignment', 'removed Account B through production UI', true);

    card = A.locator('[data-team-card]').filter({ has: A.getByRole('heading', { name: teamName, exact: true }) });
    const readd = card.locator('[data-team-add]');
    const readdOption = readd.locator(`select[name="user_id"] option[value="${userId}"]`);
    if (await readdOption.count()) {
      await readd.locator('select[name="user_id"]').selectOption(userId);
      await readd.locator('button[type="submit"]').click();
      await A.getByText('Member added.', { exact: true }).waitFor();
      record('A', 'A3 Cloud Team assignment', 're-added Account B through production UI', true);
    }
  }

  card = A.locator('[data-team-card]').filter({ has: A.getByRole('heading', { name: teamName, exact: true }) });
  const archive = card.locator('[data-team-archive]');
  if (await archive.count()) {
    A.once('dialog', dialog => dialog.accept());
    await archive.click();
    await A.getByText('Team archived.', { exact: true }).waitFor();
    record('A', 'cleanup', 'archived temporary Cloud Team through production UI', true,
      'Assignment row remains for operator cleanup under RELEASE_FIELD_VALIDATION_V3.md.');
  }
}

async function main() {
  if (!/^https:\/\//i.test(HOST) && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(HOST)) {
    throw new Error('BQ_FIELD_HOST must be HTTPS, except an explicit localhost/127.0.0.1 test host.');
  }
  requireCredentials();
  if (!SCENARIOS.size) throw new Error('Choose at least one explicit scenario: journey-group-assignment or team-assignment.');
  for (const scenario of SCENARIOS) {
    if (!['journey-group-assignment', 'team-assignment'].includes(scenario)) throw new Error(`Unsupported field scenario: ${scenario}`);
  }
  if (!MUTATE) throw new Error('Mutation scenarios are fail-closed. Set BQ_FIELD_ALLOW_MUTATION=1 only for dedicated field-test accounts.');

  const browser = await chromium.launch({ headless: HEADLESS });
  const sessions = {};
  try {
    for (const alias of ['A', 'B', 'C']) sessions[alias] = await makeSession(browser, accounts[alias]);

    if (SCENARIOS.has('journey-group-assignment')) await journeyGroupAssignmentScenario(sessions);
    if (SCENARIOS.has('team-assignment')) await teamAssignmentScenario(sessions);

    for (const [alias, session] of Object.entries(sessions)) {
      assert.equal(session.pageErrors.length, 0, `${alias} page errors: ${session.pageErrors.join(' | ')}`);
    }
    record('ALL', 'summary', 'linked-assignment field harness completed without browser/page assertion failures', true,
      'Evidence remains partial until the complete RELEASE_FIELD_VALIDATION_V3.md matrix and mandatory cleanup are completed.');
  } catch (error) {
    record('ALL', 'summary', 'linked-assignment field harness stopped on reproducible failure', false, error?.message || String(error));
    throw error;
  } finally {
    await saveEvidence().catch(error => console.error(`Could not save sanitized evidence: ${error.message}`));
    await Promise.all(Object.values(sessions).map(session => session.context.close().catch(() => {})));
    await browser.close();
  }
}

await main();
