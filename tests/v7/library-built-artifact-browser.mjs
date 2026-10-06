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
      await context.addInitScript(value => {
        if (localStorage.getItem('biblequest.v3.locale') === null) {
          localStorage.setItem('biblequest.v3.locale', JSON.stringify(value));
        }
        localStorage.setItem('biblequest.v3.accessibility-settings', JSON.stringify({ text: 'xlarge', contrast: 'strong', motion: 'reduce' }));
      }, locale);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${baseUrl}/#/learn`, { waitUntil: 'networkidle' });
      const launcher = page.locator('[data-open-library]');
      await launcher.waitFor();
      await launcher.focus();
      await page.keyboard.press('Enter');
      await page.locator('[data-library-page]').waitFor();
      assert.equal(await page.evaluate(() => location.hash), '#/library');
      await page.goto(`${baseUrl}/#/library?query=prayer&contentType=book`, { waitUntil: 'networkidle' });
      await page.locator('[data-library-page]').waitFor();
      await page.waitForFunction(() => {
        const state = document.querySelector('[data-library-status]')?.getAttribute('data-library-state');
        return state && state !== 'loading';
      });
      const heading = await page.locator('[data-library-page] h1').textContent();
      assert.equal(heading, localization.t('v7.library.title', { locale }), `${locale}: translated heading`);
      assert.deepEqual(await page.evaluate(() => [document.documentElement.dataset.bqText, document.documentElement.dataset.bqContrast, document.documentElement.dataset.bqEffectiveMotion]), ['xlarge', 'strong', 'reduce']);
      assert.equal(await page.locator('label[for="bq-library-query"]').count(), 1);
      assert.equal(await page.locator('label[for="bq-library-type"]').count(), 1);
      const query = page.locator('#bq-library-query');
      assert.equal(await query.inputValue(), 'prayer');
      assert.equal(await page.locator('#bq-library-type').inputValue(), 'book');
      await query.focus();
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'bq-library-type');
      const focus = await page.evaluate(() => {
        const style = getComputedStyle(document.activeElement);
        return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
      });
      assert.ok(focus.width >= 3 && focus.style !== 'none', `${locale}/${width}: visible keyboard focus`);
      const unlabeled = await page.locator('[data-library-page]').evaluate(root => [...root.querySelectorAll('button,input,select')]
        .filter(el => el.getClientRects().length)
        .filter(el => !(el.getAttribute('aria-label') || el.labels?.[0]?.textContent?.trim() || el.textContent?.trim()))
        .map(el => el.outerHTML));
      assert.deepEqual(unlabeled, [], `${locale}/${width}: accessible control names`);
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

      // The real shell language control reloads the app. Submitted discovery
      // must survive that reload, while an unsent search draft must not replace it.
      await query.fill('abiding');
      await page.locator('#bq-library-type').selectOption('devotional');
      await query.press('Enter');
      await page.waitForFunction(() => document.querySelector('[data-library-status]')?.getAttribute('data-library-state') === 'error');
      await query.fill('unsent draft');
      for (const nextLocale of ['en', 'tl', 'ceb', locale]) {
        if (await page.locator('[data-locale-select]').inputValue() !== nextLocale) {
          await Promise.all([
            page.waitForEvent('load'),
            page.locator('[data-locale-select]').selectOption(nextLocale),
          ]);
        } else {
          await page.reload({ waitUntil: 'networkidle' });
        }
        await page.locator('[data-library-page]').waitFor();
        await page.waitForFunction(() => document.querySelector('[data-library-status]')?.getAttribute('data-library-state') === 'error');
        assert.equal(await page.locator('[data-library-page] h1').textContent(), localization.t('v7.library.title', { locale: nextLocale }));
        assert.equal(await query.inputValue(), 'abiding', `${nextLocale}/${width}: submitted search survives locale reload`);
        assert.equal(await page.locator('#bq-library-type').inputValue(), 'devotional');
        assert.equal(await page.locator('[data-library-status]').textContent(), localization.t('v7.library.error', { locale: nextLocale }));
        assert.equal(await page.locator('[data-library-retry]').textContent(), localization.t('v7.library.retry', { locale: nextLocale }));
      }
      const browseStatus = page.locator('[data-library-status]');
      assert.equal(await browseStatus.getAttribute('role'), 'alert', `${locale}/${width}: browse error uses alert role`);
      assert.equal(await browseStatus.getAttribute('aria-live'), 'assertive', `${locale}/${width}: browse error is assertive`);
      const browseRetry = page.locator('[data-library-retry]');
      await browseRetry.focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('[data-library-status]')?.getAttribute('data-library-state') === 'error');
      assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-library-status')), true, `${locale}/${width}: browse Retry returns focus to status`);
      assert.equal(await query.inputValue(), 'abiding', `${locale}/${width}: browse Retry preserves query`);
      assert.equal(await page.locator('#bq-library-type').inputValue(), 'devotional', `${locale}/${width}: browse Retry preserves type`);
      await page.locator('[data-library-clear]').click();
      await page.reload({ waitUntil: 'networkidle' });
      await page.locator('[data-library-page]').waitFor();
      assert.equal(await query.inputValue(), '', `${locale}/${width}: Clear survives reload`);
      assert.equal(await page.locator('#bq-library-type').inputValue(), '');

      await page.goto(`${baseUrl}/#/library-item`, { waitUntil: 'networkidle' });
      await page.locator('[data-library-detail]').waitFor();
      assert.ok((await page.locator('[data-library-detail]').textContent()).trim());
      assert.equal(await page.locator('[data-library-detail] a[target="_blank"]').count(), 0);
      const back = page.locator('[data-library-back]');
      await back.focus();
      await page.keyboard.press('Enter');
      await page.locator('[data-library-page]').waitFor();
      assert.equal(await page.evaluate(() => location.hash.split('?')[0]), '#/library');

      // Warm loaded item module, then exercise genuine browser offline state.
      // Guest/backend denial remains denial after reconnect; no data is injected.
      await context.setOffline(true);
      const failedRoute = '#/library-item?id=33333333-3333-3333-3333-333333333333&query=prayer&contentType=book';
      await page.evaluate(hash => { location.hash = hash; }, failedRoute);
      const retry = page.locator('[data-library-item-retry]');
      await retry.waitFor({ state: 'visible' });
      const detail = page.locator('[data-library-detail]');
      assert.equal(await detail.textContent(), localization.t('v7.library.offline', { locale }));
      assert.equal(await detail.getAttribute('role'), 'alert', `${locale}/${width}: item offline error uses alert role`);
      assert.equal(await detail.getAttribute('aria-live'), 'assertive', `${locale}/${width}: item offline error is assertive`);
      assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-library-detail')), true, `${locale}/${width}: item entry focuses detail status`);
      await retry.focus();
      await page.keyboard.press('Enter');
      await retry.waitFor({ state: 'visible' });
      assert.equal(await page.evaluate(() => location.hash), failedRoute);
      assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-library-detail')), true, `${locale}/${width}: Retry returns focus to detail status`);
      await context.setOffline(false);
      await retry.click();
      await retry.waitFor({ state: 'visible' });
      assert.equal(await detail.textContent(), localization.t('v7.library.item.error', { locale }));
      assert.equal(await detail.getAttribute('role'), 'alert', `${locale}/${width}: item backend error uses alert role`);
      assert.equal(await detail.getAttribute('aria-live'), 'assertive', `${locale}/${width}: item backend error is assertive`);
      assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-library-detail')), true, `${locale}/${width}: reconnect Retry focus`);
      await page.locator('[data-library-back]').click();
      await page.locator('[data-library-page]').waitFor();
      await page.waitForFunction(() => {
        const state = document.querySelector('[data-library-status]')?.getAttribute('data-library-state');
        return ['ready', 'empty', 'error'].includes(state);
      });
      assert.equal(await page.locator('#bq-library-query').inputValue(), 'prayer');
      assert.equal(await page.locator('#bq-library-type').inputValue(), 'book');
      assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-library-status')), true, `${locale}/${width}: missing return card falls back to Library status focus`);
      assert.deepEqual(errors, [], `${locale}/${width}: browser errors`);
      await context.close();
    }
  }
} finally {
  await browser.close();
}
