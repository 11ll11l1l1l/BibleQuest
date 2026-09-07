import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const failures = [];
page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
page.on('console', message => { if (message.type() === 'error') failures.push(`console: ${message.text()}`); });

let breakGenesis = false;
let japaneseRequests = 0;
await page.route('https://api.getbible.net/v2/japkougo/**', async route => {
  japaneseRequests++;
  const url = new URL(route.request().url());
  const bits = url.pathname.split('/').filter(Boolean);
  const book = Number(bits.at(-2));
  const chapter = Number(String(bits.at(-1)).replace(/\.json$/, ''));
  if (breakGenesis && book === 1 && chapter === 1) {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ verses: [] }) });
  }
  if (book === 43 && chapter === 3) {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      book_name: 'ヨハネによる福音書',
      verses: [
        { verse: 16, text: '神はそのひとり子を賜わったほどに、この世を愛して下さった。' },
        { verse: 17, text: '神が御子を世につかわされたのは、世をさばくためではない。' }
      ]
    }) });
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ verses: [{ verse: 1, text: '日本語テスト本文' }] }) });
});

try {
  await page.goto(`${BASE}#/reader`, { waitUntil: 'networkidle' });
  await page.locator('[data-reader-page] h1', { hasText: 'Bible Reader' }).waitFor();
  await page.locator('[data-reader-chapter]').selectOption('3');
  await page.locator('[data-reader-translation]').selectOption('jko');
  await page.locator('[data-verse="16"]').waitFor();

  assert(await page.locator('[data-reader-translation]').inputValue() === 'jko', 'Japanese Kougo did not become the active Reader translation.');
  assert((await page.locator('[data-verse="16"]').textContent()).includes('神はそのひとり子を賜わったほどに、この世を愛して下さった。'), 'Japanese Kougo verse text did not render from the live source.');
  const sourceText = await page.locator('.bq-reader-source').textContent();
  assert(sourceText.includes('口語訳聖書 (1954/1955)') && sourceText.includes('GetBible') && sourceText.includes('moral rights remain') && sourceText.includes('without modification'), 'Japanese source/license/unchanged-text notice is incomplete.');
  assert(japaneseRequests === 1, `Expected one Japanese chapter request after first load, got ${japaneseRequests}.`);

  const beforeReload = japaneseRequests;
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-verse="16"]').waitFor();
  assert(await page.locator('[data-reader-translation]').inputValue() === 'jko' && await page.locator('[data-reader-book]').inputValue() === 'JHN' && await page.locator('[data-reader-chapter]').inputValue() === '3', 'Japanese translation/book/chapter did not persist across reload.');
  assert(japaneseRequests === beforeReload + 1, 'Reload should re-request the live Japanese chapter in the new page lifecycle.');

  const xpBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('biblequest.v3.progress-state') || '{}').xp || 0);
  assert(xpBefore === 0, 'Loading Japanese Scripture must not award XP.');

  breakGenesis = true;
  await page.locator('[data-reader-book]').selectOption('GEN');
  await page.locator('[data-jko-failure]').waitFor();
  assert((await page.locator('[data-jko-failure]').textContent()).includes('本文を推測したり別の訳で置き換えたりしません'), 'Japanese failure state does not explain the no-fabrication/no-silent-fallback rule.');
  assert(await page.locator('[data-reader-retry]').isVisible() && await page.locator('[data-reader-use-bsb]').isVisible(), 'Japanese failure state must offer Retry and explicit Use BSB actions.');
  const firstFailureRequests = japaneseRequests;
  await page.locator('[data-reader-retry]').click();
  await page.locator('[data-jko-failure]').waitFor();
  assert(japaneseRequests === firstFailureRequests + 1, 'Japanese Retry did not reattempt the live source after an invalid response.');

  const fallbackButtons = await page.locator('[data-reader-retry], [data-reader-use-bsb]').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
  assert(fallbackButtons.every(height => height >= 44), `Japanese recovery controls must remain touch-safe: ${fallbackButtons.join(', ')}.`);
  await page.locator('[data-reader-use-bsb]').click();
  await page.locator('[data-verse="1"]').waitFor();
  assert(await page.locator('[data-reader-translation]').inputValue() === 'bsb' && await page.locator('[data-reader-book]').inputValue() === 'GEN', 'Explicit Use BSB recovery did not switch through the existing Reader translation state.');
  assert((await page.locator('[data-verse="1"]').textContent()).includes('In the beginning God created the heavens and the earth.'), 'BSB fallback did not load the real bundled Genesis text.');

  const metrics = await page.evaluate(() => ({ innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert(metrics.scrollWidth <= metrics.innerWidth + 1, `Japanese Reader caused horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(failures.length === 0, `Japanese browser regression saw runtime errors: ${failures.join(' | ')}`);
  console.log('BibleQuest v3 Japanese Kougo mobile browser regression passed.');
} finally {
  await browser.close();
}
