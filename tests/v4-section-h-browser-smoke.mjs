import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const browser=await chromium.launch({headless:true});
const ROUTES=['home','reader','play','assignments','calendar','community','backup','more','account'];
const PROFILES=[
  {name:'phone-320',width:320,height:844,routes:['home','reader','backup','more']},
  {name:'phone-360',width:360,height:800,routes:ROUTES},
  {name:'phone-390',width:390,height:844,routes:ROUTES},
  {name:'phone-412',width:412,height:915,routes:ROUTES},
  {name:'phone-430',width:430,height:932,routes:['home','reader','backup','more']},
  {name:'tablet-portrait',width:768,height:1024,routes:['home','reader','play','calendar','more','account']},
  {name:'tablet-landscape',width:1024,height:768,routes:['home','reader','play','calendar','more','account']},
  {name:'desktop',width:1440,height:900,routes:['home','reader','play','calendar','more','account']},
  {name:'phone-landscape',width:844,height:390,routes:['home','reader','play','more']}
];

async function waitForApp(page){
  await page.locator('[data-bq-shell="v3"]').waitFor({timeout:8000});
  await page.waitForFunction(()=>Boolean(document.querySelector('#bq-view')?.textContent?.trim()),null,{timeout:8000});
}
async function navigate(page,route){
  await page.evaluate(route=>{
    const next=`#/${route}`;
    if(location.hash===next)window.dispatchEvent(new Event('hashchange'));else location.hash=next;
  },route);
  await page.waitForFunction(route=>location.hash===`#/${route}`&&Boolean(document.querySelector('#bq-view')?.textContent?.trim()),route,{timeout:6000});
  await page.waitForTimeout(80);
}
async function layoutSnapshot(page){
  return page.evaluate(()=>{
    const box=selector=>{const value=document.querySelector(selector)?.getBoundingClientRect();return value?{left:value.left,right:value.right,top:value.top,bottom:value.bottom,width:value.width,height:value.height}:null};
    return {innerWidth,innerHeight,html:document.documentElement.scrollWidth,body:document.body.scrollWidth,main:box('.bq-main'),topbar:box('.bq-topbar'),nav:box('.bq-nav'),startup:Boolean(document.querySelector('[data-startup-failure]')),recovery:Boolean(document.querySelector('.bq-recovery-panel'))};
  });
}
async function verifyProfile(profile){
  const page=await browser.newPage({viewport:{width:profile.width,height:profile.height},isMobile:profile.width<600,hasTouch:profile.width<600});
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${BASE}#/home`,{waitUntil:'networkidle'});await waitForApp(page);
  let cursor=errors.length;
  for(const route of profile.routes){
    await navigate(page,route);const m=await layoutSnapshot(page);const currentErrors=errors.slice(cursor);cursor=errors.length;
    assert(!m.startup&&!m.recovery,`${profile.name} #/${route} entered startup/recovery state.`);
    assert(m.html<=profile.width+1&&m.body<=profile.width+1,`${profile.name} #/${route} has horizontal overflow: html=${m.html}, body=${m.body}.`);
    assert(m.main&&m.main.left>=-1&&m.main.right<=profile.width+1,`${profile.name} #/${route} main exceeds viewport.`);
    assert(m.topbar&&m.topbar.left>=-1&&m.topbar.right<=profile.width+1,`${profile.name} #/${route} top bar exceeds viewport.`);
    assert(m.nav&&m.nav.left>=-1&&m.nav.right<=profile.width+1&&m.nav.bottom<=profile.height+1,`${profile.name} #/${route} fixed navigation exceeds viewport.`);
    assert(currentErrors.length===0,`${profile.name} #/${route} produced console/page errors: ${currentErrors.join(' | ')}`);
  }
  await page.close();
}

async function verifyKeyboardFocusAndSemantics(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto(`${BASE}#/home`,{waitUntil:'networkidle'});await waitForApp(page);
  await page.locator('#bq-view').focus();
  const visited=new Set();
  for(let index=0;index<14;index++){
    await page.keyboard.press('Tab');
    const state=await page.evaluate(()=>{
      const el=document.activeElement;if(!el||el===document.body)return null;const style=getComputedStyle(el),r=el.getBoundingClientRect();
      return{tag:el.tagName,id:el.id||'',data:el.getAttribute('data-route-link')||el.getAttribute('data-session-open')||el.getAttribute('data-home-rail-card')||'',outlineStyle:style.outlineStyle,outlineWidth:parseFloat(style.outlineWidth)||0,boxShadow:style.boxShadow,top:r.top,bottom:r.bottom,left:r.left,right:r.right};
    });
    assert(state,`Keyboard Tab ${index+1} did not reach an interactive target.`);
    visited.add(`${state.tag}:${state.id}:${state.data}:${index}`);
    assert((state.outlineStyle!=='none'&&state.outlineWidth>=2)||state.boxShadow!=='none',`Focused ${state.tag} lacks a visible focus indicator.`);
    assert(state.bottom>=-2&&state.top<=846&&state.right>=-2&&state.left<=392,`Focused ${state.tag} is not brought into the mobile viewport.`);
  }
  assert(visited.size>=10,'Keyboard traversal did not expose enough independently focusable controls.');

  for(const route of ['home','reader','assignments','calendar','play','more','account']){
    await navigate(page,route);
    const semantics=await page.evaluate(()=>{
      const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
      const name=el=>{
        const labelled=el.getAttribute('aria-labelledby');
        if(labelled){const text=labelled.split(/\s+/).map(id=>document.getElementById(id)?.textContent||'').join(' ').trim();if(text)return text}
        const aria=el.getAttribute('aria-label')?.trim();if(aria)return aria;
        if(el.id){const label=document.querySelector(`label[for="${CSS.escape(el.id)}"]`);if(label?.textContent?.trim())return label.textContent.trim()}
        const wrapper=el.closest('label');if(wrapper?.textContent?.trim())return wrapper.textContent.trim();
        return (el.textContent||el.getAttribute('alt')||el.getAttribute('title')||el.getAttribute('placeholder')||el.getAttribute('value')||'').trim();
      };
      const controls=[...document.querySelectorAll('#bq-view button,#bq-view a,#bq-view input,#bq-view select,#bq-view textarea')].filter(visible).filter(el=>!el.disabled&&el.getAttribute('aria-hidden')!=='true');
      return{main:document.querySelectorAll('main#bq-view').length,navName:document.querySelector('.bq-nav')?.getAttribute('aria-label')||'',heading:Boolean(document.querySelector('#bq-view h1,#bq-view h2')),unnamed:controls.filter(el=>!name(el)).map(el=>el.outerHTML.slice(0,180))};
    });
    assert(semantics.main===1,`#/${route} must retain one main landmark.`);
    assert(semantics.navName.length>0,`#/${route} lost the named primary navigation landmark.`);
    assert(semantics.heading,`#/${route} has no visible page heading semantics.`);
    assert(semantics.unnamed.length===0,`#/${route} exposes unnamed interactive controls: ${semantics.unnamed.join(' | ')}`);
  }
  await page.close();
}

