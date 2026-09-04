import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const localDate=(offset=0)=>{const d=new Date();d.setDate(d.getDate()+offset);const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);return x.toISOString().slice(0,10)};

try{
  await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});
  await page.waitForSelector('.today-journey-card');
  assert.equal(await page.locator('.modern-focus').evaluate(el=>getComputedStyle(el).display),'none','old competing Daily focus should be hidden');
  const home=await page.locator('.today-journey-card').innerText();
  assert.match(home,/Continue My Journey|Journey complete/);
  assert.match(home,/meaningful activity/i);
  assert.ok((await page.locator('.today-step-dots i').count())===5,'Daily Journey should expose five clear movements');
  assert.match(await page.locator('.journey-path-card').innerText(),/YOUR BIBLE JOURNEY/);
  assert.ok((await page.locator('.journey-node').count())===9,'visual Scripture path should expose nine eras');

  await page.locator('[data-journey-open]').click();
  await page.waitForSelector('#bqJourneyLoop:not(.hidden) .journey-task');
  assert.equal(await page.locator('#bqJourneyLoop .journey-task').count(),5,'journey should contain recall, context, learn, apply, reflect');
  const taskText=await page.locator('#bqJourneyLoop').innerText();
  for(const label of ['RECALL','CONTEXT','LEARN','APPLY','REFLECT'])assert.match(taskText,new RegExp(label));
  await page.locator('#bqJourneyLoop [data-journey-close]').click();

  await page.locator('[data-journey-support]').click();
  await page.waitForSelector('#bqJourneyLoop:not(.hidden) .support-grid');
  assert.match(await page.locator('#bqJourneyLoop').innerText(),/Anxiety \/ Worry/);
  assert.match(await page.locator('#bqJourneyLoop').innerText(),/Parenting/);
  assert.match(await page.locator('#bqJourneyLoop').innerText(),/Understanding Jesus/);
  await page.locator('[data-support="anxiety"]').click();
  await page.waitForSelector('#bqJourneyLoop:not(.hidden) .journey-task');
  assert.match(await page.locator('#bqJourneyLoop').innerText(),/Philippians 4:6/,'support choice should reshape today’s context task');
  await page.locator('#bqJourneyLoop [data-journey-close]').click();

  await page.locator('[data-journey-seasons]').click();
  await page.waitForSelector('#bqJourneyLoop:not(.hidden) .season-grid');
  const seasons=await page.locator('#bqJourneyLoop').innerText();
  assert.match(seasons,/7 Days With Jesus/);assert.match(seasons,/14 Days of Wisdom/);assert.match(seasons,/21 Days Through Acts/);assert.match(seasons,/Bible Detective: Exodus/);
  await page.locator('[data-season="jesus7"]').click();
  await page.waitForSelector('.journey-season');
  assert.match(await page.locator('.journey-season').innerText(),/7 Days With Jesus/);

  // Grace Day: simulate one missed calendar day, then record a meaningful activity.
  await page.evaluate(({yesterday2,today})=>{
    const g=JSON.parse(localStorage.getItem('biblequest_growth_v1')||'{}');
    const e=window.BQJourneyLoop.read();e.streak={count:5,lastMeaningful:yesterday2,graceByMonth:{}};g.engagementV2=e;localStorage.setItem('biblequest_growth_v1',JSON.stringify(g));
    window.BQJourneyLoop.recordMeaningful('smoke_grace');
  },{yesterday2:localDate(-2),today:localDate(0)});
  const grace=await page.evaluate(()=>window.BQJourneyLoop.read().streak);
  assert.ok(grace.count>=7,'one missed day should be protected by a Grace Day');
  assert.ok(Object.values(grace.graceByMonth||{}).some(v=>v===1),'Grace Day usage should be recorded');

  // Complete the mission through the public orchestration API and verify the teaching reward.
  await page.evaluate(()=>['recall','context','learn','apply','reflect'].forEach(id=>window.BQJourneyLoop.completeTask(id,'smoke')));
  await page.waitForTimeout(300);
  await page.evaluate(()=>window.BQJourneyLoop.open());
  await page.waitForSelector('#bqJourneyLoop:not(.hidden) [data-journey-reveal]');
  assert.match(await page.locator('#bqJourneyLoop').innerText(),/Journey Streak/);
  await page.locator('#bqJourneyLoop [data-journey-reveal]').click();
  await page.waitForSelector('#bqJourneyLoop:not(.hidden) .daily-reveal');
  const reveal=await page.locator('.daily-reveal').innerText();
  assert.match(reveal,/THE REWARD TEACHES TOO/);
  assert.match(reveal,/Acts|Ruth|Psalm|Timothy|Corinthians|Ephesians/);
  await page.locator('#bqJourneyLoop [data-journey-close]').click();

  await page.evaluate(()=>window.BQJourneyLoop.openRecap());
  await page.waitForSelector('#bqJourneyLoop:not(.hidden) .weekly-recap');
  assert.match(await page.locator('.weekly-recap').innerText(),/ONE OBJECTIVE FOR NEXT WEEK/);
  await page.locator('#bqJourneyLoop [data-journey-close]').click();

  await page.evaluate(()=>window.BQJourneyGroups.open());
  await page.waitForSelector('#bqJourneyGroups:not(.hidden)');
  assert.match(await page.locator('#bqJourneyGroups').innerText(),/Sign in to join your small group/);
  await page.locator('#bqJourneyGroups [data-group-close]').click();

  assert.equal(errors.length,0,`page errors: ${errors.join(' | ')}`);
  console.log('BibleQuest Daily Journey engagement smoke test passed');
} finally {await browser.close()}
