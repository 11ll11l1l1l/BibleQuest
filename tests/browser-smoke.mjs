import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.waitForSelector('.modern-home');

  assert.equal(await page.locator('.modern-hub').count(), 4, 'Home should expose exactly four primary hubs');
  assert.match(await page.locator('.modern-home').innerText(), /Daily 5/);
  assert.match(await page.locator('.modern-home').innerText(), /Play/);
  assert.match(await page.locator('.modern-home').innerText(), /Read/);
  assert.match(await page.locator('.modern-home').innerText(), /Grow/);
  assert.match(await page.locator('.modern-home').innerText(), /Together/);
  const oldStackDisplay = await page.locator('.feature-stack').evaluate(el => getComputedStyle(el).display);
  assert.equal(oldStackDisplay, 'none', 'Legacy feature catalog should be visually hidden on modern Home');

  await page.locator('[data-modern-sources]').click();
  await page.waitForSelector('.modern-sheet:not(.hidden)');
  assert.match(await page.locator('.modern-source-list').innerText(), /Berean Standard Bible/);
  assert.match(await page.locator('.modern-source-list').innerText(), /Open Bible Stories/);
  await page.locator('.modern-sheet-head [data-modern-close]').click();

  await page.locator('[data-modern-hub="play"]').click();
  await page.waitForSelector('.modern-sheet:not(.hidden)');
  assert.match(await page.locator('.modern-sheet-list').innerText(), /Who Said It/);
  await page.getByRole('button', { name: /Who Said It/ }).click();
  await page.waitForSelector('[data-speaker-answer]', { timeout: 15000 });
  assert.match(await page.locator('.extra-panel').innerText(), /BSB|Berean Standard Bible/);
  assert.ok((await page.locator('.speaker-verse').innerText()).length > 12, 'Who Said It should display actual Bible text');
  await page.locator('[data-extra-close]').click();

  await page.locator('[data-modern-review]').click();
  await page.waitForSelector('.open-review-overlay.open');
  await page.waitForSelector('[data-open-review-reveal]', { timeout: 15000 });
  const firstQuestion = await page.locator('.open-review-card h1').innerText();
  assert.ok(firstQuestion.length > 8, 'Open review should show a real source question');
  await page.locator('[data-open-review-reveal]').click();
  await page.waitForSelector('[data-open-review-rate="got"]');
  assert.match(await page.locator('.open-review-card').innerText(), /Translation Questions v90/);
  await page.locator('[data-open-review-rate="got"]').click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('biblequest_open_review_v1') || '{}'));
  assert.ok(Object.keys(stored.items || {}).length >= 1, 'Open review should persist spaced-review evidence');
  const closeReview = page.locator('[data-open-review-close]').first();
  if (await closeReview.count()) await closeReview.click();

  await page.locator('[data-modern-hub="read"]').click();
  await page.getByRole('button', { name: /Bible Reader/ }).click();
  await page.waitForSelector('[data-reader-book="GEN"]', { timeout: 15000 });
  await page.locator('[data-reader-book="GEN"]').first().click();
  await page.waitForSelector('.verse-list', { timeout: 15000 });
  assert.match(await page.locator('.reader-panel').innerText(), /BSB|Berean Standard Bible/);
  assert.ok((await page.locator('.verse-list').innerText()).length > 100, 'Reader should display Bible text');
  await page.locator('[data-reader-close]').first().click();

  await page.locator('[data-modern-hub="together"]').click();
  await page.getByRole('button', { name: /Grow Together/ }).click();
  await page.waitForSelector('.couples-layer:not(.hidden)');
  assert.match(await page.locator('.couples-panel').innerText(), /Hindi contest ang marriage/);
  assert.match(await page.locator('.couples-panel').innerText(), /Listen First/);
  await page.locator('[data-couples-close]').click();

  console.log('BibleQuest streamlined mobile browser smoke test passed');
} finally {
  await browser.close();
}
