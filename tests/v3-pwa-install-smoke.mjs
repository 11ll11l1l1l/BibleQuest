import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';const browser=await chromium.launch({headless:true});const assert=(condition,message)=>{if(!condition)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${BASE}#/more`,{waitUntil:'networkidle'});await page.locator('[data-bq-shell="v3"]').waitFor();
  const manifest=await page.evaluate(async()=>({link:document.querySelector('link[rel="manifest"]')?.getAttribute('href'),value:await fetch('manifest.webmanifest').then(response=>response.json())}));
  assert(manifest.link==='manifest.webmanifest'&&manifest.value.start_url==='./'&&manifest.value.scope==='./'&&manifest.value.display==='standalone','Browser must discover the relative standalone manifest.');
  assert(await page.locator('[data-more-install]').isHidden(),'Install UI must stay hidden before browser eligibility.');
  await page.evaluate(()=>{const event=new Event('beforeinstallprompt');event.prompt=async()=>{};event.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(event)});
  const panel=page.locator('[data-more-install]');await panel.waitFor();const button=panel.locator('[data-install-app]');
  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,target:document.querySelector('[data-install-app]')?.getBoundingClientRect().height||0,workers:'serviceWorker' in navigator?navigator.serviceWorker.controller:null}));
  assert(metrics.scrollWidth<=metrics.innerWidth+1&&metrics.target>=44,`PWA install UI is not mobile safe: ${JSON.stringify(metrics)}`);assert(metrics.workers===null,'#97 must not install a service-worker controller.');
  await button.click();await panel.waitFor({state:'hidden'});assert(errors.length===0,`Unexpected PWA install console/page errors: ${errors.join(' | ')}`);await page.close();
}
try{await run();console.log('BibleQuest v3 PWA install browser regression passed.')}finally{await browser.close()}
