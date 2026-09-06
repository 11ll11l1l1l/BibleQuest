import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });

async function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function desktopFlow() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('[data-bq-shell="v3"]').waitFor();
  assert(await page.locator('[data-bq-shell="v3"]').count() === 1, 'Shell must mount exactly once.');
  assert((await page.locator('h1').first().textContent())?.trim() === 'BibleQuest', 'Home must render BibleQuest heading.');

  await page.locator('[data-route-link="learn"]').click();
  await page.waitForURL(/#\/learn$/);
  assert((await page.locator('h1').first().textContent())?.trim() === 'Learn', 'Learn route did not render.');
  assert(await page.locator('[data-route-link="learn"][aria-current]').count() === 1, 'Active nav state missing for Learn.');

  await page.reload({ waitUntil: 'networkidle' });
  assert((await page.locator('h1').first().textContent())?.trim() === 'Learn', 'Deep-link reload did not preserve Learn route.');
  assert(await page.locator('[data-bq-shell="v3"]').count() === 1, 'Reload created duplicate shell.');

  await page.locator('[data-route-link="play"]').click();
  await page.goBack();
  await page.waitForURL(/#\/learn$/);
  assert((await page.locator('h1').first().textContent())?.trim() === 'Learn', 'Browser back did not restore Learn.');

  await page.goForward();
  await page.waitForURL(/#\/play$/);
  assert((await page.locator('h1').first().textContent())?.trim() === 'Play', 'Browser forward did not restore Play.');

  await page.goto(`${BASE}#/does-not-exist`, { waitUntil: 'networkidle' });
  assert((await page.locator('h1').first().textContent())?.trim() === 'Page not found', 'Unknown route did not use controlled not-found state.');
  await page.close();
}

async function mobileFlow() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('[data-bq-shell="v3"]').waitFor();
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    navHeight: document.querySelector('.bq-nav')?.getBoundingClientRect().height || 0
  }));
  assert(metrics.scrollWidth <= metrics.innerWidth + 1, `Mobile horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.navHeight >= 60, 'Mobile primary navigation is too small or missing.');

  for (const route of ['home','learn','play','grow','more']) {
    await page.locator(`[data-route-link="${route}"]`).click();
    await page.waitForURL(new RegExp(`#/${route}$`));
    assert(await page.locator(`[data-route-link="${route}"][aria-current]`).count() === 1, `Mobile active nav missing for ${route}.`);
  }
  await page.close();
}

try {
  await desktopFlow();
  await mobileFlow();
  console.log('BibleQuest v3 shell browser regression passed.');
} finally {
  await browser.close();
}
