import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:360,height:800}});
page.setDefaultTimeout(12000);
const errors=[];
page.on('pageerror',e=>errors.push(e.message));

async function closeModernSheet(){
  const close=page.locator('#bqModernSheet:not(.hidden) [data-modern-close]').first();
  if(await close.count())await close.click();
}

async function openTransformFromGrow(){
  await page.waitForSelector('.today-journey-card');
  await page.locator('[data-modern-hub="grow"]').click();
  await page.getByRole('button',{name:/Transformation/}).click();
  await page.waitForURL(/\/transform\.html$/);
  await page.waitForSelector('.bq-transform-v2');
}

try{
  await page.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.modern-home');
  await page.waitForSelector('.today-journey-card');

  // Hub routing must never silently no-op if one optional feature module is absent.
  // Simulate a failed Grow module through the real Home -> Grow -> Bible World click path.
  const originalWorld=await page.evaluate(()=>window.BQWorld);
  await page.evaluate(()=>{window.BQWorld=undefined});
  await page.locator('[data-modern-hub="grow"]').click();
  await page.getByRole('button',{name:/Bible World/}).click();
  await page.waitForSelector('.modern-feature-failure');
  assert.match(await page.locator('.modern-feature-failure').innerText(),/Feature unavailable right now/);
  assert.match(await page.locator('#bqModernSheet').innerText(),/Bible World could not open/);
  assert.ok(await page.getByRole('button',{name:/Try again/}).isVisible(),'failed feature must expose a retry path');
  await closeModernSheet();
  assert.ok(await page.locator('.today-journey-card').isVisible(),'feature failure must not kill the Home shell');
  await page.evaluate(value=>{window.BQWorld=value},originalWorld);

  // Selector-backed features need the same visible recovery instead of closing the hub and doing nothing.
  await page.locator('[data-reader-open]').evaluate(el=>el.dataset.operationalSaved='1');
  await page.locator('[data-reader-open]').evaluate(el=>el.removeAttribute('data-reader-open'));
  await page.locator('[data-modern-hub="read"]').click();
  await page.getByRole('button',{name:/Bible Reader/}).click();
  await page.waitForSelector('.modern-feature-failure');
  assert.match(await page.locator('#bqModernSheet').innerText(),/Bible Reader could not open/);
  await closeModernSheet();
  await page.locator('[data-operational-saved="1"]').evaluate(el=>{el.setAttribute('data-reader-open','');delete el.dataset.operationalSaved});

  // A feature API that exists but rejects must also degrade visibly without an unhandled page failure.
  const originalMission=await page.evaluate(()=>window.BQMission);
  await page.evaluate(()=>{window.BQMission={open:()=>Promise.reject(new Error('simulated mission failure'))}});
  await page.locator('[data-modern-hub="grow"]').click();
  await page.getByRole('button',{name:/My Mission/}).click();
  await page.waitForSelector('.modern-feature-failure');
  assert.match(await page.locator('#bqModernSheet').innerText(),/My Mission could not open/);
  await closeModernSheet();
  await page.evaluate(value=>{window.BQMission=value},originalMission);

  // Exact user path: Home -> Grow -> Transformation must navigate to the isolated
  // standalone Transform document instead of trying to mount inside the main SPA.
  await openTransformFromGrow();
  assert.equal(await page.evaluate(()=>window.BQ_TRANSFORMATION?.mode),'rebuilt-v2');
  assert.match(await page.locator('.bq-transform-v2').innerText(),/Personality Foundations/);
  assert.match(await page.locator('.bq-transform-v2').innerText(),/Thinking Patterns Check/);
  assert.match(await page.locator('.bq-transform-v2').innerText(),/Reflection & Action Plan/);

  const alive=await page.evaluate(()=>new Promise(resolve=>setTimeout(()=>resolve('alive'),100)));
  assert.equal(alive,'alive','standalone Transform must leave the browser event loop responsive');

  await page.getByRole('button',{name:/Personality Foundations/}).click();
  await page.getByRole('button',{name:/Begin assessment/}).click();
  await page.waitForSelector('[data-t2-rate]');
  for(const id of ['E1','A1','C1','S1','O1'])await page.locator(`[data-t2-rate="${id}"][data-value="3"]`).click();
  assert.equal(await page.locator('[data-t2-personality-next]').isDisabled(),false,'first personality page should unlock after all five responses');
  await page.locator('[data-t2-personality-next]').click();
  assert.match(await page.locator('.bq-t2-heading h1').innerText(),/Page 2 of 4/);

  // Escape must always return to the main shell and leave saved progress intact.
  await page.keyboard.press('Escape');
  await page.waitForURL(url=>!url.pathname.endsWith('/transform.html'));
  await page.waitForSelector('.modern-home');

  await openTransformFromGrow();
  await page.getByRole('button',{name:/Personality Foundations/}).click();
  assert.match(await page.locator('.bq-t2-panel').innerText(),/Continue \(5\/20 answered\)/);

  await page.locator('[data-t2-home]').click();
  await page.getByRole('button',{name:/Reflection Journal/}).click();
  await page.locator('[data-t2-noticed]').fill('I rush when I feel pressure.');
  await page.locator('[data-t2-action]').fill('Pause and ask one clarifying question.');
  await page.locator('[data-t2-prayer]').fill('James 1:22');
  await page.locator('[data-t2-save]').click();
  assert.match(await page.locator('[data-t2-status]').innerText(),/Saved privately on this device/);

  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('biblequest_transform_v2')||'{}'));
  assert.equal(saved.version,2);
  assert.equal(saved.personality.answers.E1,3);
  assert.equal(saved.reflection.action,'Pause and ask one clarifying question.');

  // The explicit Close control must also return cleanly.
  await page.locator('[data-t2-close]').click();
  await page.waitForURL(url=>!url.pathname.endsWith('/transform.html'));
  await page.waitForSelector('.modern-home');

  // Transform -> Reader must survive the document transition and consume its one-shot return action.
  await openTransformFromGrow();
  await page.locator('[data-t2-reader]').click();
  await page.waitForURL(url=>!url.pathname.endsWith('/transform.html'));
  await page.waitForSelector('[data-reader-book="GEN"]');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('bq_transform_return_action')),null,'Reader return action must be consumed once');
  await page.locator('[data-reader-close]').first().click();
  await page.waitForSelector('.today-journey-card');

  // Transform -> Situations & Wisdom must use the same recoverable one-shot return mechanism.
  await openTransformFromGrow();
  await page.getByRole('button',{name:/Reflection & Action Plan/}).click();
  await page.locator('[data-t2-wisdom]').click();
  await page.waitForURL(url=>!url.pathname.endsWith('/transform.html'));
  await page.waitForSelector('.question-card');
  assert.match(await page.locator('.question-card .eyebrow').innerText(),/Situations & Wisdom/);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('bq_transform_return_action')),null,'Wisdom return action must be consumed once');

  assert.equal(errors.length,0,`page errors: ${errors.join(' | ')}`);
  console.log('BibleQuest operational entry + standalone Transform smoke passed');
} finally {
  await browser.close();
}
