import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const localState=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('biblequest.v3.couples-family-local')||'{}'));

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});await page.locator('[data-route-link="more"]').click();await page.waitForURL(/#\/more$/);await page.locator('[data-open-couples-family]').waitFor();
  await page.locator('[data-open-couples-family]').click();await page.waitForURL(/#\/couples-family$/);await page.locator('[data-couples-mode="card"]').waitFor();
  const overview=(await page.locator('[data-couples-view]').textContent())||'';
  assert(overview.includes('Couples cloud is a separate later milestone'),'Couples local UI must state its cloud boundary.');
  assert(await page.locator('[data-couples-category]').count()===8,'Couples dashboard must expose all eight recovered categories.');
  assert(await page.locator('[data-couples-mode]').count()===6,'Couples dashboard must expose all six recovered local modes.');
  let metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('[data-couples-view] button')].map(node=>node.getBoundingClientRect().height))}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Couples overview mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(metrics.minTarget>=44,`Couples overview touch target below 44px: ${metrics.minTarget}px.`);

  await page.locator('[data-couples-category="communication"]').click();await page.locator('[data-couples-card-id]').waitFor();
  const cardId=await page.locator('[data-couples-card-id]').getAttribute('data-couples-card-id');assert(/^c0[5-8]$/.test(cardId||''),'Communication category opened a card outside the recovered communication deck.');
  await page.locator('[data-couples-favorite]').click();await page.locator('[data-couples-favorite]').waitFor();assert((await page.locator('[data-couples-favorite]').textContent())?.includes('Saved'),'Saved-card UI did not update.');
  await page.locator('[data-couples-practice]').click();await page.locator('[data-couples-complete-practice]').waitFor();
  let stored=await localState(page);assert(stored.favorites?.includes(cardId)&&stored.commitments?.length===1&&!stored.commitments[0]?.done,'Saved card/practice did not persist through shared browser storage.');

  await page.reload({waitUntil:'networkidle'});await page.locator('[data-couples-complete-practice]').waitFor();stored=await localState(page);assert(stored.favorites?.includes(cardId)&&stored.commitments?.length===1,'Couples local saved state did not survive browser reload.');
  await page.locator('[data-couples-complete-practice]').click();stored=await localState(page);assert(stored.commitments?.[0]?.done===true,'Completing a recovered 7-day practice did not persist.');

  await page.locator('[data-couples-mode="listen"]').click();await page.locator('[data-listen-next]').waitFor();for(let i=0;i<5;i+=1){await page.locator('[data-listen-next]').click();if(i<4)await page.locator('[data-listen-next]').waitFor()}await page.locator('[data-couples-mode="checkin"]').waitFor();stored=await localState(page);assert(stored.listenCount===1,'Listen First completion did not persist locally.');

  await page.locator('[data-couples-mode="checkin"]').click();await page.locator('[data-check-submit]').click();await page.locator('[data-check-pass]').waitFor();await page.locator('[data-check-pass]').click();await page.locator('[data-check-submit]').click();await page.locator('.bq-couples-result').waitFor();stored=await localState(page);assert(stored.checkins?.length===1,'Pass-the-phone Couple Check-in did not persist once.');assert(((await page.locator('.bq-couples-result').textContent())||'').includes('NO WINNER · NO LOSER'),'Check-in result lost its non-competitive framing.');
  await page.locator('.bq-couples-result [data-couples-go="dashboard"]').click();await page.locator('[data-couples-mode="repair"]').click();await page.locator('.bq-couples-safety').waitFor();const safety=(await page.locator('.bq-couples-safety').textContent())||'';assert(safety.includes('coercion')&&safety.includes('violence'),'Repair Room lost its recovered safety boundary.');
  await page.locator('[data-couples-go="dashboard"]').click();await page.locator('[data-couples-category="christ"]').click();await page.locator('[data-couples-reader]').click();await page.waitForURL(/#\/reader$/);const readerState=await page.evaluate(()=>JSON.parse(localStorage.getItem('biblequest.v3.reader-state')||'{}'));assert(readerState.translation==='bsb'&&['COL','PSA','PHP','EPH'].includes(readerState.book),'Couples Scripture handoff did not use the existing BSB Reader owner.');

  metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert(metrics.scrollWidth<=metrics.innerWidth+1,`Couples/Reader handoff mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(errors.length===0,`Unexpected Couples local console/page errors: ${errors.join(' | ')}`);await page.close();
}
try{await run();console.log('BibleQuest v3 Couples/family local browser regression passed.')}finally{await browser.close()}
