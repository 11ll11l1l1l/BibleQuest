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

function readPngDimensions(bytes, label) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  assert(bytes.length >= 24, `${label}: PNG payload is too small`);
  assert(signature.every((value, index) => bytes[index] === value), `${label}: invalid PNG signature`);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  assert(String.fromCharCode(...bytes.slice(12, 16)) === 'IHDR', `${label}: PNG IHDR chunk missing`);
  return { width: view.getUint32(16), height: view.getUint32(20) };
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
    const iconContentType = iconResponse.headers()['content-type'] || '';
    assert(iconContentType.includes('image/png'), `manifest icon has unexpected content type: ${src} -> ${iconContentType || '<missing>'}`);
    const iconBytes = await iconResponse.body();
    assert(iconBytes.byteLength > 0, `manifest icon empty: ${src}`);
    const [expectedWidth, expectedHeight] = sizes.split('x').map(Number);
    const actual = readPngDimensions(iconBytes, src);
    assert(
      actual.width === expectedWidth && actual.height === expectedHeight,
      `manifest icon dimensions mismatch: ${src} expected ${sizes}, got ${actual.width}x${actual.height}`,
    );
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

  // Prove stale shell cache cleanup during worker replacement. Seed one obsolete
  // BibleQuest shell cache plus an unrelated cache, replace the active worker
  // with the same built worker under a cache-busted script URL, and wait for
  // activation. The activate handler must delete only stale BibleQuest shell
  // caches while preserving unrelated storage and the current shell cache.
  const workerUpgrade = await page.evaluate(async () => {
    const currentRegistration = await navigator.serviceWorker.ready;
    const staleCacheName = 'biblequest-v3-offline-shell-v1-browser-upgrade-test';
    const unrelatedCacheName = 'bq-unrelated-browser-upgrade-test';
    const currentCacheName = 'biblequest-v3-offline-shell-v2';

    await Promise.all([
      caches.delete(staleCacheName),
      caches.delete(unrelatedCacheName),
    ]);

    const staleCache = await caches.open(staleCacheName);
    await staleCache.put(
      new Request(new URL('./bq-stale-cache-probe', currentRegistration.scope).href),
      new Response('stale'),
    );
    const unrelatedCache = await caches.open(unrelatedCacheName);
    await unrelatedCache.put(
      new Request(new URL('./bq-unrelated-cache-probe', currentRegistration.scope).href),
      new Response('keep'),
    );

    const updateScriptUrl = new URL(
      './offline-shell-sw.js?bq-sw-update-probe=1',
      currentRegistration.scope,
    ).href;
    const scopePath = new URL(currentRegistration.scope).pathname;
    const updatedRegistration = await navigator.serviceWorker.register(updateScriptUrl, {
      scope: scopePath,
      updateViaCache: 'none',
    });

    const deadline = Date.now() + 10000;
    while (
      Date.now() < deadline
      && (
        updatedRegistration.active?.state !== 'activated'
        || updatedRegistration.active?.scriptURL !== updateScriptUrl
      )
    ) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    const activeScriptUrl = updatedRegistration.active?.scriptURL || '';
    const cacheNames = await caches.keys();
    await caches.delete(unrelatedCacheName);

    return {
      activeScriptUrl,
      staleCachePresent: cacheNames.includes(staleCacheName),
      unrelatedCachePresent: cacheNames.includes(unrelatedCacheName),
      currentCachePresent: cacheNames.includes(currentCacheName),
    };
  });

  assert(
    workerUpgrade.activeScriptUrl.includes('bq-sw-update-probe=1'),
    `service-worker replacement did not activate the updated built worker: ${workerUpgrade.activeScriptUrl || '<missing>'}`,
  );
  assert(
    !workerUpgrade.staleCachePresent,
    'service-worker activation did not remove the obsolete BibleQuest shell cache',
  );
  assert(
    workerUpgrade.unrelatedCachePresent,
    'service-worker activation removed an unrelated cache',
  );
  assert(
    workerUpgrade.currentCachePresent,
    'service-worker activation removed the current BibleQuest shell cache',
  );

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

  // Web Share is progressive enhancement. Prove the built More surface uses
  // native sharing when available and copies the same route-neutral app URL
  // when native sharing is unavailable.
  const nativeShareContext = await browser.newContext({ viewport: { width: 360, height: 844 } });
  const nativeSharePage = await nativeShareContext.newPage();
  await nativeSharePage.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async payload => { globalThis.__BQ_NATIVE_SHARE_PAYLOAD__ = payload; },
    });
  });
  await nativeSharePage.goto(`${baseUrl}/#/more`, { waitUntil: 'networkidle' });
  await nativeSharePage.locator('#app').waitFor({ state: 'attached' });
  await waitForResolvedLazyRoute(nativeSharePage, '360px native Web Share');
  const nativeShareButton = nativeSharePage.locator('[data-share-app]');
  assert(await nativeShareButton.isVisible(), '360px native Web Share button is hidden');
  await nativeShareButton.click();
  await nativeSharePage.waitForFunction(() => Boolean(globalThis.__BQ_NATIVE_SHARE_PAYLOAD__));
  const nativePayload = await nativeSharePage.evaluate(() => globalThis.__BQ_NATIVE_SHARE_PAYLOAD__);
  assert(nativePayload?.title === 'BibleQuest', `native Web Share title mismatch: ${nativePayload?.title || '<missing>'}`);
  assert(nativePayload?.text === 'Open BibleQuest', `native Web Share text mismatch: ${nativePayload?.text || '<missing>'}`);
  assert(nativePayload?.url === `${baseUrl}/`, `native Web Share URL mismatch: ${nativePayload?.url || '<missing>'}`);
  assert(!(await nativeShareButton.isDisabled()), 'native Web Share button remained disabled after completion');
  await nativeShareContext.close();

  const clipboardShareContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const clipboardSharePage = await clipboardShareContext.newPage();
  await clipboardSharePage.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async value => { globalThis.__BQ_CLIPBOARD_SHARE_URL__ = value; },
      },
    });
  });
  await clipboardSharePage.goto(`${baseUrl}/#/more`, { waitUntil: 'networkidle' });
  await clipboardSharePage.locator('#app').waitFor({ state: 'attached' });
  await waitForResolvedLazyRoute(clipboardSharePage, '390px Web Share clipboard fallback');
  const clipboardShareButton = clipboardSharePage.locator('[data-share-app]');
  await clipboardShareButton.click();
  await clipboardSharePage.waitForFunction(() => Boolean(globalThis.__BQ_CLIPBOARD_SHARE_URL__));
  const copiedShareUrl = await clipboardSharePage.evaluate(() => globalThis.__BQ_CLIPBOARD_SHARE_URL__);
  assert(copiedShareUrl === `${baseUrl}/`, `clipboard Web Share URL mismatch: ${copiedShareUrl || '<missing>'}`);
  await clipboardSharePage.locator('[data-share-status]').waitFor({ state: 'visible' });
  assert(
    (await clipboardSharePage.locator('[data-share-status]').textContent())?.includes('copied'),
    'clipboard Web Share fallback must confirm the copied link',
  );
  assert(!(await clipboardShareButton.isDisabled()), 'clipboard Web Share button remained disabled after completion');
  await clipboardShareContext.close();

  // iOS does not expose beforeinstallprompt in the same way as Chromium
  // desktop/Android. Prove the built UI provides explicit Safari
  // Add-to-Home-Screen guidance at every required narrow-phone width.
  const iosWidths = [320, 360, 390, 412, 430];
  const iosUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
  for (const width of iosWidths) {
    const iosContext = await browser.newContext({
      viewport: { width, height: 844 },
      userAgent: iosUserAgent,
    });
    const iosPage = await iosContext.newPage();
    await iosPage.addInitScript(() => {
      // Chromium may still synthesize beforeinstallprompt even when the UA is
      // iPhone-like. Safari does not expose that event, so suppress it here to
      // exercise the real iOS fallback branch deterministically.
      window.addEventListener('beforeinstallprompt', event => event.stopImmediatePropagation(), true);
    });
    await iosPage.goto(`${baseUrl}/#/more`, { waitUntil: 'networkidle' });
    await iosPage.locator('#app').waitFor({ state: 'attached' });
    await waitForResolvedLazyRoute(iosPage, `iOS ${width}px More install guidance`);
    const iosInstallPanel = iosPage.locator('[data-more-install]');
    assert(await iosInstallPanel.isVisible(), `iOS ${width}px Add to Home Screen guidance panel is hidden`);
    const iosGuidance = iosPage.locator('[data-install-guidance]');
    assert(await iosGuidance.isVisible(), `iOS ${width}px Add to Home Screen guidance text is hidden`);
    assert(
      (await iosGuidance.textContent())?.includes('Safari')
        && (await iosGuidance.textContent())?.includes('Add to Home Screen'),
      `iOS ${width}px install guidance must name Safari and Add to Home Screen`,
    );
    assert(
      await iosPage.locator('[data-install-app]').isHidden(),
      `iOS ${width}px fallback must not show an unavailable native install prompt button`,
    );
    const overflow = await iosPage.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert(
      overflow.scrollWidth <= overflow.clientWidth + 1,
      `iOS ${width}px install guidance overflows horizontally: ${overflow.scrollWidth}px > ${overflow.clientWidth}px`,
    );
    await iosContext.close();
  }

  // Safari exposes navigator.standalone for an app launched from the Home
  // Screen. Prove that path is treated as already installed even when
  // Chromium's display-mode emulation does not report standalone.
  const iosStandaloneContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: iosUserAgent,
  });
  const iosStandalonePage = await iosStandaloneContext.newPage();
  await iosStandalonePage.addInitScript(() => {
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: true });
    window.addEventListener('beforeinstallprompt', event => event.stopImmediatePropagation(), true);
  });
  await iosStandalonePage.goto(`${baseUrl}/#/more`, { waitUntil: 'networkidle' });
  await iosStandalonePage.locator('#app').waitFor({ state: 'attached' });
  await waitForResolvedLazyRoute(iosStandalonePage, 'iOS standalone More install state');
  assert(
    await iosStandalonePage.locator('[data-more-install]').isHidden(),
    'iOS standalone launch must not offer installation again',
  );
  await iosStandaloneContext.close();
} finally {
  await browser.close();
}

console.log('Built PWA acceptance passed: manifest/install metadata, required PNG icon payloads/dimensions, four shortcuts/routes, service-worker registration, offline shell reopen, network reconnect recovery at 390px, native Web Share at 360px, clipboard share fallback at 390px, iOS Safari Add-to-Home-Screen guidance at 320/360/390/412/430px, and iOS standalone installed-state handling at 390px.');
