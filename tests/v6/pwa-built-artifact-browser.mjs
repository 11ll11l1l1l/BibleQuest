import { chromium } from 'playwright';

const baseUrl = process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173';
const expectedShortcuts = Object.freeze([
  ['Today\'s Journey', './#/my-journey'],
  ['Read Bible', './#/reader'],
  ['Assignments', './#/assignments'],
  ['Calendar', './#/calendar'],
]);
const requiredIcons = Object.freeze([
  ['pwa-icon-192.png', '192x192', 'any'],
  ['pwa-icon-512.png', '512x512', 'any'],
  ['pwa-icon-maskable-512.png', '512x512', 'maskable'],
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForResolvedLazyRoute(page, label) {
  await page.waitForFunction(() => {
    const lazyRoute = document.querySelector('[data-lazy-route]');
    return !lazyRoute || lazyRoute.getAttribute('aria-busy') !== 'true';
  });
  const lazyFailure = await page.locator('[data-lazy-route] [role="alert"]').count();
  assert(lazyFailure === 0, `${label}: lazy route module failed to load`);
}

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(String(error?.message || error)));

  await page.goto(`${baseUrl}/#/home`, { waitUntil: 'networkidle' });
  await page.locator('#app').waitFor({ state: 'attached' });

  const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
  assert(manifestLink, 'built artifact must expose a manifest link');
  const manifestUrl = new URL(manifestLink, `${baseUrl}/`).href;
  const manifestResponse = await context.request.get(manifestUrl);
  assert(manifestResponse.ok(), `manifest request failed: ${manifestResponse.status()}`);
  const manifest = await manifestResponse.json();

  assert(manifest.name === 'BibleQuest', `unexpected manifest name: ${manifest.name}`);
  assert(manifest.short_name === 'BibleQuest', `unexpected manifest short_name: ${manifest.short_name}`);
  assert(manifest.display === 'standalone', `manifest display must be standalone, got ${manifest.display}`);
  assert(manifest.start_url === './', `manifest start_url must remain relative, got ${manifest.start_url}`);
  assert(manifest.scope === './', `manifest scope must remain relative, got ${manifest.scope}`);

  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  for (const [src, sizes, purpose] of requiredIcons) {
    const icon = icons.find(candidate => candidate?.src === src && candidate?.sizes === sizes && candidate?.purpose === purpose);
    assert(icon, `required manifest icon missing: ${src} ${sizes} ${purpose}`);
    const iconResponse = await context.request.get(new URL(src, manifestUrl).href);
    assert(iconResponse.ok(), `manifest icon unavailable: ${src} (${iconResponse.status()})`);
    assert((await iconResponse.body()).byteLength > 0, `manifest icon empty: ${src}`);
  }

  const shortcuts = Array.isArray(manifest.shortcuts) ? manifest.shortcuts : [];
  assert(shortcuts.length === expectedShortcuts.length, `expected ${expectedShortcuts.length} shortcuts, got ${shortcuts.length}`);
  for (const [name, url] of expectedShortcuts) {
    const shortcut = shortcuts.find(candidate => candidate?.name === name && candidate?.url === url);
    assert(shortcut, `required shortcut missing or misrouted: ${name} -> ${url}`);
    const route = url.replace('./#/', '');
    const routePage = await context.newPage();
    await routePage.goto(`${baseUrl}/#/${route}`, { waitUntil: 'networkidle' });
    await routePage.locator('#app').waitFor({ state: 'attached' });
    await routePage.waitForFunction(() => document.querySelector('#app')?.textContent?.trim().length > 0);
    await waitForResolvedLazyRoute(routePage, `shortcut ${name}`);
    assert(await routePage.evaluate(() => location.hash) === `#/${route}`, `shortcut route did not resolve: ${name}`);
    await routePage.close();
  }

  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const registration = await navigator.serviceWorker.getRegistration('./');
    return Boolean(registration?.active || registration?.waiting || registration?.installing);
  });
  await page.waitForFunction(async () => Boolean(await navigator.serviceWorker.ready));

  // Prove the installed-app shell can reopen without network after one online
  // load. This is browser automation for shell availability only; it does not
  // claim physical-device install UI or offline Scripture-package acceptance.
  await context.setOffline(true);
  await page.goto(`${baseUrl}/#/home`, { waitUntil: 'domcontentloaded' });
  await page.locator('#app').waitFor({ state: 'attached' });
  await page.waitForFunction(() => document.querySelector('#app')?.textContent?.trim().length > 0);
  await waitForResolvedLazyRoute(page, 'offline Home reopen');
  const startupFailure = await page.locator('[data-startup-failure]').count();
  assert(startupFailure === 0, 'offline shell reopen rendered startup failure');
  assert(await page.evaluate(() => location.hash) === '#/home', 'offline shell reopen lost the Home route');
  assert(await page.evaluate(() => navigator.onLine === false), 'offline browser context did not report offline state');

  // Recover the same installed-app context after connectivity returns. The
  // bq-net-probe query is explicitly excluded from service-worker shell
  // handling, so a successful navigation proves the network path recovered
  // rather than silently satisfying the check from Cache Storage.
  await context.setOffline(false);
  await page.waitForFunction(() => navigator.onLine === true);
  const reconnectResponse = await page.goto(
    `${baseUrl}/?bq-net-probe=pwa-reconnect#/calendar`,
    { waitUntil: 'networkidle' },
  );
  assert(reconnectResponse?.ok(), `PWA reconnect network probe failed: ${reconnectResponse?.status() ?? 'no response'}`);
  await page.locator('#app').waitFor({ state: 'attached' });
  await page.waitForFunction(() => document.querySelector('#app')?.textContent?.trim().length > 0);
  await waitForResolvedLazyRoute(page, 'reconnected Calendar route');
  assert(await page.evaluate(() => location.hash) === '#/calendar', 'PWA reconnect lost the Calendar route');
  const reconnectStartupFailure = await page.locator('[data-startup-failure]').count();
  assert(reconnectStartupFailure === 0, 'PWA reconnect rendered startup failure');

  assert(pageErrors.length === 0, `PWA browser errors: ${pageErrors.join(' | ')}`);
  await context.close();

  // iOS does not expose beforeinstallprompt in the same way as Chromium
  // desktop/Android. Prove the built UI provides explicit Safari
  // Add-to-Home-Screen guidance instead of hiding the install surface.
  const iosContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
  });
  const iosPage = await iosContext.newPage();
  await iosPage.goto(`${baseUrl}/#/more`, { waitUntil: 'networkidle' });
  await iosPage.locator('#app').waitFor({ state: 'attached' });
  await waitForResolvedLazyRoute(iosPage, 'iOS More install guidance');
  const iosInstallPanel = iosPage.locator('[data-more-install]');
  assert(await iosInstallPanel.isVisible(), 'iOS Add to Home Screen guidance panel is hidden');
  const iosGuidance = iosPage.locator('[data-install-guidance]');
  assert(await iosGuidance.isVisible(), 'iOS Add to Home Screen guidance text is hidden');
  assert(
    (await iosGuidance.textContent())?.includes('Safari')
      && (await iosGuidance.textContent())?.includes('Add to Home Screen'),
    'iOS install guidance must name Safari and Add to Home Screen',
  );
  assert(await iosPage.locator('[data-install-app]').isHidden(), 'iOS fallback must not show an unavailable native install prompt button');
  await iosContext.close();
} finally {
  await browser.close();
}

console.log('Built PWA acceptance passed: manifest/install metadata, required icons, four shortcuts/routes, service-worker registration, offline shell reopen, network reconnect recovery, and iOS Safari Add-to-Home-Screen guidance verified at 390px.');
