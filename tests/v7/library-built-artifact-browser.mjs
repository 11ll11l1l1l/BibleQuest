import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { localization } from '../../src/app/localization.js';

const baseUrl = process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });

async function assertTextContrast(locator, label, minimum = 4.5) {
  const sample = await locator.evaluate(element => {
    const parseColor = value => {
      const text = String(value).trim();
      const rgb = text.match(/rgba?\(([^)]+)\)/i);
      if (rgb) {
        const parts = rgb[1].trim().split(/[\s,\/]+/).filter(Boolean).map(Number);
        return { r: parts[0], g: parts[1], b: parts[2], a: Number.isFinite(parts[3]) ? parts[3] : 1 };
      }
      const srgb = text.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/i);
      if (srgb) {
        return {
          r: Number(srgb[1]) * 255,
          g: Number(srgb[2]) * 255,
          b: Number(srgb[3]) * 255,
          a: Number.isFinite(Number(srgb[4])) ? Number(srgb[4]) : 1,
        };
      }
      throw new Error(`Unsupported computed color: ${value}`);
    };
    const relativeLuminance = color => {
      const channel = value => {
        const normalized = value / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
    };
    const contrastRatio = (foreground, background) => {
      const fg = relativeLuminance(foreground);
      const bg = relativeLuminance(background);
      return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
    };
    const foregroundText = getComputedStyle(element).color;
    const foreground = parseColor(foregroundText);
    let backgroundNode = element;
    let backgroundText = '';
    let background;
    while (backgroundNode) {
      backgroundText = getComputedStyle(backgroundNode).backgroundColor;
      const candidate = parseColor(backgroundText);
      if (candidate.a >= 0.999) {
        background = candidate;
        break;
      }
      backgroundNode = backgroundNode.parentElement;
    }
    if (!background) throw new Error('No opaque background found for contrast measurement.');
    return {
      ratio: contrastRatio(foreground, background),
      foreground: foregroundText,
      background: backgroundText,
      text: element.textContent?.trim() || element.getAttribute('value') || element.tagName,
    };
  });
  assert.ok(
    sample.ratio >= minimum,
    `${label}: expected >= ${minimum}:1, got ${sample.ratio.toFixed(2)}:1 (${sample.foreground} on ${sample.background})`
  );
  return sample;
}

// Real signed-out built routes consume the exact-SHA reviewed public catalog.
// Protected review/admin data remains outside the public Library surface.
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
      assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('bq-primary-button')), true,
        `${locale}/${width}: search action follows the query in keyboard order`);
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'bq-library-type');
      const focus = await page.evaluate(() => {
        const style = getComputedStyle(document.activeElement);
        return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
      });
      assert.ok(focus.width >= 3 && focus.style !== 'none', `${locale}/${width}: visible keyboard focus`);
      assert.deepEqual(
        await page.evaluate(() => [document.documentElement.dataset.bqText, document.documentElement.dataset.bqContrast]),
        ['xlarge', 'strong'],
        `${locale}/${width}: contrast evidence runs with requested accessibility preferences`
      );
      await assertTextContrast(page.locator('[data-library-page] h1'), `${locale}/${width}: Library heading contrast`);
      await assertTextContrast(page.locator('[data-library-page] .bq-library__header > p:last-child'), `${locale}/${width}: Library intro contrast`);
      await assertTextContrast(page.locator('label[for="bq-library-query"]'), `${locale}/${width}: search label contrast`);
      await assertTextContrast(page.locator('#bq-library-query'), `${locale}/${width}: search control text contrast`);
      await assertTextContrast(page.locator('[data-library-page] .bq-primary-button'), `${locale}/${width}: primary control text contrast`);
      await assertTextContrast(page.locator('[data-library-clear]'), `${locale}/${width}: secondary control text contrast`);
      await assertTextContrast(page.locator('[data-library-status]'), `${locale}/${width}: Library status contrast`);
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
      await query.fill('concern');
      await page.locator('#bq-library-type').selectOption('devotional');
      await query.press('Enter');
      await page.waitForFunction(() => document.querySelector('[data-library-status]')?.getAttribute('data-library-state') === 'ready');
      assert.ok(await page.locator('[data-library-item]').count() > 0, `${locale}/${width}: reviewed public devotional search returns results`);
      assert.equal(await page.locator('[data-library-retry]').isHidden(), true, `${locale}/${width}: working public catalog does not expose Retry`);
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
        await page.waitForFunction(() => document.querySelector('[data-library-status]')?.getAttribute('data-library-state') === 'ready');
        assert.equal(await page.locator('[data-library-page] h1').textContent(), localization.t('v7.library.title', { locale: nextLocale }));
        assert.equal(await query.inputValue(), 'concern', `${nextLocale}/${width}: submitted search survives locale reload`);
        assert.equal(await page.locator('#bq-library-type').inputValue(), 'devotional');
        assert.ok(await page.locator('[data-library-item]').count() > 0, `${nextLocale}/${width}: public catalog remains available after locale reload`);
      }
      const browseStatus = page.locator('[data-library-status]');
      assert.equal(await browseStatus.getAttribute('role'), 'status', `${locale}/${width}: successful public browse uses status role`);
      assert.equal(await browseStatus.getAttribute('aria-live'), 'polite', `${locale}/${width}: successful public browse is polite`);
      await page.locator('[data-library-clear]').click();
      await page.reload({ waitUntil: 'networkidle' });
      await page.locator('[data-library-page]').waitFor();
      assert.equal(await query.inputValue(), '', `${locale}/${width}: Clear survives reload`);
      assert.equal(await page.locator('#bq-library-type').inputValue(), '');

      await page.goto(`${baseUrl}/#/library-item`, { waitUntil: 'networkidle' });
      await page.locator('[data-library-detail]').waitFor();
      assert.ok((await page.locator('[data-library-detail]').textContent()).trim());
      assert.equal(await page.locator('[data-library-detail] a[target="_blank"]').count(), 0);
      assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-library-detail')), true, `${locale}/${width}: missing-id detail entry focuses status`);
      const back = page.locator('[data-library-back]');
      await back.focus();
      await page.keyboard.press('Enter');
      await page.locator('[data-library-page]').waitFor();
      assert.equal(await page.evaluate(() => location.hash.split('?')[0]), '#/library');

      // Once the reviewed public catalog has been loaded, item lookup remains
      // deterministic offline and an unknown id stays a clear not-found state.
      await context.setOffline(true);
      const failedRoute = '#/library-item?id=33333333-3333-3333-3333-333333333333&query=prayer&contentType=book';
      await page.evaluate(hash => { location.hash = hash; }, failedRoute);
      const detail = page.locator('[data-library-detail]');
      await page.waitForFunction(() => document.querySelector('[data-library-detail]')?.getAttribute('role') === 'alert');
      assert.equal(await detail.textContent(), localization.t('v7.library.item.unavailable', { locale }));
      assert.equal(await detail.getAttribute('role'), 'alert', `${locale}/${width}: missing public item uses alert role`);
      assert.equal(await detail.getAttribute('aria-live'), 'assertive', `${locale}/${width}: missing public item is assertive`);
      assert.equal(await page.locator('[data-library-item-retry]').isHidden(), true, `${locale}/${width}: not-found public item does not expose a useless Retry`);
      assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-library-detail')), true, `${locale}/${width}: item entry focuses detail status`);
      await context.setOffline(false);
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
