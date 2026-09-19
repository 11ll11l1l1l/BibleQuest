import { chromium } from 'playwright';

const baseUrl = process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173';
const widths = [320, 360, 390, 412, 430];
const representativeRoutes = ['home', 'reader', 'assignments', 'calendar', 'more'];
const canonicalRoutes = [
  'home',
  'mission',
  'learn',
  'study',
  'deep-questions',
  'story-journey',
  'wisdom-situations',
  'adaptive-learning',
  'bible-world',
  'open-review',
  'private-notes',
  'cloud-notes',
  'couples-family',
  'couples-cloud',
  'journey-groups',
  'encouragements',
  'community',
  'live-rooms',
  'ministry-hub',
  'leader-center',
  'notification-center',
  'workspace',
  'team-center',
  'leaderboards',
  'recognition',
  'assignments',
  'content-review',
  'reader',
  'play',
  'grow',
  'my-journey',
  'transform',
  'personality-profile',
  'psychometrics',
  'avatar-vault',
  'my-mission',
  'calendar',
  'recordings',
  'media',
  'more',
  'help',
  'accessibility',
  'backup',
  'congregation',
  'account',
];

async function assertRoute(page, route, label) {
  await page.goto(`${baseUrl}/#/${route}`, { waitUntil: 'networkidle' });
  await page.locator('#app').waitFor({ state: 'attached' });
  await page.waitForFunction(() => document.querySelector('#app')?.textContent?.trim().length > 0);
  const startupFailure = await page.locator('[data-startup-failure]').count();
  if (startupFailure) throw new Error(`${label} #/${route}: startup failure rendered`);
  const resolvedHash = await page.evaluate(() => location.hash);
  if (resolvedHash !== `#/${route}`) throw new Error(`${label} #/${route}: resolved ${resolvedHash}`);
}

const browser = await chromium.launch({ headless: true });
try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(String(error?.message || error)));

    for (const route of representativeRoutes) {
      await assertRoute(page, route, `${width}px`);
    }

    if (pageErrors.length) throw new Error(`${width}px browser errors: ${pageErrors.join(' | ')}`);
    await context.close();
  }

  // Exercise every canonical route as a fresh built-artifact deep link. This
  // catches missing compatibility assets/imports and startup-only route
  // failures without pretending that signed-out CI is authenticated E2E.
  const deepLinkContext = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const deepLinkErrors = [];
  for (const route of canonicalRoutes) {
    const page = await deepLinkContext.newPage();
    page.on('pageerror', error => deepLinkErrors.push(`#/${route}: ${String(error?.message || error)}`));
    await assertRoute(page, route, '390px direct');
    await page.close();
  }
  if (deepLinkErrors.length) throw new Error(`390px canonical deep-link browser errors: ${deepLinkErrors.join(' | ')}`);
  await deepLinkContext.close();

  // Unknown routes must resolve through the application's not-found owner
  // while retaining the requested hash for refresh/deep-link diagnostics.
  const notFoundContext = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const notFoundPage = await notFoundContext.newPage();
  await assertRoute(notFoundPage, 'v6-route-does-not-exist', '390px unknown');
  const notFoundText = await notFoundPage.locator('#app').textContent();
  if (!/page not found/i.test(notFoundText || '')) throw new Error('390px unknown route: not-found UI missing');
  await notFoundContext.close();

  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/#/home`, { waitUntil: 'networkidle' });
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const registration = await navigator.serviceWorker.getRegistration('./');
    return Boolean(registration);
  });
  const sw = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration('./');
    return registration ? { scope: registration.scope, active: Boolean(registration.active || registration.waiting || registration.installing) } : null;
  });
  if (!sw?.active) throw new Error('390px #/home: PWA service worker registration missing');
  await context.close();
} finally {
  await browser.close();
}

console.log(
  `Built-artifact browser parity passed: ${widths.join('/')}px representative routes; ${canonicalRoutes.length} canonical direct deep links + not-found at 390px; PWA registration verified at 390px.`,
);
