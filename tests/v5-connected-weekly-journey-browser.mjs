import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const baseURL = process.env.BQ_TEST_BASE_URL || 'http://127.0.0.1:4173';
const expectedRoutes = ['recordings', 'reader', 'transform', 'journey-groups', 'assignments', 'calendar'];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));

try {
  await page.goto(`${baseURL}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => {
    const [{ homeThisWeekIntroHtml }, { localization }] = await Promise.all([
      import('/src/features/home/today-this-week.js'),
      import('/src/app/localization.js')
    ]);
    window.__renderWeeklyJourney = locale => {
      localization.setLocale(locale);
      document.body.innerHTML = `<main id="weekly-root">${homeThisWeekIntroHtml(locale)}</main>`;
      window.__weeklyClicks = [];
      document.querySelector('[data-home-weekly-journey]')?.addEventListener('click', event => {
        const link = event.target.closest('[data-weekly-journey-route]');
        if (!link) return;
        event.preventDefault();
        window.__weeklyClicks.push(link.getAttribute('href'));
      });
    };
    window.__renderWeeklyJourney('en');
  });

  await assertJourney('en');
  assert.match((await page.locator('[data-home-week-heading]').textContent()) || '', /Keep your week connected/);
  assert.match((await page.locator('[data-weekly-journey-step="service"]').textContent()) || '', /Service/);
  assert.match((await page.locator('[data-weekly-journey-step="scripture"]').textContent()) || '', /Scripture/);
  assert.match((await page.locator('[data-weekly-journey-step="reflect"]').textContent()) || '', /Reflect/);
  assert.match((await page.locator('[data-weekly-journey-step="discuss"]').textContent()) || '', /Discuss & pray/);
  await assertDinnerPrompt('en', /ASK AT DINNER · OPTIONAL/, /What did God show us this week/);

  for (const route of expectedRoutes) await page.locator(`[data-weekly-journey-route="${route}"]`).click();
  assert.deepEqual(await page.evaluate(() => window.__weeklyClicks), expectedRoutes.map(route => `#/${route}`), 'each weekly journey step must remain directly navigable to its existing owner');

  await page.evaluate(() => window.__renderWeeklyJourney('tl'));
  await assertJourney('tl');
  const tagalogText = (await page.locator('[data-home-weekly-journey]').textContent()) || '';
  assert.match(tagalogText, /Kasulatan/);
  assert.match(tagalogText, /Magnilay/);
  assert.match(tagalogText, /Mag-usap at manalangin/);
  assert.match(tagalogText, /Isabuhay/);
  assert.match(tagalogText, /Magplano/);
  await assertDinnerPrompt('tl', /PAG-USAPAN SA HAPUNAN · OPSYONAL/, /Ano ang ipinakita sa atin ng Diyos ngayong linggo/);

  assert.deepEqual(pageErrors, [], `weekly journey browser emitted page errors: ${pageErrors.join(' | ')}`);
  console.log('BROWSER-AUTO PASS: connected weekly journey EN/TL, route sequence, touch targets and 390px overflow');
} finally {
  await browser.close();
}

async function assertJourney(locale) {
  const links = page.locator('[data-home-weekly-journey] [data-weekly-journey-route]');
  assert.equal(await links.count(), 6, `${locale} must expose six connected weekly journey steps`);
  const hrefs = await links.evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
  assert.deepEqual(hrefs, expectedRoutes.map(route => `#/${route}`), `${locale} route sequence must remain service -> Scripture -> reflection -> discussion/prayer -> action -> Calendar`);
  const geometry = await links.evaluateAll(nodes => ({
    heights: nodes.map(node => node.getBoundingClientRect().height),
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth
  }));
  geometry.heights.forEach((height, index) => assert.ok(height >= 44, `${locale} step ${index + 1} touch target is too small: ${height}px`));
  assert.ok(geometry.scrollWidth <= geometry.innerWidth + 1, `${locale} weekly journey overflows at 390px: ${geometry.scrollWidth} > ${geometry.innerWidth}`);
}

async function assertDinnerPrompt(locale, label, prompt) {
  const dinner = page.locator('[data-weekly-dinner-prompt]');
  assert.equal(await dinner.count(), 1, `${locale} must show exactly one Ask at Dinner prompt`);
  await dinner.scrollIntoViewIfNeeded();
  assert.equal(await dinner.isVisible(), true, `${locale} Ask at Dinner prompt must be visible`);
  const text = (await dinner.textContent()) || '';
  assert.match(text, label);
  assert.match(text, prompt);
  assert.equal(await dinner.locator('a, button, form').count(), 0, `${locale} Ask at Dinner must remain optional non-interactive content`);
  assert.equal(await dinner.getAttribute('aria-labelledby'), 'weekly-dinner-prompt-label', `${locale} Ask at Dinner prompt must retain its accessible label`);
  const geometry = await dinner.evaluate(node => ({
    left: node.getBoundingClientRect().left,
    right: node.getBoundingClientRect().right,
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  assert.ok(geometry.left >= -1 && geometry.right <= geometry.viewport + 1, `${locale} Ask at Dinner prompt overflows its 390px viewport`);
  assert.ok(geometry.scrollWidth <= geometry.viewport + 1, `${locale} Ask at Dinner page overflows at 390px`);
}
