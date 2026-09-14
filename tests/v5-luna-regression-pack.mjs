import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function proveStaticContract() {
  const [guard, index, games] = await Promise.all([
    fs.readFile('src/app/v5-luna-regression-guards.js', 'utf8'),
    fs.readFile('index.html', 'utf8'),
    fs.readFile('src/features/games/index.js', 'utf8'),
  ]);
  assert(!index.includes('<script type="module" src="src/app/v5-luna-regression-guards.js">'), 'App shell must boot exactly one script entry - the Luna guards must not be a second top-level <script>.');
  assert(guard.includes("const DAILY_FORM = '[data-daily-text-form]'"), 'BQ-002 must target the existing Daily Journey form owner.');
  assert(guard.includes('Please enter a response before saving this step.'), 'BQ-002 must retain canonical required-response guidance.');
  assert(guard.includes("textarea.setAttribute('aria-invalid', 'true')"), 'BQ-002 must expose invalid state accessibly.');
  assert(guard.includes('textarea.focus()'), 'BQ-002 must recover focus to the invalid field.');
  assert(guard.includes("window.addEventListener('beforeunload'"), 'BQ-003 must retain a leave/reload warning for active quiz rounds.');
  assert(guard.includes("const ACTIVE_GAME_QUESTION = '[data-games-page] [data-game-question]'"), 'BQ-003 must bind to the current quiz marker.');
  assert(games.includes('data-game-question="${escapeHtml(q.id)}"'), 'Games UI must expose the marker consumed by BQ-003.');
}

async function proveBrowserBehavior() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('console', message => { if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(`console: ${message.text()}`); });
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('requestfailed', request => errors.push(`requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', response => { if (response.status() >= 400) errors.push(`http: ${response.status()} ${response.url()}`); });

  try {
    await page.goto(`${BASE}tests/v5-luna-regression-pack.mjs`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      document.head.innerHTML = `<base href="/"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="icon" href="data:,"><link rel="stylesheet" href="/src/ui/app.css"><link rel="stylesheet" href="/src/ui/daily-mission.css"><link rel="stylesheet" href="/src/ui/games.css"><link rel="stylesheet" href="/src/ui/v4-foundation.css"><link rel="stylesheet" href="/src/ui/journey-v4.css"><link rel="stylesheet" href="/src/ui/games-v4.css">`;
      document.body.innerHTML = `<main><section class="bq-panel" data-daily-step><form data-daily-text-form><label for="bq-luna-response">Reflection</label><textarea id="bq-luna-response" name="response" required></textarea><button type="submit" class="bq-primary-button" data-daily-save>Save reflection</button></form><p data-daily-message aria-live="polite"></p></section><section class="bq-panel" data-games-page><div class="bq-question-card" data-game-question="quick-recall-1"><h1>Quick Recall</h1><button type="button" class="bq-primary-button" data-quick-recall-answer>Answer</button></div></section></main>`;
      window.__bqLunaPack = { submitCount: 0 };
      document.querySelector('[data-daily-text-form]').addEventListener('submit', event => { event.preventDefault(); window.__bqLunaPack.submitCount += 1; });
      const guardModule = await import(`/src/app/v5-luna-regression-guards.js?pack=${Date.now()}`);
      guardModule.installV5LunaRegressionGuards();
    });

    const textarea = page.locator('textarea[name="response"]');
    const save = page.locator('[data-daily-save]');
    const message = page.locator('[data-daily-message]');
    await textarea.fill('   ');
    await save.click();
    await page.waitForFunction(() => document.activeElement?.matches?.('textarea[name="response"]'));
    assert((await textarea.getAttribute('aria-invalid')) === 'true', 'BQ-002 blank/whitespace save must set aria-invalid.');
    assert((await message.getAttribute('role')) === 'alert', 'BQ-002 guidance must be an alert.');
    assert((await message.textContent())?.trim() === 'Please enter a response before saving this step.', 'BQ-002 canonical guidance mismatch.');
    assert((await page.evaluate(() => window.__bqLunaPack.submitCount)) === 0, 'BQ-002 blank response must not reach submit owner.');

    await textarea.fill('I will apply this today.');
    await page.waitForFunction(() => !document.querySelector('textarea[name="response"]')?.hasAttribute('aria-invalid'));
    assert((await message.textContent())?.trim() === '', 'BQ-002 guidance must clear after valid correction.');
    await save.click();
    assert((await page.evaluate(() => window.__bqLunaPack.submitCount)) === 1, 'BQ-002 valid response must preserve normal submission.');

    const warningState = await page.evaluate(() => {
      const answerHeight = document.querySelector('[data-quick-recall-answer]')?.getBoundingClientRect().height || 0;
      const active = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(active);
      document.querySelector('[data-game-question]')?.remove();
      const inactive = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(inactive);
      return { activePrevented: active.defaultPrevented, inactivePrevented: inactive.defaultPrevented, answerHeight };
    });
    assert(warningState.activePrevented === true, 'BQ-003 active quiz must request standard browser leave/reload confirmation.');
    assert(warningState.inactivePrevented === false, 'BQ-003 must not warn without an active quiz question.');

    const metrics = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, saveHeight: document.querySelector('[data-daily-save]')?.getBoundingClientRect().height || 0 }));
    assert(metrics.width === 390, `Expected 390px viewport, got ${metrics.width}.`);
    assert(metrics.scrollWidth <= metrics.width + 1, `Horizontal overflow: ${metrics.scrollWidth}px > ${metrics.width}px.`);
    assert(metrics.saveHeight >= 44, `Daily Journey Save control is below 44px: ${metrics.saveHeight}px.`);
    assert(warningState.answerHeight >= 44, `Quick Recall control is below 44px: ${warningState.answerHeight}px.`);
    assert(errors.length === 0, `Unexpected browser/page errors: ${errors.join(' | ')}`);
  } finally {
    await browser.close();
  }
}

await proveStaticContract();
await proveBrowserBehavior();
console.log('V5 Luna regression pack passed: BQ-002 canonical validation + BQ-003 active-quiz leave warning (STATIC + BROWSER-AUTO).');
