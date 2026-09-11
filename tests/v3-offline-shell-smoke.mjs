import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
const page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const warmSentinels=[
  '/src/app/bootstrap.js',
  '/src/app/offline-shell.js',
  '/src/features/more/index.js',
  '/src/features/games/memory.js',
  '/src/features/psychometrics/via-content.js',
  '/src/ui/content-reporting.css'
];
try{
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.locator('[data-bq-shell="v3"]').waitFor();
  await page.evaluate(()=>navigator.serviceWorker.ready);
  let readiness=null;
  for(let attempt=1;attempt<=80;attempt++){
    readiness=await page.evaluate(async sentinels=>{
      const name=(await caches.keys()).find(value=>value.startsWith('biblequest-v3-offline-shell-'));
      if(!name)return {ready:false,name:'',count:0,probe:false,packs:false,found:[]};
      const urls=(await (await caches.open(name)).keys()).map(request=>request.url);
      const found=sentinels.filter(sentinel=>urls.some(url=>url.includes(sentinel)));
      return {
        ready:found.length===sentinels.length,
        name,
        count:urls.length,
        probe:urls.some(url=>url.includes('bq-net-probe')),
        packs:urls.some(url=>url.includes('/data/packs/')),
        found
      };
    },warmSentinels);
    if(readiness.ready)break;
    await page.waitForTimeout(250);
  }
  assert(readiness?.ready,`Offline shell cache did not reach late shell modules before offline transition: ${JSON.stringify(readiness)}`);
  assert(readiness.count>=warmSentinels.length,'Offline shell cache did not warm the required shell graph.');
  assert(readiness.found.length===warmSentinels.length,'Offline shell cache did not retain all late shell sentinels.');
  assert(!readiness.probe,'Client Diagnostics network probe must never enter the offline shell cache.');
  assert(!readiness.packs,'#98 shell cache must not contain Bible packs reserved for #99.');
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:15000});
  await page.locator('[data-bq-shell="v3"]').waitFor({timeout:15000});
  await page.locator('[data-session-label]',{hasText:'Guest'}).waitFor({timeout:15000});
  const metrics=await page.evaluate(()=>({shells:document.querySelectorAll('[data-bq-shell="v3"]').length,heading:document.querySelector('h1')?.textContent?.trim(),innerWidth,scrollWidth:document.documentElement.scrollWidth,controller:Boolean(navigator.serviceWorker.controller)}));
  assert(metrics.shells===1,'Offline reload must mount exactly one v3 shell.');
  assert(metrics.heading==='BibleQuest','Offline reload must render the home shell.');
  assert(metrics.controller,'Offline reload must remain controlled by the #98 worker.');
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Offline mobile reload overflowed horizontally: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(errors.length===0,`Offline shell browser errors: ${errors.join(' | ')}`);
  console.log('BibleQuest v3 offline shell mobile browser regression passed.');
}finally{await context.setOffline(false).catch(()=>{});await browser.close()}
