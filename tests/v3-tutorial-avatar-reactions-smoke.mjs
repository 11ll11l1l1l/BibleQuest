import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const expected = [
  ['welcome', '0% 0%'],
  ['down', '0% 100%'],
  ['up', '100% 0%'],
  ['thumbs', '33.333% 100%'],
  ['thoughtful', '100% 100%'],
  ['thumbs', '33.333% 100%']
];
const normalizePosition = value => String(value || '').trim().split(/\s+/).map(token => /^0(?:px|%)?$/.test(token) ? '0' : token).join(' ');
const samePosition = (actual, retained) => normalizePosition(actual) === normalizePosition(retained);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'allow' });
const page = await context.newPage();
const errors = [];
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', error => errors.push(error.message));

const trainerMetrics = () => page.evaluate(() => {
  const trainer = document.querySelector('.bq-tutorial-trainer');
  const visual = document.querySelector('.bq-tutorial-trainer-visual');
  const rect = visual?.getBoundingClientRect();
  const style = visual ? getComputedStyle(visual) : null;
  return {
    state: trainer?.dataset.trainerState || '',
    width: rect?.width || 0,
    height: rect?.height || 0,
    left: rect?.left || 0,
    right: rect?.right || 0,
    backgroundImage: style?.backgroundImage || '',
    backgroundSize: style?.backgroundSize || '',
    backgroundPosition: style?.backgroundPosition || '',
    animationName: style?.animationName || '',
    innerWidth,
    scrollWidth: document.documentElement.scrollWidth
  };
});

try {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('[data-bq-shell="v3"]').waitFor({ timeout: 10000 });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-bq-shell="v3"]').waitFor({ timeout: 10000 });
  assert(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), 'Trainer acceptance requires the existing offline-shell worker to control the page.');

  await page.locator('[data-open-tutorial]').click();
  await page.locator('[data-bq-tutorial-layer]').waitFor({ state: 'visible', timeout: 10000 });

  for (let step = 0; step < expected.length; step += 1) {
    const [state, position] = expected[step];
    const metrics = await trainerMetrics();
    assert(metrics.state === state, `Tutorial step ${step + 1} rendered ${metrics.state} instead of ${state}.`);
    assert(metrics.backgroundImage.includes('tutorial-trainer-sprite.webp'), `Tutorial step ${step + 1} did not render the retained trainer asset.`);
    assert(metrics.backgroundSize === '400% 200%', `Trainer sheet size changed at step ${step + 1}: ${metrics.backgroundSize}.`);
    assert(samePosition(metrics.backgroundPosition, position), `Trainer sheet position changed for ${state}: ${metrics.backgroundPosition} != ${position}.`);
    assert(Math.abs(metrics.width - 122) < 1 && Math.abs(metrics.height - 122) < 1, `Mobile trainer must remain 122px square; got ${metrics.width}x${metrics.height}.`);
    assert(metrics.left >= -1 && metrics.right <= metrics.innerWidth + 1, `Mobile trainer escaped the viewport at step ${step + 1}.`);
    assert(metrics.scrollWidth <= metrics.innerWidth + 1, `Trainer caused horizontal overflow at step ${step + 1}: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
    if (step < expected.length - 1) {
      await page.locator('[data-tutorial-next]').click();
      await page.waitForFunction(nextState => document.querySelector('.bq-tutorial-trainer')?.dataset.trainerState === nextState, expected[step + 1][0]);
    }
  }

  await page.locator('[data-tutorial-back]').click();
  await page.waitForFunction(() => document.querySelector('.bq-tutorial-trainer')?.dataset.trainerState === 'thoughtful');
  await page.locator('[data-tutorial-next]').click();
  await page.waitForFunction(() => document.querySelector('.bq-tutorial-trainer')?.dataset.trainerState === 'thumbs');

  await page.waitForFunction(async () => {
    const cacheName = (await caches.keys()).find(value => value.startsWith('biblequest-v3-offline-shell-'));
    if (!cacheName) return false;
    const cache = await caches.open(cacheName);
    return (await cache.keys()).some(request => request.url.includes('/assets/tutorial-trainer-sprite.webp'));
  }, null, { timeout: 10000 });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  let metrics = await trainerMetrics();
  assert(metrics.animationName === 'none', `Reduced-motion mode must disable trainer bob animation; got ${metrics.animationName}.`);
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  await page.locator('[data-tutorial-skip]').click();
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.locator('[data-bq-shell="v3"]').waitFor({ timeout: 10000 });
  await page.locator('[data-open-tutorial]').click();
  await page.locator('[data-bq-tutorial-layer]').waitFor({ state: 'visible', timeout: 5000 });
  const offlineImageLoaded = await page.evaluate(() => new Promise(resolve => {
    const image = new Image();
    const timer = setTimeout(() => resolve(false), 4000);
    image.onload = () => { clearTimeout(timer); resolve(true); };
    image.onerror = () => { clearTimeout(timer); resolve(false); };
    image.src = '/assets/tutorial-trainer-sprite.webp';
  }));
  assert(offlineImageLoaded, 'Retained trainer asset did not load from the verified offline-shell cache.');
  metrics = await trainerMetrics();
  assert(metrics.state === 'welcome', `Offline tutorial reopened with wrong trainer state: ${metrics.state}.`);
  assert(metrics.scrollWidth <= metrics.innerWidth + 1, 'Offline trainer presentation caused horizontal overflow.');

  assert(errors.length === 0, `Unexpected Tutorial trainer console/page errors: ${errors.join(' | ')}`);
  console.log('BibleQuest v3 Tutorial avatar/trainer mobile + reduced-motion + offline browser regression passed.');
} finally {
  await context.setOffline(false).catch(() => {});
  await browser.close();
}