async function verifyReducedMotionAndPerformance(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await page.goto(`${BASE}#/home`,{waitUntil:'networkidle'});await waitForApp(page);
  const motion=await page.evaluate(()=>{
    const node=document.querySelector('.bq-session-chip'),style=getComputedStyle(node);
    return{matches:matchMedia('(prefers-reduced-motion: reduce)').matches,animation:style.animationDuration,transition:style.transitionDuration};
  });
  assert(motion.matches,'Reduced-motion browser preference was not exposed to the app.');
  const toMs=value=>Math.max(...String(value).split(',').map(item=>item.trim().endsWith('ms')?parseFloat(item):parseFloat(item)*1000).filter(Number.isFinite),0);
  assert(toMs(motion.animation)<=1&&toMs(motion.transition)<=1,`Reduced-motion CSS still leaves material motion: ${JSON.stringify(motion)}`);
  const perf=await page.evaluate(()=>{
    const entries=performance.getEntriesByType('resource');const sizes=entries.map(entry=>Number(entry.encodedBodySize||entry.transferSize||0));
    return{count:entries.length,total:sizes.reduce((a,b)=>a+b,0),max:Math.max(0,...sizes),duplicates:entries.map(entry=>entry.name).filter((name,index,list)=>list.indexOf(name)!==index)};
  });
  assert(perf.count<400,`Home loads ${perf.count} resources; Section H ceiling is 399.`);
  assert(perf.total<20*1024*1024,`Home encoded resource cost ${(perf.total/1024/1024).toFixed(2)} MiB exceeds the 20 MiB release ceiling.`);
  assert(perf.max<5*1024*1024,`A single Home resource ${(perf.max/1024/1024).toFixed(2)} MiB exceeds the 5 MiB release ceiling.`);
  assert(new Set(perf.duplicates).size<20,`Home has excessive duplicate resource requests: ${[...new Set(perf.duplicates)].slice(0,20).join(', ')}`);
  console.log(`Section H route-load budget: ${perf.count} resources, ${(perf.total/1024/1024).toFixed(2)} MiB encoded, max ${(perf.max/1024/1024).toFixed(2)} MiB.`);
  await page.close();
}

async function verifyPwaOfflineReconnect(){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
  await page.goto(`${BASE}#/more`,{waitUntil:'networkidle'});await waitForApp(page);
  const pwa=await page.evaluate(async()=>{
    const manifest=await (await fetch('manifest.webmanifest')).json();
    const registration=await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('service worker ready timeout')),12000))]);
    return{display:manifest.display,startUrl:manifest.start_url,scope:manifest.scope,worker:registration.active?.scriptURL||'',controlled:Boolean(navigator.serviceWorker.controller)};
  });
  assert(pwa.display==='standalone'&&pwa.startUrl==='./'&&pwa.scope==='./',`PWA manifest browser contract failed: ${JSON.stringify(pwa)}`);
  assert(pwa.worker.endsWith('/offline-shell-sw.js'),`Unexpected active service worker: ${pwa.worker}`);
  await page.waitForTimeout(400);
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:10000});await waitForApp(page);
  const offline=await layoutSnapshot(page);assert(!offline.startup&&!offline.recovery,'Cached PWA shell failed while offline.');
  await context.setOffline(false);
  await page.reload({waitUntil:'networkidle',timeout:15000});await waitForApp(page);
  await navigate(page,'home');const online=await layoutSnapshot(page);assert(!online.startup&&!online.recovery,'PWA shell did not recover after reconnect.');
  await context.close();
}

try{
  for(const profile of PROFILES)await verifyProfile(profile);
  await verifyKeyboardFocusAndSemantics();
  await verifyReducedMotionAndPerformance();
  await verifyPwaOfflineReconnect();
  console.log('BibleQuest V4 Section H browser release gate passed.');
}finally{await browser.close()}
