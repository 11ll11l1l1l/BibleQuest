import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const failures = [];
page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
page.on('console', message => { if (message.type() === 'error') failures.push(`console: ${message.text()}`); });

try {
  await page.goto(`${BASE}#/reader`, { waitUntil: 'networkidle' });
  await page.locator('[data-reader-page] h1', { hasText: 'Bible Reader' }).waitFor();
  await page.locator('[data-reader-book]').selectOption('JHN');
  await page.locator('[data-reader-chapter]').selectOption('3');
  await page.locator('[data-reader-translation]').selectOption('nlt');
  await page.locator('[data-licensed-reader]').waitFor();

  assert(await page.locator('[data-reader-translation]').inputValue() === 'nlt', 'NLT must be selectable in the main Reader translation picker.');
  assert(await page.locator('[data-verse]').count() === 0, 'NLT licensed mode must not render redistributed verse text.');
  assert(await page.locator('[data-reader-mark]').count() === 0, 'NLT licensed mode must not expose Mark read for unseen external text.');
  assert(await page.locator('[data-reader-search]').count() === 0, 'NLT licensed mode must not expose in-app NLT text search.');
  assert(await page.locator('[data-licensed-search-note]').isVisible(), 'NLT mode must explain that search remains in the licensed reader.');

  const sourceText = await page.locator('.bq-reader-source').textContent();
  assert(sourceText.includes('New Living Translation') && sourceText.includes('Copyrighted translation') && sourceText.includes('Tyndale House Publishers'), 'NLT source/license attribution is incomplete.');
  const panelText = await page.locator('[data-licensed-reader]').textContent();
  assert(panelText.includes('does not redistribute its full text') && panelText.includes('private translation API key'), 'NLT copyright-safe handoff explanation is incomplete.');

  const link = await page.locator('[data-nlt-open]').evaluate(node => ({ href: node.href, target: node.target, rel: node.rel, height: node.getBoundingClientRect().height }));
  const url = new URL(link.href);
  assert(url.hostname === 'www.biblegateway.com' && url.searchParams.get('search') === 'John 3' && url.searchParams.get('version') === 'NLT', 'NLT external handoff must target the exact selected passage and NLT version.');
  assert(link.target === '_blank' && link.rel.includes('noopener') && link.rel.includes('noreferrer'), 'NLT external link must return safely without replacing BibleQuest.');
  assert(link.height >= 44, 'NLT external handoff must be at least 44px high on mobile.');

  await page.locator('[data-reader-next]').click();
  await page.locator('[data-licensed-reader] h2', { hasText: 'John 4' }).waitFor();
  const nextHref = await page.locator('[data-nlt-open]').getAttribute('href');
  const nextUrl = new URL(nextHref, BASE);
  assert(nextUrl.searchParams.get('search') === 'John 4', 'NLT Next must update the external passage to John 4.');

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-licensed-reader] h2', { hasText: 'John 4' }).waitFor();
  assert(await page.locator('[data-reader-translation]').inputValue() === 'nlt' && await page.locator('[data-reader-book]').inputValue() === 'JHN' && await page.locator('[data-reader-chapter]').inputValue() === '4', 'NLT translation/book/chapter must survive reload.');

  await page.locator('[data-reader-prev]').click();
  await page.locator('[data-licensed-reader] h2', { hasText: 'John 3' }).waitFor();
  await page.locator('[data-reader-book]').selectOption('GEN');
  await page.locator('[data-licensed-reader] h2', { hasText: 'Genesis 1' }).waitFor();
  const genesisUrl = new URL(await page.locator('[data-nlt-open]').getAttribute('href'), BASE);
  assert(genesisUrl.searchParams.get('search') === 'Genesis 1', 'Changing books in NLT mode must update the exact licensed-reader passage.');

  const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('biblequest.v3.progress-state') || '{}'));
  assert((progress.xp || 0) === 0 && (progress.counters?.chaptersRead || 0) === 0, 'Browsing NLT external passages must not invent XP or chapter-read progress.');

  await page.locator('[data-reader-translation]').selectOption('bsb');
  await page.locator('[data-verse="1"]').waitFor();
  assert(await page.locator('[data-licensed-reader]').count() === 0, 'Switching back to BSB must restore the normal in-app Scripture Reader.');

  const metrics = await page.evaluate(() => ({ innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  assert(metrics.scrollWidth <= metrics.innerWidth + 1, `NLT licensed Reader caused horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(failures.length === 0, `NLT licensed Reader regression saw runtime errors: ${failures.join(' | ')}`);
  console.log('BibleQuest v3 NLT licensed-link mobile browser regression passed.');
} finally {
  await browser.close();
}
