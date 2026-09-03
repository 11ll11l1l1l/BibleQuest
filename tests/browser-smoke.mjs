import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await page.waitForSelector('.brand');
  const homeText = await page.locator('body').innerText();
  assert.match(homeText, /Daily 5/);
  assert.match(homeText, /Tuloy ang learning|Bible journey mo|Taglish/);
  assert.match(homeText, /Berean Standard Bible/);
  assert.match(homeText, /Grow Together/);

  const smart = page.locator('[data-open-review]');
  await smart.waitFor({ state: 'visible' });
  await smart.click();
  await page.waitForSelector('.open-review-overlay.open');
  await page.waitForSelector('[data-open-review-reveal]', { timeout: 15000 });
  const firstQuestion = await page.locator('.open-review-card h1').innerText();
  assert.ok(firstQuestion.length > 8, 'Open review should show a real source question');
  await page.locator('[data-open-review-reveal]').click();
  await page.waitForSelector('[data-open-review-rate="got"]');
  assert.match(await page.locator('.open-answer').innerText(), /SOURCE ANSWER|REFERENCE ANSWER/);
  assert.match(await page.locator('.open-review-card').innerText(), /Translation Questions v90/);
  await page.locator('[data-open-review-rate="got"]').click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('biblequest_open_review_v1') || '{}'));
  assert.ok(Object.keys(stored.items || {}).length >= 1, 'Open review should persist spaced-review evidence');
  const closeReview = page.locator('[data-open-review-close]').first();
  if (await closeReview.count()) await closeReview.click();

  const who = page.locator('[data-who-said]');
  await who.waitFor({ state: 'visible' });
  await who.click();
  await page.waitForSelector('[data-speaker-answer]', { timeout: 15000 });
  assert.match(await page.locator('.extra-panel').innerText(), /BSB|Berean Standard Bible/);
  assert.ok((await page.locator('.speaker-verse').innerText()).length > 12, 'Who Said It should display actual Bible text');
  await page.locator('[data-extra-close]').click();

  const storyNext = page.locator('[data-story-next]');
  await storyNext.waitFor({ state: 'visible' });
  await storyNext.click();
  await page.waitForSelector('[data-story-answer]', { timeout: 15000 });
  assert.match(await page.locator('.extra-panel').innerText(), /OBS|Open Bible Stories/);
  await page.locator('[data-extra-close]').click();

  const couples = page.locator('[data-couples-open]');
  await couples.waitFor({ state: 'visible' });
  await couples.click();
  await page.waitForSelector('.couples-layer:not(.hidden)');
  assert.match(await page.locator('.couples-panel').innerText(), /Hindi contest ang marriage/);
  await page.locator('[data-couples-mode="card"]').click();
  await page.waitForSelector('.couples-card');
  assert.match(await page.locator('.couples-card').innerText(), /BSB|READ TOGETHER/);
  assert.match(await page.locator('.couples-card').innerText(), /Ang narinig ko ay/);
  await page.locator('[data-couples-close]').click();

  const reader = page.locator('[data-reader-open]');
  await reader.waitFor({ state: 'visible' });
  await reader.click();
  await page.waitForSelector('[data-reader-book="GEN"]', { timeout: 15000 });
  await page.locator('[data-reader-book="GEN"]').first().click();
  await page.waitForSelector('.verse-list', { timeout: 15000 });
  assert.match(await page.locator('.reader-panel').innerText(), /BSB|Berean Standard Bible/);
  assert.ok((await page.locator('.verse-list').innerText()).length > 100, 'Reader should display Bible text');
  await page.locator('[data-reader-close]').first().click();

  console.log('BibleQuest expanded browser smoke test passed');
} finally {
  await browser.close();
}
