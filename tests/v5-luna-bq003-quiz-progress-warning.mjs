import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

async function proveStaticContract() {
  const [guard, games] = await Promise.all([
    fs.readFile('src/app/v5-luna-regression-guards.js', 'utf8'),
    fs.readFile('src/features/games/index.js', 'utf8'),
  ]);

  assert(guard.includes("const ACTIVE_GAME_QUESTION = '[data-games-page] [data-game-question]'"), 'Luna guard must target an active standard quiz question inside the Games page.');
  assert(/addEventListener\('beforeunload'/.test(guard), 'Luna guard must install a beforeunload protection for active quiz rounds.');
  assert(/event\.preventDefault\(\)/.test(guard) && /event\.returnValue\s*=\s*''/.test(guard), 'Luna guard must request the browser-standard leave/reload confirmation.');
  assert(/data-games-page/.test(games) && /data-game-question=/.test(games), 'Games UI must emit the exact active-question markers consumed by the Luna guard.');
}

async function installHarness(page, { activeQuestion }) {
  await page.evaluate(async ({ activeQuestion }) => {
    document.head.innerHTML = '<base href="/"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,">';
    document.body.innerHTML = activeQuestion
      ? '<main data-games-page><section data-game-question="bq003-q1"><h1>Quick Recall</h1><button type="button" id="bq003-activate">Answer choice</button></section></main>'
      : '<main data-games-page><section data-game-complete><h1>Round complete</h1><button type="button" id="bq003-activate">Done</button></section></main>';
    const stamp = `${Date.now()}-${Math.random()}`;
    await import(`/src/app/v5-luna-regression-guards.js?bq003=${stamp}`);
  }, { activeQuestion });
}

async function proveBrowserContract() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('requestfailed', request => errors.push(`requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`http: ${response.status()} ${response.url()}`);
  });

  try {
    await page.goto(`${BASE}tests/v5-luna-bq003-quiz-progress-warning.mjs`, { waitUntil: 'domcontentloaded' });
    await installHarness(page, { activeQuestion: true });
    await page.locator('#bq003-activate').click();

    const activeDispatch = await page.evaluate(() => {
      const event = new Event('beforeunload', { cancelable: true });
      const dispatchResult = window.dispatchEvent(event);
      return { dispatchResult, defaultPrevented: event.defaultPrevented, returnValue: event.returnValue };
    });
    assert(activeDispatch.dispatchResult === false, 'Active quiz beforeunload event must be canceled.');
    assert(activeDispatch.defaultPrevented === true, 'Active quiz beforeunload event must be default-prevented.');
    assert(activeDispatch.returnValue === false || activeDispatch.returnValue === '', `Active quiz beforeunload returnValue must request browser confirmation; got ${String(activeDispatch.returnValue)}.`);

    // Exercise an actual browser reload after a user gesture. Chromium should emit
    // the standard beforeunload dialog; custom text is intentionally not asserted.
    let dialogType = null;
    page.once('dialog', async dialog => {
      dialogType = dialog.type();
      await dialog.accept();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert(dialogType === 'beforeunload', `Expected a native beforeunload dialog for active quiz reload, got ${String(dialogType)}.`);

    await installHarness(page, { activeQuestion: false });
    await page.locator('#bq003-activate').click();
    const inactiveDispatch = await page.evaluate(() => {
      const event = new Event('beforeunload', { cancelable: true });
      const dispatchResult = window.dispatchEvent(event);
      return { dispatchResult, defaultPrevented: event.defaultPrevented, returnValue: event.returnValue };
    });
    assert(inactiveDispatch.dispatchResult === true, 'Completed/non-active Games state must not block unload.');
    assert(inactiveDispatch.defaultPrevented === false, 'Completed/non-active Games state must not request a reload warning.');
    assert(errors.length === 0, `Unexpected browser/page errors: ${errors.join(' | ')}`);
  } finally {
    await browser.close();
  }
}

await proveStaticContract();
await proveBrowserContract();
console.log('V5 Luna BQ-003 quiz progress-loss warning proof passed (STATIC + BROWSER-AUTO).');
