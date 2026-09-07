import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function verifiedFlow() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('pageerror', error => errors.push(`page: ${error.message}`));
  await page.goto(`${BASE}#/reader`, { waitUntil: 'networkidle' });
  await page.locator('[data-reader-page] h1', { hasText: 'Bible Reader' }).waitFor();
  await page.locator('[data-reader-book]').selectOption('JHN');
  await page.locator('[data-reader-chapter]').selectOption('3');
  await page.locator('[data-verse="16"]').waitFor();
  await page.locator('[data-verse="16"]').click();
  await page.locator('[data-verse-dialog]').waitFor({ state: 'visible' });
  await page.locator('[data-peek-context]').click();
  const dialog = page.locator('[data-context-dialog]');
  await dialog.waitFor({ state: 'visible' });
  await dialog.locator('h1', { hasText: 'Look closer' }).waitFor();
  await dialog.locator('[data-context-verse]').waitFor();
  assert(await dialog.locator('[data-context-book]').inputValue() === 'JHN', 'Context Lab did not inherit the Reader book.');
  assert(await dialog.locator('[data-context-chapter]').inputValue() === '3', 'Context Lab did not inherit the Reader chapter.');
  assert(await dialog.locator('[data-context-verse]').inputValue() === '16', 'Verse Peek did not hand its selected verse to Context Lab.');
  const text = await dialog.textContent();
  assert(text.includes('BSB · John 3:16'), 'Context Lab did not retain the BSB Scripture reference.');
  assert(text.includes('Three rules for a safer word study') && text.includes('Do not build doctrine from etymology or one Strong’s entry alone.'), 'Context Lab safety/context guidance is missing.');
  assert(text.includes('STEPBible') && text.includes('CC BY 4.0'), 'Context Lab source/license attribution is missing.');
  assert(await dialog.locator('.bq-context-lexeme').count() > 0, 'John 3:16 did not expose lexical entries from the retained context pack.');
  assert((await dialog.locator('.bq-context-lexeme').first().textContent()).includes('Greek'), 'John 3:16 lexical entries are not identified as Greek.');
  assert(await dialog.locator('[data-context-jump]').count() === 2, 'Context Lab must expose previous/next surrounding verses for John 3:16.');
  assert(await dialog.locator('.bq-context-usage').count() > 0, 'Context Lab must expose in-book lexical usage details.');
  await dialog.locator('.bq-context-usage').first().locator('summary').click();
  const usageButtons = dialog.locator('[data-context-ref]');
  assert(await usageButtons.count() > 0, 'A tagged lexical entry must expose at least one in-book usage reference.');
  const priorReference = (await dialog.locator('.bq-context-scripture small').textContent()).trim();
  await usageButtons.first().click();
  await dialog.locator('.bq-context-scripture small').waitFor();
  const afterReference = (await dialog.locator('.bq-context-scripture small').textContent()).trim();
  assert(/^BSB · John \d+:\d+$/.test(afterReference), 'Usage navigation must remain inside valid John Scripture context.');
  assert(afterReference.length > 0 && priorReference.length > 0, 'Usage navigation lost the Scripture reference.');
  const controls = await dialog.locator('button,select,a').evaluateAll(nodes => nodes.map(node => ({ height: node.getBoundingClientRect().height, width: node.getBoundingClientRect().width })));
  assert(controls.filter(item => item.width > 0).every(item => item.height >= 43.5), 'Context Lab interactive controls must retain approximately 44px touch targets.');
  const metrics = await page.evaluate(() => ({ innerWidth, scrollWidth: document.documentElement.scrollWidth, dialogWidth: document.querySelector('[data-context-dialog]')?.getBoundingClientRect().width || 0 }));
  assert(metrics.scrollWidth <= metrics.innerWidth + 1, `Context Lab caused mobile horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.dialogWidth <= metrics.innerWidth + 1, 'Context Lab dialog exceeds the mobile viewport.');
  await dialog.locator('[data-context-close]').click();
  assert(!await dialog.isVisible(), 'Context Lab did not close cleanly.');
  assert(await page.locator('[data-reader-book]').inputValue() === 'JHN' && await page.locator('[data-reader-chapter]').inputValue() === '3', 'Context Lab navigation must not mutate the main Reader passage.');
  await page.locator('[data-reader-context]').click();
  await dialog.waitFor({ state: 'visible' });
  assert(await dialog.locator('[data-context-verse]').inputValue() === '1', 'Reader-level Context Lab should start at verse 1 of the current chapter, matching retained behavior.');
  await dialog.locator('[data-context-close]').click();
  assert(errors.length === 0, `Context Lab emitted browser errors: ${errors.join(' | ')}`);
  await page.close();
}

async function unavailableFlow() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/data/packs/context/JHN.json', route => route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }));
  await page.goto(`${BASE}#/reader`, { waitUntil: 'networkidle' });
  await page.locator('[data-reader-book]').selectOption('JHN');
  await page.locator('[data-reader-chapter]').selectOption('3');
  await page.locator('[data-reader-context]').click();
  const dialog = page.locator('[data-context-dialog]');
  await dialog.waitFor({ state: 'visible' });
  await dialog.getByText('Context pack is unavailable.', { exact: true }).waitFor();
  assert((await dialog.textContent()).includes('Original-language context pack for John is unavailable.'), 'Unavailable context pack did not render a controlled Reader-safe message.');
  assert(page.url().endsWith('#/reader'), 'Unavailable lexical data must not navigate away from Reader.');
  assert(errors.length === 0, `Unavailable-data flow raised a page error: ${errors.join(' | ')}`);
  await page.close();
}

try {
  await verifiedFlow();
  await unavailableFlow();
  console.log('BibleQuest v3 STEPBible lexical/context browser regression passed.');
} finally {
  await browser.close();
}
