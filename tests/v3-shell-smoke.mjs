import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });

async function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function coreServiceFlow(page) {
  const result = await page.evaluate(async () => {
    const [{ createStore }, { storage }] = await Promise.all([
      import('/src/app/store.js'),
      import('/src/core/storage.js')
    ]);

    const store = createStore({ route: 'home', count: 0 });
    let notifications = 0;
    const unsubscribe = store.subscribe(() => notifications++);
    store.setState(current => ({ ...current, route: 'learn', count: current.count + 1 }));
    unsubscribe();
    store.setState(current => ({ ...current, count: current.count + 1 }));

    storage.write('smoke', { ok: true, value: 7 });
    const stored = storage.read('smoke');
    localStorage.setItem('biblequest.v3.corrupt', '{not-json');
    const corruptFallback = storage.read('corrupt', { safe: true });
    localStorage.setItem('unrelated.key', 'keep');
    storage.remove('smoke');

    return {
      state: store.getState(),
      notifications,
      frozen: Object.isFrozen(store.getState()),
      stored,
      corruptFallback,
      unrelated: localStorage.getItem('unrelated.key'),
      removed: storage.read('smoke', null)
    };
  });

  assert(result.state.route === 'learn' && result.state.count === 2, 'Global store state transitions failed.');
  assert(result.notifications === 1, 'Global store subscription/unsubscribe contract failed.');
  assert(result.frozen, 'Global store snapshots must be frozen.');
  assert(result.stored?.ok === true && result.stored?.value === 7, 'Storage write/read contract failed.');
  assert(result.corruptFallback?.safe === true, 'Storage malformed-data recovery failed.');
  assert(result.unrelated === 'keep', 'Storage boundary modified an unrelated browser key.');
  assert(result.removed === null, 'Storage remove contract failed.');
}

async function desktopFlow() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('[data-bq-shell="v3"]').waitFor();
  assert(await page.locator('[data-bq-shell="v3"]').count() === 1, 'Shell must mount exactly once.');
  assert((await page.locator('h1').first().textContent())?.trim() === 'BibleQuest', 'Home must render BibleQuest heading.');
  await coreServiceFlow(page);

  await page.locator('[data-route-link="learn"]').click();
  await page.waitForURL(/#\/learn$/);
  await page.locator('h1', { hasText: 'Learn' }).waitFor();
  assert((await page.locator('h1').first().textContent())?.trim() === 'Learn', 'Learn route did not render.');
  assert(await page.locator('[data-route-link="learn"][aria-current]').count() === 1, 'Active nav state missing for Learn.');

  await page.reload({ waitUntil: 'networkidle' });
  assert((await page.locator('h1').first().textContent())?.trim() === 'Learn', 'Deep-link reload did not preserve Learn route.');
  assert(await page.locator('[data-bq-shell="v3"]').count() === 1, 'Reload created duplicate shell.');

  await page.locator('[data-route-link="play"]').click();
  await page.locator('h1', { hasText: 'Play' }).waitFor();
  await page.goBack();
  await page.waitForURL(/#\/learn$/);
  await page.locator('h1', { hasText: 'Learn' }).waitFor();
  assert((await page.locator('h1').first().textContent())?.trim() === 'Learn', 'Browser back did not restore Learn.');

  await page.goForward();
  await page.waitForURL(/#\/play$/);
  await page.locator('h1', { hasText: 'Play' }).waitFor();
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
    await page.locator('h1').waitFor();
    assert(await page.locator(`[data-route-link="${route}"][aria-current]`).count() === 1, `Mobile active nav missing for ${route}.`);
  }
  await page.close();
}

try {
  await desktopFlow();
  await mobileFlow();
  console.log('BibleQuest v3 foundation browser regression passed.');
} finally {
  await browser.close();
}
