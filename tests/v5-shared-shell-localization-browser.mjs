import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const pageErrors = [];
  const consoleErrors = [];
  const failedResources = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('response', response => {
    if (response.status() >= 400 && /\.(?:js|mjs)(?:\?|$)/i.test(response.url())) failedResources.push(`${response.status()} ${response.url()}`);
  });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  try {
    await page.waitForFunction(() => document.querySelector('[data-bq-shell="v3"]') || document.querySelector('[data-startup-failure]'), null, { timeout: 5000 });
  } catch {
    const body = (await page.locator('body').innerText().catch(() => '')).trim().slice(0, 500);
    throw new Error(`BibleQuest shell did not start. pageErrors=${pageErrors.join(' | ') || 'none'}; consoleErrors=${consoleErrors.join(' | ') || 'none'}; failedResources=${failedResources.join(' | ') || 'none'}; body=${body || '<empty>'}`);
  }
  const startupFailure = page.locator('[data-startup-failure]');
  if (await startupFailure.count()) {
    const detail = (await startupFailure.innerText()).trim().replace(/\s+/g, ' ');
    throw new Error(`BibleQuest rendered startup failure instead of the shell: ${detail}`);
  }
  await page.locator('[data-locale-select]').waitFor();

  assert(await page.locator('[data-bq-shell="v3"][data-locale="en"]').count() === 1, 'English must remain the default shell locale.');
  assert((await page.locator('[data-locale-select]').inputValue()) === 'en', 'Language selector must reflect English default.');

  await page.locator('[data-locale-select]').selectOption('tl');
  await page.waitForFunction(() => document.querySelector('[data-bq-shell="v3"]')?.dataset.locale === 'tl');
  await page.locator('[data-session-label]', { hasText: 'Bisita' }).waitFor();

  const labels = await page.evaluate(() => ({
    learn: document.querySelector('[data-route-link="learn"] small')?.textContent?.trim(),
    play: document.querySelector('[data-route-link="play"] small')?.textContent?.trim(),
    grow: document.querySelector('[data-route-link="grow"] small')?.textContent?.trim(),
    more: document.querySelector('[data-route-link="more"] small')?.textContent?.trim(),
    tagline: document.querySelector('.bq-brand small')?.textContent?.trim(),
    navLabel: document.querySelector('.bq-nav')?.getAttribute('aria-label'),
    localeLabel: document.querySelector('[data-locale-select]')?.getAttribute('aria-label'),
    accountLabel: document.querySelector('[data-session-open]')?.getAttribute('aria-label'),
    progressLabel: document.querySelector('[data-progress-chip]')?.getAttribute('aria-label'),
    session: document.querySelector('[data-session-label]')?.textContent?.trim(),
    locale: document.querySelector('[data-bq-shell="v3"]')?.dataset.locale,
    selectedLocale: document.querySelector('[data-locale-select]')?.value,
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    localeHeight: document.querySelector('[data-locale-select]')?.getBoundingClientRect().height || 0,
    accountHeight: document.querySelector('[data-session-open]')?.getBoundingClientRect().height || 0
  }));

  assert(labels.learn === 'Matuto', `Expected Matuto, got ${labels.learn}.`);
  assert(labels.play === 'Maglaro', `Expected Maglaro, got ${labels.play}.`);
  assert(labels.grow === 'Lumago', `Expected Lumago, got ${labels.grow}.`);
  assert(labels.more === 'Higit pa', `Expected Higit pa, got ${labels.more}.`);
  assert(labels.tagline === 'Magbasa · Matuto · Lumago', 'Tagalog brand tagline missing.');
  assert(labels.navLabel === 'Pangunahing nabigasyon', 'Primary navigation aria-label was not localized.');
  assert(labels.localeLabel === 'Wika', 'Language selector aria-label was not localized.');
  assert(labels.accountLabel === 'Buksan ang account', 'Account aria-label was not localized.');
  assert(labels.progressLabel === 'Pag-unlad sa BibleQuest', 'Progress aria-label was not localized.');
  assert(labels.session === 'Bisita', 'Guest shell state was not localized.');
  assert(labels.locale === 'tl' && labels.selectedLocale === 'tl', 'Selected locale did not persist through shell reload.');
  assert(labels.scrollWidth <= labels.innerWidth + 1, `Tagalog shell overflows at 390px: ${labels.scrollWidth}px > ${labels.innerWidth}px.`);
  assert(labels.localeHeight >= 44, `Language selector touch target is too small: ${labels.localeHeight}px.`);
  assert(labels.accountHeight >= 44, `Account control touch target regressed: ${labels.accountHeight}px.`);

  for (const leak of ['Learn', 'Play', 'Grow', 'More', 'Primary navigation', 'Guest', 'Open account']) {
    const count = await page.getByText(leak, { exact: true }).count();
    assert(count === 0, `Localized shared shell still exposes English text: ${leak}`);
  }

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-bq-shell="v3"][data-locale="tl"]').waitFor();
  assert((await page.locator('[data-locale-select]').inputValue()) === 'tl', 'Tagalog preference did not survive a full reload.');
  assert(pageErrors.length === 0, `Browser page errors occurred: ${pageErrors.join(' | ')}`);
  assert(failedResources.length === 0, `Browser requested missing JavaScript resources: ${failedResources.join(' | ')}`);

  console.log('PASS V5 shared shell Tagalog browser localization');
} finally {
  await browser.close();
}
