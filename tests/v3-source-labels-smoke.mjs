import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));
  const open=async route=>{await page.goto(`${BASE}#/${route}`,{waitUntil:'networkidle'})};
  const noOverflow=async label=>{const m=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert(m.scrollWidth<=m.innerWidth+1,`${label} source-label mobile overflow: ${m.scrollWidth}px > ${m.innerWidth}px.`)};
  const expectSource=async(id,label)=>{const node=page.locator(`[data-source-id="${id}"]`).first();await node.waitFor();const text=await node.textContent();assert(/not .*?(?:Bible quotation|Bible translation text|Scripture quotation|Scripture text)/i.test(text||''),`${label} provenance does not clearly distinguish authored content from Scripture.`);await noOverflow(label)};

  await open('learn');
  await page.locator('[data-source-guide]').waitFor();
  assert((await page.locator('main h1').first().textContent())?.trim()==='Learn','Source guide changed the stable Learn heading.');
  assert(await page.locator('[data-source-guide-id]').count()===11,'Learn source guide must show 5 translations + recall source + 5 BibleQuest content types.');
  const guideText=await page.locator('[data-source-guide]').textContent();
  assert(guideText?.includes('Berean Standard Bible'),'Learn source guide lost Bible-owner BSB attribution.');
  assert(guideText?.includes('Cebuano/Bisaya · OCCB')&&guideText?.includes('Biblica® Open Ang Pulong sa Dios™')&&guideText?.includes('CC BY-SA 4.0'),'Learn source guide lost CEBOCB Cebuano/Bisaya source and open-license attribution.');
  assert(await page.locator('[data-source-guide-id="translation:cebocb"]').count()===1,'Learn source guide must expose exactly one CEBOCB translation source entry.');
  assert(guideText?.includes('New Living Translation')&&guideText?.includes('licensed external reader only'),'Learn source guide lost NLT licensed-reader attribution.');
  assert(guideText?.includes('unfoldingWord Translation Questions v90')&&guideText?.includes('CC BY-SA 4.0'),'Learn source guide lost Recall-owner attribution.');
  assert(guideText?.includes('A Scripture reference is not presented as though it were a quotation.'),'Learn source guide lost the reference-vs-quotation rule.');
  await noOverflow('Learn source guide');

  await open('reader');
  await page.locator('.bq-reader-source').waitFor();
  assert((await page.locator('.bq-reader-source').textContent())?.includes('Berean Standard Bible'),'Reader no longer shows the active Scripture source.');

  await open('study');
  await page.locator('[data-study-open="good-samaritan"]').click();
  await page.locator('[data-study-session="good-samaritan"]').waitFor();
  await expectSource('bq-study','Guided Study');

  await open('deep-questions');
  await page.locator('[data-deep-open="p1"]').click();
  await page.locator('[data-deep-session="p1"]').waitFor();
  await expectSource('bq-study','Deep Questions');

  await open('story-journey');
  await page.locator('[data-story-open="s1"]').click();
  await page.locator('[data-story-session="s1"]').waitFor();
  await expectSource('bq-retelling','Story Journey scene');
  for(let i=0;i<5;i++)await page.locator('[data-story-advance]').click();
  await page.locator('[data-story-checkpoint="s1"]').waitFor();
  await expectSource('bq-recall','Story Journey checkpoint');

  await open('wisdom-situations');
  await page.locator('[data-wisdom-session]').waitFor();
  await expectSource('bq-wisdom','Wisdom Situations');

  await open('adaptive-learning');
  await page.locator('[data-adaptive-start]').click();
  await page.locator('[data-adaptive-session]').waitFor();
  await expectSource('bq-recall','Adaptive Learning');

  await open('mission');
  await page.locator('[data-daily-step]').waitFor();
  await expectSource('bq-study','Daily Journey');

  await open('play');
  await page.locator('[data-game-launch="quick-recall"]').click();
  await page.locator('[data-game-question]').waitFor();
  await expectSource('bq-recall','Quick Recall');

  assert(errors.length===0,`Unexpected source-label console/page errors: ${errors.join(' | ')}`);
  await page.close();
}

try{await run();console.log('BibleQuest v3 source-label provenance browser regression passed.')}finally{await browser.close()}
