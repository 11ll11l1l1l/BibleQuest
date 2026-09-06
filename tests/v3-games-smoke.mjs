import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});

  await page.locator('[data-route-link="play"]').click();
  await page.waitForURL(/#\/play$/);
  await page.locator('[data-game-launch="quick-recall"]').waitFor();
  assert(await page.locator('[data-game-launch]').count()===3,'Games launcher must expose the three verified/active modes in this milestone.');

  const launchHeights=await page.locator('[data-game-launch]').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().height));
  assert(Math.min(...launchHeights)>=44,'Games launcher touch target is below 44px.');

  await page.locator('[data-game-launch="quick-recall"]').click();
  await page.locator('[data-game-question="q1"]').waitFor();
  assert((await page.locator('[data-game-progress]').textContent())?.includes('1 of 10'),'Quick Recall must start a 10-question round.');

  await page.locator('[data-game-answer="1"]').click();
  await page.locator('[data-game-feedback]').waitFor();
  assert((await page.locator('[data-game-score]').textContent())?.includes('Score 1'),'Correct Quick Recall answer did not score once.');
  assert(await page.locator('[data-game-answer="0"]').isDisabled(),'Answer choices must lock after the first answer.');
  await page.locator('[data-game-answer="0"]').evaluate(node=>node.click());
  assert((await page.locator('[data-game-score]').textContent())?.includes('Score 1'),'Locked answer accepted a duplicate score.');

  const answers=[0,1,2,1,0,1,0,2,1];
  for(const correct of answers){
    await page.locator('[data-game-next]').click();
    await page.locator(`[data-game-answer="${correct}"]`).click();
    await page.locator('[data-game-feedback]').waitFor();
  }
  await page.locator('[data-game-next]').click();
  await page.locator('[data-game-complete]').waitFor();
  assert((await page.locator('[data-game-complete] h1').textContent())==='10/10','Quick Recall completion score is wrong.');
  assert((await page.locator('[data-game-complete]').textContent())?.includes('+100'),'Quick Recall XP total is wrong.');

  await page.locator('[data-game-replay]').click();
  await page.locator('[data-game-question="q1"]').waitFor();
  assert((await page.locator('[data-game-score]').textContent())?.includes('Score 0'),'Replay must reset score.');
  assert((await page.locator('[data-game-progress]').textContent())?.includes('1 of 10'),'Replay must reset question position.');

  await page.locator('[data-game-launcher]').click();
  await page.locator('[data-game-launch="context-challenge"]').click();
  await page.locator('[data-game-question="q5"]').waitFor();
  assert((await page.locator('[data-game-progress]').textContent())?.includes('1 of 9'),'Context Challenge must use the verified context/connection bank.');
  await page.locator('[data-game-answer="1"]').click();
  await page.locator('[data-game-feedback]').waitFor();
  assert((await page.locator('[data-game-feedback]').textContent())?.includes('1 Samuel 17:34–37,45–47'),'Context Challenge must show its Scripture reference after answering.');

  await page.locator('[data-game-launcher]').click();
  await page.locator('[data-game-launch="mixed-quest"]').click();
  const mixedIds=['q1','q5','q9','q11','q15','q16','q19','q22','q23','q21'];
  const mixedAnswers=[1,1,2,1,0,2,0,1,0,0];
  for(let index=0;index<mixedIds.length;index++){
    await page.locator(`[data-game-question="${mixedIds[index]}"]`).waitFor();
    await page.locator(`[data-game-answer="${mixedAnswers[index]}"]`).click();
    await page.locator('[data-game-feedback]').waitFor();
    if(index<mixedIds.length-1) await page.locator('[data-game-next]').click();
  }
  await page.locator('[data-game-next]').click();
  await page.locator('[data-game-complete]').waitFor();
  assert((await page.locator('[data-game-complete] h1').textContent())==='10/10','Mixed Quest completion score is wrong.');
  assert((await page.locator('[data-game-complete]').textContent())?.includes('Mixed Quest'),'Mixed Quest result must identify its mode.');

  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-session-label]',{hasText:'Guest'}).waitFor();
  await page.locator('[data-game-launch="mixed-quest"]').waitFor();
  const lastMixed=page.locator('[data-game-last="mixed-quest"]');
  await lastMixed.waitFor();
  assert((await lastMixed.textContent())?.includes('10/10'),'Mixed Quest score did not persist across reload.');
  assert((await lastMixed.textContent())?.includes('+100 XP'),'Mixed Quest XP summary did not persist across reload.');

  await page.locator('[data-game-launch="mixed-quest"]').click();
  await page.locator('[data-game-question="q1"]').waitFor();
  await page.locator('[data-route-link="home"]').click();
  await page.waitForURL(/#\/home$/);
  await page.locator('[data-route-link="play"]').click();
  await page.locator('[data-game-launch="quick-recall"]').waitFor();
  assert(await page.locator('[data-game-question]').count()===0,'Leaving and returning to Play must tear down the active round.');

  const metrics=await page.evaluate(()=>{
    const scope=document.querySelector('[data-games-page]');
    const controls=[...scope.querySelectorAll('button')];
    return{
      innerWidth,
      scrollWidth:document.documentElement.scrollWidth,
      minTarget:Math.min(...controls.map(node=>node.getBoundingClientRect().height))
    };
  });
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Games mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minTarget>=44,`Games mobile control target is below 44px: ${metrics.minTarget}px.`);
  assert(errors.length===0,`Unexpected console/page errors: ${errors.join(' | ')}`);

  await page.close();
}

try{await run();console.log('BibleQuest v3 Games browser regression passed.')}finally{await browser.close()}
