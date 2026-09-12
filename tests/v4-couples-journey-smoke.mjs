import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const localState=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('biblequest.v3.couples-family-local')||'{}'));

async function openCouples(page){
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.locator('[data-route-link="more"]').click();
  await page.waitForURL(/#\/more$/);
  await page.locator('[data-open-couples-family]').click();
  await page.waitForURL(/#\/couples-family$/);
  await page.locator('[data-couples-mode="journey"]').waitFor({state:'visible'});
}

async function runMobile(){
  const page=await browser.newPage({viewport:{width:320,height:760},isMobile:true,hasTouch:true});
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await openCouples(page);
  const modes=await page.locator('.bq-couples-mode-grid [data-couples-mode]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-couples-mode')));
  assert(modes.length===7,'Couples dashboard must expose six retained modes plus Communication Journey.');
  for(const id of['journey','card','listen','checkin','repair','god','date'])assert(modes.includes(id),`Couples dashboard lost mode: ${id}.`);

  await page.locator('[data-couples-mode="journey"]').click();
  await page.locator('[data-couples-journey]').waitFor({state:'visible'});
  assert(await page.locator('[data-journey-rating]').count()===12,'Communication Journey must render 12 self-assessment ratings.');
  const intro=((await page.locator('.bq-couples-journey-intro').textContent())||'').toLowerCase();
  assert(intro.includes('not a diagnosis')&&intro.includes('not your 12 individual answers'),'Communication Journey lost its privacy/non-diagnostic framing.');
  const safety=((await page.locator('.bq-couples-safety').textContent())||'').toLowerCase();
  assert(safety.includes('coercion')&&safety.includes('violence'),'Communication Journey lost its safety boundary.');

  const first=page.locator('[data-journey-rating]').first();await first.focus();await page.keyboard.press('ArrowRight');
  assert(((await page.locator('[data-journey-value="heard"]').textContent())||'').startsWith('4 ·'),'Journey range control did not respond to keyboard input.');
  await page.locator('[data-journey-rating]').evaluateAll(nodes=>{for(const node of nodes){node.value='5';node.dispatchEvent(new Event('input',{bubbles:true}))}});
  await page.locator('[data-journey-submit]').click();
  await page.locator('[data-couples-journey-result]').waitFor({state:'visible'});
  assert(((await page.locator('.bq-couples-journey-result-head h1').textContent())||'')==='Growing Together','All-5 browser assessment must produce Growing Together.');
  assert(await page.locator('[data-journey-level]').count()===5,'Communication Journey result must render all five levels.');
  assert(await page.locator('[data-journey-level="growing-together"]').getAttribute('aria-current')==='step','Current journey level must expose aria-current=step.');
  let stored=await localState(page);
  assert(stored.version===2&&stored.journeyAssessments?.length===1,'Communication Journey summary did not persist through existing local Couples storage.');
  const summary=stored.journeyAssessments[0];
  assert(summary.levelId==='growing-together'&&summary.total===60&&!('answers' in summary),'Persisted journey summary is incorrect or contains raw answers.');
  for(const rawId of['heard','curiosity','honesty','repair','respect','pause','team','warmth','appreciation','faithGrace','boundaries','safety'])assert(!(rawId in summary),`Raw journey answer leaked into storage: ${rawId}.`);

  let metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minButton:Math.min(...[...document.querySelectorAll('[data-couples-journey-result] button')].map(node=>node.getBoundingClientRect().height))}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Communication Journey 320px result overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minButton>=44,`Communication Journey 320px result button below 44px: ${metrics.minButton}px.`);

  await page.locator('[data-journey-retake]').click();
  await page.locator('[data-journey-rating]').evaluateAll(nodes=>{for(const node of nodes){node.value=node.getAttribute('data-journey-rating')==='safety'?'2':'5';node.dispatchEvent(new Event('input',{bubbles:true}))}});
  await page.locator('[data-journey-submit]').click();
  await page.locator('[data-journey-safety-priority]').waitFor({state:'visible'});
  assert(await page.locator('[data-journey-listen]').count()===0&&await page.locator('[data-journey-repair]').count()===0,'Safety-priority result must not make ordinary couple exercises the primary next action.');
  stored=await localState(page);assert(stored.journeyAssessments?.length===2&&stored.journeyAssessments.at(-1)?.safetyPriority===true,'Safety-priority summary did not persist.');
  // The journey summary screen intentionally offers two routes back to the
  // Couples dashboard ("Done" and "Back to Couples"), so this locator must be
  // explicit about which one it drives instead of failing strict-mode.
  await page.locator('[data-couples-go="dashboard"]').first().click();
  await page.locator('.bq-couples-journey-latest').waitFor();
  assert(((await page.locator('.bq-couples-journey-latest').textContent())||'').includes('Safety-first reflection saved'),'Dashboard did not surface the latest journey summary safely.');
  await page.reload({waitUntil:'networkidle'});await page.locator('.bq-couples-journey-latest').waitFor();
  assert(((await page.locator('.bq-couples-journey-latest').textContent())||'').includes('Safety-first reflection saved'),'Journey summary did not survive browser reload.');
  assert(errors.length===0,`Unexpected Communication Journey browser errors: ${errors.join(' | ')}`);
  await page.close();
}

async function runDesktop(){
  const page=await browser.newPage({viewport:{width:1100,height:800}});await openCouples(page);await page.locator('[data-couples-mode="journey"]').click();await page.locator('[data-couples-journey]').waitFor();
  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Communication Journey desktop overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(await page.locator('[data-journey-rating]').count()===12,'Communication Journey desktop lost assessment items.');
  await page.close();
}

try{await runMobile();await runDesktop();console.log('BibleQuest v4 Couples Communication Journey browser acceptance passed.')}finally{await browser.close()}
