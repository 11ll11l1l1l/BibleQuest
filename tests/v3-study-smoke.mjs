import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});await page.locator('[data-route-link="learn"]').click();await page.waitForURL(/#\/learn$/);await page.locator('[data-open-study]').waitFor();
  assert((await page.locator('[data-open-study]').textContent())?.includes('Guided Study'),'Learn page does not expose Guided Study.');
  await page.locator('[data-open-study]').click();await page.waitForURL(/#\/study$/);await page.locator('[data-study-open="good-samaritan"]').waitFor();
  assert(await page.locator('[data-study-open]').count()===3,'Guided Study library must expose three initial Scripture-first studies.');
  let metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('[data-study-page] button')].map(node=>node.getBoundingClientRect().height))}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Guided Study library mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(metrics.minTarget>=44,`Guided Study library touch target below 44px: ${metrics.minTarget}px.`);

  await page.locator('[data-study-open="good-samaritan"]').click();await page.locator('[data-study-session="good-samaritan"]').waitFor();assert((await page.locator('.bq-study-prompt').textContent())?.includes('Luke 10:25–37'),'Guided Study did not open the retained passage context.');
  await page.locator('[data-study-advance]').click();assert((await page.locator('.bq-study-prompt').textContent())?.includes('Context:'),'Guided Study context step is missing.');await page.locator('[data-study-advance]').click();
  await page.locator('[data-study-choice="1"]').click();await page.locator('.bq-study-feedback').waitFor();assert((await page.locator('.bq-study-feedback').textContent())?.includes('Correct'),'Guided Study objective observation feedback failed.');assert(await page.locator('[data-study-choice]:not([disabled])').count()===0,'Answered Guided Study choice was not locked.');await page.locator('[data-study-advance]').click();
  assert((await page.locator('.bq-study-prompt').textContent())?.includes('Meaning:'),'Guided Study meaning step is missing.');await page.locator('[data-study-advance]').click();
  await page.locator('[data-study-response]').fill('I can overlook people when I am rushing.');await page.locator('[data-study-response-form] button[type="submit"]').click();await page.locator('.bq-study-saved-response').waitFor();assert((await page.locator('.bq-study-saved-response').textContent())?.includes('rushing'),'First private reflection was not saved.');await page.locator('[data-study-advance]').click();
  await page.locator('[data-study-response]').fill('I will listen carefully and help one person this week.');await page.locator('[data-study-response-form] button[type="submit"]').click();await page.locator('.bq-study-saved-response').waitFor();await page.locator('[data-study-advance]').click();
  await page.locator('[data-study-confirm]').click();await page.locator('[data-study-advance]').click();await page.locator('[data-study-complete]').waitFor();
  const completeText=await page.locator('[data-study-complete]').textContent();assert(completeText?.includes('Who Is My Neighbor?'),'Guided Study completion title is wrong.');assert(completeText?.includes('4')&&completeText?.includes('responses'),'Guided Study completion response count is wrong.');assert(!completeText?.includes('+')&&!completeText?.includes('XP'),'Guided Study UI invented an unverified XP reward.');
  const progressAfter=await page.evaluate(()=>JSON.parse(localStorage.getItem('biblequest.v3.progress-state')||'null'));
  const event=progressAfter?.events?.['study:good-samaritan:v1:complete'];assert(event?.type==='study.complete','Guided Study meaningful completion event was not persisted.');assert(event.xp===0,'Guided Study completion invented XP.');assert(event.metrics?.reflections===1,'Guided Study completion did not record reflection progress.');const eventCount=Object.keys(progressAfter.events).filter(id=>id==='study:good-samaritan:v1:complete').length;assert(eventCount===1,'Guided Study completion event identity is duplicated.');

  await page.reload({waitUntil:'networkidle'});await page.locator('[data-study-open="good-samaritan"]').waitFor();await page.locator('[data-study-open="good-samaritan"]').click();await page.locator('[data-study-complete]').waitFor();const progressReloaded=await page.evaluate(()=>JSON.parse(localStorage.getItem('biblequest.v3.progress-state')||'null'));assert(Object.keys(progressReloaded.events).filter(id=>id==='study:good-samaritan:v1:complete').length===1,'Reopening a completed Guided Study duplicated progress.');
  await page.locator('[data-study-restart]').click();await page.locator('[data-study-session="good-samaritan"]').waitFor();assert((await page.locator('.bq-study-prompt').textContent())?.includes('Read Luke 10:25–37 slowly'),'Guided Study restart did not return to the first step.');
  metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('[data-study-page] button, [data-study-page] textarea')].map(node=>node.getBoundingClientRect().height))}));assert(metrics.scrollWidth<=metrics.innerWidth+1,`Guided Study session mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(metrics.minTarget>=44,`Guided Study session control below 44px: ${metrics.minTarget}px.`);

  await page.locator('[data-study-reader]').click();await page.waitForURL(/#\/reader$/);await page.locator('[data-reader-page]').waitFor();const readerText=await page.locator('[data-reader-page]').textContent();assert(readerText?.includes('Luke'),'Guided Study Reader handoff did not open Luke.');
  assert(errors.length===0,`Unexpected Guided Study console/page errors: ${errors.join(' | ')}`);await page.close();
}
try{await run();console.log('BibleQuest v3 Guided Study browser regression passed.')}finally{await browser.close()}
