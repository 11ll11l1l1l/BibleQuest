import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(ok,message)=>{if(!ok)throw new Error(message)};

async function run(){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await context.addInitScript(()=>{
    localStorage.removeItem('biblequest.v3.personal-challenges-state-v1');
    localStorage.removeItem('biblequest.v3.auth.bq-personal-challenges-sync-owner-v1');
  });
  const page=await context.newPage();
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));

  await page.goto(BASE+'#/more',{waitUntil:'networkidle'});
  await page.locator('[data-open-challenges]').waitFor();
  await page.locator('[data-open-challenges]').click();
  await page.waitForURL(/#\/challenges$/);
  await page.locator('[data-personal-challenges-page]').waitFor();

  const card=page.locator('[data-personal-challenge-card="gospel7"]');
  assert(await card.count()===1,'More must open the active Personal Challenges page.');
  assert((await card.textContent()).includes('Not started'),'Fresh Gospel challenge must be visibly not started.');

  await page.locator('[data-personal-challenge-open="gospel7"]').click();
  await page.locator('[data-personal-challenge-start]').click();

  let day1=page.locator('[data-personal-challenge-day="1"]');
  let day2=page.locator('[data-personal-challenge-day="2"]');
  assert(await day1.getAttribute('data-personal-challenge-state')==='next','Day 1 must be the initial next step.');
  assert(await day2.getAttribute('data-personal-challenge-state')==='locked','Day 2 must start locked.');
  assert(await day2.locator('button').isDisabled(),'Future challenge days must be disabled.');
  assert(await day1.locator('[data-personal-challenge-reader]').count()===1,'Scripture-based next day must expose a Reader shortcut.');

  await day1.locator('[data-personal-challenge-complete="1"]').click();
  day2=page.locator('[data-personal-challenge-day="2"]');
  assert(await page.locator('[data-personal-challenge-day="1"]').getAttribute('data-personal-challenge-state')==='done','Completed day must stay done.');
  assert(await day2.getAttribute('data-personal-challenge-state')==='next','Day 2 must unlock only after day 1.');
  assert(await page.locator('[data-personal-challenge-day="3"]').getAttribute('data-personal-challenge-state')==='locked','Day 3 must remain locked.');

  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-personal-challenges-page]').waitFor();
  const resumedCard=page.locator('[data-personal-challenge-card="gospel7"]');
  const resumedText=await resumedCard.textContent();
  assert(resumedText.includes('1/7'),'Reloaded challenge card must preserve completed-day count.');
  assert(resumedText.includes('Resume'),'Reloaded challenge card must present Resume rather than Start.');
  await page.locator('[data-personal-challenge-open="gospel7"]').click();
  assert(await page.locator('[data-personal-challenge-day="2"]').getAttribute('data-personal-challenge-state')==='next','Reload must resume at the first unfinished day.');

  for(let day=2;day<=7;day++){
    await page.locator('[data-personal-challenge-complete="'+day+'"]').click();
  }
  assert(await page.locator('[data-personal-challenge-complete-note]').count()===1,'Finishing the last day must render terminal completion state.');
  assert(await page.locator('[data-personal-challenge-complete]').count()===0,'Completed challenge must not expose another completion action.');

  await page.locator('[data-personal-challenge-list]').click();
  const completeText=await page.locator('[data-personal-challenge-card="gospel7"]').textContent();
  assert(completeText.includes('7/7'),'Completed challenge card must show full completion.');
  assert(completeText.includes('Complete'),'Completed challenge card must show Complete.');
  assert(!completeText.includes('Resume'),'Completed challenge card must not say Resume.');

  assert(errors.length===0,'Unexpected Personal Challenge console/page errors: '+errors.join(' | '));
  await context.close();
}

try{
  await run();
  console.log('BibleQuest V5 active Personal Challenge browser lifecycle regression passed.');
}finally{
  await browser.close();
}
