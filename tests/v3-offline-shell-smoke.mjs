import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'allow'});
const page=await context.newPage();
const errors=[],failed=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('requestfailed',request=>failed.push({url:request.url(),failure:request.failure()?.errorText||''}));
const warmSentinels=[
  '/src/app/bootstrap.js',
  '/src/app/offline-shell.js',
  '/src/features/more/index.js',
  '/src/app/personal-challenges.js',
  '/src/features/challenges/index.js',
  '/src/app/explorer.js',
  '/src/features/explorer/index.js',
  '/src/features/games/memory.js',
  '/src/features/psychometrics/via-content.js',
  '/src/ui/content-reporting.css'
];
async function waitForControlledWarmShell(page){
  return page.evaluate(async sourceSentinels=>{
    const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    const shellResources=()=>{
      const urls=new Set();
      try{const current=new URL(location.href);current.hash='';urls.add(current.href)}catch{}
      for(const entry of performance.getEntriesByType('resource')){
        if(!['script','link','css','img'].includes(String(entry.initiatorType||'')))continue;
        try{const url=new URL(entry.name,location.href);if(url.origin===location.origin)urls.add(url.href)}catch{}
      }
      return [...urls];
    };
    const initial=shellResources();
    const sourceMode=initial.some(url=>url.includes('/src/app/bootstrap.js'));
    const manifestExpected=[];
    if(!sourceMode){
      try{
        const response=await fetch(new URL('vite-manifest.json',location.href),{cache:'reload'});
        if(response.ok){
          const manifest=await response.json();
          const add=value=>{
            if(!value)return;
            try{
              const url=new URL(value,location.href);
              if(url.origin===location.origin&&/\\.(?:[cm]?js|css)$/i.test(url.pathname))manifestExpected.push(url.href);
            }catch{}
          };
          for(const record of Object.values(manifest||{})){
            add(record?.file);
            for(const value of Array.isArray(record?.css)?record.css:[])add(value);
          }
        }
      }catch{}
    }
    const expected=sourceMode?sourceSentinels:[...new Set([...initial,...manifestExpected])];
    let readiness={ready:false,controlled:false,name:'',count:0,probe:false,packs:false,found:[],builtAssets:0,sourceMode};
    for(let attempt=1;attempt<=80;attempt++){
      const controlled=Boolean(navigator.serviceWorker.controller);
      const name=(await caches.keys()).find(value=>value.startsWith('biblequest-v3-offline-shell-'))||'';
      const urls=name?(await (await caches.open(name)).keys()).map(request=>request.url):[];
      const found=expected.filter(expectedUrl=>sourceMode?urls.some(url=>url.includes(expectedUrl)):urls.includes(expectedUrl));
      const builtAssets=urls.filter(url=>url.includes('/_v6/')).length;
      const deepEnough=sourceMode?found.length===sourceSentinels.length:(found.length===expected.length&&builtAssets>0&&urls.length>=Math.max(expected.length,10));
      const missing=expected.filter(expectedUrl=>sourceMode?!urls.some(url=>url.includes(expectedUrl)):!urls.includes(expectedUrl));
      readiness={ready:controlled&&Boolean(name)&&deepEnough,controlled,name,count:urls.length,probe:urls.some(url=>url.includes('bq-net-probe')),packs:urls.some(url=>url.includes('/data/packs/')),found,missing,expectedCount:expected.length,expected,builtAssets,sourceMode,cached:urls};
      if(readiness.ready)break;
      await sleep(150);
    }
    return readiness;
  },warmSentinels);
}

try{
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.locator('[data-bq-shell="v3"]').waitFor();
  await page.evaluate(()=>navigator.serviceWorker.ready);
  const readiness=await waitForControlledWarmShell(page);
  assert(readiness?.ready,`Offline shell did not become controlled and warm before offline transition: ${JSON.stringify(readiness)}`);
  assert(readiness.controlled,'Offline shell page must be controlled before the offline transition.');
  assert(readiness.count>=Math.max(readiness.found.length,10),'Offline shell cache did not warm the required shell graph.');
  if(readiness.sourceMode)assert(readiness.found.length===warmSentinels.length,'Offline shell cache did not retain all late source-shell sentinels.');
  else assert(readiness.builtAssets>0,'Deployable offline shell cache did not retain built application assets.');
  assert(!readiness.probe,'Client Diagnostics network probe must never enter the offline shell cache.');
  assert(!readiness.packs,'#98 shell cache must not contain Bible packs reserved for #99.');
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:15000});
  try{await page.locator('[data-bq-shell="v3"]').waitFor({timeout:15000})}catch(error){
    const diagnostic=await page.evaluate(async()=>({
      href:location.href,
      readyState:document.readyState,
      appHtml:document.querySelector('#app')?.innerHTML?.slice(0,1200)||'',
      bodyText:document.body?.innerText?.slice(0,1200)||'',
      controller:navigator.serviceWorker.controller?.scriptURL||'',
      cacheNames:await caches.keys(),
      resources:performance.getEntriesByType('resource').map(entry=>entry.name)
    })).catch(()=>({evaluateFailed:true}));
    throw new Error(`Offline shell mount timeout: ${JSON.stringify({diagnostic,errors,failed})}; original=${error.message}`);
  }
  await page.locator('[data-session-label]',{hasText:'Guest'}).waitFor({timeout:15000});
  const metrics=await page.evaluate(()=>({shells:document.querySelectorAll('[data-bq-shell="v3"]').length,heading:document.querySelector('h1')?.textContent?.trim(),innerWidth,scrollWidth:document.documentElement.scrollWidth,controller:Boolean(navigator.serviceWorker.controller)}));
  assert(metrics.shells===1,'Offline reload must mount exactly one v3 shell.');
  assert(metrics.heading==='BibleQuest','Offline reload must render the home shell.');
  assert(metrics.controller,'Offline reload must remain controlled by the #98 worker.');
  assert(metrics.scrollWidth<=metrics.innerWidth+1,`Offline mobile reload overflowed horizontally: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);
  assert(errors.length===0,`Offline shell browser errors: ${errors.join(' | ')}`);
  console.log('BibleQuest v3 offline shell mobile browser regression passed.');
}finally{await context.setOffline(false).catch(()=>{});await browser.close()}
