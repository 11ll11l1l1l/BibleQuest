import { chromium } from 'playwright';

const baseUrl = process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173';
const widths = [320, 360, 390, 412, 430];
const routes = ['home', 'reader', 'assignments', 'calendar', 'more'];

const browser = await chromium.launch({ headless: true });
try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(String(error?.message || error)));

    for (const route of routes) {
      await page.goto(`${baseUrl}/#/${route}`, { waitUntil: 'networkidle' });
      await page.locator('#app').waitFor({ state: 'attached' });
      await page.waitForFunction(() => document.querySelector('#app')?.textContent?.trim().length > 0);
      const startupFailure = await page.locator('[data-startup-failure]').count();
      if (startupFailure) throw new Error(`${width}px #/${route}: startup failure rendered`);
      const resolvedHash = await page.evaluate(() => location.hash);
      if (resolvedHash !== `#/${route}`) throw new Error(`${width}px #/${route}: resolved ${resolvedHash}`);
    }

    if (pageErrors.length) throw new Error(`${width}px browser errors: ${pageErrors.join(' | ')}`);
    await context.close();
  }

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

console.log(`Built-artifact browser parity passed: ${widths.join('/')}px; routes ${routes.join(', ')}; PWA registration verified at 390px.`);
