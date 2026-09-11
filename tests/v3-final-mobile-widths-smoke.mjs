import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const WIDTHS = [320, 360, 390, 412, 430];
const PRIMARY_ROUTES = ['home', 'learn', 'play', 'grow', 'more'];
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const browser = await chromium.launch({ headless: true });

function approxEqual(values, tolerance = 2) {
  return Math.max(...values) - Math.min(...values) <= tolerance;
}

async function verifyWidth(width) {
  const page = await browser.newPage({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('pageerror', error => errors.push(`page: ${error.message}`));

  await page.goto(`${BASE}#/home`, { waitUntil: 'networkidle' });
  await page.locator('[data-bq-shell="v3"]').waitFor();
  await page.locator('[data-session-label]', { hasText: 'Guest' }).waitFor();
  await page.locator('[data-home-daily]').waitFor();

  const home = await page.evaluate(() => {
    const rect = node => {
      const value = node?.getBoundingClientRect();
      return value ? { left: value.left, right: value.right, top: value.top, bottom: value.bottom, width: value.width, height: value.height } : null;
    };
    const font = node => Number.parseFloat(node ? getComputedStyle(node).fontSize : '0') || 0;
    const navLinks = [...document.querySelectorAll('.bq-nav [data-route-link]')];
    const navLabels = navLinks.map(link => link.querySelector('small'));
    return {
      innerWidth,
      innerHeight,
      htmlScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      topbar: rect(document.querySelector('.bq-topbar')),
      brand: rect(document.querySelector('.bq-brand')),
      topActions: rect(document.querySelector('.bq-top-actions')),
      progressChip: rect(document.querySelector('[data-progress-chip]')),
      account: rect(document.querySelector('[data-session-open]')),
      nav: rect(document.querySelector('.bq-nav')),
      navCount: navLinks.length,
      navWidths: navLinks.map(link => rect(link)?.width || 0),
      navHeights: navLinks.map(link => rect(link)?.height || 0),
      navLabelFonts: navLabels.map(font),
      navLabels: navLabels.map(node => node?.textContent?.trim() || ''),
      firstNav: rect(navLinks[0]),
      lastNav: rect(navLinks.at(-1)),
      daily: rect(document.querySelector('[data-home-daily]')),
      dailyButton: rect(document.querySelector('[data-open-daily]')),
      dailyHeading: document.querySelector('[data-home-daily] h2')?.textContent?.trim() || '',
      heroSupportFont: font(document.querySelector('.bq-hero p:not(.bq-eyebrow)')),
      dailySupportFont: font(document.querySelector('[data-home-daily] p:not(.bq-eyebrow)')),
      bodyFont: font(document.body)
    };
  });

  assert(home.innerWidth === width, `Viewport width mismatch: expected ${width}, got ${home.innerWidth}.`);
  assert(home.htmlScrollWidth <= width + 1 && home.bodyScrollWidth <= width + 1, `${width}px Home has horizontal overflow: html=${home.htmlScrollWidth}, body=${home.bodyScrollWidth}.`);
  assert(home.topbar && home.topbar.left >= -1 && home.topbar.right <= width + 1, `${width}px topbar does not fit the viewport.`);
  assert(home.brand && home.topActions && home.brand.right <= home.topActions.left + 1, `${width}px topbar controls overlap/crowd.`);
  assert(home.account?.height >= 44 && home.account?.width >= 44, `${width}px account control is below practical 44px target.`);
  assert(home.progressChip?.width > 0, `${width}px progress status chip is missing.`);

  assert(home.navCount === 5, `${width}px current v3 shell must retain five primary nav destinations, got ${home.navCount}.`);
  assert(home.navLabels.join('|') === 'Home|Learn|Play|Grow|More', `${width}px current v3 primary navigation labels changed: ${home.navLabels.join('|')}.`);
  assert(approxEqual(home.navWidths), `${width}px primary navigation columns are not equal: ${home.navWidths.join(', ')}.`);
  assert(home.navHeights.every(value => value >= 44), `${width}px primary navigation contains a target below 44px: ${home.navHeights.join(', ')}.`);
  assert(home.navLabelFonts.every(value => value >= 10), `${width}px primary navigation label fell below 10px: ${home.navLabelFonts.join(', ')}.`);
  assert(home.firstNav?.left >= -1 && home.lastNav?.right <= width + 1, `${width}px primary navigation is clipped.`);

  assert(home.daily && home.dailyButton, `${width}px Daily Journey surface/CTA is missing.`);
  assert(/Continue My Journey/i.test(home.dailyHeading), `${width}px Daily Journey heading lost its primary hierarchy.`);
  assert(home.daily.top < home.innerHeight && home.dailyButton.top < home.innerHeight, `${width}px Daily Journey CTA is not discoverable in the initial viewport.`);
  assert(home.dailyButton.height >= 44, `${width}px Daily Journey CTA is below practical 44px target.`);
  assert(home.heroSupportFont >= 12 && home.dailySupportFont >= 12 && home.bodyFont >= 14, `${width}px critical supporting/body text is too small: hero=${home.heroSupportFont}, daily=${home.dailySupportFont}, body=${home.bodyFont}.`);

  for (const route of PRIMARY_ROUTES) {
    await page.goto(`${BASE}#/${route}`, { waitUntil: 'networkidle' });
    await page.locator(`[data-route-link="${route}"][aria-current]`).waitFor();
    const routeMetrics = await page.evaluate(() => ({
      innerWidth,
      htmlScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      mainRight: document.querySelector('.bq-main')?.getBoundingClientRect().right || 0,
      navRight: document.querySelector('.bq-nav')?.getBoundingClientRect().right || 0
    }));
    assert(routeMetrics.htmlScrollWidth <= width + 1 && routeMetrics.bodyScrollWidth <= width + 1, `${width}px #/${route} has horizontal overflow: html=${routeMetrics.htmlScrollWidth}, body=${routeMetrics.bodyScrollWidth}.`);
    assert(routeMetrics.mainRight <= width + 1 && routeMetrics.navRight <= width + 1, `${width}px #/${route} shell/main exceeds viewport.`);
  }

  assert(errors.length === 0, `${width}px current-v3 mobile acceptance produced errors: ${errors.join(' | ')}`);
  await page.close();
}

try {
  for (const width of WIDTHS) await verifyWidth(width);
  console.log(`BibleQuest v3 final mobile-width acceptance passed at ${WIDTHS.join('/')} px.`);
} finally {
  await browser.close();
}
