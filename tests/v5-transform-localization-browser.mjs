import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('[data-locale-select]').waitFor();
  await page.locator('[data-locale-select]').selectOption('tl');
  await page.waitForFunction(() => document.querySelector('[data-bq-shell="v3"]')?.dataset.locale === 'tl');

  await page.goto(new URL('#/transform', BASE).href, { waitUntil: 'networkidle' });
  await page.locator('[data-transform-page]').waitFor();
  await page.getByRole('heading', { name: 'Pagninilay sa pananampalataya at pagsasabuhay' }).waitFor();
  assert(await page.locator('[data-transform-message]').count() === 1, 'Basic assessment must own one unambiguous status message');
  assert(await page.locator('[data-transform-flow-message]').count() === 1, 'Scripture flow must own its separate status message');

  const state = await page.evaluate(() => ({
    heading: document.querySelector('[data-transform-page] h1')?.textContent?.trim(),
    modePrompt: document.querySelector('.bq-transform-actions b')?.textContent?.trim(),
    modeLabel: document.querySelector('.bq-transform-actions')?.getAttribute('aria-label'),
    answered: document.querySelector('[data-transform-message]')?.previousElementSibling?.textContent?.trim(),
    back: document.querySelector('[data-transform-back]')?.textContent?.trim(),
    reset: document.querySelector('[data-transform-reset]')?.textContent?.trim(),
    calculate: document.querySelector('[data-transform-calculate]')?.textContent?.trim(),
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    minControlHeight: Math.min(...[...document.querySelectorAll('[data-transform-page] button')].map(node => node.getBoundingClientRect().height))
  }));

  assert(state.heading === 'Pagninilay sa pananampalataya at pagsasabuhay', `Unexpected Transformation heading: ${state.heading}`);
  assert(state.modePrompt === 'Pumili ng paraan ng pagninilay', `Unexpected mode prompt: ${state.modePrompt}`);
  assert(state.modeLabel === 'Paraan ng Transformation', `Unexpected mode aria-label: ${state.modeLabel}`);
  assert(state.answered === '0/12 nasagutan', `Unexpected answered label: ${state.answered}`);
  assert(state.back === 'Bumalik sa Lumago', `Unexpected back label: ${state.back}`);
  assert(state.reset === 'I-reset', `Unexpected reset label: ${state.reset}`);
  assert(state.calculate === 'Tingnan ang pagninilay', `Unexpected calculate label: ${state.calculate}`);
  assert(state.scrollWidth <= state.innerWidth + 1, `Tagalog Transformation overflows at 390px: ${state.scrollWidth}px > ${state.innerWidth}px.`);
  assert(state.minControlHeight >= 40, `Transformation control height regressed below 40px: ${state.minControlHeight}px.`);

  for (const leak of ['Faith & practice reflection', 'Choose a reflection mode', 'Back to Grow', 'Reset', 'View reflection']) {
    assert(await page.getByText(leak, { exact: true }).count() === 0, `Basic Transformation still exposes English UI text: ${leak}`);
  }

  const firstRating = page.locator('[data-transform-rating]').first();
  const ratingLabel = await firstRating.locator('xpath=..').getAttribute('aria-label');
  assert(ratingLabel?.startsWith('Rating para sa '), `Rating aria-label was not localized: ${ratingLabel}`);
  assert(pageErrors.length === 0, `Browser page errors occurred: ${pageErrors.join(' | ')}`);

  console.log('PASS V5 basic Transformation Tagalog browser localization');
} finally {
  await browser.close();
}