import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { localization } from '../../src/app/localization.js';

const baseUrl = process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });

// Real signed-out built routes: no injected service, fabricated publication or
// authenticated-content claim. Reviewed live content remains separate evidence.
try {
  for (const locale of ['en', 'tl', 'ceb']) {
    for (const width of [320, 390, 430]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      await context.addInitScript(value => localStorage.setItem('biblequest.v3.locale', JSON.stringify(value)), locale);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${baseUrl}/#/library?query=prayer&contentType=book`, { waitUntil: 'networkidle' });
      await page.locator('[data-library-page]').waitFor();
      await page.waitForFunction(() => {
        const state = document.querySelector('[data-library-status]')?.getAttribute('data-library-state');
        return state && state !== 'loading';
      });
      const heading = await page.locator('[data-library-page] h1').textContent();
      assert.equal(heading, localization.t('v7.library.title', { locale }), `${locale}: translated heading`);
      assert.equal(await page.locator('label[for="bq-library-query"]').count(), 1);
      assert.equal(await page.locator('label[for="bq-library-type"]').count(), 1);
      const query = page.locator('#bq-library-query');
      assert.equal(await query.inputValue(), 'prayer');
      assert.equal(await page.locator('#bq-library-type').inputValue(), 'book');
      await query.focus();
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'bq-library-type');
      for (const type of ['book', 'devotional', 'past_teaching']) {
        await page.locator('#bq-library-type').selectOption(type);
        await query.fill('prayer');
        await query.press('Enter');
        await page.waitForFunction(() => document.querySelector('[data-library-status]')?.getAttribute('data-library-state') !== 'loading');
        assert.equal(await page.locator('#bq-library-type').inputValue(), type);
      }
      await page.locator('[data-library-clear]').click();
      assert.equal(await query.inputValue(), '');
      assert.equal(await page.locator('#bq-library-type').inputValue(), '');
      assert.ok(await page.locator('[data-library-status]').textContent());
      const widest = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
      assert.ok(widest <= width + 1, `${locale}/${width}: Library overflow ${widest}`);

      await page.goto(`${baseUrl}/#/library-item`, { waitUntil: 'networkidle' });
      await page.locator('[data-library-detail]').waitFor();
      assert.ok((await page.locator('[data-library-detail]').textContent()).trim());
      assert.equal(await page.locator('[data-library-detail] a[target="_blank"]').count(), 0);
      const back = page.locator('[data-library-back]');
      await back.focus();
      await page.keyboard.press('Enter');
      await page.locator('[data-library-page]').waitFor();
      assert.equal(await page.evaluate(() => location.hash.split('?')[0]), '#/library');
      assert.deepEqual(errors, [], `${locale}/${width}: browser errors`);
      await context.close();
    }
  }
} finally {
  await browser.close();
}
