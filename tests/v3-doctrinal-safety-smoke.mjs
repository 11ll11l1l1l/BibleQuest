import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${BASE}#/learn`,{waitUntil:'networkidle'});
  await page.locator('[data-doctrinal-policy]').waitFor();
  assert((await page.locator('main h1').first().textContent())?.trim()==='Learn','Doctrinal safety changed the stable Learn heading.');
  const policyText=await page.locator('[data-doctrinal-policy]').textContent();
  assert(/explicit Scripture reference/i.test(policyText||''),'Learn doctrinal policy does not explain Scripture-reference gating.');
  assert(/quarantined/i.test(policyText||''),'Learn doctrinal policy does not explain disputed-claim quarantine.');
  assert(/Deep Questions and Wisdom/i.test(policyText||''),'Learn doctrinal policy does not explain neutral interpretive surfaces.');
  let metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Doctrinal policy Learn view overflows mobile: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);

  const runtime=await page.evaluate(async()=>{
    const policy=await import('/src/core/doctrinal-safety.js');
    const games=await import('/src/features/games/content.js');
    const recallModule=await import('/src/core/recall-packs.js');
    const recall=recallModule.createRecallPackService();
    const john=await recall.loadBook('JHN');
    const baptism=john.items.find(item=>item.id==='ly5i');
    return{
      highRisk:policy.reviewImportedRecall({q:'How is a person saved?',a:'By grace through faith.',r:'2:8',bookName:'Ephesians',safety:{action:'allow',topics:[]}}).action,
      questionCount:games.GAME_QUESTIONS.length,
      reviewed:games.GAME_QUESTIONS.every(item=>item.safety?.reviewed===true),
      q10:games.GAME_QUESTIONS.find(item=>item.id==='q10')?.safety?.action,
      q21:games.GAME_QUESTIONS.find(item=>item.id==='q21')?.safety?.action,
      baptismAction:baptism?.safety?.action,
      baptismNote:baptism?.safety?.contextNote||''
    };
  });
  assert(runtime.highRisk==='quarantine','Browser runtime allowed a stale high-risk imported question.');
  assert(runtime.questionCount===24&&runtime.reviewed,'Shared scored Games/Adaptive bank is not fully safety-reviewed in browser runtime.');
  assert(runtime.q10==='context'&&runtime.q21==='context','Passage-sensitive authored questions lost context classification.');
  assert(runtime.baptismAction==='context'&&/baptism|passage|context/i.test(runtime.baptismNote),'Imported John baptism question did not retain contextual safety metadata.');

  await page.goto(`${BASE}#/deep-questions`,{waitUntil:'networkidle'});await page.locator('[data-deep-open="p1"]').click();await page.locator('[data-deep-session="p1"]').waitFor();
  await page.locator('[data-doctrinal-action="neutral"]').waitFor();
  assert(/interpretive|reflection|doctrine/i.test((await page.locator('[data-doctrinal-action="neutral"]').textContent())||''),'Deep Questions neutral safety notice is missing.');
  await page.locator('[data-deep-choice="0"]').click();await page.locator('.bq-deep-feedback').waitFor();
  assert(/does not score/i.test((await page.locator('.bq-deep-feedback').textContent())||''),'Deep Questions no longer states its neutral no-score contract.');

  await page.goto(`${BASE}#/story-journey`,{waitUntil:'networkidle'});await page.locator('[data-story-open="s1"]').click();await page.locator('[data-story-session="s1"]').waitFor();
  for(let index=0;index<5;index++)await page.locator('[data-story-advance]').click();
  await page.locator('[data-story-checkpoint="s1"]').waitFor();await page.locator('[data-doctrinal-action="context"]').waitFor();
  assert(/passage|context|complete doctrine/i.test((await page.locator('[data-doctrinal-action="context"]').textContent())||''),'Story checkpoint passage-context notice is missing.');

  await page.goto(`${BASE}#/wisdom-situations`,{waitUntil:'networkidle'});await page.locator('[data-wisdom-session]').waitFor();await page.locator('[data-doctrinal-action="neutral"]').waitFor();await page.locator('[data-wisdom-choice="0"]').click();await page.locator('[data-wisdom-complete]').waitFor();
  assert(/not a declaration.*universally binding response/i.test((await page.locator('.bq-wisdom-warning').textContent())||''),'Wisdom Situations lost its neutral applied-judgment warning.');
  assert(await page.locator('[data-doctrinal-action="neutral"]').count()===1,'Wisdom Situations neutral safety notice is missing or duplicated.');
  metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('button')].map(node=>node.getBoundingClientRect().height).filter(Boolean))}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Doctrinal safety mobile flow overflows: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(metrics.minTarget>=44,`Doctrinal safety mobile flow has a touch target below 44px: ${metrics.minTarget}px.`);
  assert(errors.length===0,`Unexpected doctrinal-safety console/page errors: ${errors.join(' | ')}`);
  await page.close();
}

try{await run();console.log('BibleQuest v3 doctrinal-safety browser regression passed.')}finally{await browser.close()}
