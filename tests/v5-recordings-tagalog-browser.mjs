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
    const [{ recordingsPage }, { localization }] = await Promise.all([
      import('/src/features/recordings/index.js'),
      import('/src/app/localization.js')
    ]);
    localization.setLocale('tl');
    const row = {
      id: 'recording-stable-123',
      title: 'Runtime Worship Title',
      description: 'Runtime description remains source data.',
      featured: true
    };
    let state = { status: 'ready', rows: [row], selectedId: null };
    const recordings = {
      load: async () => state,
      getState: () => state,
      select: (id, frameHost) => {
        state = { ...state, selectedId: id };
        frameHost.textContent = 'runtime-player-host';
      },
      addVideo: async () => state,
      leave: () => {}
    };
    document.body.innerHTML = '<main id="recordings-root"></main>';
    const root = document.querySelector('#recordings-root');
    const feature = recordingsPage({ recordings, onHome() {}, onAccount() {} });
    root.innerHTML = feature.html;
    feature.mount(root);
    window.__bqRecordingsTitle = feature.title;
  });

  await page.waitForSelector('[data-video-select]');
  assert.equal(await page.evaluate(() => window.__bqRecordingsTitle), 'Mga Video');
  assert.equal((await page.locator('.bq-recordings-head h1').textContent())?.trim(), 'Mga video para sa pagsamba at pag-aaral ng Biblia');
  assert.equal((await page.locator('[data-video-curator-toggle]').textContent())?.trim(), 'Magdagdag ng video');
  assert.equal(await page.getByText('Itinatampok', { exact: true }).count(), 1);
  assert.equal(await page.getByText('Runtime Worship Title', { exact: true }).count(), 1, 'runtime video title must remain unchanged');
  assert.equal(await page.getByText('Runtime description remains source data.', { exact: true }).count(), 1, 'runtime video description must remain unchanged');

  await page.locator('[data-video-select]').click();
  assert.equal((await page.locator('[data-recording-now] h2').textContent())?.trim(), 'Runtime Worship Title', 'selected runtime title must remain unchanged');

  await page.locator('[data-video-curator-toggle]').click();
  assert.equal(await page.getByText('Pamagat', { exact: true }).count(), 1);
  assert.equal(await page.getByText('Paglalarawan (opsyonal)', { exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Magdagdag ng video', exact: true }).count(), 1);
  for (const leak of ['Worship and Bible study videos', 'Choose a video', 'No videos yet', 'Back home', 'Add video']) {
    assert.equal(await page.getByText(leak, { exact: true }).count(), 0, `Videos exposes migrated English UI text: ${leak}`);
  }

  const geometry = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    minButtonHeight: Math.min(...[...document.querySelectorAll('[data-video-select], [data-video-curator-toggle], [data-recordings-home], [data-video-add-form] button')]
      .map(node => node.getBoundingClientRect().height)
      .filter(Boolean))
  }));
  assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, `Tagalog Videos overflows at 390px: ${geometry.scrollWidth} > ${geometry.innerWidth}`);
  assert.ok(geometry.minButtonHeight >= 44, `Videos touch target regressed below 44px: ${geometry.minButtonHeight}`);
  assert.deepEqual(pageErrors, [], `Browser page errors occurred: ${pageErrors.join(' | ')}`);
  console.log('BROWSER-AUTO PASS: Tagalog Videos chrome, runtime metadata preservation, 390px touch/overflow');
} finally {
  await browser.close();
}
