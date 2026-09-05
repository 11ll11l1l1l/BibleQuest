import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:360,height:800}});
page.setDefaultTimeout(12000);
const errors=[];
page.on('pageerror',e=>errors.push(e.message));

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
  console.log('BibleQuest standalone Transform operational smoke passed');
} finally {
  await browser.close();
}
