import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173';
const candidateSha = String(process.env.BQ_EXACT_SHA || process.env.GITHUB_SHA || '');
const browser = await chromium.launch({ headless: true });
const checks = [];
const observations = [];
const deckObservations = [];
const files = [];
const testedLocales = new Set();
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
      const locale = ({ 320: 'en', 390: 'tl', 430: 'ceb', 800: 'en' })[width];
      testedLocales.add(locale);
      stage = width + '/' + reducedMotion + '/' + locale;
      const context = await browser.newContext({
        viewport: { width, height: 900 }, reducedMotion,
        hasTouch: width < 800, isMobile: false,
      });
      await context.addInitScript(language => {
        if (localStorage.getItem('biblequest.v3.locale') === null) {
          localStorage.setItem('biblequest.v3.locale', JSON.stringify(language));
        }
        window.__bqMotionMeasurements = { shifts: [], longTasks: [] };
        try {
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput && window.__bqMotionMeasurements.shifts.length < 100) {
                window.__bqMotionMeasurements.shifts.push(Number(entry.value));
              }
            }
          }).observe({ type: 'layout-shift', buffered: true });
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              if (window.__bqMotionMeasurements.longTasks.length < 100) {
                window.__bqMotionMeasurements.longTasks.push(Math.round(entry.duration));
              }
            }
          }).observe({ type: 'longtask', buffered: true });
        } catch { /* Unsupported performance APIs are recorded as unavailable. */ }
      }, locale);
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', e => pageErrors.push(e.message));
      await page.goto(baseUrl + '/#/home', { waitUntil: 'networkidle' });
      const nav = page.locator('.bq-nav');
      await nav.waitFor({ state: 'visible' });
      await page.locator('[data-route-link="home"][aria-current="page"]').waitFor();
      await page.waitForFunction(() => document.readyState === 'complete');
      assert.equal(await nav.locator('[aria-current="page"]').count(), 1, 'one primary destination is active');
      const feature = page.locator('[data-home-feature]');
      const heroAction = page.locator('[data-home-hero-reader]');
      const heroCover = page.locator('[data-home-cover]');
      await feature.waitFor({ state: 'visible' });
      const heroMetrics = await feature.evaluate(element => ({
        rect: element.getBoundingClientRect().height,
        cssMinHeight: getComputedStyle(element).minHeight,
        cssMaxHeight: getComputedStyle(element).maxHeight,
        display: getComputedStyle(element).display,
        parent: element.parentElement?.className,
        styles: [...document.styleSheets].map(sheet => sheet.href || '').filter(url => url.includes('home') || url.includes('v7')),
      }));
      assert.ok(heroMetrics.rect >= 280, 'image-first Home feature has usable visual height: ' + JSON.stringify(heroMetrics));
      assert.equal(await heroAction.count(), 1, 'one clear reading action in feature artwork');
      assert.ok((await heroAction.getAttribute('aria-label'))?.trim(), 'live translated button semantics');
      assert.ok((await heroCover.getAttribute('src'))?.trim(), 'offline-friendly static or approved art');
      assert.equal(await heroCover.getAttribute('alt'), '', 'mood image is decorative; reading action is live text');
      if (width === 390) {
        await mkdir('artifacts/v7', { recursive: true });
        const file = 'artifacts/v7/motion-rest-' + locale + '-' + reducedMotion + '-390.png';
        await page.screenshot({ path: file, animations: 'disabled' });
        files.push(file);
      }

      // Enter activates the actual reading route, including in reduced motion.
      await heroAction.focus();
      await page.keyboard.press('Enter');
      await page.locator('[data-route-link="reader"][aria-current="page"]').waitFor();
      assert.ok((await page.evaluate(() => location.hash)).startsWith('#/reader'));
      await page.locator('[data-route-link="home"]').click();
      await feature.waitFor({ state: 'visible' });
      await page.locator('[data-route-link="home"][aria-current="page"]').waitFor();

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
      const bible = page.locator('[data-route-link="reader"]');
      await bible.focus();
      await page.keyboard.press('Enter');
      await page.locator('[data-route-link="reader"][aria-current="page"]').waitFor();
      if (width === 390) {
        const file = 'artifacts/v7/motion-interacting-' + locale + '-' + reducedMotion + '-390.png';
        await page.screenshot({ path: file, animations: 'disabled' });
        files.push(file);
      }
      for (const destination of ['home', 'reader', 'home']) {
        await page.locator('[data-route-link="' + destination + '"]').click();
        await page.locator('[data-route-link="' + destination + '"][aria-current="page"]').waitFor();
        assert.equal(await nav.locator('[aria-current="page"]').count(), 1);
      }

      // Zoom through text scaling without changing layout geometry.
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      const layout = await page.evaluate(() => ({
        viewport: innerWidth,
        locale: document.querySelector('[data-bq-shell]')?.dataset.locale || '',
        layoutShiftScore: (window.__bqMotionMeasurements?.shifts || []).reduce((sum, value) => sum + value, 0),
        longTasks: (window.__bqMotionMeasurements?.longTasks || []).length,
        maxLongTaskMs: Math.max(0, ...(window.__bqMotionMeasurements?.longTasks || [])),
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
      observations.push({ width, reducedMotion, locale, layout });
      checks.push(stage + ':active-focus-no-overflow-reduced-motion');

      if (width === 390) {
        const file = 'artifacts/v7/motion-settled-' + locale + '-' + reducedMotion + '-390.png';
        await mkdir('artifacts/v7', { recursive: true });
        await page.screenshot({ path: file, animations: 'disabled' });
        files.push(file);
      }
      await context.close();
    }
  }

  // Release-convergence evidence for the *routed, built* Library decks.
  // Lane B owns the component; Lane D independently verifies behavior on
  // the exact release binary, rather than a source-mode mock.
  for (const reducedMotion of ['no-preference', 'reduce']) {
    stage = 'library-decks/390/' + reducedMotion;
    const context = await browser.newContext({
      viewport: { width: 390, height: 900 }, reducedMotion, hasTouch: true,
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(baseUrl + '/#/library', { waitUntil: 'networkidle' });
    await page.locator('[data-library-visual-decks] [data-v7-deck="emotion"]').waitFor({ state: 'visible' });
    for (const [kind, count] of [['emotion', 30], ['need', 19]]) {
      stage = 'library-decks/390/' + reducedMotion + '/' + kind;
      const deck = page.locator('[data-library-visual-decks] [data-v7-deck="' + kind + '"]');
      const cards = deck.locator('.bq-v7-visual-deck__card');
      const track = deck.locator('.bq-v7-visual-deck__track');
      const arrows = deck.locator('.bq-v7-visual-deck__arrow');
      assert.equal(await cards.count(), count, 'real ' + kind + ' deck must retain canonical card count');
      assert.equal(await arrows.count(), 2, 'real ' + kind + ' deck needs non-swipe controls');
      const firstId = await cards.first().getAttribute('data-v7-deck-id');
      const secondId = await cards.nth(1).getAttribute('data-v7-deck-id');
      const transitionMs = await cards.first().evaluate(element =>
        Math.max(...getComputedStyle(element).transitionDuration.split(',').map(value =>
          Number.parseFloat(value) * (value.trim().endsWith('ms') ? 1 : 1000))));
      if (reducedMotion === 'reduce') assert.equal(transitionMs, 0,
        kind + ': reduced-motion deck cannot animate');
      else assert.ok(transitionMs > 0 && transitionMs <= 400,
        kind + ': normal deck transition must be brief and perceptible');
      assert.equal(await deck.locator('[aria-current="true"]').count(), 1,
        kind + ': one current card before navigation');
      const beforeSelected = await deck.locator('[aria-pressed="true"]').count();
      await arrows.nth(1).click();
      await page.waitForTimeout(550);
      const activeAfterNext = await deck.locator('[aria-current="true"]').getAttribute('data-v7-deck-id');
      assert.equal(activeAfterNext, secondId,
        kind + ': Next must settle on the second real card');
      assert.equal(await deck.locator('[aria-pressed="true"]').count(), beforeSelected,
        kind + ': navigation must not select or deselect a card');
      await track.focus();
      await page.keyboard.press('Home');
      await page.waitForTimeout(550);
      const activeAfterHome = await deck.locator('[aria-current="true"]').getAttribute('data-v7-deck-id');
      assert.equal(activeAfterHome, firstId, kind + ': keyboard Home must restore first card');
      const layout = await track.evaluate(element => ({
        scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
        viewport: window.innerWidth,
        widest: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        focusedCard: document.activeElement?.getAttribute('data-v7-deck-id') || '',
      }));
      assert.equal(layout.focusedCard, firstId, kind + ': keyboard navigation must restore focus');
      assert.ok(layout.scrollWidth > layout.clientWidth, kind + ': track must be scrollable');
      assert.ok(layout.widest <= layout.viewport + 1, kind + ': deck caused horizontal overflow');
      deckObservations.push({
        width: 390, locale: 'en', reducedMotion, kind, firstId, secondId,
        activeAfterNext, activeAfterHome, transitionMs, selectedUnchanged: true,
        keyboardFocusRestored: true, scrollable: true, noOverflow: true,
      });
      checks.push('390/' + reducedMotion + '/en:built-library-' + kind + '-deck-motion-and-focus');
    }
    assert.deepEqual(pageErrors, [], 'built Library deck browser errors');
    await context.close();
  }
  await mkdir('artifacts/v7', { recursive: true });
  await writeFile('artifacts/v7/motion-built-artifact.json', JSON.stringify({
    schemaVersion: 1, result: 'PASS', candidateSha,
    testedWidths: [320,390,430,800], testedMotion: ['no-preference','reduce'],
    testedLocales: [...testedLocales],
    localeLimitations: ['Ilocano UI selection is not yet exposed in the global shell'],
    capturedStates: ['rest','interacting','settled','reduced-motion'],
    checks, observations, deckObservations, screenshots: files,
    evidenceClass: 'built-browser-automated-viewport-keyboard-and-preference',
    exclusions: ['physical-device-fps', 'lane-c-lesson-step-animation-certification'],
  }, null, 2) + '\n');
  console.log('PASS V7 built motion browser gate: ' + checks.length + ' viewport/preference combinations');
} catch (error) {
  await recordFailure(error);
  throw error;
} finally { await browser.close(); }
