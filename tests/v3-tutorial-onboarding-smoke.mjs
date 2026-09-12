import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'allow' });
const page = await context.newPage();
const errors = [];
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', error => errors.push(error.message));

try {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('[data-bq-shell="v3"]').waitFor({ timeout: 10000 });

  let metrics = await page.evaluate(() => ({
    layers: document.querySelectorAll('[data-bq-tutorial-layer]').length,
    dialogs: document.querySelectorAll('.bq-tutorial-dialog').length,
    hidden: document.querySelector('[data-bq-tutorial-layer]')?.hidden === true,
    launcherHeight: document.querySelector('[data-open-tutorial]')?.getBoundingClientRect().height || 0,
    innerWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  assert(metrics.layers === 1, 'Bootstrap must mount exactly one tutorial layer.');
  assert(metrics.hidden && metrics.dialogs === 0, 'Anonymous Home must remain unobstructed until an explicit retained trigger opens onboarding.');
  assert(metrics.launcherHeight >= 44, `Tutorial launcher is too short for mobile: ${metrics.launcherHeight}px.`);
  assert(metrics.scrollWidth <= metrics.innerWidth + 1, `Home with tutorial launcher caused horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);

  const accountHandoff = await page.evaluate(async () => {
    const secret = 'BQ-PRIVATE-RECOVERY-CODE';
    const { accountPage } = await import(`/src/features/account/index.js?onboarding-smoke=${Date.now()}`);
    const host = document.createElement('div');
    document.body.appendChild(host);
    let tutorialCalls = 0;
    let tutorialArgCount = -1;
    const account = {
      async signUp() { return { recovery_code: secret, signedIn: false, signInWarning: 'manual sign-in required', deviceWarning: '' }; }
    };
    const session = { getState: () => ({ authenticated: false, remoteAvailable: true, user: null }) };
    const def = accountPage({
      account,
      session,
      onHome() {},
      onTutorial(...args) { tutorialCalls += 1; tutorialArgCount = args.length; }
    });
    host.innerHTML = def.html;
    const dispose = def.mount(host);
    host.querySelector('[data-account-mode="signup"]')?.click();
    const form = host.querySelector('[data-account-signup]');
    form.querySelector('[name="full_name"]').value = 'Test Learner';
    form.querySelector('[name="preferred_name"]').value = 'Test';
    form.querySelector('[name="email"]').value = 'test@example.com';
    form.querySelector('[name="password"]').value = 'Password123!';
    form.querySelector('[name="confirm_password"]').value = 'Password123!';
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    for (let i = 0; i < 50 && !host.querySelector('[data-recovery-code]'); i += 1) await new Promise(resolve => setTimeout(resolve, 10));
    const codeNode = host.querySelector('[data-recovery-code]');
    const done = host.querySelector('[data-code-done]');
    const before = { code: codeNode?.textContent || '', disabled: done?.disabled === true, tutorialCalls };
    const saved = host.querySelector('[data-code-saved]');
    saved.checked = true;
    saved.dispatchEvent(new Event('click', { bubbles: true }));
    const enabledAfterSave = done?.disabled === false;
    done?.click();
    await Promise.resolve();
    const after = { tutorialCalls, tutorialArgCount, secretStored: Object.keys(localStorage).some(key => String(localStorage.getItem(key) || '').includes(secret)) };
    dispose?.();
    host.remove();
    return { before, enabledAfterSave, after };
  });
  assert(accountHandoff.before.code === 'BQ-PRIVATE-RECOVERY-CODE', 'Account owner did not retain the one-time recovery code on its own security surface.');
  assert(accountHandoff.before.disabled, 'Recovery-code Continue must remain disabled before save confirmation.');
  assert(accountHandoff.before.tutorialCalls === 0, 'Tutorial must not start before recovery-code save confirmation.');
  assert(accountHandoff.enabledAfterSave, 'Recovery-code save confirmation did not enable Continue.');
  assert(accountHandoff.after.tutorialCalls === 1, 'Account creation must hand off to onboarding exactly once after save confirmation.');
  assert(accountHandoff.after.tutorialArgCount === 0, 'Recovery code or other payload leaked into the tutorial callback.');
  assert(!accountHandoff.after.secretStored, 'Recovery code leaked into browser storage during tutorial handoff.');

  await page.locator('[data-open-tutorial]').click();
  await page.locator('[data-bq-tutorial-layer]').waitFor({ state: 'visible', timeout: 10000 });
  metrics = await page.evaluate(() => {
    const next = document.querySelector('[data-tutorial-next]')?.getBoundingClientRect();
    return {
      layers: document.querySelectorAll('[data-bq-tutorial-layer]').length,
      dialogs: document.querySelectorAll('.bq-tutorial-dialog').length,
      step: document.querySelector('.bq-tutorial-trainer small')?.textContent || '',
      nextHeight: next?.height || 0,
      innerWidth,
      scrollWidth: document.documentElement.scrollWidth
    };
  });
  assert(metrics.layers === 1 && metrics.dialogs === 1, 'Launcher must open exactly one visible tutorial overlay.');
  assert(metrics.step.includes('Step 1 of 9'), `Tutorial did not start at step 1: ${metrics.step}`);
  assert(metrics.nextHeight >= 44, `Tutorial Next target is too short for mobile: ${metrics.nextHeight}px.`);
  assert(metrics.scrollWidth <= metrics.innerWidth + 1, `Tutorial caused horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);

  await page.locator('[data-tutorial-next]').click();
  await page.waitForFunction(() => document.querySelector('.bq-tutorial-trainer small')?.textContent?.includes('Step 2 of 9'));
  await page.locator('[data-tutorial-back]').click();
  await page.waitForFunction(() => document.querySelector('.bq-tutorial-trainer small')?.textContent?.includes('Step 1 of 9'));

  await page.locator('[data-tutorial-skip]').click();
  await page.locator('[data-bq-tutorial-layer]').waitFor({ state: 'hidden' });
  await page.locator('[data-open-tutorial]').click();
  await page.locator('[data-bq-tutorial-layer]').waitFor({ state: 'visible' });
  metrics = await page.evaluate(() => ({ layers: document.querySelectorAll('[data-bq-tutorial-layer]').length, dialogs: document.querySelectorAll('.bq-tutorial-dialog').length }));
  assert(metrics.layers === 1 && metrics.dialogs === 1, 'Force-open launcher must reuse the single mounted overlay.');

  for (let step = 1; step < 9; step += 1) await page.locator('[data-tutorial-next]').click();
  await page.locator('[data-tutorial-next]').click();
  await page.locator('[data-bq-tutorial-layer]').waitFor({ state: 'hidden' });
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('biblequest.v3.tutorial-onboarding') || 'null'));
  assert(persisted?.completed === true, 'Finishing the tutorial did not persist completion through the shared storage boundary.');

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-bq-shell="v3"]').waitFor({ timeout: 10000 });
  assert(await page.locator('[data-bq-tutorial-layer]').isHidden(), 'Completed tutorial must remain closed after reload.');
  await page.locator('[data-open-tutorial]').click();
  await page.locator('[data-bq-tutorial-layer]').waitFor({ state: 'visible' });
  // Guided tour order (Phase 5, 9 steps): Welcome(0) -> Home(1) -> Read(2) -> Daily Journey(3, action=mission) -> ...
  for (let step = 0; step < 3; step += 1) await page.locator('[data-tutorial-next]').click();
  await page.locator('[data-tutorial-action="mission"]').click();
  await page.waitForFunction(() => location.hash === '#/mission');
  assert(await page.locator('[data-bq-tutorial-layer]').isHidden(), 'Tutorial action handoff must close the overlay before routing.');

  await page.evaluate(() => history.pushState(null, '', '#/home'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-bq-shell="v3"]').waitFor({ timeout: 10000 });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(async () => {
    const name = (await caches.keys()).find(value => value.startsWith('biblequest-v3-offline-shell-'));
    if (!name) return false;
    const cache = await caches.open(name);
    const urls = (await cache.keys()).map(request => request.url);
    return urls.some(url => url.includes('/src/app/tutorial.js')) && urls.some(url => url.includes('/src/features/tutorial/index.js')) && urls.some(url => url.includes('/src/ui/tutorial.css'));
  }, null, { timeout: 10000 });

  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.locator('[data-bq-shell="v3"]').waitFor({ timeout: 10000 });
  assert(await page.locator('[data-bq-tutorial-layer]').isHidden(), 'Offline Home must also remain unobstructed until the launcher is used.');
  await page.locator('[data-open-tutorial]').click();
  await page.locator('[data-bq-tutorial-layer]').waitFor({ state: 'visible', timeout: 5000 });
  metrics = await page.evaluate(() => ({
    layers: document.querySelectorAll('[data-bq-tutorial-layer]').length,
    controller: Boolean(navigator.serviceWorker.controller),
    innerWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  assert(metrics.layers === 1, 'Offline tutorial launch must keep exactly one overlay layer.');
  assert(metrics.controller, 'Offline tutorial acceptance requires the existing offline-shell worker to remain controller.');
  assert(metrics.scrollWidth <= metrics.innerWidth + 1, `Offline tutorial overflowed horizontally: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);

  assert(errors.length === 0, `Unexpected Tutorial/onboarding console/page errors: ${errors.join(' | ')}`);
  console.log('BibleQuest v3 Tutorial/onboarding account-handoff + mobile + offline browser regression passed.');
} finally {
  await context.setOffline(false).catch(() => {});
  await browser.close();
}
