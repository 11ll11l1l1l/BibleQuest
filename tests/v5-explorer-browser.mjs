import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(ok,message)=>{if(!ok)throw new Error(message)};

async function run(){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await context.addInitScript(()=>{
    localStorage.removeItem('biblequest.v3.explorer-state-v1');
    localStorage.removeItem('biblequest.v3.auth.bq-explorer-sync-owner-v1');
  });
  const page=await context.newPage();
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));

  await page.goto(BASE+'#/learn',{waitUntil:'networkidle'});
  await page.locator('[data-open-explorer]').waitFor();
  await page.locator('[data-open-explorer]').click();
  await page.waitForURL(/#\/explorer$/);
  await page.locator('[data-explorer-page]').waitFor();

  await page.locator('[data-explorer-mode="person"]').click();
  const firstCase=page.locator('[data-explorer-case]');
  await firstCase.waitFor();
  const firstId=await firstCase.getAttribute('data-explorer-case');
  const clue1=await page.locator('[data-explorer-current-clue]').textContent();
  assert(Boolean(firstId),'People Explorer must open a concrete case.');

  await page.locator('[data-explorer-clue]').click();
  const clue2=await page.locator('[data-explorer-current-clue]').textContent();
  assert(clue2&&clue2!==clue1,'Another clue must advance the saved clue position.');

  await page.reload({waitUntil:'networkidle'});
  await page.locator('[data-explorer-page]').waitFor();
  const personHome=page.locator('[data-explorer-mode="person"]');
  assert((await personHome.textContent()).includes('Resume'),'Reloaded Explorer home must advertise the unfinished People case.');
  await personHome.click();
  await page.locator('[data-explorer-case="'+firstId+'"]').waitFor();
  assert((await page.locator('[data-explorer-current-clue]').textContent())===clue2,'Reload must resume the exact Explorer clue.');

  await page.locator('[data-explorer-reveal]').click();
  const answer=page.locator('[data-explorer-answer="'+firstId+'"]');
  await answer.waitFor();
  const answerText=await answer.textContent();
  assert(answerText?.includes('Scripture'),'Revealed Explorer answer must show its Scripture reference.');
  assert(await page.locator('[data-explorer-reader]').count()===1,'Revealed Explorer answer must expose a Reader shortcut.');

  await page.locator('[data-explorer-next]').click();
  const nextCase=page.locator('[data-explorer-case]');
  await nextCase.waitFor();
  const secondId=await nextCase.getAttribute('data-explorer-case');
  assert(secondId!==firstId,'Next Explorer case must not immediately repeat the previous person.');

  await page.locator('[data-explorer-home]').click();
  await page.locator('[data-explorer-mode="place"]').click();
  const placeCase=page.locator('[data-explorer-case]');
  await placeCase.waitFor();
  const placeId=await placeCase.getAttribute('data-explorer-case');
  assert(placeId?.startsWith('place-'),'Places mode must select from the place pool.');
  await page.locator('[data-explorer-home]').click();

  await page.locator('[data-explorer-mode="connections"]').click();
  assert(await page.locator('[data-explorer-connection]').count()===15,'Explorer Connections must expose all 15 curated people and places.');
  assert(await page.locator('[data-explorer-connection-reader]').count()===15,'Every Explorer connection must expose a Reader shortcut.');

  const metrics=await page.evaluate(()=>{
    const scope=document.querySelector('[data-explorer-page]');
    const controls=[...scope.querySelectorAll('button')].filter(node=>{const box=node.getBoundingClientRect();return box.width>0&&box.height>0});
    return {innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...controls.map(node=>node.getBoundingClientRect().height))};
  });
  assert(metrics.scrollWidth<=metrics.innerWidth+1,'Bible Explorer must not overflow horizontally on mobile.');
  assert(metrics.minTarget>=44,'Bible Explorer visible action targets must remain at least 44px high.');

  assert(errors.length===0,'Unexpected Bible Explorer console/page errors: '+errors.join(' | '));
  await context.close();
}

try{
  await run();
  console.log('BibleQuest V5 active Bible Explorer browser regression passed.');
}finally{
  await browser.close();
}
