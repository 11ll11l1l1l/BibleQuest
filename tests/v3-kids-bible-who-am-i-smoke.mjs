import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.locator('[data-route-link="play"]').click();
  await page.waitForURL(/#\/play$/);
  const kids=page.locator('[data-kids-bible-card]');await kids.waitFor();
  assert((await kids.locator('h2').textContent())==='Kids Bible Who Am I?','Kids Bible launcher title changed.');
  assert((await kids.locator('p').textContent())==='Easy character clues for family play.','Kids Bible launcher description changed.');
  const open=page.locator('[data-kids-bible-open]');assert((await open.textContent())==='Play Bible Who Am I?','Kids Bible launcher CTA changed.');
  assert((await open.evaluate(node=>node.getBoundingClientRect().height))>=44,'Kids Bible launcher touch target is below 44px.');
  await open.click();await page.locator('[data-detective="d1"]').waitFor();
  assert((await page.locator('[data-detective] h1').textContent())==='Who am I?','Kids Bible did not enter the shared detective UI.');
  assert(await page.locator('.bq-detective-clues > div').count()===3,'Kids Bible must reuse the verified three-clue v3 detective presentation.');
  await page.locator('[data-detective-answer]').fill('DAVID');await page.locator('[data-detective-submit]').click();await page.locator('[data-detective-feedback]').waitFor();
  assert((await page.locator('[data-detective-feedback]').textContent())?.includes('Correct'),'Kids Bible shared detective answer failed.');
  assert((await page.locator('[data-detective-score]').textContent())?.includes('+12'),'Kids Bible alias changed detective XP semantics.');
  await page.locator('.bq-game-actions [data-game-launcher]').click();await page.locator('[data-kids-bible-open]').waitFor();
  assert(await page.locator('[data-game-launch="character-detective"]').count()===1,'General Character Detective launcher must remain single and available.');
  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert(metrics.scrollWidth<=metrics.innerWidth+1,`Kids Bible mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(errors.length===0,`Unexpected console/page errors: ${errors.join(' | ')}`);
  await page.close();
}
try{await run();console.log('BibleQuest v3 Kids Bible Who Am I mobile acceptance passed.')}finally{await browser.close()}
