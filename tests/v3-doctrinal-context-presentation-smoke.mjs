import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${BASE}#/play`,{waitUntil:'networkidle'});
  await page.locator('[data-game-launch="per-book-recall"]').click();
  await page.locator('[data-recall-library]').waitFor();
  await page.locator('[data-recall-search]').fill('Acts');
  await page.locator('[data-recall-book="ACT"]').click();
  const leading=['bpjr','ve8f','qacc','b10x'];
  for(const id of leading){
    await page.locator(`[data-recall-question="${id}"]`).waitFor();
    assert(await page.locator('[data-recall-context]').count()===0,`Recall context appeared before reveal for ${id}.`);
    await page.locator('[data-recall-reveal]').click();
    await page.locator('[data-recall-answer]').waitFor();
    assert(await page.locator('[data-recall-context]').count()===0,`Textual Recall item ${id} received an invented context notice.`);
    await page.locator('[data-recall-rate="got"]').click();
  }
  await page.locator('[data-recall-question="q5vv"]').waitFor();
  assert(await page.locator('[data-recall-answer]').count()===0,'Passage-context Recall answer appeared before reveal.');
  assert(await page.locator('[data-recall-context]').count()===0,'Passage-context Recall notice appeared before reveal.');
  await page.locator('[data-recall-reveal]').click();
  await page.locator('[data-recall-context]').waitFor();
  const recallAnswer=(await page.locator('[data-recall-answer] p').textContent())?.trim();
  const recallContext=(await page.locator('[data-recall-context]').textContent())||'';
  assert(recallAnswer==='Jesus said the apostles would receive power.','Per-book Recall changed the imported reference answer.');
  assert(/BibleQuest context/i.test(recallContext)&&/Holy Spirit|passage|universal/i.test(recallContext),'Per-book Recall did not show the trusted passage-context notice after reveal.');
  assert(!recallAnswer.includes('BibleQuest context'),'Per-book Recall merged BibleQuest commentary into the third-party answer.');
  assert((await page.locator('.bq-recall-license').textContent())?.includes('unfoldingWord Translation Questions v90'),'Per-book Recall source attribution was lost while showing context.');
  await page.locator('[data-recall-rate="again"]').click();

  await page.goto(`${BASE}#/open-review`,{waitUntil:'networkidle'});
  await page.locator('[data-open-review-start]').click();
  await page.locator('[data-open-review-reveal]').waitFor();
  const question=(await page.locator('[data-open-review-view] h1').textContent())||'';
  assert(/Holy Spirit/i.test(question),'Open Smart Review did not prioritize the shared contextual Games review item.');
  assert(await page.locator('[data-open-review-context]').count()===0,'Open Smart Review context appeared before reveal.');
  await page.locator('[data-open-review-reveal]').click();
  await page.locator('[data-open-review-context]').waitFor();
  const openAnswer=(await page.locator('.bq-open-review-answer p').textContent())?.trim();
  const openContext=(await page.locator('[data-open-review-context]').textContent())||'';
  assert(openAnswer==='Jesus said the apostles would receive power.','Open Smart Review changed the imported reference answer.');
  assert(/BibleQuest context/i.test(openContext)&&/Holy Spirit|passage|universal/i.test(openContext),'Open Smart Review did not reveal the trusted context notice.');
  assert(!openAnswer.includes('BibleQuest context'),'Open Smart Review merged BibleQuest commentary into the third-party answer.');
  const attribution=(await page.locator('.bq-open-review-license').textContent())||'';
  assert(attribution.includes('unfoldingWord Translation Questions v90')&&attribution.includes('CC BY-SA 4.0'),'Open Smart Review source/license attribution was lost while showing context.');
  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('button')].map(node=>node.getBoundingClientRect().height).filter(Boolean))}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Doctrinal context presentation overflows mobile: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minTarget>=44,`Doctrinal context presentation has a touch target below 44px: ${metrics.minTarget}px.`);
  assert(errors.length===0,`Unexpected doctrinal context presentation errors: ${errors.join(' | ')}`);
  await page.close();
}

try{await run();console.log('BibleQuest v3 doctrinal context presentation browser regression passed.')}finally{await browser.close()}
