import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});await page.locator('[data-route-link="play"]').click();await page.waitForURL(/#\/play$/);await page.locator('[data-game-launch="quick-recall"]').waitFor();
  assert(await page.locator('[data-game-launch]').count()===4,'Games launcher must expose four modes through Per-book Recall.');
  const heights=await page.locator('[data-game-launch]').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().height));assert(Math.min(...heights)>=44,'Games launcher touch target is below 44px.');

  await page.locator('[data-game-launch="quick-recall"]').click();await page.locator('[data-game-question="q1"]').waitFor();await page.locator('[data-game-answer="1"]').click();await page.locator('[data-game-feedback]').waitFor();assert((await page.locator('[data-game-score]').textContent())?.includes('Score 1'),'Quick Recall score failed.');await page.locator('[data-game-launcher]').click();
  await page.locator('[data-game-launch="context-challenge"]').click();await page.locator('[data-game-question="q5"]').waitFor();await page.locator('[data-game-answer="1"]').click();await page.locator('[data-game-feedback]').waitFor();assert((await page.locator('[data-game-feedback]').textContent())?.includes('1 Samuel 17:34–37,45–47'),'Context reference failed.');await page.locator('[data-game-launcher]').click();

  await page.locator('[data-game-launch="mixed-quest"]').click();const mixedIds=['q1','q5','q9','q11','q15','q16','q19','q22','q23','q21'],mixedAnswers=[1,1,2,1,0,2,0,1,0,0];
  for(let index=0;index<mixedIds.length;index++){await page.locator(`[data-game-question="${mixedIds[index]}"]`).waitFor();await page.locator(`[data-game-answer="${mixedAnswers[index]}"]`).click();await page.locator('[data-game-feedback]').waitFor();await page.locator('[data-game-next]').click()}
  await page.locator('[data-game-complete]').waitFor();assert((await page.locator('[data-game-complete] h1').textContent())==='10/10','Mixed Quest completion failed.');await page.locator('[data-game-launcher]').click();

  await page.locator('[data-game-launch="per-book-recall"]').click();await page.locator('[data-recall-library]').waitFor();assert(await page.locator('[data-recall-book]').count()>40,'Per-book Recall did not load the retained book manifest.');
  assert((await page.locator('.bq-recall-source').textContent())?.includes('CC BY-SA 4.0'),'Per-book Recall attribution is missing.');
  await page.locator('[data-recall-search]').fill('Ruth');await page.locator('[data-recall-book="RUT"]').waitFor();assert(await page.locator('[data-recall-book]').count()===1,'Per-book Recall search did not narrow to Ruth.');
  await page.locator('[data-recall-book="RUT"]').click();await page.locator('[data-recall-question="y3tt"]').waitFor();assert((await page.locator('[data-recall-progress]').textContent())?.includes('1 of 10'),'Ruth recall round must start with 10 items.');
  assert(await page.locator('[data-recall-answer]').count()===0,'Reference answer must stay hidden before reveal.');await page.locator('[data-recall-reveal]').click();await page.locator('[data-recall-answer]').waitFor();assert((await page.locator('[data-recall-answer]').textContent())?.includes('days when the judges ruled'),'Ruth reference answer did not load.');
  await page.locator('[data-recall-rate="again"]').click();
  for(let index=1;index<10;index++){await page.locator('[data-recall-reveal]').click();await page.locator('[data-recall-answer]').waitFor();await page.locator('[data-recall-rate="got"]').click()}
  await page.locator('[data-recall-complete]').waitFor();assert((await page.locator('[data-recall-complete] h1').textContent())==='9/10','Per-book Recall remembered score is wrong.');const completedText=await page.locator('[data-recall-complete]').textContent();assert(completedText?.includes('+46'),'Per-book Recall XP must preserve old +1/+5 semantics.');assert(completedText?.includes('1')&&completedText?.includes('book review'),'Per-book Recall review queue summary is missing.');

  await page.reload({waitUntil:'networkidle'});await page.locator('[data-session-label]',{hasText:'Guest'}).waitFor();await page.locator('[data-game-launch="per-book-recall"]').click();await page.locator('[data-recall-library]').waitFor();await page.locator('[data-recall-search]').fill('Ruth');await page.locator('[data-recall-book="RUT"]').waitFor();const summary=await page.locator('[data-recall-summary="RUT"]').textContent();assert(summary?.includes('1 review'),'Per-book Recall review queue did not persist across reload.');assert(summary?.includes('10 studied'),'Per-book Recall study stats did not persist across reload.');assert(summary?.includes('last 9/10'),'Per-book Recall last result did not persist across reload.');
  await page.locator('[data-recall-book="RUT"]').click();await page.locator('[data-recall-question="y3tt"]').waitFor();await page.locator('[data-recall-reveal]').click();await page.locator('[data-recall-rate="got"]').click();await page.locator('[data-recall-library]').click();await page.locator('[data-recall-library]').waitFor();await page.locator('[data-recall-search]').fill('Ruth');await page.locator('[data-recall-book="RUT"]').waitFor();assert((await page.locator('[data-recall-summary="RUT"]').textContent())?.includes('0 review'),'Got it did not clear the persisted review item.');

  await page.locator('[data-game-launcher]').click();await page.locator('[data-game-launch="per-book-recall"]').waitFor();const metrics=await page.evaluate(()=>{const scope=document.querySelector('[data-games-page]'),controls=[...scope.querySelectorAll('button,input')];return{innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...controls.map(node=>node.getBoundingClientRect().height))}});assert(metrics.scrollWidth<=metrics.innerWidth+1,`Games mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(metrics.minTarget>=44,`Games mobile control target is below 44px: ${metrics.minTarget}px.`);assert(errors.length===0,`Unexpected console/page errors: ${errors.join(' | ')}`);await page.close();
}
try{await run();console.log('BibleQuest v3 Games browser regression passed.')}finally{await browser.close()}
