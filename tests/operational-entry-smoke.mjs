import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:360,height:800}});
page.setDefaultTimeout(12000);
const errors=[];
page.on('pageerror',e=>errors.push(e.message));

try{
  await page.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.modern-home');
  await page.waitForSelector('.today-journey-card');
  await page.waitForFunction(()=>Boolean(window.BQOperational?.health));

  const health=await page.evaluate(()=>window.BQOperational.health());
  const missing=Object.entries(health).filter(([,ok])=>!ok).map(([name])=>name);
  assert.deepEqual(missing,[],`top-level feature entry points must be available: ${missing.join(', ')}`);

  // Exact user path: the bottom Transform tab must open a lightweight isolated page and leave
  // the event loop responsive. The legacy assessment runtime is intentionally not production-loaded.
  await page.waitForSelector('[data-transform-tab]');
  await page.locator('[data-transform-tab]').click();
  await page.waitForSelector('.bq-transform-safe-page');
  assert.match(await page.locator('.bq-transform-safe-page').innerText(),/Turn what you learn into one faithful next step/);
  const eventLoopAlive=await page.evaluate(()=>new Promise(resolve=>setTimeout(()=>resolve('alive'),80)));
  assert.equal(eventLoopAlive,'alive','opening Transform must leave the browser event loop responsive');
  assert.equal(await page.locator('[data-transform-safe-close]').count(),1,'Transform must have an obvious close control');

  await page.locator('[data-transform-notice]').fill('Remember the passage context.');
  await page.locator('[data-transform-action]').fill('Practice one concrete action today.');
  await page.locator('[data-transform-save]').click();
  assert.match(await page.locator('[data-transform-save-status]').innerText(),/Saved on this device/);
  await page.locator('[data-transform-safe-close]').click();
  await page.waitForFunction(()=>!document.querySelector('.bq-transform-overlay'));

  // Stale legacy assessment data may exist from previous builds. It must be sanitized before the
  // safe Transform page opens and it must never be evaluated by the retired production runtime.
  await page.evaluate(()=>localStorage.setItem('biblequest_transformation_v1',JSON.stringify({
    personalityAnswers:{E1:4},
    personalityResult:{date:'old-build',scores:null},
    biasAnswers:{sunk:1},
    calibration:null,
    biasResult:{date:'old-build',resistance:'bad'},
    history:null
  })));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('.modern-home');
  await page.waitForSelector('[data-transform-tab]');
  await page.locator('[data-transform-tab]').click();
  await page.waitForSelector('.bq-transform-safe-page');
  const repairedLoopAlive=await page.evaluate(()=>new Promise(resolve=>setTimeout(()=>resolve('alive'),80)));
  assert.equal(repairedLoopAlive,'alive','Transform must remain responsive with stale legacy data present');
  const repaired=await page.evaluate(()=>JSON.parse(localStorage.getItem('biblequest_transformation_v1')||'{}'));
  assert.equal(repaired.personalityResult,null,'invalid legacy personality result should be discarded without deleting partial answers');
  assert.equal(repaired.biasResult,null,'invalid legacy bias result should be discarded without deleting answers');
  assert.deepEqual(repaired.calibration,{},'invalid calibration storage should be normalized');
  assert.equal(repaired.personalityAnswers.E1,4,'valid partial answers should survive state repair');
  await page.locator('[data-transform-safe-close]').click();

  // Grow -> Transformation must use the same isolated safe renderer.
  await page.locator('[data-modern-hub="grow"]').click();
  await page.getByRole('button',{name:/Transformation/}).click();
  await page.waitForSelector('.bq-transform-safe-page');
  assert.match(await page.locator('.bq-transform-safe-page').innerText(),/Situations & Wisdom/);
  assert.equal(await page.evaluate(()=>window.BQ_TRANSFORMATION?.mode),'safe-application-v1');
  await page.locator('[data-transform-safe-close]').click();
  await page.waitForFunction(()=>!document.querySelector('.bq-transform-overlay'));

  // Missing modules must fail visibly instead of closing a menu and appearing to crash/do nothing.
  await page.evaluate(()=>{window.__bqSavedAvatarOpen=window.BQAvatarVault.open;delete window.BQAvatarVault.open});
  await page.locator('[data-modern-hub="grow"]').click();
  await page.getByRole('button',{name:/Avatar Vault/}).click();
  await page.waitForSelector('.bq-operational-recovery');
  assert.match(await page.locator('.bq-operational-recovery').innerText(),/Avatar Vault recovered from an error|entry point did not load/i);
  assert.ok(await page.locator('.today-journey-card').count(),'main app must remain mounted after a feature entry failure');
  await page.locator('.bq-operational-close').click();
  await page.evaluate(()=>{window.BQAvatarVault.open=window.__bqSavedAvatarOpen;delete window.__bqSavedAvatarOpen});

  assert.equal(errors.length,0,`page errors: ${errors.join(' | ')}`);
  console.log('BibleQuest operational feature-entry smoke passed');
} finally {
  await browser.close();
}
