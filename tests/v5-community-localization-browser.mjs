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
    const [{ communityPage }, { localization }] = await Promise.all([
      import('/src/features/community/index.js'),
      import('/src/app/localization.js')
    ]);
    localization.setLocale('tl');
    const state = {
      status: 'ready',
      congregations: [{ name: 'ICAC <Runtime>', roleLabel: 'Runtime Pastor Role', canMinistry: true }],
      groups: [{ name: 'Runtime Family Group', role: 'Runtime Facilitator', memberCount: 7, maxMembers: 12 }],
      encouragementCount: 3
    };
    const bridge = { load: async () => state };
    document.body.innerHTML = '<main id="community-root"></main>';
    const root = document.querySelector('#community-root');
    const feature = communityPage({ bridge, onNavigate() {}, onBack() {}, onAccount() {} });
    root.innerHTML = feature.html;
    feature.mount(root);
    window.__bqCommunityTitle = feature.title;
  });

  await page.waitForSelector('.bq-community-summary');

  const title = await page.evaluate(() => window.__bqCommunityTitle);
  assert.ok(title && title !== 'Community', 'Community title should use the Tagalog locale');
  assert.equal(await page.getByText('ICAC <Runtime>', { exact: true }).count(), 1, 'runtime congregation name must remain source data and render safely');
  assert.equal(await page.getByText('Runtime Pastor Role', { exact: true }).count(), 1, 'runtime congregation role label must not be translated');
  assert.equal(await page.getByText('Runtime Family Group', { exact: true }).count(), 1, 'runtime group name must not be translated');
  assert.equal(await page.getByText('Runtime Facilitator', { exact: true }).count(), 1, 'runtime group role must not be translated');

  for (const leak of [
    'Grow together without exposing private study.',
    'Your congregations',
    'Journey Groups',
    'What stays separate',
    'Back to More',
    'Congregation membership',
    'Assignments'
  ]) {
    assert.equal(await page.getByText(leak, { exact: true }).count(), 0, `Community exposes migrated English UI text: ${leak}`);
  }

  const geometry = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('[data-community-route], [data-community-back]')];
    const heights = buttons.map(node => node.getBoundingClientRect().height).filter(Boolean);
    return {
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      minButtonHeight: heights.length ? Math.min(...heights) : 0,
      buttonCount: buttons.length
    };
  });
  assert.ok(geometry.buttonCount >= 8, `expected Community navigation controls, found ${geometry.buttonCount}`);
  assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, `Tagalog Community overflows at 390px: ${geometry.scrollWidth} > ${geometry.innerWidth}`);
  assert.ok(geometry.minButtonHeight >= 44, `Community touch target regressed below 44px: ${geometry.minButtonHeight}`);
  assert.deepEqual(pageErrors, [], `Browser page errors occurred: ${pageErrors.join(' | ')}`);

  console.log('BROWSER-AUTO PASS: Tagalog Community chrome, runtime-data preservation, English-leak rejection, 390px touch/overflow');
} finally {
  await browser.close();
}
