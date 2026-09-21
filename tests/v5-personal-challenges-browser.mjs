import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(ok,message)=>{if(!ok)throw new Error(message)};

async function loadLegacyChallenges(page){
  await page.addScriptTag({url:new URL('innovation-suite.js',BASE).href});
  await page.waitForFunction(()=>typeof window.BQChallenges?.open==='function');
}

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    localStorage.removeItem('biblequest_personal_challenges_v1');
    localStorage.removeItem('biblequest_personal_challenges_owner_v1');
    for(let i=localStorage.length-1;i>=0;i--){
      const key=localStorage.key(i);
      if(key?.startsWith('biblequest_personal_challenges_cache_v1:'))localStorage.removeItem(key);
    }
  });
  await loadLegacyChallenges(page);

  await page.evaluate(()=>window.BQChallenges.open());
  await page.locator('[data-challenge-template="0"]').click();
  await page.locator('[data-challenge-personal]').click();

  let state=await page.evaluate(()=>JSON.parse(localStorage.getItem('biblequest_personal_challenges_v1')||'{}'));
  assert(Boolean(state.gospel7?.startedAt),'Starting a Personal Challenge must persist startedAt before day 1 is completed.');
  assert((state.gospel7?.done||[]).length===0,'Starting a Personal Challenge must not silently complete day 1.');

  const day1=page.locator('[data-personal-challenge-day="1"]');
  const day2=page.locator('[data-personal-challenge-day="2"]');
  assert(await day1.getAttribute('data-personal-challenge-state')==='next','Day 1 must be the initial next step.');
  assert(!(await day1.isDisabled()),'The first unfinished day must be enabled.');
  assert(await day2.getAttribute('data-personal-challenge-state')==='locked','Day 2 must start locked.');
  assert(await day2.isDisabled(),'Future challenge days must be disabled.');

  await day1.click();
  state=await page.evaluate(()=>JSON.parse(localStorage.getItem('biblequest_personal_challenges_v1')||'{}'));
  assert(JSON.stringify(state.gospel7.done)==='["1"]','Completing day 1 must persist exactly day 1.');
  assert(await page.locator('[data-personal-challenge-day="2"]').getAttribute('data-personal-challenge-state')==='next','Day 2 must unlock after day 1.');
  assert(await page.locator('[data-personal-challenge-day="3"]').isDisabled(),'Day 3 must remain locked while day 2 is unfinished.');

  await page.reload({waitUntil:'domcontentloaded'});
  await loadLegacyChallenges(page);
  await page.evaluate(()=>window.BQChallenges.open());
  const listText=await page.locator('[data-challenge-template="0"]').textContent();
  assert(listText.includes('1/7 complete · Resume'),'Reloaded challenge list must show resumable progress.');
  await page.locator('[data-challenge-template="0"]').click();
  assert((await page.locator('[data-challenge-personal]').textContent()).includes('Resume personal challenge'),'Started challenge must offer Resume after reload.');
  await page.locator('[data-challenge-personal]').click();
  assert(await page.locator('[data-personal-challenge-day="2"]').getAttribute('data-personal-challenge-state')==='next','Reload must resume at the first unfinished day.');

  for(let day=2;day<=7;day++)await page.locator('[data-personal-challenge-day="'+day+'"]').click();
  assert((await page.locator('.innovation-note').textContent()).includes('Challenge complete'),'Finishing the last day must render completed state.');

  await page.locator('[data-challenge-back]').click();
  assert((await page.locator('[data-challenge-personal]').textContent()).includes('View completed challenge'),'Completed template must not offer Resume.');
  await page.locator('[data-challenge-back]').click();
  const completeListText=await page.locator('[data-challenge-template="0"]').textContent();
  assert(completeListText.includes('7/7 complete'),'Completed challenge list must show full completion.');
  assert(!completeListText.includes('Resume'),'Completed challenge list must not say Resume.');

  assert(errors.length===0,'Unexpected Personal Challenge page errors: '+errors.join(' | '));
  await page.close();
}

try{await run();console.log('BibleQuest V5 Personal Challenge browser lifecycle regression passed.')}finally{await browser.close()}
