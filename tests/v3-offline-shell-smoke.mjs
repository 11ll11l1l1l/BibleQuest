import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
const page=await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
try{
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.locator('[data-bq-shell="v3"]').waitFor();
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.waitForFunction(async()=>{
    const names=await caches.keys();
    const name=names.find(value=>value.startsWith('biblequest-v3-offline-shell-'));
    if(!name)return false;
    const cache=await caches.open(name),requests=await cache.keys(),urls=requests.map(request=>request.url);
    return urls.some(url=>url.includes('/src/app/bootstrap.js'))&&urls.some(url=>url.includes('/src/ui/app.css'));
  },null,{timeout:10000});
  const before=await page.evaluate(async()=>{
    const name=(await caches.keys()).find(value=>value.startsWith('biblequest-v3-offline-shell-'));
    const cache=await caches.open(name),requests=await cache.keys();
    return {name,count:requests.length,probe:requests.some(request=>request.url.includes('bq-net-probe')),packs:requests.some(request=>request.url.includes('/data/packs/'))};
  });
  assert(before.count>2,'Offline shell cache did not warm enough resources.');
  assert(!before.probe,'Client Diagnostics network probe must never enter the offline shell cache.');
  assert(!before.packs,'#98 shell cache must not contain Bible packs reserved for #99.');
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:15000});
  await page.locator('[data-bq-shell="v3"]').waitFor({timeout:10000});
  await page.locator('[data-session-label]',{hasText:'Guest'}).waitFor({timeout:10000});
  const metrics=await page.evaluate(()=>({shells:document.querySelectorAll('[data-bq-shell="v3"]').length,heading:document.querySelector('h1')?.textContent?.trim(),innerWidth,scrollWidth:document.documentElement.scrollWidth,controller:Boolean(navigator.serviceWorker.controller)}));
  assert(metrics.shells===1,'Offline reload must mount exactly one v3 shell.');
  assert(metrics.heading==='BibleQuest','Offline reload must render the home shell.');
  assert(metrics.controller,'Offline reload must remain controlled by the #98 worker.');
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Offline mobile reload overflowed horizontally: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(errors.length===0,`Offline shell browser errors: ${errors.join(' | ')}`);
  console.log('BibleQuest v3 offline shell mobile browser regression passed.');
}finally{await context.setOffline(false).catch(()=>{});await browser.close()}
