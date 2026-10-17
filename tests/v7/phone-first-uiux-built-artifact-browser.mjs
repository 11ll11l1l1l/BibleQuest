import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173';
const candidateSha = String(process.env.BQ_EXACT_SHA || '').trim().toLowerCase();
assert.match(candidateSha, /^[a-f0-9]{40}$/, 'BQ_EXACT_SHA must identify the built candidate');

const viewports = [
  ...[320, 390].flatMap(width => ['en', 'tl', 'ceb', 'ilo'].map(locale => ({
    width,
    height: width === 320 ? 800 : 844,
    locale,
    colorScheme: width === 390 && locale === 'en' ? 'light' : 'dark',
  }))),
  { width: 430, height: 932, locale: 'en', colorScheme: 'dark' },
  { width: 800, height: 1024, locale: 'en', colorScheme: 'light' },
];
const routes = [
  { id: 'home', selector: '[data-home-feature]' },
  { id: 'reader', selector: '.bq-reader-passage' },
  { id: 'library', selector: '[data-library-page]' },
  { id: 'one-to-one', selector: '[data-one-to-one-hero]' },
  { id: 'more', selector: '[data-more-group]' },
];
const report = {
  schemaVersion: 1,
  candidateSha,
  result: 'PASS',
  scope: 'built-artifact phone-first route geometry; not owner visual acceptance or physical-device safe-area certification',
  profiles: viewports.map(({ width, height, locale, colorScheme }) => ({ width, height, locale, colorScheme })),
  observations: [],
  screenshots: [],
};
const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      colorScheme: viewport.colorScheme,
      hasTouch: viewport.width < 800,
    });
    await context.addInitScript(locale => {
      if (localStorage.getItem('biblequest.v3.locale') === null) {
        localStorage.setItem('biblequest.v3.locale', JSON.stringify(locale));
      }
    }, viewport.locale);

    for (const route of routes) {
      const page = await context.newPage();
      const errors = [];
      page.on('console', message => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${baseUrl}/#/${route.id}`, { waitUntil: 'networkidle' });
      await page.locator(route.selector).first().waitFor({ state: 'visible', timeout: 15000 });
      await page.locator('.bq-nav').waitFor({ state: 'visible' });
      await page.waitForFunction(() => document.readyState === 'complete');

      const geometry = await page.evaluate(() => {
        const rect = element => {
          const value = element.getBoundingClientRect();
          return {
            x: Number(value.x.toFixed(2)), y: Number(value.y.toFixed(2)),
            width: Number(value.width.toFixed(2)), height: Number(value.height.toFixed(2)),
            top: Number(value.top.toFixed(2)), right: Number(value.right.toFixed(2)),
            bottom: Number(value.bottom.toFixed(2)), left: Number(value.left.toFixed(2)),
          };
        };
        const nav = document.querySelector('.bq-nav');
        const links = [...(nav?.querySelectorAll('[data-route-link]') || [])];
        const topbar = document.querySelector('.bq-topbar');
        const primary = document.querySelector('#bq-view');
        return {
          viewport: { width: innerWidth, height: innerHeight },
          document: {
            width: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
            height: Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0),
          },
          locale: JSON.parse(localStorage.getItem('biblequest.v3.locale') || '"en"'),
          preferredColorScheme: matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark',
          computedColorScheme: getComputedStyle(document.documentElement).colorScheme,
          topbar: topbar ? rect(topbar) : null,
          navigation: nav ? rect(nav) : null,
          navigationTargets: links.map(link => ({
            route: link.dataset.routeLink,
            label: link.textContent.trim(),
            current: link.getAttribute('aria-current') === 'page',
            ...rect(link),
          })),
          unlabeledControls: [...document.querySelectorAll('#bq-view button, #bq-view a[href], #bq-view input, #bq-view select, #bq-view textarea, #bq-view summary')]
            .filter(element => element.getClientRects().length && !element.closest('[hidden]'))
            .filter(element => !(element.getAttribute('aria-label')
              || element.labels?.[0]?.textContent?.trim()
              || element.textContent?.trim()
              || element.getAttribute('title')))
            .map(element => element.outerHTML),
          shortTapTargets: [...document.querySelectorAll('#bq-view button, #bq-view input, #bq-view select, #bq-view textarea, #bq-view summary')]
            .filter(element => element.getClientRects().length && !element.closest('[hidden]'))
            .map(element => {
              const value = element.getBoundingClientRect();
              return { tag: element.tagName, label: element.getAttribute('aria-label') || element.labels?.[0]?.textContent?.trim() || element.textContent?.trim(), width: Number(value.width.toFixed(2)), height: Number(value.height.toFixed(2)) };
            })
            .filter(target => target.width < 44 || target.height < 44),
          mainBottomPadding: primary ? parseFloat(getComputedStyle(primary).paddingBottom) : 0,
        };
      });
      assert.ok(geometry.document.width <= viewport.width + 1,
        `${route.id}/${viewport.width}: horizontal document overflow ${geometry.document.width}/${viewport.width}`);
      assert.equal(geometry.navigationTargets.length, 5, `${route.id}/${viewport.width}: keep five primary destinations`);
      assert.equal(geometry.navigationTargets.filter(target => target.current).length, 1,
        `${route.id}/${viewport.width}: exactly one current primary destination`);
      assert.deepEqual(geometry.unlabeledControls, [],
        `${route.id}/${viewport.width}: every visible control needs an accessible name`);
      assert.deepEqual(geometry.shortTapTargets, [],
        `${route.id}/${viewport.width}: controls below the 44px tap target minimum`);
      assert.ok(geometry.navigation.left >= -1 && geometry.navigation.right <= viewport.width + 1,
        `${route.id}/${viewport.width}: bottom navigation extends beyond the viewport`);
      assert.ok(geometry.navigation.bottom <= viewport.height + 1,
        `${route.id}/${viewport.width}: bottom navigation collides with the viewport edge`);
      for (const target of geometry.navigationTargets) {
        assert.ok(target.width >= 44 && target.height >= 44,
          `${route.id}/${viewport.width}: ${target.route} target is below 44 CSS px (${target.width}x${target.height})`);
        assert.ok(target.left >= -1 && target.right <= viewport.width + 1,
          `${route.id}/${viewport.width}: ${target.route} label target is horizontally clipped`);
      }
      if (geometry.topbar) {
        assert.ok(geometry.topbar.left >= -1 && geometry.topbar.right <= viewport.width + 1,
          `${route.id}/${viewport.width}: top bar is horizontally clipped`);
      }

      let readerAudio = null;
      let readerBottomClearance = null;
      if (route.id === 'reader') {
        const audio = page.locator('[data-reader-audio-player]');
        if (await audio.count()) {
          const more = audio.locator('.bq-reader-audio__more');
          const summary = more.locator('summary');
          assert.equal(await more.evaluate(element => ['fixed', 'sticky'].includes(getComputedStyle(element).position)), false,
            `${viewport.width}: audio options must not overlay the passage or primary navigation`);
          assert.equal(await audio.evaluate(element => ['fixed', 'sticky'].includes(getComputedStyle(element).position)), false,
            `${viewport.width}: Reader audio player must not overlay Scripture/navigation`);
          const durationText = String(await page.locator('[data-reader-audio-time]').textContent() || '').trim();
          assert.ok(durationText && !durationText.includes('--:--'),
            `${viewport.width}/${viewport.locale}: audio must expose a localized duration or unavailable state`);
          if (viewport.width === 390 && viewport.locale === 'en') {
            const player = await audio.screenshot({ animations: 'disabled' });
            await mkdir('artifacts/v7/phone-first-uiux', { recursive: true });
            const file = 'artifacts/v7/phone-first-uiux/reader-audio-collapsed-390.png';
            await writeFile(file, player);
            report.screenshots.push({ file, sha256: createHash('sha256').update(player).digest('hex') });
          }
          await summary.click();
          assert.equal(await more.getAttribute('open') !== null, true, `${viewport.width}: audio options disclosure opens`);
          assert.equal(await more.locator('[data-reader-audio-auto-next]').count(), 1,
            `${viewport.width}: Auto-next remains available inside audio options`);
          const expandedTargets = await more.locator('summary, select, label:has(input[type="checkbox"])').evaluateAll(elements => elements
            .filter(element => element.getClientRects().length)
            .map(element => {
              const bounds = element.getBoundingClientRect();
              return { label: element.textContent.trim(), width: bounds.width, height: bounds.height };
            }));
          assert.ok(expandedTargets.length > 0, `${viewport.width}: expanded audio controls should be exposed`);
          assert.deepEqual(expandedTargets.filter(target => target.width < 44 || target.height < 44), [],
            `${viewport.width}: expanded audio settings have a target below 44px`);
          readerAudio = {
            collapsedPlayer: await audio.evaluate(element => ({
              position: getComputedStyle(element).position,
              bounds: (() => { const r = element.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, height: r.height }; })(),
            })),
            expandedControlsVisible: await more.locator('[data-reader-audio-auto-next]').isVisible(),
            expandedTargetCount: expandedTargets.length,
          };
          await summary.click();
        }
        const lastVerse = page.locator('[data-reader-verse-text]').last();
        if (await lastVerse.count()) {
          await page.evaluate(() => window.scrollTo(0, Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0)));
          readerBottomClearance = await page.evaluate(() => {
            const verse = document.querySelectorAll('[data-reader-verse-text]');
            const nav = document.querySelector('.bq-nav');
            const verseRect = verse[verse.length - 1]?.getBoundingClientRect();
            const navRect = nav?.getBoundingClientRect();
            return verseRect && navRect ? {
              finalVerseBottom: Number(verseRect.bottom.toFixed(2)),
              navigationTop: Number(navRect.top.toFixed(2)),
              clearPixels: Number((navRect.top - verseRect.bottom).toFixed(2)),
            } : null;
          });
          assert.ok(readerBottomClearance && readerBottomClearance.clearPixels >= 0,
            `${viewport.width}: fixed bottom navigation covers the final Scripture text (${JSON.stringify(readerBottomClearance)})`);
        }
      }

      if (viewport.width === 390 && viewport.locale === 'en') {
        await mkdir('artifacts/v7/phone-first-uiux', { recursive: true });
        const file = `artifacts/v7/phone-first-uiux/${route.id}-390.png`;
        await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
        const bytes = await readFile(file);
        report.screenshots.push({ file, sha256: createHash('sha256').update(bytes).digest('hex') });
      }
      assert.deepEqual(errors, [], `${route.id}/${viewport.width}: page errors`);
      report.observations.push({ route: route.id, locale: viewport.locale, ...geometry, readerAudio, readerBottomClearance, pageErrors: errors });

      // Apply 200% text scaling to each route; it must stay usable without
      // adding horizontal page overflow. This is a browser zoom proxy, not OS
      // font-scaling or physical-device typography acceptance.
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      const scaled = await page.evaluate(() => ({
        rootFontSize: parseFloat(getComputedStyle(document.documentElement).fontSize),
        pageWidth: Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0),
        viewportWidth: innerWidth,
      }));
      assert.ok(scaled.rootFontSize >= 31, `${route.id}/${viewport.width}: 200% text scaling probe did not apply`);
      assert.ok(scaled.pageWidth <= scaled.viewportWidth + 1,
        `${route.id}/${viewport.width}: horizontal overflow at 200% text (${scaled.pageWidth}/${scaled.viewportWidth})`);
      report.observations.at(-1).textScale200 = scaled;
      await page.close();
    }
    await context.close();
  }

  await mkdir('artifacts/v7', { recursive: true });
  await writeFile('artifacts/v7/phone-first-uiux-geometry.json', `${JSON.stringify(report, null, 2)}\n`, 'utf8');
} catch (error) {
  report.result = 'FAIL';
  report.failure = String(error?.stack || error);
  await mkdir('artifacts/v7', { recursive: true });
  await writeFile('artifacts/v7/phone-first-uiux-geometry.json', `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  throw error;
} finally {
  await browser.close();
}

console.log(`PASS phone-first UI/UX route matrix (${routes.length} routes × ${viewports.length} viewport/locale profiles; exact SHA ${candidateSha})`);
