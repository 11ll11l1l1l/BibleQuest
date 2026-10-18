/**
 * Certification of the ACTUAL production bundle in a deterministic no-art
 * network state. Importing /src is prohibited: this test must pass on dist-v6.
 * Security/content approval is separately enforced by the real Library routes.
 */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BASE = (process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const browser = await chromium.launch({ headless: true });
const localeStorage = 'biblequest.v3.locale';
let checks = 0;
try {
  for (const locale of ['en', 'tl', 'ceb', 'ilo']) {
    for (const width of [320, 390, 430, 800]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        serviceWorkers: 'block',
      });
      await context.addInitScript(({ localeStorage, locale }) => {
        localStorage.setItem(localeStorage, JSON.stringify(locale));
        localStorage.setItem('biblequest.v3.accessibility-settings',
          JSON.stringify({ text: 'xlarge', contrast: 'strong', motion: 'reduce' }));
      }, { localeStorage, locale });
      // An absent registry must not strand Library users behind image work.
      // Verify the built app's real fallback, not an isolated source component.
      await context.route('**/data/v7/visual-assets.json*', route => route.fulfill({
        status: 503, contentType: 'application/json', body: '{"error":"art-unavailable"}'
      }));
      const page = await context.newPage();
      const exceptions = [];
      page.on('pageerror', err => exceptions.push(err.message));
      await page.goto(BASE + '/#/library?query=concern&contentType=devotional', {
        waitUntil: 'networkidle',
      });
      await page.locator('[data-library-page]').waitFor();
      await page.waitForFunction(() => ['ready', 'empty', 'error'].includes(
        document.querySelector('[data-library-status]')?.getAttribute('data-library-state')
      ));
      await page.locator('[data-library-filter-panel] > summary').click();
      const emotion = page.locator('[data-v7-deck="emotion"]');
      const need = page.locator('[data-v7-deck="need"]');
      await emotion.waitFor();
      await need.waitFor();
      assert.equal(await emotion.locator('[data-v7-deck-id]').count(), 30, 'Missing Feeling selections');
      assert.equal(await need.locator('[data-v7-deck-id]').count(), 19, 'Missing Need selections');
      const fallback = page.locator('.bq-v7-visual-deck__card--text-only');
      assert.equal(await fallback.count(), 49, `${locale}/${width}: unavailable art must become color/text buttons`);
      assert.equal(await page.locator('.bq-v7-visual-deck__image img').count(), 0,
        `${locale}/${width}: missing registry must not load images`);
      const info = await emotion.locator('.bq-v7-visual-deck__card--text-only').first().evaluate(el => {
        const rect = el.getBoundingClientRect();
        const label = el.querySelector('.bq-v7-visual-deck__label');
        const color = getComputedStyle(el).backgroundColor;
        return {
          width: rect.width, height: rect.height, text: label?.textContent?.trim(),
          name: el.getAttribute('aria-label'),
          labelVisible: !!label && getComputedStyle(label).display !== 'none',
          background: color,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        };
      });
      assert.ok(info.width >= 120 && info.width <= Math.min(width, 440), `${locale}/${width}: compact button width`);
      assert.ok(info.height >= 44 && info.height < 240, `${locale}/${width}: no blank portrait slot`);
      assert.ok(info.text && info.labelVisible && info.name?.includes(info.text),
        `${locale}/${width}: accessible live localized Feeling title`);
      assert.ok(!info.overflow, `${locale}/${width}: no page horizontal overflow`);
      // Real reviewed content must remain navigable; loss of art must never
      // bypass the existing approved-content visibility gate.
      const results = page.locator('[data-library-results] .bq-v7-content-card');
      const count = await results.count();
      assert.ok(count > 0, `${locale}/${width}: reviewed devotional content still available`);
      assert.equal(await page.locator('.bq-v7-content-card--text-only').count(), count,
        `${locale}/${width}: published devotional cards must have text-first fallback`);
      const first = results.first();
      assert.ok((await first.locator('h3').textContent())?.trim(), 'Missing semantic devotional title');
      assert.equal(await first.locator('.bq-v7-content-card__cover img').count(), 0,
        'Broken image element present under no-art mode');
      assert.ok((await first.locator('.bq-v7-content-card__action').getAttribute('aria-label'))?.trim(),
        'Accessible open action disappeared');
      const select = emotion.locator('[data-v7-deck-id="anxious"]');
      const before = await select.getAttribute('aria-pressed');
      await select.click();
      assert.notEqual(await select.getAttribute('aria-pressed'), before, `${locale}/${width}: Feeling button must work without image`);
      assert.deepEqual(exceptions, [], `${locale}/${width}: application errors`);
      checks++;
      await context.close();
    }
  }
} finally {
  await browser.close();
}
console.log('PASS text-first built-artifact fallback: ' + checks + ' exact built Library mobile/tablet/locale profiles');
