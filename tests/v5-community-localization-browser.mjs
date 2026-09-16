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

  const expectedArt = {
    congregation: 'assets/v4/community/congregation.png',
    leaderboards: 'assets/v4/community/leaderboards.png',
    recognition: 'assets/v4/community/recognition.png',
    assignments: 'assets/v4/ministry-more/assignments.png',
    'live-rooms': 'assets/v4/community/live-rooms.png',
    'journey-groups': 'assets/v4/community/journey-groups.png',
    encouragements: 'assets/v4/community/encouragements.png'
  };
  const artwork = await page.evaluate(() => [...document.querySelectorAll('[data-community-route]')].map(button => {
    const img = button.querySelector('img.bq-community-art');
    return {
      route: button.dataset.communityRoute,
      src: img?.getAttribute('src') || '',
      alt: img?.getAttribute('alt'),
      ariaHidden: img?.getAttribute('aria-hidden'),
      naturalWidth: img?.naturalWidth || 0,
      width: img?.getBoundingClientRect().width || 0,
      height: img?.getBoundingClientRect().height || 0
    };
  }));
  assert.equal(artwork.length, 7, `expected seven Community artwork actions, found ${artwork.length}`);
  for (const item of artwork) {
    assert.equal(item.src, expectedArt[item.route], `wrong Community artwork for ${item.route}`);
    assert.equal(item.alt, '', `Community artwork must have empty alt text for ${item.route}`);
    assert.equal(item.ariaHidden, 'true', `Community artwork must remain decorative for ${item.route}`);
    assert.ok(item.naturalWidth > 0, `Community artwork failed to load for ${item.route}`);
    assert.ok(item.width > 0 && item.width <= 48, `Community artwork width is unsafe for ${item.route}: ${item.width}`);
    assert.ok(item.height > 0 && item.height <= 48, `Community artwork height is unsafe for ${item.route}: ${item.height}`);
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

  console.log('BROWSER-AUTO PASS: Tagalog Community chrome, exact artwork, runtime-data preservation, English-leak rejection, 390px touch/overflow');
} finally {
  await browser.close();
}
