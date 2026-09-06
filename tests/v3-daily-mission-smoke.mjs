import { chromium } from 'playwright';

const BASE = process.env.BQ_BASE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless:true });
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function desktopFlow() {
  const page = await browser.newPage({ viewport:{ width:1280, height:900 } });
  let supabaseRequests = 0;
  page.on('request', request => { if (request.url().includes('supabase.co')) supabaseRequests++; });
  await page.goto(BASE, { waitUntil:'networkidle' });
  await page.locator('[data-home-daily]').waitFor();
  await page.locator('[data-open-daily]').click();
  await page.waitForURL(/#\/mission$/);
  await page.locator('[data-daily-step="retrieve"]').waitFor();

  await page.locator('[data-daily-choice]').first().click();
  await page.locator('[data-daily-feedback]').waitFor();
  await page.locator('[data-progress-xp]', { hasText:'12 XP' }).waitFor();
  await page.locator('[data-daily-next]').click();
  await page.locator('[data-daily-step="context"]').waitFor();
  await page.reload({ waitUntil:'networkidle' });
  await page.locator('[data-daily-step="context"]').waitFor();
  assert((await page.locator('[data-progress-xp]').textContent()).trim() === '12 XP', 'Daily Retrieve XP did not survive reload.');

  await page.locator('[data-daily-open-reader]').click();
  await page.waitForURL(/#\/reader$/);
  await page.locator('[data-reader-page] h1', { hasText:'Bible Reader' }).waitFor();
  await page.goBack();
  await page.waitForURL(/#\/mission$/);
  await page.locator('[data-daily-step="context"]').waitFor();
  await page.locator('[data-daily-confirm]').click();
  await page.locator('[data-daily-feedback]').waitFor();
  await page.locator('[data-daily-next]').click();

  await page.locator('[data-daily-step="learn"]').waitFor();
  await page.locator('[data-daily-confirm]').click();
  await page.locator('[data-daily-next]').click();
  await page.locator('[data-daily-step="apply"]').waitFor();
  await page.locator('[data-daily-text-form] textarea').fill('Practice one concrete act of obedience today.');
  await page.locator('[data-daily-save]').click();
  await page.locator('[data-daily-next]').click();
  await page.locator('[data-daily-step="reflect"]').waitFor();
  await page.locator('[data-daily-text-form] textarea').fill('Remember the passage and put it into practice.');
  await page.locator('[data-daily-save]').click();
  await page.locator('[data-daily-next]').click();
  await page.locator('[data-daily-complete]').waitFor();
  await page.locator('[data-progress-xp]', { hasText:'69 XP' }).waitFor();
  assert((await page.locator('[data-progress-streak]').textContent()).includes('1 day streak'), 'Daily Journey did not protect the streak.');
  await page.reload({ waitUntil:'networkidle' });
  await page.locator('[data-daily-complete]').waitFor();
  assert((await page.locator('[data-progress-xp]').textContent()).trim() === '69 XP', 'Reload duplicated or lost Daily Journey completion XP.');
  assert(supabaseRequests === 0, 'Guest Daily Journey must not create cloud/Supabase traffic.');
  await page.close();
}

async function mobileFlow() {
  const page = await browser.newPage({ viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true });
  await page.goto(`${BASE}#/mission`, { waitUntil:'networkidle' });
  await page.locator('[data-daily-page]').waitFor();
  const metrics = await page.evaluate(() => ({
    innerWidth,
    scrollWidth:document.documentElement.scrollWidth,
    actionHeight:document.querySelector('[data-daily-choice],[data-daily-confirm],[data-daily-save],[data-daily-next]')?.getBoundingClientRect().height || 0
  }));
  assert(metrics.scrollWidth <= metrics.innerWidth + 1, `Daily Journey mobile horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.actionHeight >= 44, 'Daily Journey primary interaction is below the mobile touch-target contract.');
  await page.close();
}

try { await desktopFlow(); await mobileFlow(); console.log('BibleQuest v3 Daily Mission browser regression passed.'); }
finally { await browser.close(); }
