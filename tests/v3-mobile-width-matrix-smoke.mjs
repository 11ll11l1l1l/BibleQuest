import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const WIDTHS = [320, 360, 390, 412, 430];
const browser = await chromium.launch({ headless: true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const SURFACES = [
  { route: 'home', ready: '[data-bq-shell="v3"]', detail: 'h1' },
  { route: 'account', ready: '[data-account-login]', detail: '[data-account-mode="signup"]' },
  { route: 'reader', ready: '[data-reader-page]', detail: '[data-verse]' },
  { route: 'play', ready: '[data-games-page]', detail: '[data-game-launch]' },
  { route: 'transform', ready: '[data-transform-page]', detail: '[data-transform-item]' }
];

function normalizeBase(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

async function inspectSurface(page, width, surface) {
  const routeUrl = `${normalizeBase(BASE)}#/${surface.route}`;
  await page.goto(routeUrl, { waitUntil: 'networkidle' });
  await page.locator(surface.ready).first().waitFor({ state: 'visible' });
  await page.locator(surface.detail).first().waitFor({ state: 'visible' });
  await page.locator('[data-session-label]', { hasText: 'Guest' }).waitFor();

  const metrics = await page.evaluate(() => {
    const visible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) !== 0 && rect.width > 0 && rect.height > 0;
    };
    const describe = element => {
      const attrs = ['data-route-link', 'data-session-open', 'data-account-mode', 'data-game-launch', 'data-transform-rating', 'name'];
      for (const attr of attrs) {
        const value = element.getAttribute(attr);
        if (value) return `${element.tagName.toLowerCase()}[${attr}="${value}"]`;
      }
      return `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.classList.length ? `.${[...element.classList].slice(0, 2).join('.')}` : ''}`;
    };

    const controls = [...document.querySelectorAll('button, a[href], input, select, textarea')]
      .filter(visible)
      .map(element => {
        const rect = element.getBoundingClientRect();
        return { label: describe(element), left: rect.left, right: rect.right, width: rect.width, height: rect.height };
      });
    const clippedControls = controls.filter(item => item.left < -1 || item.right > innerWidth + 1);
    const nav = document.querySelector('.bq-nav');
    const navRect = nav?.getBoundingClientRect() || null;
    const account = document.querySelector('[data-session-open]');
    const accountRect = account?.getBoundingClientRect() || null;
    const main = document.querySelector('main');
    const mainRect = main?.getBoundingClientRect() || null;

    return {
      innerWidth,
      htmlScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body?.scrollWidth || 0,
      nav: navRect ? { left: navRect.left, right: navRect.right, height: navRect.height } : null,
      account: accountRect ? { left: accountRect.left, right: accountRect.right, width: accountRect.width, height: accountRect.height } : null,
      main: mainRect ? { left: mainRect.left, right: mainRect.right, width: mainRect.width } : null,
      clippedControls
    };
  });

  assert(metrics.htmlScrollWidth <= width + 1, `${surface.route}@${width}: document overflow ${metrics.htmlScrollWidth}px > ${width}px.`);
  assert(metrics.bodyScrollWidth <= width + 1, `${surface.route}@${width}: body overflow ${metrics.bodyScrollWidth}px > ${width}px.`);
  assert(metrics.nav, `${surface.route}@${width}: primary navigation missing.`);
  assert(metrics.nav.left >= -1 && metrics.nav.right <= width + 1, `${surface.route}@${width}: primary navigation escapes viewport (${metrics.nav.left}..${metrics.nav.right}).`);
  assert(metrics.nav.height >= 60, `${surface.route}@${width}: primary navigation is too short for the established mobile contract (${metrics.nav.height}px).`);
  assert(metrics.account, `${surface.route}@${width}: account control missing.`);
  assert(metrics.account.left >= -1 && metrics.account.right <= width + 1, `${surface.route}@${width}: account control escapes viewport.`);
  assert(metrics.account.width >= 44 && metrics.account.height >= 44, `${surface.route}@${width}: account touch target is below 44px (${metrics.account.width}x${metrics.account.height}).`);
  assert(metrics.main && metrics.main.left >= -1 && metrics.main.right <= width + 1, `${surface.route}@${width}: main content escapes viewport (${metrics.main?.left}..${metrics.main?.right}).`);
  assert(metrics.clippedControls.length === 0, `${surface.route}@${width}: horizontally clipped controls: ${metrics.clippedControls.map(item => `${item.label}(${Math.round(item.left)}..${Math.round(item.right)})`).join(', ')}`);
}

try {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
    for (const surface of SURFACES) await inspectSurface(page, width, surface);
    await page.close();
  }
  console.log(`BibleQuest v3 mobile width matrix passed at ${WIDTHS.join('/')}px across Home, Account, Reader, Games, and Transform.`);
} finally {
  await browser.close();
}
