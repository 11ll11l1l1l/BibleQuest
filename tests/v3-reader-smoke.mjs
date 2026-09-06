import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function desktopFlow() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('[data-route-link="learn"]').click();
  await page.waitForURL(/#\/learn$/);
  await page.locator('h1', { hasText: 'Learn' }).waitFor();
  await page.locator('[data-open-reader]').click();
  await page.waitForURL(/#\/reader$/);
  await page.locator('[data-reader-page] h1', { hasText: 'Bible Reader' }).waitFor();

  await page.locator('[data-reader-book]').selectOption('GEN');
  await page.locator('[data-verse="1"]').waitFor();
  assert((await page.locator('[data-verse="1"]').textContent()).includes('In the beginning God created the heavens and the earth.'), 'BSB Genesis 1:1 did not render from the local pack.');

  await page.locator('[data-verse="1"]').click();
  const dialog = page.locator('[data-verse-dialog]');
  await dialog.waitFor({ state: 'visible' });
  assert(await page.locator('[data-verse-dialog]').count() === 1, 'Verse Peek created more than one dialog.');
  assert((await dialog.textContent()).includes('Genesis 1:1'), 'Verse Peek reference is wrong.');
  await page.locator('[data-verse-close]').click();
  await page.locator('[data-verse="1"]').click();
  await dialog.waitFor({ state: 'visible' });
  assert(await page.locator('[data-verse-dialog]').count() === 1, 'Repeated Verse Peek duplicated the overlay.');
  await page.locator('[data-verse-close]').click();

  const external = await page.locator('[data-external-reader]').evaluateAll(nodes => nodes.map(node => ({ id: node.dataset.externalReader, href: node.href, target: node.target, rel: node.rel })));
  assert(external.length === 4, 'External reader/tool link set is incomplete.');
  assert(external.every(item => item.target === '_blank' && item.rel.includes('noopener') && item.rel.includes('noreferrer')), 'External reader links must open safely without replacing BibleQuest.');
  assert(external.find(item => item.id === 'esv')?.href.includes('esv.org/verses/Genesis+1'), 'ESV external passage link is incorrect.');
  assert(external.find(item => item.id === 'niv')?.href.includes('version=NIV'), 'NIV external passage link is incorrect.');
  assert(external.find(item => item.id === 'amp')?.href.includes('version=AMP'), 'AMP external passage link is incorrect.');
  assert(decodeURIComponent(external.find(item => item.id === 'step')?.href || '').includes('reference=Gen.1'), 'STEP external passage link is incorrect.');

  await page.locator('[data-reader-translation]').selectOption('tl');
  await page.locator('[data-verse="1"]').waitFor();
  assert((await page.locator('[data-verse="1"]').textContent()).includes('Noong simula nilikha ng Diyos ang langit at ang lupa.'), 'Tagalog Genesis 1:1 did not render.');
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-reader-page] h1', { hasText: 'Bible Reader' }).waitFor();
  await page.locator('[data-verse="1"]').waitFor();
  assert(await page.locator('[data-reader-translation]').inputValue() === 'tl' && await page.locator('[data-reader-book]').inputValue() === 'GEN' && await page.locator('[data-reader-chapter]').inputValue() === '1', 'Reader translation/book/chapter did not survive reload.');

  await page.locator('[data-reader-mark]').click();
  assert((await page.locator('[data-reader-mark]').textContent()).includes('Marked read'), 'Mark read did not update state.');
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-reader-mark]', { hasText: 'Marked read' }).waitFor();

  await page.locator('[data-reader-translation]').selectOption('bsb');
  await page.locator('[data-reader-book]').selectOption('GEN');
  await page.locator('[data-reader-chapter]').selectOption('50');
  await page.locator('[data-reader-next]').click();
  assert(await page.locator('[data-reader-book]').inputValue() === 'EXO' && await page.locator('[data-reader-chapter]').inputValue() === '1', 'Next navigation did not cross Genesis → Exodus.');
  await page.locator('[data-reader-prev]').click();
  assert(await page.locator('[data-reader-book]').inputValue() === 'GEN' && await page.locator('[data-reader-chapter]').inputValue() === '50', 'Previous navigation did not cross Exodus → Genesis.');

  await page.locator('[data-reader-book]').selectOption('GEN');
  let search = page.locator('[data-reader-search] input[name="query"]');
  await search.fill('ab');
  await page.locator('[data-reader-search] button[type="submit"]').click();
  assert(await search.evaluate(input => !input.checkValidity()), 'Short search must remain invalid at the browser form boundary.');
  assert(page.url().endsWith('#/reader'), 'Invalid search must not navigate away from the reader.');
  await search.fill('John 3:16');
  await page.locator('[data-reader-search] button[type="submit"]').click();
  await page.locator('[data-search-result="0"]').waitFor();
  assert((await page.locator('[data-search-result="0"] b').textContent()).trim() === 'John 3:16', 'Reference search did not return John 3:16.');
  await page.locator('[data-search-result="0"]').click();
  await page.locator('[data-verse="16"].is-highlighted').waitFor();
  assert(await page.locator('[data-reader-book]').inputValue() === 'JHN' && await page.locator('[data-reader-chapter]').inputValue() === '3', 'Search result navigation did not open John 3.');

  search = page.locator('[data-reader-search] input[name="query"]');
  await search.fill('God');
  await page.locator('[data-reader-search] button[type="submit"]').click();
  await page.locator('[data-search-result="0"]').waitFor();
  assert(await page.locator('[data-search-result]').count() > 0, 'Text search returned no bundled results.');
  await page.close();
}

async function mobileFlow() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}#/reader`, { waitUntil: 'networkidle' });
  await page.locator('[data-reader-page] h1', { hasText: 'Bible Reader' }).waitFor();
  await page.locator('[data-verse]').first().waitFor();
  const metrics = await page.evaluate(() => ({ innerWidth, scrollWidth: document.documentElement.scrollWidth, verseWidth: document.querySelector('[data-verse]')?.getBoundingClientRect().width || 0 }));
  assert(metrics.scrollWidth <= metrics.innerWidth + 1, `Reader mobile horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.verseWidth > 300, 'Reader verses are too narrow on mobile.');
  await page.close();
}

try {
  await desktopFlow();
  await mobileFlow();
  console.log('BibleQuest v3 reader browser regression passed.');
} finally {
  await browser.close();
}
