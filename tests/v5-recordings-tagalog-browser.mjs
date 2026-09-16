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
    const [{ recordingsPage }, { localization }] = await Promise.all([import('/src/features/recordings/index.js'), import('/src/app/localization.js')]);
    localization.setLocale('tl');
    const rows = [
      { id: 'recording-stable-123', title: 'Runtime Worship Title', description: 'Runtime description remains source data.', featured: true },
      { id: 'recording-study-456', title: 'Pag-aaral ng Roma', description: 'Grace teaching for the loaded congregation.', featured: false },
      { id: 'recording-youth-789', title: 'Youth Fellowship', description: 'Friday gathering.', featured: true }
    ];
    let state = { status: 'ready', rows, selectedId: null };
    let loadCount = 0;
    const recordings = { load: async () => { loadCount += 1; return state; }, getState: () => state, select: (id, frameHost) => { state = { ...state, selectedId: id }; frameHost.textContent = 'runtime-player-host'; }, addVideo: async () => state, leave: () => {} };
    document.body.innerHTML = '<main id="recordings-root"></main>';
    const root = document.querySelector('#recordings-root');
    const feature = recordingsPage({ recordings, onHome() {}, onAccount() {} });
    root.innerHTML = feature.html;
    feature.mount(root);
    window.__bqRecordingsTitle = feature.title;
    window.__bqRecordingsLoadCount = () => loadCount;
  });
  await page.waitForSelector('[data-video-select]');
  assert.equal(await page.evaluate(() => window.__bqRecordingsTitle), 'Mga Video');
  assert.equal((await page.locator('.bq-recordings-head h1').textContent())?.trim(), 'Mga video para sa pagsamba at pag-aaral ng Biblia');
  assert.equal((await page.locator('[data-video-curator-toggle]').textContent())?.trim(), 'Magdagdag ng video');
  assert.equal(await page.getByText('Itinatampok', { exact: true }).count(), 1);
  assert.equal(await page.getByText('Runtime Worship Title', { exact: true }).count(), 1);
  assert.equal(await page.getByText('Runtime description remains source data.', { exact: true }).count(), 1);
  assert.equal((await page.locator('[data-recordings-filter-status]').textContent())?.trim(), '3 video ang ipinapakita');
  await page.locator('[data-video-select]').first().click();
  assert.equal((await page.locator('[data-recording-now] h2').textContent())?.trim(), 'Runtime Worship Title');
  await page.locator('[data-video-curator-toggle]').click();
  assert.equal(await page.getByText('Pamagat', { exact: true }).count(), 1);
  assert.equal(await page.getByText('Paglalarawan (opsyonal)', { exact: true }).count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Magdagdag ng video', exact: true }).count(), 1);
  await page.locator('[data-recordings-search]').fill('grace');
  assert.equal(await page.locator('[data-video-select]').count(), 1);
  assert.equal(await page.getByText('Pag-aaral ng Roma', { exact: true }).count(), 1);
  assert.equal((await page.locator('[data-recordings-filter-status]').textContent())?.trim(), '1 video ang ipinapakita');
  assert.equal(await page.locator('[data-recordings-search]').evaluate(node => node === document.activeElement), true, 'search focus should survive client-side list filtering');
  await page.locator('[data-recordings-feature-filter]').selectOption('featured');
  assert.equal(await page.locator('[data-video-select]').count(), 0);
  assert.equal(await page.getByText('Walang katugmang video', { exact: true }).count(), 1);
  await page.locator('[data-recordings-search]').fill('');
  assert.equal(await page.locator('[data-video-select]').count(), 2);
  assert.equal(await page.locator('[data-video-select]', { hasText: 'Runtime Worship Title' }).count(), 1);
  assert.equal(await page.locator('[data-video-select]', { hasText: 'Youth Fellowship' }).count(), 1);
  assert.equal(await page.evaluate(() => window.__bqRecordingsLoadCount()), 1, 'client-side filtering must not reload Recordings');
  for (const leak of ['Worship and Bible study videos','Choose a video','No videos yet','Back home','Add video']) assert.equal(await page.getByText(leak, { exact: true }).count(), 0, `Videos exposes migrated English UI text: ${leak}`);
  const geometry = await page.evaluate(() => ({ innerWidth: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, minControlHeight: Math.min(...[...document.querySelectorAll('[data-video-select], [data-video-curator-toggle], [data-recordings-home], [data-video-add-form] button, [data-recordings-search], [data-recordings-feature-filter]')].map(node => node.getBoundingClientRect().height).filter(Boolean)) }));
  assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, `Tagalog Videos overflows at 390px: ${geometry.scrollWidth} > ${geometry.innerWidth}`);
  assert.ok(geometry.minControlHeight >= 44, `Videos touch target regressed below 44px: ${geometry.minControlHeight}`);
  assert.deepEqual(pageErrors, [], `Browser page errors occurred: ${pageErrors.join(' | ')}`);
  console.log('BROWSER-AUTO PASS: Tagalog Videos client-side search/featured filter, runtime metadata preservation, 390px touch/overflow');
} finally { await browser.close(); }
