import { chromium } from 'playwright';

const baseUrl = process.env.BQ_PREVIEW_URL || 'http://127.0.0.1:4173';
const widths = [320, 360, 390, 412, 430, 1280];
const representativeRoutes = ['home', 'reader', 'assignments', 'calendar', 'more'];
const canonicalRoutes = [
  'home',
  'mission',
  'learn',
  'study',
  'deep-questions',
  'story-journey',
  'wisdom-situations',
  'adaptive-learning',
  'bible-world',
  'open-review',
  'private-notes',
  'cloud-notes',
  'couples-family',
  'couples-cloud',
  'journey-groups',
  'encouragements',
  'community',
  'live-rooms',
  'ministry-hub',
  'leader-center',
  'notification-center',
  'workspace',
  'team-center',
  'leaderboards',
  'recognition',
  'assignments',
  'content-review',
  'reader',
  'play',
  'grow',
  'my-journey',
  'transform',
  'personality-profile',
  'psychometrics',
  'avatar-vault',
  'my-mission',
  'calendar',
  'recordings',
  'media',
  'more',
  'help',
  'accessibility',
  'backup',
  'congregation',
  'account',
];

async function assertRoute(page, route, label) {
  await page.goto(`${baseUrl}/#/${route}`, { waitUntil: 'networkidle' });
  await page.locator('#app').waitFor({ state: 'attached' });
  await page.waitForFunction(() => document.querySelector('#app')?.textContent?.trim().length > 0);
  await page.waitForFunction(() => {
    const lazyRoute = document.querySelector('[data-lazy-route]');
    return !lazyRoute || lazyRoute.getAttribute('aria-busy') !== 'true';
  });
  const startupFailure = await page.locator('[data-startup-failure]').count();
  if (startupFailure) throw new Error(`${label} #/${route}: startup failure rendered`);
  const lazyFailure = await page.locator('[data-lazy-route] [role="alert"]').count();
  if (lazyFailure) throw new Error(`${label} #/${route}: lazy route module failed to load`);
  const resolvedHash = await page.evaluate(() => location.hash);
  if (resolvedHash !== `#/${route}`) throw new Error(`${label} #/${route}: resolved ${resolvedHash}`);
}

async function assertAutomatedAccessibility(page, label) {
  const violations = await page.evaluate(() => {
    const issues = [];
    const lang = document.documentElement.getAttribute('lang')?.trim();
    if (!lang) issues.push('document <html> is missing lang');

    const ids = [...document.querySelectorAll('[id]')].map(node => node.id).filter(Boolean);
    const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    if (duplicates.length) issues.push(`duplicate ids: ${duplicates.join(', ')}`);

    for (const image of document.querySelectorAll('img')) {
      if (!image.hasAttribute('alt')) issues.push(`img missing alt: ${image.currentSrc || image.src || '<inline>'}`);
    }

    const interactive = document.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [role="link"]');
    for (const element of interactive) {
      if (element.matches('[aria-hidden="true"], [hidden]')) continue;
      const labelledBy = element.getAttribute('aria-labelledby');
      const labelledText = labelledBy
        ? labelledBy.split(/\s+/).map(id => document.getElementById(id)?.textContent?.trim() || '').join(' ').trim()
        : '';
      const name = (
        element.getAttribute('aria-label')
        || labelledText
        || element.getAttribute('title')
        || element.getAttribute('alt')
        || element.textContent
        || element.getAttribute('value')
        || ''
      ).trim();
      if (!name) issues.push(`unnamed interactive element: ${element.outerHTML.slice(0, 180)}`);
    }

    for (const control of document.querySelectorAll('input:not([type="hidden"]), select, textarea')) {
      if (control.matches('[aria-hidden="true"], [hidden]')) continue;
      const id = control.id;
      const labelled = Boolean(
        control.getAttribute('aria-label')
        || control.getAttribute('aria-labelledby')
        || (id && document.querySelector(`label[for="${CSS.escape(id)}"]`))
        || control.closest('label')
      );
      if (!labelled) issues.push(`form control missing label: ${control.outerHTML.slice(0, 180)}`);
    }

    return issues;
  });
  if (violations.length) {
    throw new Error(`${label}: automated accessibility violations: ${violations.join(' | ')}`);
  }
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
    };
  });
  if (overflow.scrollWidth > overflow.clientWidth + 1) {
    throw new Error(
      `${label}: horizontal overflow ${overflow.scrollWidth}px > ${overflow.clientWidth}px viewport`,
    );
  }
}

