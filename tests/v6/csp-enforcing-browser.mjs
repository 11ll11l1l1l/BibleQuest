import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { CSP_ENFORCING_POLICY } from '../../scripts/v6-csp-policy.mjs';

const base = new URL(process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173');
const routes = [
  '/',
  '/#/reader',
  '/#/recordings',
  '/#/notification-center',
  '/#/accessibility',
  '/admin.html',
  '/admin-operations.html',
  '/content-review.html',
  '/transform.html',
  '/psychometrics.html',
  '/reset.html',
  '/classic.html',
  '/v5-push-device-field.html',
];
const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const routePath of routes) {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(String(error?.message || error)));
    await page.addInitScript(() => {
      globalThis.__bqCspViolations = [];
      document.addEventListener('securitypolicyviolation', event => {
        globalThis.__bqCspViolations.push({
          blockedURI: event.blockedURI,
          violatedDirective: event.violatedDirective,
          effectiveDirective: event.effectiveDirective,
          disposition: event.disposition,
          sourceFile: event.sourceFile,
          lineNumber: event.lineNumber,
        });
      });
    });
    await page.route(`${base.origin}/**`, async route => {
      if (route.request().resourceType() !== 'document') return route.continue();
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: { ...response.headers(), 'content-security-policy': CSP_ENFORCING_POLICY },
      });
    });
    const response = await page.goto(new URL(routePath, base).href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    assert.ok(response?.ok(), `${routePath}: built route did not load`);
    await page.waitForTimeout(1500);
    const violations = await page.evaluate(() => globalThis.__bqCspViolations ?? []);
    if (violations.length || pageErrors.length) failures.push({ routePath, violations, pageErrors });
    await context.close();
  }
} finally {
  await browser.close();
}
if (failures.length) console.error(JSON.stringify(failures, null, 2));
assert.deepEqual(failures, [], 'enforcing CSP blocked or broke a built-artifact route');
console.log(JSON.stringify({ policy: CSP_ENFORCING_POLICY, routes, violations: 0 }, null, 2));
