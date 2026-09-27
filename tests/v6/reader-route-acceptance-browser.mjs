import { chromium } from 'playwright';

const BASE = process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173';
const WIDTHS = [320, 360, 390, 412, 430];
const browser = await chromium.launch({ headless: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function verifyWidth(width) {
  const page = await browser.newPage({
    viewport: { width, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));

  await page.goto(`${BASE}/#/reader`, { waitUntil: 'networkidle' });
  await page.locator('[data-reader-page] h1', { hasText: 'Bible Reader' }).waitFor();
  await page.locator('[data-verse]').first().waitFor();

  assert(await page.getByLabel('Translation').count() === 1, `${width}px Reader translation control lacks an accessible label.`);
  assert(await page.getByLabel('Book').count() === 1, `${width}px Reader book control lacks an accessible label.`);
  assert(await page.getByLabel('Chapter').count() === 1, `${width}px Reader chapter control lacks an accessible label.`);
  assert(await page.getByLabel('Search this translation').count() === 1, `${width}px Reader search input lacks an accessible label.`);

  const metrics = await page.evaluate(() => {
    const rect = (selector) => document.querySelector(selector)?.getBoundingClientRect() || null;
    const height = (selector) => rect(selector)?.height || 0;
    return {
      innerWidth,
      htmlScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      layoutRight: rect('.bq-reader-layout')?.right || 0,
      scriptureRight: rect('.bq-scripture-panel')?.right || 0,
      translationHeight: height('[data-reader-translation]'),
      bookHeight: height('[data-reader-book]'),
      chapterHeight: height('[data-reader-chapter]'),
      previousHeight: height('[data-reader-prev]'),
      nextHeight: height('[data-reader-next]'),
      searchHeight: height('[data-reader-search] button[type="submit"]'),
      firstVerseHeight: rect('[data-verse]')?.height || 0,
      contextLabel: document.querySelector('[data-context-dialog]')?.getAttribute('aria-label') || '',
    };
  });

  assert(metrics.htmlScrollWidth <= width + 1 && metrics.bodyScrollWidth <= width + 1,
    `${width}px Reader has horizontal overflow: html=${metrics.htmlScrollWidth}, body=${metrics.bodyScrollWidth}.`);
  assert(metrics.layoutRight <= width + 1 && metrics.scriptureRight <= width + 1,
    `${width}px Reader content exceeds the viewport.`);
  for (const [name, value] of Object.entries({
    translation: metrics.translationHeight,
    book: metrics.bookHeight,
    chapter: metrics.chapterHeight,
    previous: metrics.previousHeight,
    next: metrics.nextHeight,
    search: metrics.searchHeight,
  })) {
    assert(value >= 44, `${width}px Reader ${name} control is below the 44px practical target: ${value}px.`);
  }
  assert(metrics.firstVerseHeight >= 44, `${width}px Reader verse target is below 44px: ${metrics.firstVerseHeight}px.`);
  assert(metrics.contextLabel === 'Hebrew and Greek Context Lab', `${width}px Context Lab dialog lacks an accessible name.`);

  const verse = page.locator('[data-verse]').first();
  await verse.focus();
  await page.keyboard.press('Enter');
  const dialog = page.locator('[data-verse-dialog]');
  await dialog.waitFor({ state: 'visible' });
  assert(await dialog.getAttribute('aria-labelledby') === 'bq-verse-peek-title',
    `${width}px Verse Peek dialog is not labelled by its Scripture reference.`);
  const heading = page.locator('#bq-verse-peek-title');
  assert((await heading.textContent())?.trim(), `${width}px Verse Peek accessible heading is blank.`);
  assert(await page.locator('[data-verse-close]').count() === 1, `${width}px Verse Peek close action is missing.`);
  await page.locator('[data-verse-close]').click();
  await dialog.waitFor({ state: 'hidden' });

  if (width === 390) {
    const search = page.getByLabel('Search this translation');
    await search.fill('John 3:16');
    await page.locator('[data-reader-search] button[type="submit"]').click();
    const result = page.locator('[data-search-result="0"]');
    await result.waitFor();
    assert((await result.locator('b').textContent())?.trim() === 'John 3:16',
      'Reader reference search parity failed for John 3:16.');
    assert(await page.locator('[aria-labelledby="bq-reader-search-results-title"]').count() === 1,
      'Reader Search results region lacks its accessible heading relationship.');
    await result.click();
    await page.locator('[data-verse="16"].is-highlighted').waitFor();
    assert(await page.locator('[data-reader-book]').inputValue() === 'JHN'
      && await page.locator('[data-reader-chapter]').inputValue() === '3',
    'Reader Search-result navigation did not preserve existing John 3:16 behavior.');
  }

  assert(errors.length === 0, `${width}px Reader acceptance produced errors: ${errors.join(' | ')}`);
  await page.close();
}

try {
  for (const width of WIDTHS) await verifyWidth(width);
  console.log(`V6 Reader parity/accessibility/mobile acceptance passed at ${WIDTHS.join('/')} px.`);
} finally {
  await browser.close();
}
