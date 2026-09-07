import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const progressState=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('biblequest.v3.progress-state')||'{"xp":0,"counters":{"quizCorrect":0,"situations":0},"events":{}}'));

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.addInitScript(()=>{Math.random=()=>0});
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});await page.locator('[data-route-link="learn"]').click();await page.waitForURL(/#\/learn$/);await page.locator('[data-open-wisdom-situations]').waitFor();
  assert((await page.locator('main h1').first().textContent())?.trim()==='Learn','Wisdom integration broke the stable Learn heading.');assert((await page.locator('[data-open-wisdom-situations]').textContent())?.includes('Wisdom Situations'),'Learn page does not expose Wisdom Situations.');
  await page.locator('[data-open-wisdom-situations]').click();await page.waitForURL(/#\/wisdom-situations$/);await page.locator('[data-wisdom-session="hw01"]').waitFor();
  assert((await page.locator('[data-wisdom-session="hw01"] h1').textContent())?.includes('Confidentiality or protection?'),'Recovered Wisdom scenario hw01 did not open.');
  assert(await page.locator('[data-wisdom-choice]').count()===4,'Wisdom Situation must present all four recovered plausible choices.');
  assert((await page.locator('.bq-wisdom-warning').textContent())?.includes('not the answer that merely sounds most religious'),'Wisdom exercise guardrail is missing before answer.');
  let metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('[data-wisdom-page] button')].map(node=>node.getBoundingClientRect().height))}));assert(metrics.scrollWidth<=metrics.innerWidth+1,`Wisdom mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(metrics.minTarget>=44,`Wisdom touch target below 44px: ${metrics.minTarget}px.`);

  const before=await progressState(page);const beforeEvents=Object.keys(before.events||{}).filter(id=>id.startsWith('wisdom-situation:')).length;
  await page.locator('[data-wisdom-choice="0"]').click();await page.locator('[data-wisdom-complete="hw01"]').waitFor();
  const completeText=await page.locator('[data-wisdom-complete="hw01"]').textContent();assert(completeText?.includes('A stronger judgment is available'),'Weaker Wisdom choice feedback is missing.');assert(completeText?.includes('+8 XP'),'Wisdom result does not show recovered +8 XP parity.');assert(completeText?.includes('Strongest supported option: C'),'Wisdom result did not reveal the strongest supported option.');assert(await page.locator('.bq-wisdom-rationales article').count()===4,'Wisdom result must explain all four options.');assert((await page.locator('.bq-wisdom-refs').textContent())?.includes('Proverbs 11:13'),'Wisdom Scripture references are missing.');
  const after=await progressState(page);assert((after.xp||0)-(before.xp||0)===8,`Wisdom awarded ${(after.xp||0)-(before.xp||0)} XP instead of recovered +8.`);assert((after.counters?.situations||0)-(before.counters?.situations||0)===1,'Wisdom did not increment situations exactly once.');assert((after.counters?.quizCorrect||0)===(before.counters?.quizCorrect||0),'Wisdom incorrectly changed Bible quiz correctness progress.');const afterEvents=Object.keys(after.events||{}).filter(id=>id.startsWith('wisdom-situation:'));assert(afterEvents.length===beforeEvents+1,'Wisdom did not record exactly one deterministic Progress event.');

  await page.reload({waitUntil:'networkidle'});await page.locator('[data-wisdom-session="hw01"]').waitFor();const reloaded=await progressState(page);assert(reloaded.xp===after.xp&&reloaded.counters?.situations===after.counters?.situations,'Reloading Wisdom before a new answer duplicated completion progress.');
  await page.locator('[data-wisdom-choice="2"]').click();await page.locator('[data-wisdom-complete="hw01"]').waitFor();const strongText=await page.locator('[data-wisdom-complete="hw01"]').textContent();assert(strongText?.includes('Strong judgment'),'Strongest Wisdom choice feedback is missing.');const second=await progressState(page);assert(second.xp===after.xp+8&&second.counters?.situations===after.counters?.situations+1,'A new Wisdom attempt did not earn exactly one +8 XP / +1 situation reward.');
  await page.locator('[data-wisdom-restart]').click();await page.locator('[data-wisdom-session="hw01"]').waitFor();assert(await page.locator('[data-wisdom-choice]').count()===4,'Wisdom replay did not reset the scenario.');
  await page.locator('[data-wisdom-choice="2"]').click();await page.locator('[data-wisdom-another]').click();await page.locator('[data-wisdom-session="hw02"]').waitFor();assert((await page.locator('[data-wisdom-session="hw02"] h1').textContent())?.includes('Loyalty to your employer'),'Another Wisdom Situation immediately repeated the prior scenario instead of advancing the recovered pool.');
  metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('[data-wisdom-page] button')].map(node=>node.getBoundingClientRect().height))}));assert(metrics.scrollWidth<=metrics.innerWidth+1,`Wisdom follow-up mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(metrics.minTarget>=44,`Wisdom follow-up control below 44px: ${metrics.minTarget}px.`);
  await page.locator('[data-wisdom-learn]').click();await page.waitForURL(/#\/learn$/);assert((await page.locator('main h1').first().textContent())?.trim()==='Learn','Wisdom return broke the stable Learn heading.');
  assert(errors.length===0,`Unexpected Wisdom console/page errors: ${errors.join(' | ')}`);await page.close();
}
try{await run();console.log('BibleQuest v3 Wisdom Situations browser regression passed.')}finally{await browser.close()}
