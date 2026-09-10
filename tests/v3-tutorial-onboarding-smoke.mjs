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
  await page.locator('[data-bq-tutorial-layer]').waitFor({ state: 'visible', timeout: 10000 });

  let metrics = await page.evaluate(() => {
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
  assert(metrics.layers === 1 && metrics.dialogs === 1, 'First run must mount exactly one visible tutorial overlay.');
  assert(metrics.step.includes('Step 1 of 6'), `Tutorial did not start at step 1: ${metrics.step}`);
  assert(metrics.nextHeight >= 44, `Tutorial Next target is too short for mobile: ${metrics.nextHeight}px.`);
  assert(metrics.scrollWidth <= metrics.innerWidth + 1, `Tutorial caused horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);

  await page.locator('[data-tutorial-next]').click();
  await page.waitForFunction(() => document.querySelector('.bq-tutorial-trainer small')?.textContent?.includes('Step 2 of 6'));
  await page.locator('[data-tutorial-back]').click();
  await page.waitForFunction(() => document.querySelector('.bq-tutorial-trainer small')?.textContent?.includes('Step 1 of 6'));

  await page.locator('[data-tutorial-skip]').click();
  await page.locator('[data-bq-tutorial-layer]').waitFor({ state: 'hidden' });
  await page.locator('[data-open-tutorial]').click();
  await page.locator('[data-bq-tutorial-layer]').waitFor({ state: 'visible' });
  metrics = await page.evaluate(() => ({ layers: document.querySelectorAll('[data-bq-tutorial-layer]').length, dialogs: document.querySelectorAll('.bq-tutorial-dialog').length }));
  assert(metrics.layers === 1 && metrics.dialogs === 1, 'Force-open launcher must reuse the single mounted overlay.');

  for (let step = 1; step < 6; step += 1) await page.locator('[data-tutorial-next]').click();
  await page.locator('[data-bq-tutorial-layer]').waitFor({ state: 'hidden' });
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('biblequest.v3.tutorial-onboarding') || 'null'));
  assert(persisted?.completed === true, 'Finishing the tutorial did not persist completion through the shared storage boundary.');

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-bq-shell="v3"]').waitFor({ timeout: 10000 });
  assert(await page.locator('[data-bq-tutorial-layer]').isHidden(), 'Completed tutorial must not auto-open after reload.');
  await page.locator('[data-open-tutorial]').click();
  await page.locator('[data-bq-tutorial-layer]').waitFor({ state: 'visible' });
  await page.locator('[data-tutorial-next]').click();
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
  console.log('BibleQuest v3 Tutorial/onboarding mobile + offline browser regression passed.');
} finally {
  await context.setOffline(false).catch(() => {});
  await browser.close();
}
