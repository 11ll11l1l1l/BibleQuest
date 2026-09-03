import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.waitForSelector('.brand');
  assert.match(await page.locator('body').innerText(), /Daily 5/);

  const smart = page.locator('[data-open-review]');
  await smart.waitFor({ state: 'visible' });
  assert.match(await smart.innerText(), /Open Smart Review/);
  await smart.click();

  await page.waitForSelector('.open-review-overlay.open');
  await page.waitForSelector('[data-open-review-reveal]', { timeout: 15000 });
  const firstQuestion = await page.locator('.open-review-card h1').innerText();
  assert.ok(firstQuestion.length > 8, 'Open review should show a real question');
  await page.locator('[data-open-review-reveal]').click();
  await page.waitForSelector('[data-open-review-rate="got"]');
  const answerText = await page.locator('.open-answer').innerText();
  assert.match(answerText, /REFERENCE ANSWER/);
  await page.locator('[data-open-review-rate="got"]').click();

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('biblequest_open_review_v1') || '{}'));
  assert.ok(Object.keys(stored.items || {}).length >= 1, 'Open review should persist spaced-review evidence');

  const close = page.locator('[data-open-review-close]').first();
  if (await close.count()) await close.click();

  await page.locator('[data-action="decks"]').click();
  await page.waitForSelector('.deck-library');
  const libraryText = await page.locator('.deck-library').innerText();
  assert.match(libraryText, /Choose one book/);
  assert.match(libraryText, /Genesis/);
  assert.match(libraryText, /open questions/);

  await page.locator('[data-deck="GEN"]').click();
  await page.waitForSelector('.flashcard', { timeout: 15000 });
  assert.match(await page.locator('.flashcard').innerText(), /Genesis/);
  assert.match(await page.locator('.flashcard').innerText(), /Reveal answer/);

  console.log('BibleQuest browser smoke test passed');
} finally {
  await browser.close();
}
