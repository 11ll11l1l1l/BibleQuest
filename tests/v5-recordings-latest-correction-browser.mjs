import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseURL = process.env.BQ_TEST_BASE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));

try {
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const [{ recordingsPage }, { localization }] = await Promise.all([
      import('/src/features/recordings/index.js'),
      import('/src/app/localization.js')
    ]);

    const makeRows = () => [
      { id: 'featured', title: 'Wrong latest service', description: 'Needs correction', youtubeId: 'FEATURED123', featured: true, createdAt: '2026-09-08T01:00:00Z' },
      { id: 'ordinary', title: 'Correct service', description: '', youtubeId: 'ORDINARY123', featured: false, createdAt: '2026-09-12T01:00:00Z' }
    ];

    window.__renderRecordingsCorrection = locale => {
      window.__recordingsCleanup?.();
      localization.setLocale(locale);
      const rows = makeRows();
      const mutations = [];
      let state = { status: 'ready', rows, selectedId: null, error: '', access: 'granted', latestService: rows[0] };
      const refreshLatest = () => {
        state.latestService = state.rows.filter(row => row.featured).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0] || null;
      };
      const api = {
        async load() { return state; },
        getState() { return state; },
        select(id) { state = { ...state, selectedId: id }; return state; },
        async setFeatured(id, featured) {
          mutations.push({ type: 'featured', id, featured });
          state.rows = state.rows.map(row => row.id === id ? { ...row, featured } : row);
          state = { ...state, selectedId: null };
          refreshLatest();
          return state;
        },
        async archive(id) {
          mutations.push({ type: 'archive', id });
          state.rows = state.rows.filter(row => row.id !== id);
          state = { ...state, selectedId: null };
          refreshLatest();
          return state;
        },
        async addVideo() { throw new Error('not used'); },
        leave() {},
        getLatestService() { return state.latestService; }
      };
      window.__recordingMutations = mutations;
      document.body.innerHTML = '<main id="recordings-test"></main>';
      const root = document.querySelector('#recordings-test');
      const feature = recordingsPage({ recordings: api, onHome() {}, onAccount() {} });
      root.innerHTML = feature.html;
      window.__recordingsCleanup = feature.mount(root);
    };

    window.__renderRecordingsCorrection('en');
  });

  await page.waitForSelector('[data-video-select="featured"]');
  await page.locator('[data-video-select="featured"]').click();
  await page.waitForSelector('[data-video-correction]');
  assert.match((await page.locator('[data-video-feature-toggle]').textContent()) || '', /Remove latest-service confirmation/);
  assert.match((await page.locator('[data-video-archive]').textContent()) || '', /Hide video/);
  await assertMobileGeometry('en-featured');

  await page.locator('[data-video-feature-toggle]').click();
  await page.waitForFunction(() => window.__recordingMutations.length === 1);
  assert.deepEqual(await page.evaluate(() => window.__recordingMutations[0]), { type: 'featured', id: 'featured', featured: false });
  assert.match((await page.locator('[data-video-message]').textContent()) || '', /Latest-service confirmation updated/);

  await page.locator('[data-video-select="ordinary"]').click();
  assert.match((await page.locator('[data-video-feature-toggle]').textContent()) || '', /Confirm for latest service/);
  await page.locator('[data-video-feature-toggle]').click();
  await page.waitForFunction(() => window.__recordingMutations.length === 2);
  assert.deepEqual(await page.evaluate(() => window.__recordingMutations[1]), { type: 'featured', id: 'ordinary', featured: true });

  await page.locator('[data-video-select="ordinary"]').click();
  await page.locator('[data-video-archive]').click();
  await page.waitForFunction(() => window.__recordingMutations.length === 3);
  assert.deepEqual(await page.evaluate(() => window.__recordingMutations[2]), { type: 'archive', id: 'ordinary' });
  assert.equal(await page.locator('[data-video-select="ordinary"]').count(), 0, 'archived video must leave the active list');
  assert.match((await page.locator('[data-video-message]').textContent()) || '', /Video hidden from the active list/);

  await page.evaluate(() => window.__renderRecordingsCorrection('tl'));
  await page.waitForSelector('[data-video-select="featured"]');
  await page.locator('[data-video-select="featured"]').click();
  assert.match((await page.locator('[data-video-feature-toggle]').textContent()) || '', /Alisin ang kumpirmasyon sa latest service/);
  assert.match((await page.locator('[data-video-archive]').textContent()) || '', /Itago ang video/);
  assert.match((await page.locator('[data-video-correction]').textContent()) || '', /server permissions/i);
  await assertMobileGeometry('tl-featured');

  assert.deepEqual(pageErrors, [], `Recordings correction browser emitted page errors: ${pageErrors.join(' | ')}`);
  console.log('BROWSER-AUTO PASS: Recordings latest-service correction EN/TL, feature toggle, archive, 390px overflow');
} finally {
  await browser.close();
}

async function assertMobileGeometry(label) {
  const geometry = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('[data-video-correction] button')];
    return {
      innerWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      heights: buttons.map(button => button.getBoundingClientRect().height)
    };
  });
  assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, `${label} overflows at 390px: ${geometry.scrollWidth} > ${geometry.innerWidth}`);
  geometry.heights.forEach((height, index) => assert.ok(height >= 44, `${label} correction button ${index + 1} is too small: ${height}px`));
}
