import { chromium } from 'playwright';

const baseUrl = process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173';
const widths = [320, 360, 390, 412, 430];
const ids = Object.freeze({
  pair: '33333333-3333-3333-3333-333333333333',
  track: '55555555-5555-5555-5555-555555555555',
  module: '77777777-7777-7777-7777-777777777777',
  revision: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  step: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
});

const deepLinks = [
  'one-to-one',
  'one-to-one?view=authoring',
  'one-to-one?view=assignment',
  `one-to-one-pair?id=${ids.pair}`,
  `one-to-one-track?pairId=${ids.pair}`,
  `one-to-one-module?pairId=${ids.pair}&trackId=${ids.track}`,
  `one-to-one-lesson?pairId=${ids.pair}&trackId=${ids.track}&moduleId=${ids.module}&revisionId=${ids.revision}&stepId=${ids.step}`,
];

async function assertBuiltRoute(page, route, label, { checkOverflow = false } = {}) {
  const errors = [];
  page.on('pageerror', error => errors.push(String(error?.message || error)));

  await page.goto(`${baseUrl}/#/${route}`, { waitUntil: 'networkidle' });
  await page.locator('#app').waitFor({ state: 'attached' });
  await page.waitForFunction(() => document.querySelector('#app')?.textContent?.trim().length > 0);
  await page.waitForFunction(() => {
    const lazyRoute = document.querySelector('[data-lazy-route]');
    return !lazyRoute || lazyRoute.getAttribute('aria-busy') !== 'true';
  });

  if (await page.locator('[data-startup-failure]').count()) {
    throw new Error(`${label}: startup failure rendered`);
  }
  if (await page.locator('[data-lazy-route] [role="alert"]').count()) {
    throw new Error(`${label}: lazy route module failed to load`);
  }

  const resolvedHash = await page.evaluate(() => location.hash);
  if (resolvedHash !== `#/${route}`) {
    throw new Error(`${label}: resolved ${resolvedHash}`);
  }

  if (checkOverflow) {
    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body?.scrollWidth || 0,
    }));
    const widest = Math.max(layout.documentWidth, layout.bodyWidth);
    if (widest > layout.viewport + 1) {
      throw new Error(`${label}: horizontal overflow ${widest}px exceeds ${layout.viewport}px viewport`);
    }
  }

  if (errors.length) throw new Error(`${label}: browser errors: ${errors.join(' | ')}`);
}

// This is intentionally signed-out built-artifact smoke. It proves route/module
// composition and narrow-layout safety only; it is not authenticated, RLS, or
// live-backend ONE 2 ONE journey certification.
const browser = await chromium.launch({ headless: true });
try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    await assertBuiltRoute(page, 'one-to-one', `${width}px ONE 2 ONE entry`, { checkOverflow: true });
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  for (const route of deepLinks) {
    const page = await context.newPage();
    await assertBuiltRoute(page, route, `390px direct #/${route}`, { checkOverflow: true });
    await page.close();
  }
  await context.close();
} finally {
  await browser.close();
}
