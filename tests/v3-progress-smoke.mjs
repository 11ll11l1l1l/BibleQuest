import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function desktopFlow() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('[data-progress-xp]', { hasText: '0 XP' }).waitFor();
  assert((await page.locator('[data-home-xp]').textContent()).trim() === '0', 'Home must start from the canonical progress snapshot.');

  await page.locator('[data-route-link="learn"]').click();
  await page.locator('[data-open-reader]').click();
  await page.waitForURL(/#\/reader$/);
  await page.locator('[data-reader-book]').selectOption('GEN');
  await page.locator('[data-verse="1"]').waitFor();
  await page.locator('[data-reader-mark]').click();
  await page.locator('[data-reader-message]', { hasText: '+10 XP' }).waitFor();
  await page.locator('[data-progress-xp]', { hasText: '10 XP' }).waitFor();
  assert((await page.locator('[data-progress-streak]').textContent()).includes('1 day streak'), 'First meaningful reader event must start streak.');

  await page.locator('[data-reader-mark]').click();
  await page.locator('[data-reader-message]', { hasText: 'Already marked read' }).waitFor();
  assert((await page.locator('[data-progress-xp]').textContent()).trim() === '10 XP', 'Repeated mark-read click duplicated XP.');
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-reader-mark]', { hasText: 'Marked read' }).waitFor();
  assert((await page.locator('[data-progress-xp]').textContent()).trim() === '10 XP', 'Reader XP did not persist across reload.');

  await page.locator('[data-route-link="grow"]').click();
  await page.waitForURL(/#\/grow$/);
  await page.locator('[data-progress-page]').waitFor();
  assert((await page.locator('[data-progress-page-xp]').textContent()).trim() === '10', 'Grow page XP is not sourced from progress service.');
  assert((await page.locator('[data-progress-page-streak]').textContent()).trim() === '1', 'Grow page streak is incorrect.');
  assert((await page.locator('[data-progress-page-activities]').textContent()).trim() === '1', 'Meaningful activity count is incorrect.');
  assert((await page.locator('[data-progress-page-chapters]').textContent()).trim() === '1', 'Reader chapter counter did not flow through progress service.');
  assert((await page.locator('[data-progress-badge="first-step"]').getAttribute('class')).includes('is-unlocked'), 'First Step badge did not render unlocked.');
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-progress-page-xp]', { hasText: '10' }).waitFor();
  await page.close();
}

async function mobileFlow() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}#/grow`, { waitUntil: 'networkidle' });
  await page.locator('[data-progress-page]').waitFor();
  const metrics = await page.evaluate(() => ({ innerWidth, scrollWidth: document.documentElement.scrollWidth, accountWidth: document.querySelector('[data-session-open]')?.getBoundingClientRect().width || 0, chipWidth: document.querySelector('[data-progress-chip]')?.getBoundingClientRect().width || 0 }));
  assert(metrics.scrollWidth <= metrics.innerWidth + 1, `Progress mobile horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.accountWidth >= 44, 'Progress shell change made account control too small.');
  assert(metrics.chipWidth >= 44, 'Progress status chip is too small to read on mobile.');
  await page.close();
}

try { await desktopFlow(); await mobileFlow(); console.log('BibleQuest v3 progress browser regression passed.'); }
finally { await browser.close(); }