const browser = await chromium.launch({ headless: true });
try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(String(error?.message || error)));

    for (const route of representativeRoutes) {
      await assertRoute(page, route, `${width}px`);
      await assertNoHorizontalOverflow(page, `${width}px #/${route}`);
      await assertAutomatedAccessibility(page, `${width}px #/${route}`);
    }

    if (pageErrors.length) throw new Error(`${width}px browser errors: ${pageErrors.join(' | ')}`);
    await context.close();
  }

  // Exercise every canonical route as a fresh built-artifact deep link. This
  // catches missing compatibility assets/imports and startup-only route
  // failures without pretending that signed-out CI is authenticated E2E.
  const deepLinkContext = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const deepLinkErrors = [];
  for (const route of canonicalRoutes) {
    const page = await deepLinkContext.newPage();
    page.on('pageerror', error => deepLinkErrors.push(`#/${route}: ${String(error?.message || error)}`));
    await assertRoute(page, route, '390px direct');
    await page.close();
  }
  if (deepLinkErrors.length) throw new Error(`390px canonical deep-link browser errors: ${deepLinkErrors.join(' | ')}`);
  await deepLinkContext.close();

  // Prove the first live V6 feature migration end to end. Accessibility keeps
  // the released local-storage/UI contract while mutations pass through the
  // V6 feature-command seam.
  const accessibilityContext = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const accessibilityPage = await accessibilityContext.newPage();
  const accessibilityErrors = [];
  accessibilityPage.on('pageerror', error => accessibilityErrors.push(String(error?.message || error)));
  await assertRoute(accessibilityPage, 'accessibility', '390px V6 accessibility migration');
  await accessibilityPage.selectOption('[data-accessibility-setting="text"]', 'xlarge');
  await accessibilityPage.selectOption('[data-accessibility-setting="motion"]', 'reduce');
  await accessibilityPage.selectOption('[data-accessibility-setting="contrast"]', 'strong');
  await accessibilityPage.waitForFunction(() => {
    const root = document.documentElement;
    return root.dataset.bqText === 'xlarge'
      && root.dataset.bqMotion === 'reduce'
      && root.dataset.bqContrast === 'strong'
      && root.dataset.bqEffectiveMotion === 'reduce';
  });
  const savedAccessibility = await accessibilityPage.evaluate(() => {
    const raw = localStorage.getItem('biblequest.v3.accessibility-settings');
    return raw ? JSON.parse(raw) : null;
  });
  if (
    savedAccessibility?.text !== 'xlarge'
    || savedAccessibility?.motion !== 'reduce'
    || savedAccessibility?.contrast !== 'strong'
  ) {
    throw new Error(`390px V6 accessibility migration: persisted state mismatch ${JSON.stringify(savedAccessibility)}`);
  }
  await accessibilityPage.reload({ waitUntil: 'networkidle' });
  await accessibilityPage.waitForFunction(() => {
    const text = document.querySelector('[data-accessibility-setting="text"]');
    const motion = document.querySelector('[data-accessibility-setting="motion"]');
    const contrast = document.querySelector('[data-accessibility-setting="contrast"]');
    return text?.value === 'xlarge' && motion?.value === 'reduce' && contrast?.value === 'strong';
  });
  if (accessibilityErrors.length) {
    throw new Error(`390px V6 accessibility migration browser errors: ${accessibilityErrors.join(' | ')}`);
  }
  await accessibilityContext.close();

  // Unknown routes must resolve through the application's not-found owner
  // while retaining the requested hash for refresh/deep-link diagnostics.
  const notFoundContext = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const notFoundPage = await notFoundContext.newPage();
  await assertRoute(notFoundPage, 'v6-route-does-not-exist', '390px unknown');
  const notFoundText = await notFoundPage.locator('#app').textContent();
  if (!/page not found/i.test(notFoundText || '')) throw new Error('390px unknown route: not-found UI missing');
  await notFoundContext.close();

  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/#/home`, { waitUntil: 'networkidle' });
  await page.waitForFunction(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const registration = await navigator.serviceWorker.getRegistration('./');
    return Boolean(registration);
  });
  const sw = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration('./');
    return registration ? { scope: registration.scope, active: Boolean(registration.active || registration.waiting || registration.installing) } : null;
  });
  if (!sw?.active) throw new Error('390px #/home: PWA service worker registration missing');
  await context.close();
} finally {
  await browser.close();
}

console.log(
  `Built-artifact browser parity passed: ${widths.join('/')}px representative routes with no document-level horizontal overflow and automated accessibility smoke; ${canonicalRoutes.length} canonical direct deep links + not-found at 390px; PWA registration verified at 390px.`,
);
