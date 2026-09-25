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
  await page.waitForFunction(() => {
    const lazyRoute = document.querySelector('[data-lazy-route]');
    return !lazyRoute || lazyRoute.getAttribute('aria-busy') !== 'true';
  });
  const startupFailure = await page.locator('[data-startup-failure]').count();
  if (startupFailure) throw new Error(`${label} #/${route}: startup failure rendered`);
  const lazyFailure = await page.locator('[data-lazy-route] [role="alert"]').count();
  if (lazyFailure) throw new Error(`${label} #/${route}: lazy route module failed to load`);
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

  // Prove the first live V6 feature migration end to end. Accessibility keeps
  // the released local-storage/UI contract while mutations pass through the
  // V6 feature-command seam.
  const accessibilityContext = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const accessibilityPage = await accessibilityContext.newPage();
  const accessibilityErrors = [];
  accessibilityPage.on('pageerror', error => accessibilityErrors.push(String(error?.message || error)));
  await assertRoute(accessibilityPage, 'accessibility', '390px V6 accessibility migration');
  await accessibilityPage.selectOption('[data-accessibility-setting="text"]', 'xlarge');
  await accessibilityPage.selectOption('[data-accessibility-setting="motion"]', 'reduce');
  await accessibilityPage.selectOption('[data-accessibility-setting="contrast"]', 'strong');
  await accessibilityPage.waitForFunction(() => {
    const root = document.documentElement;
    return root.dataset.bqText === 'xlarge'
      && root.dataset.bqMotion === 'reduce'
      && root.dataset.bqContrast === 'strong'
      && root.dataset.bqEffectiveMotion === 'reduce';
  });
  const savedAccessibility = await accessibilityPage.evaluate(() => {
    const raw = localStorage.getItem('biblequest.v3.accessibility-settings');
    return raw ? JSON.parse(raw) : null;
  });
  if (
    savedAccessibility?.text !== 'xlarge'
    || savedAccessibility?.motion !== 'reduce'
    || savedAccessibility?.contrast !== 'strong'
  ) {
    throw new Error(`390px V6 accessibility migration: persisted state mismatch ${JSON.stringify(savedAccessibility)}`);
  }
  await accessibilityPage.reload({ waitUntil: 'networkidle' });
  await accessibilityPage.waitForFunction(() => {
    const text = document.querySelector('[data-accessibility-setting="text"]');
    const motion = document.querySelector('[data-accessibility-setting="motion"]');
    const contrast = document.querySelector('[data-accessibility-setting="contrast"]');
    return text?.value === 'xlarge' && motion?.value === 'reduce' && contrast?.value === 'strong';
  });
  if (accessibilityErrors.length) {
    throw new Error(`390px V6 accessibility migration browser errors: ${accessibilityErrors.join(' | ')}`);
  }
  await accessibilityContext.close();

  // Prove the V6 managed Scripture package UI against the built application.
  // Download one verified BSB book, disable the network, reload the Reader,
  // navigate within that book offline, then reconnect and reclaim storage.
  const offlineReaderContext = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const offlineReaderPage = await offlineReaderContext.newPage();
  const offlineReaderErrors = [];
  offlineReaderPage.on('pageerror', error => offlineReaderErrors.push(String(error?.message || error)));
  await assertRoute(offlineReaderPage, 'reader', '390px V6 managed offline Reader');

  await offlineReaderPage.locator('[data-reader-offline-download]').waitFor({ state: 'visible' });
  const downloadLabel = await offlineReaderPage.locator('[data-reader-offline-manager]').textContent();
  if (!/Download this book/i.test(downloadLabel || '')) {
    throw new Error('390px V6 managed offline Reader: download control missing for BSB John');
  }
  await offlineReaderPage.locator('[data-reader-offline-download]').click();
  await offlineReaderPage.locator('[data-reader-offline-remove]').waitFor({ state: 'visible' });

  const managedBeforeOffline = await offlineReaderPage.evaluate(async () => {
    const metadata = await caches.open('biblequest-v6-scripture-package-metadata-v1');
    const payload = await caches.open('biblequest-v3-opened-bible-packs-v1');
    const metadataKeys = await metadata.keys();
    const payloadMatch = await payload.match(new URL('data/packs/bible/JHN.json', location.href).href);
    return {
      metadataEntries: metadataKeys.length,
      payloadPresent: Boolean(payloadMatch),
      managerText: document.querySelector('[data-reader-offline-manager]')?.textContent || '',
    };
  });
  if (managedBeforeOffline.metadataEntries < 1 || !managedBeforeOffline.payloadPresent) {
    throw new Error(`390px V6 managed offline Reader: verified package did not reach cache storage ${JSON.stringify(managedBeforeOffline)}`);
  }
  if (!/Managed offline copy/i.test(managedBeforeOffline.managerText)) {
    throw new Error('390px V6 managed offline Reader: installed state not rendered');
  }

  await offlineReaderPage.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const registration = await navigator.serviceWorker.getRegistration('./');
    return Boolean(registration?.active || registration?.waiting);
  });
  await offlineReaderContext.setOffline(true);
  await offlineReaderPage.reload({ waitUntil: 'domcontentloaded' });
  await offlineReaderPage.waitForSelector('[data-reader-verse-text]');
  const offlineChapterOne = await offlineReaderPage.locator('.bq-reader-title h2').first().textContent();
  if (!/John 1/i.test(offlineChapterOne || '')) {
    throw new Error(`390px V6 managed offline Reader: expected John 1 after offline reload, got ${offlineChapterOne}`);
  }

  await offlineReaderPage.locator('[data-reader-next]').click();
  await offlineReaderPage.waitForFunction(() => {
    const headings = [...document.querySelectorAll('.bq-reader-title h2')].map(node => node.textContent || '');
    return headings.some(text => /John 2/i.test(text));
  });
  const offlineStatus = await offlineReaderPage.locator('[data-reader-offline-status]').textContent();
  if (!/Available offline/i.test(offlineStatus || '')) {
    throw new Error(`390px V6 managed offline Reader: offline availability was not retained: ${offlineStatus}`);
  }

  await offlineReaderContext.setOffline(false);
  await offlineReaderPage.locator('[data-reader-offline-remove]').waitFor({ state: 'visible' });
  await offlineReaderPage.locator('[data-reader-offline-remove]').click();
  await offlineReaderPage.locator('[data-reader-offline-download]').waitFor({ state: 'visible' });
  const managedAfterRemove = await offlineReaderPage.evaluate(async () => {
    const metadata = await caches.open('biblequest-v6-scripture-package-metadata-v1');
    const payload = await caches.open('biblequest-v3-opened-bible-packs-v1');
    return {
      metadataEntries: (await metadata.keys()).length,
      payloadPresent: Boolean(await payload.match(new URL('data/packs/bible/JHN.json', location.href).href)),
    };
  });
  if (managedAfterRemove.metadataEntries !== 0 || managedAfterRemove.payloadPresent) {
    throw new Error(`390px V6 managed offline Reader: remove did not reclaim managed storage ${JSON.stringify(managedAfterRemove)}`);
  }
  if (offlineReaderErrors.length) {
    throw new Error(`390px V6 managed offline Reader browser errors: ${offlineReaderErrors.join(' | ')}`);
  }
  await offlineReaderContext.close();

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
