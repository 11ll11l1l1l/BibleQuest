import { chromium } from 'playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
let offlinePersistentContext = null;
let offlineProfileDir = null;
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

  // Prove managed single-book and full-translation Scripture downloads against
  // the built application, including all-book offline navigation and search.
  offlineProfileDir = await mkdtemp(join(tmpdir(), 'bq-v6-offline-reader-'));
  offlinePersistentContext = await chromium.launchPersistentContext(offlineProfileDir, {
    headless: true,
    viewport: { width: 390, height: 900 },
  });
  let offlineReaderContext = offlinePersistentContext;
  let offlineReaderPage = await offlineReaderContext.newPage();
  const offlineReaderErrors = [];
  const offlineExternalRequests = [];
  offlineReaderPage.on('pageerror', error => offlineReaderErrors.push(String(error?.message || error)));
  const recordExternalRequest = request => {
    try {
      const target = new URL(request.url());
      if (target.origin !== new URL(baseUrl).origin) offlineExternalRequests.push(`${request.method()} ${target.origin}${target.pathname}`);
    } catch { /* Ignore non-URL browser request diagnostics. */ }
  };
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
  offlineReaderPage.on('request', recordExternalRequest);
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
  if (offlineExternalRequests.length) {
    throw new Error(`390px V6 single-book offline Reader attempted external requests: ${offlineExternalRequests.join(' | ')}`);
  }

  await offlineReaderContext.setOffline(false);
  const removeOfflineControl = offlineReaderPage.locator('[data-reader-offline-remove]');
  try {
    await removeOfflineControl.waitFor({ state: 'visible', timeout: 5_000 });
  } catch {
    const offlineControlState = await offlineReaderPage.evaluate(async () => {
      const metadata = await caches.open('biblequest-v6-scripture-package-metadata-v1');
      const payload = await caches.open('biblequest-v3-opened-bible-packs-v1');
      return {
        managerText: document.querySelector('[data-reader-offline-manager]')?.textContent || '',
        message: document.querySelector('[data-reader-message]')?.textContent || '',
        metadataEntries: (await metadata.keys()).length,
        payloadEntries: (await payload.keys()).length,
      };
    });
    throw new Error(`390px V6 managed offline Reader: removal control not available after offline navigation: ${JSON.stringify(offlineControlState)}; pageErrors=${JSON.stringify(offlineReaderErrors)}`);
  }
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

  await offlineReaderPage.locator('[data-reader-translation-download]').click();
  let packagesBeforeCancel = 0;
  const partialDownloadDeadline = Date.now() + 30_000;
  while (Date.now() < partialDownloadDeadline) {
    packagesBeforeCancel = await offlineReaderPage.evaluate(async () =>
      (await (await caches.open('biblequest-v6-scripture-package-metadata-v1')).keys()).length,
    );
    if (packagesBeforeCancel >= 5 && packagesBeforeCancel < 66) break;
    await offlineReaderPage.waitForTimeout(50);
  }
  if (packagesBeforeCancel < 5 || packagesBeforeCancel >= 66) {
    throw new Error(`Full BSB download did not reach a cancellable partial state: ${packagesBeforeCancel} packages`);
  }
  await offlineReaderPage.locator('[data-reader-translation-cancel]').click();
  await offlineReaderPage.waitForFunction(() => /Full translation download cancelled/.test(
    document.querySelector('[data-reader-message]')?.textContent || '',
  ), { timeout: 30_000 });
  await offlineReaderPage.locator('[data-reader-translation-download]').waitFor({ state: 'visible', timeout: 30_000 });
  const packagesAfterCancel = await offlineReaderPage.evaluate(async () =>
    (await (await caches.open('biblequest-v6-scripture-package-metadata-v1')).keys()).length,
  );
  if (packagesAfterCancel < packagesBeforeCancel || packagesAfterCancel < 5 || packagesAfterCancel >= 66) {
    throw new Error(`Full BSB cancellation lost completed packages or did not stop early: before=${packagesBeforeCancel}, after=${packagesAfterCancel}`);
  }

  await offlineReaderContext.close();
  offlinePersistentContext = await chromium.launchPersistentContext(offlineProfileDir, {
    headless: true,
    viewport: { width: 390, height: 900 },
  });
  offlineReaderContext = offlinePersistentContext;
  offlineReaderPage = await offlineReaderContext.newPage();
  offlineReaderPage.on('pageerror', error => offlineReaderErrors.push(String(error?.message || error)));
  await assertRoute(offlineReaderPage, 'reader', '390px restarted partial offline Reader');
  const restartedPartialPackageCount = await offlineReaderPage.evaluate(async () =>
    (await (await caches.open('biblequest-v6-scripture-package-metadata-v1')).keys()).length,
  );
  if (restartedPartialPackageCount !== packagesAfterCancel) {
    throw new Error(`390px V6 offline Reader: partial package inventory changed after browser restart: before=${packagesAfterCancel}, after=${restartedPartialPackageCount}`);
  }
  await offlineReaderPage.locator('[data-reader-translation-download]').waitFor({ state: 'visible' });

  await offlineReaderPage.locator('[data-reader-translation-download]').click();
  await offlineReaderPage.locator('[data-reader-translation-remove]').waitFor({ state: 'visible', timeout: 120_000 });
  const fullTranslationState = await offlineReaderPage.evaluate(async () => {
    const metadata = await caches.open('biblequest-v6-scripture-package-metadata-v1');
    const payload = await caches.open('biblequest-v3-opened-bible-packs-v1');
    const keys = await metadata.keys();
    return {
      metadataEntries: keys.length,
      payloadEntries: (await payload.keys()).length,
      bookCodes: keys.map(request => new URL(request.url).pathname.split('/').pop().replace(/\.json$/, '')),
    };
  });
  if (fullTranslationState.metadataEntries !== 66 || fullTranslationState.payloadEntries !== 66) {
    throw new Error(`390px V6 managed offline Reader: expected all 66 BSB book packages, got ${JSON.stringify(fullTranslationState)}`);
  }

  await offlineReaderContext.close();
  offlinePersistentContext = await chromium.launchPersistentContext(offlineProfileDir, {
    headless: true,
    viewport: { width: 390, height: 900 },
  });
  const resumedReaderPage = await offlinePersistentContext.newPage();
  resumedReaderPage.on('pageerror', error => offlineReaderErrors.push(String(error?.message || error)));
  await assertRoute(resumedReaderPage, 'reader', '390px restarted full offline Reader');
  const persistedFullTranslationState = await resumedReaderPage.evaluate(async () => {
    const metadata = await caches.open('biblequest-v6-scripture-package-metadata-v1');
    const payload = await caches.open('biblequest-v3-opened-bible-packs-v1');
    const keys = await metadata.keys();
    return {
      metadataEntries: keys.length,
      payloadEntries: (await payload.keys()).length,
      bookCodes: keys.map(request => new URL(request.url).pathname.split('/').pop().replace(/\.json$/, '')),
    };
  });
  if (persistedFullTranslationState.metadataEntries !== 66 || persistedFullTranslationState.payloadEntries !== 66) {
    throw new Error(`390px V6 offline Reader: browser restart lost full-translation packages: ${JSON.stringify({ before: fullTranslationState, after: persistedFullTranslationState })}`);
  }
  await resumedReaderPage.locator('[data-reader-translation-remove]').waitFor({ state: 'visible' });

  await offlinePersistentContext.setOffline(true);
  const fullOfflineExternalRequests = [];
  resumedReaderPage.on('request', request => {
    try {
      const target = new URL(request.url());
      if (target.origin !== new URL(baseUrl).origin) fullOfflineExternalRequests.push(`${request.method()} ${target.origin}${target.pathname}`);
    } catch { /* Ignore non-URL browser request diagnostics. */ }
  });
  await resumedReaderPage.reload({ waitUntil: 'domcontentloaded' });
  await resumedReaderPage.waitForSelector('[data-reader-verse-text]');
  await resumedReaderPage.locator('[data-reader-book]').selectOption('GEN');
  await resumedReaderPage.waitForFunction(() => /Genesis 1/.test(document.querySelector('.bq-reader-title h2')?.textContent || ''));
  await resumedReaderPage.locator('[data-reader-next]').click();
  await resumedReaderPage.waitForFunction(() => [...document.querySelectorAll('.bq-reader-title h2')].some(node => /Genesis 2/.test(node.textContent || '')));
  const offlineSearch = resumedReaderPage.locator('[data-reader-search]');
  await offlineSearch.locator('[name="query"]').fill('In the beginning');
  await offlineSearch.locator('button[type="submit"]').click();
  await resumedReaderPage.locator('[data-search-result]').first().waitFor({ state: 'visible', timeout: 30_000 });
  const offlineSearchReference = await resumedReaderPage.locator('[data-search-result] b').first().textContent();
  if (!/Genesis 1:1/.test(offlineSearchReference || '')) {
    throw new Error(`390px V6 full offline Bible search returned the wrong first reference: ${offlineSearchReference}`);
  }
  if (fullOfflineExternalRequests.length) {
    throw new Error(`390px V6 full offline Reader attempted external requests: ${fullOfflineExternalRequests.join(' | ')}`);
  }

  await offlinePersistentContext.setOffline(false);
  await resumedReaderPage.reload({ waitUntil: 'networkidle' });
  await resumedReaderPage.locator('[data-reader-translation-remove]').waitFor({ state: 'visible' });
  await resumedReaderPage.locator('[data-reader-translation-remove]').click();
  await resumedReaderPage.locator('[data-reader-translation-download]').waitFor({ state: 'visible' });
  const fullTranslationRemoved = await resumedReaderPage.evaluate(async () => {
    const metadata = await caches.open('biblequest-v6-scripture-package-metadata-v1');
    const payload = await caches.open('biblequest-v3-opened-bible-packs-v1');
    return { metadataEntries: (await metadata.keys()).length, payloadEntries: (await payload.keys()).length };
  });
  if (fullTranslationRemoved.metadataEntries !== 0 || fullTranslationRemoved.payloadEntries !== 0) {
    throw new Error(`390px V6 full offline Bible removal left package data behind: ${JSON.stringify(fullTranslationRemoved)}`);
  }
  if (offlineReaderErrors.length) {
    throw new Error(`390px V6 managed offline Reader browser errors: ${offlineReaderErrors.join(' | ')}`);
  }
  await offlinePersistentContext.close();
  offlinePersistentContext = null;

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
  await offlinePersistentContext?.close();
  if (offlineProfileDir) await rm(offlineProfileDir, { recursive: true, force: true });
  await browser.close();
}

console.log(
  `Built-artifact browser parity passed: ${widths.join('/')}px representative routes; ${canonicalRoutes.length} canonical direct deep links + not-found at 390px; PWA registration verified at 390px.`,
);
