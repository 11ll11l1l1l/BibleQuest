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

async function dispatchPushThroughInstalledWorker(context, payload) {
  const worker = context.serviceWorkers().find(candidate => candidate.url().includes('offline-shell-sw.js'));
  assert(worker, 'installed BibleQuest service worker was not visible to Chromium');

  return worker.evaluate(async value => {
    const prototype = ServiceWorkerRegistration.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, 'showNotification');
    if (!descriptor) throw new Error('ServiceWorkerRegistration.showNotification descriptor unavailable');

    return new Promise((resolve, reject) => {
      let settled = false;
      const restore = () => Object.defineProperty(prototype, 'showNotification', descriptor);
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        restore();
        reject(new Error('installed worker did not call showNotification'));
      }, 1000);

      try {
        Object.defineProperty(prototype, 'showNotification', {
          configurable: true,
          writable: true,
          value: async (title, options = {}) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            const captured = {
              title: String(title || ''),
              body: String(options.body || ''),
              tag: String(options.tag || ''),
              data: options.data || null,
            };
            restore();
            resolve(captured);
          },
        });

        self.dispatchEvent(new PushEvent('push', { data: JSON.stringify(value) }));
      } catch (error) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        restore();
        reject(error);
      }
    });
  }, payload);
}

async function dispatchNotificationClickThroughInstalledWorker(context, notificationData) {
  const worker = context.serviceWorkers().find(candidate => candidate.url().includes('offline-shell-sw.js'));
  assert(worker, 'installed BibleQuest service worker was not visible to Chromium for notification click');

  await worker.evaluate(async data => {
    const event = new ExtendableEvent('notificationclick');
    Object.defineProperty(event, 'notification', {
      configurable: true,
      value: {
        data,
        close() {},
      },
    });
    self.dispatchEvent(event);
    await new Promise(resolve => setTimeout(resolve, 100));
  }, notificationData);
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

  const assignedPush = await dispatchPushThroughInstalledWorker(context, {
    title: 'New assignment',
    body: 'Read John 1 before Friday.',
    notificationId: '55555555-5555-4555-8555-555555555555',
    type: 'assignments',
    url: '/#/assignments',
  });
  assert(assignedPush.title === 'New assignment', 'assigned push title changed in the installed service worker');
  assert(assignedPush.body === 'Read John 1 before Friday.', 'assigned push body changed in the installed service worker');
  assert(assignedPush.tag === 'bq-55555555-5555-4555-8555-555555555555', 'assigned push tag is not stable');
  assert(assignedPush.data?.url === `${new URL(baseUrl).origin}/#/assignments`, 'assigned push lost the assignments deep link');
  assert(assignedPush.data?.type === 'assignments', 'assigned push lost the assignments delivery category');

  const duePush = await dispatchPushThroughInstalledWorker(context, {
    title: 'Assignment due soon',
    body: 'Finish John 1 before the deadline.',
    notificationId: '66666666-6666-4666-8666-666666666666',
    type: 'assignments',
    url: '/#/assignments',
  });
  assert(duePush.title === 'Assignment due soon', 'due push title changed in the installed service worker');
  assert(duePush.body === 'Finish John 1 before the deadline.', 'due push body changed in the installed service worker');
  assert(duePush.tag === 'bq-66666666-6666-4666-8666-666666666666', 'due push tag is not stable');
  assert(duePush.data?.url === `${new URL(baseUrl).origin}/#/assignments`, 'due push lost the assignments deep link');
  assert(duePush.data?.type === 'assignments', 'due push lost the assignments delivery category');

  await page.goto(`${baseUrl}/#/home`, { waitUntil: 'networkidle' });
  await dispatchNotificationClickThroughInstalledWorker(context, assignedPush.data);
  await page.waitForFunction(() => location.hash === '#/assignments');
  await waitForResolvedLazyRoute(page, 'assigned push notification click');
  assert(await page.evaluate(() => location.hash) === '#/assignments', 'assigned push notification click did not deep-link to Assignments');

  await page.goto(`${baseUrl}/#/home`, { waitUntil: 'networkidle' });
  await dispatchNotificationClickThroughInstalledWorker(context, duePush.data);
  await page.waitForFunction(() => location.hash === '#/assignments');
  await waitForResolvedLazyRoute(page, 'due push notification click');
  assert(await page.evaluate(() => location.hash) === '#/assignments', 'due push notification click did not deep-link to Assignments');

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

  assert(pageErrors.length === 0, `PWA browser errors: ${pageErrors.join(' | ')}`);
  await context.close();
} finally {
  await browser.close();
}

console.log('Built PWA acceptance passed: manifest/install metadata, required icons, four shortcuts/routes, installed service-worker assigned/due push handling + click deep-links, and offline shell reopen verified at 390px.');
