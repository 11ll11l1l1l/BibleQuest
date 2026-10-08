import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173';
const candidateSha = String(process.env.BQ_EXACT_SHA || process.env.GITHUB_SHA || '');
const browser = await chromium.launch({ headless: true });
const checks = [];
const observations = [];
const files = [];
let stage = 'setup';

async function recordFailure(error) {
  await mkdir('artifacts/v7', { recursive: true });
  await writeFile('artifacts/v7/motion-built-artifact.json', JSON.stringify({
    schemaVersion: 1, candidateSha, result: 'FAIL', stage,
    checks, observations, error: String(error?.message || error),
  }, null, 2) + '\n');
}

try {
  for (const width of [320, 390, 430, 800]) {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      stage = width + '/' + reducedMotion;
      const context = await browser.newContext({
        viewport: { width, height: 900 }, reducedMotion,
        hasTouch: width < 800, isMobile: false,
      });
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', e => pageErrors.push(e.message));
      await page.goto(baseUrl + '/#/home', { waitUntil: 'networkidle' });
      const nav = page.locator('.bq-nav');
      await nav.waitFor({ state: 'visible' });
      await page.locator('[data-route-link="home"][aria-current="page"]').waitFor();
      await page.waitForFunction(() => document.readyState === 'complete');
      assert.equal(await nav.locator('[aria-current="page"]').count(), 1, 'one primary destination is active');

      const observed = await page.evaluate(() => {
        const nav = document.querySelector('.bq-nav');
        const link = document.querySelector('[data-route-link="home"]');
        return {
          visibleNavigation: Boolean(nav && getComputedStyle(nav).display !== 'none'),
          selectedMarker: getComputedStyle(link, '::before').opacity,
          transition: getComputedStyle(link).transitionDuration,
        };
      });
      assert.ok(observed.visibleNavigation, 'labeled navigation must always remain visible');
      assert.equal(Number(observed.selectedMarker) > 0, true, 'selection remains visible without motion');
      if (reducedMotion === 'reduce') {
        assert.ok(observed.transition.split(',').every(v => parseFloat(v) === 0),
          'reduced motion removes nav transitions');
      }

      // Keyboard Enter and repeated destination changes must not get stuck on
      // a stale selected state or delay activation behind animation.
      const learn = page.locator('[data-route-link="learn"]');
      await learn.focus();
      await page.keyboard.press('Enter');
      await page.locator('[data-route-link="learn"][aria-current="page"]').waitFor();
      for (const destination of ['home', 'learn', 'home']) {
        await page.locator('[data-route-link="' + destination + '"]').click();
        await page.locator('[data-route-link="' + destination + '"][aria-current="page"]').waitFor();
        assert.equal(await nav.locator('[aria-current="page"]').count(), 1);
      }

      // Zoom through text scaling without changing layout geometry.
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      const layout = await page.evaluate(() => ({
        viewport: innerWidth,
        widest: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        navTarget: Math.min(...Array.from(document.querySelectorAll('.bq-nav [data-route-link]'))
          .map(node => node.getBoundingClientRect().height)),
        focusable: Array.from(document.querySelectorAll('.bq-nav [data-route-link]'))
          .every(node => node.getAttribute('href')?.startsWith('#/')),
      }));
      assert.ok(layout.widest <= width + 1, 'V7 motion chrome must not create horizontal overflow');
      assert.ok(layout.navTarget >= 40, 'bottom navigation requires usable touch/focus targets');
      assert.equal(layout.focusable, true, 'motion must not replace semantic navigation');
      assert.deepEqual(pageErrors, [], 'no browser script errors');
      observations.push({ width, reducedMotion, layout });
      checks.push(stage + ':active-focus-no-overflow-reduced-motion');

      if (width === 390) {
        const file = 'artifacts/v7/motion-' + reducedMotion + '-390.png';
        await mkdir('artifacts/v7', { recursive: true });
        await page.screenshot({ path: file, animations: 'disabled' });
        files.push(file);
      }
      await context.close();
    }
  }
  await mkdir('artifacts/v7', { recursive: true });
  await writeFile('artifacts/v7/motion-built-artifact.json', JSON.stringify({
    schemaVersion: 1, result: 'PASS', candidateSha,
    testedWidths: [320,390,430,800], testedMotion: ['no-preference','reduce'],
    checks, observations, screenshots: files,
    evidenceClass: 'built-browser-automated-viewport-keyboard-and-preference',
    exclusions: ['physical-device-fps', 'lane-b-deck-functional-certification',
      'lane-c-lesson-step-animation-certification'],
  }, null, 2) + '\n');
  console.log('PASS V7 built motion browser gate: ' + checks.length + ' viewport/preference combinations');
} catch (error) {
  await recordFailure(error);
  throw error;
} finally { await browser.close(); }
