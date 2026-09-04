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

  // Exact incident path: the bottom Transform tab must open from a clean/new browser and must
  // remain responsive. This catches MutationObserver feedback loops that can freeze/crash the tab.
  await page.waitForSelector('[data-transform-tab]');
  await page.locator('[data-transform-tab]').click();
  await page.waitForSelector('.bq-transform-overlay');
  assert.match(await page.locator('.bq-transform-overlay').innerText(),/Personality Foundations/);
  const eventLoopAlive=await page.evaluate(()=>new Promise(resolve=>setTimeout(()=>resolve('alive'),60)));
  assert.equal(eventLoopAlive,'alive','opening Transform must not create a DOM-mutation feedback loop');
  assert.equal(await page.locator('[data-transform-safe-close]').count(),1,'Transformation must have an obvious safe close control');
  await page.locator('[data-transform-safe-close]').click();
  await page.waitForFunction(()=>!document.querySelector('.bq-transform-overlay'));

  // Reproduce stale/incompatible saved data. The pre-load state guard must normalize it before
  // transformation.js captures its in-memory state so the first click cannot reuse a corrupt result.
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
  await page.waitForSelector('.bq-transform-overlay');
  assert.match(await page.locator('.bq-transform-overlay').innerText(),/Personality Foundations/);
  assert.match(await page.locator('.local-chip').innerText(),/private on this device/i);
  assert.equal(await page.locator('[data-transform-safe-close]').count(),1,'Transformation must keep the safe close control after state repair');
  assert.equal(await page.locator('.bq-operational-recovery').count(),0,'repairable stale Transformation state must not crash the feature');
  const repairedLoopAlive=await page.evaluate(()=>new Promise(resolve=>setTimeout(()=>resolve('alive'),60)));
  assert.equal(repairedLoopAlive,'alive','repaired Transform must remain responsive after opening');

  const repaired=await page.evaluate(()=>JSON.parse(localStorage.getItem('biblequest_transformation_v1')||'{}'));
  assert.equal(repaired.personalityResult,null,'invalid legacy personality result should be discarded without deleting partial answers');
  assert.equal(repaired.biasResult,null,'invalid legacy bias result should be discarded without deleting answers');
  assert.deepEqual(repaired.calibration,{},'invalid calibration storage should be normalized');
  assert.equal(repaired.personalityAnswers.E1,4,'valid partial answers should survive state repair');

  await page.locator('[data-transform-safe-close]').click();
  await page.waitForFunction(()=>!document.querySelector('.bq-transform-overlay'));
  assert.ok(await page.locator('.today-journey-card').count(),'closing a feature must return to a usable BibleQuest shell');

  // Grow -> Transformation uses the public API route and must remain healthy too.
  await page.locator('[data-modern-hub="grow"]').click();
  await page.getByRole('button',{name:/Transformation/}).click();
  await page.waitForSelector('.bq-transform-overlay');
  assert.match(await page.locator('.bq-transform-overlay').innerText(),/Cognitive Bias Lab/);
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
