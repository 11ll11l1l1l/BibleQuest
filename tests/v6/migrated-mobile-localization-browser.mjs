import assert from 'node:assert/strict';
import { chromium } from 'playwright';

import { en } from '../../src/content/locales/en.js';
import { tl } from '../../src/content/locales/tl.js';
import { ceb } from '../../src/content/locales/ceb.js';

const baseUrl = process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173';
const widths = Object.freeze([320, 360, 390, 412, 430]);
const locales = Object.freeze({
  en: Object.freeze({
    dictionary: en,
    englishFallbacks: [],
  }),
  tl: Object.freeze({
    dictionary: tl,
    englishFallbacks: Object.freeze([
      'Notification Center',
      'NOTIFICATIONS',
      'Leader Center',
      'MINISTRY',
      'COMMUNITY BRIDGE',
    ]),
  }),
  ceb: Object.freeze({
    dictionary: ceb,
    englishFallbacks: Object.freeze([
      'Notification Center',
      'NOTIFICATIONS',
      'Leader Center',
      'MINISTRY',
      'COMMUNITY BRIDGE',
    ]),
  }),
});

const surfaces = Object.freeze([
  Object.freeze({
    route: 'notification-center',
    keys: Object.freeze(['notificationCenter.heading', 'notificationCenter.eyebrow']),
  }),
  Object.freeze({
    route: 'leader-center',
    keys: Object.freeze(['leaderCenter.title', 'leaderCenter.eyebrow']),
  }),
  Object.freeze({
    route: 'community',
    keys: Object.freeze(['community.intro.heading', 'community.eyebrow']),
  }),
]);

async function waitForRoute(page, route) {
  await page.goto(`${baseUrl}/#/${route}`, { waitUntil: 'networkidle' });
  await page.locator('#app').waitFor({ state: 'attached' });
  await page.waitForFunction(() => document.querySelector('#app')?.textContent?.trim().length > 0);
  await page.waitForFunction(() => {
    const lazyRoute = document.querySelector('[data-lazy-route]');
    return !lazyRoute || lazyRoute.getAttribute('aria-busy') !== 'true';
  });
  assert.equal(await page.locator('[data-startup-failure]').count(), 0, `#/${route} rendered startup failure`);
  assert.equal(await page.locator('[data-lazy-route] [role="alert"]').count(), 0, `#/${route} lazy route failed`);
  assert.equal(await page.evaluate(() => location.hash), `#/${route}`, `#/${route} did not retain its route`);
}

async function assertMobileGeometry(page, { width, locale, route }) {
  const geometry = await page.evaluate(() => {
    const app = document.querySelector('#app');
    const visible = node => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const controls = [...(app?.querySelectorAll('.bq-primary-button, .bq-secondary-button, select') || [])]
      .filter(visible)
      .map(node => {
        const rect = node.getBoundingClientRect();
        return {
          tag: node.tagName.toLowerCase(),
          text: (node.textContent || node.getAttribute('aria-label') || '').trim().slice(0, 80),
          width: rect.width,
          height: rect.height,
          left: rect.left,
          right: rect.right,
        };
      });
    return {
      innerWidth: window.innerWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      appScrollWidth: app?.scrollWidth || 0,
      controls,
      accessibility: {
        text: document.documentElement.dataset.bqText || '',
        motion: document.documentElement.dataset.bqMotion || '',
        contrast: document.documentElement.dataset.bqContrast || '',
        effectiveMotion: document.documentElement.dataset.bqEffectiveMotion || '',
      },
    };
  });

  assert.equal(geometry.innerWidth, width, `${locale} #/${route}: wrong viewport width`);
  assert.ok(
    geometry.documentScrollWidth <= width + 1,
    `${locale} #/${route}: document overflows at ${width}px (${geometry.documentScrollWidth}px)`,
  );
  assert.ok(
    geometry.appScrollWidth <= width + 1,
    `${locale} #/${route}: app overflows at ${width}px (${geometry.appScrollWidth}px)`,
  );
  assert.ok(geometry.controls.length > 0, `${locale} #/${route}: expected visible action controls`);

  for (const control of geometry.controls) {
    assert.ok(
      control.height >= 44,
      `${locale} #/${route}: touch target below 44px at ${width}px: ${JSON.stringify(control)}`,
    );
    assert.ok(
      control.left >= -1 && control.right <= width + 1,
      `${locale} #/${route}: action control escapes viewport at ${width}px: ${JSON.stringify(control)}`,
    );
  }

  assert.deepEqual(
    geometry.accessibility,
    { text: 'xlarge', motion: 'reduce', contrast: 'strong', effectiveMotion: 'reduce' },
    `${locale} #/${route}: accessibility preferences were not active at ${width}px`,
  );
}

const browser = await chromium.launch({ headless: true });
try {
  for (const width of widths) {
    for (const [locale, config] of Object.entries(locales)) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        isMobile: true,
        hasTouch: true,
      });
      await context.addInitScript(({ selectedLocale }) => {
        try {
          localStorage.setItem('biblequest.v3.locale', JSON.stringify(selectedLocale));
          localStorage.setItem('biblequest.v3.accessibility-settings', JSON.stringify({
            text: 'xlarge',
            motion: 'reduce',
            contrast: 'strong',
          }));
        } catch {
          // about:blank can reject storage; the script runs again on the app origin.
        }
      }, { selectedLocale: locale });

      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(String(error?.message || error)));

      for (const surface of surfaces) {
        await waitForRoute(page, surface.route);

        const bodyText = (await page.locator('#app').textContent()) || '';
        for (const key of surface.keys) {
          const expected = String(config.dictionary[key] || '').trim();
          assert.ok(expected, `${locale} catalog missing ${key}`);
          assert.ok(
            bodyText.includes(expected),
            `${locale} #/${surface.route} at ${width}px did not render catalog key ${key}: ${expected}`,
          );
        }

        for (const fallback of config.englishFallbacks) {
          if (!surface.keys.some(key => String(en[key] || '') === fallback)) continue;
          assert.ok(
            !bodyText.includes(fallback),
            `${locale} #/${surface.route} at ${width}px leaked English UI copy: ${fallback}`,
          );
        }

        await assertMobileGeometry(page, { width, locale, route: surface.route });
      }

      assert.deepEqual(
        pageErrors,
        [],
        `${locale} migrated surfaces emitted browser errors at ${width}px: ${pageErrors.join(' | ')}`,
      );
      await context.close();
    }
  }
} finally {
  await browser.close();
}

console.log(
  `Built migrated-surface mobile/localization/accessibility regression passed: ${widths.join('/')}px × EN/TL/CEB × Notification/Leader/Community surfaces with xlarge/reduced-motion/strong-contrast preferences.`,
);
