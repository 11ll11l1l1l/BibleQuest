import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseURL = process.env.BQ_TEST_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
try {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const [{ accountPage }, { localization }] = await Promise.all([import('/src/features/account/index.js'), import('/src/app/localization.js')]);
    localization.setLocale('tl');
    const state = { authenticated: true, user: { displayName: 'Runtime Member Name', email: 'runtime-member@example.test' } };
    const session = { getState: () => state, signOut: async () => {} };
    const account = {
      listDevices: async () => [
        { id: 'current', label: 'Runtime Phone', platform: 'Android Runtime', current: true },
        { id: 'other', label: 'Runtime Laptop', platform: 'Windows Runtime', current: false }
      ],
      removeDevice: async () => {},
      issueRecoveryCode: async () => ({ recovery_code: 'BQ-TEST-CODE' }),
      changePassword: async () => {}
    };
    document.body.innerHTML = '<main id="account-root"></main>';
    const root = document.querySelector('#account-root');
    const feature = accountPage({ account, session, onHome: () => {} });
    root.innerHTML = feature.html;
    feature.mount(root);
    window.__bqAccountTitle = feature.title;
  });
  await page.waitForSelector('[data-device-remove]');
  assert.equal(await page.evaluate(() => window.__bqAccountTitle), 'Account');
  assert.equal((await page.locator('.bq-account-panel > .bq-eyebrow').textContent())?.trim(), 'IYONG ACCOUNT');
  assert.equal((await page.locator('.bq-account-section-heading h2').first().textContent())?.trim(), 'Mga naaalalang device');
  assert.equal((await page.locator('.bq-account-section-heading h2').nth(1).textContent())?.trim(), 'Seguridad at recovery');
  assert.equal((await page.locator('[data-issue-recovery]').textContent())?.trim(), 'Gumawa ng bagong recovery code');
  assert.equal((await page.locator('[data-account-password] button[type="submit"]').textContent())?.trim(), 'Palitan ang password');
  assert.equal((await page.locator('[data-account-signout]').textContent())?.trim(), 'Mag-sign out sa device na ito');
  assert.equal(await page.getByText('Runtime Member Name', { exact: true }).count(), 1, 'runtime display name must remain unchanged');
  assert.equal(await page.getByText('runtime-member@example.test', { exact: true }).count(), 1, 'runtime email must remain unchanged');
  assert.equal(await page.getByText('Runtime Phone', { exact: true }).count(), 1, 'runtime device label must remain unchanged');
  assert.equal(await page.getByText('Android Runtime', { exact: true }).count(), 1, 'runtime device platform must remain unchanged');
  for (const leak of ['Remembered devices','Security & recovery','Generate new recovery code','Change password','Return home','Sign out on this device','THIS DEVICE']) {
    assert.equal(await page.getByText(leak, { exact: true }).count(), 0, `Account settings exposes migrated English UI text: ${leak}`);
  }
  const geometry = await page.evaluate(() => {
    const controls = [...document.querySelectorAll('[data-issue-recovery], [data-account-password] button, [data-account-home], [data-account-signout], [data-device-remove]')];
    return {
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      minButtonHeight: Math.min(...controls.map(node => node.getBoundingClientRect().height))
    };
  });
  assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, `Tagalog Account settings overflows at 390px: ${geometry.scrollWidth} > ${geometry.innerWidth}`);
  assert.ok(geometry.minButtonHeight >= 44, `Account settings touch target regressed below 44px: ${geometry.minButtonHeight}`);
  assert.deepEqual(pageErrors, [], `Browser page errors occurred: ${pageErrors.join(' | ')}`);
  console.log('BROWSER-AUTO PASS: Tagalog signed-in Account settings, runtime data preservation, 390px touch/overflow');
} finally {
  await browser.close();
}