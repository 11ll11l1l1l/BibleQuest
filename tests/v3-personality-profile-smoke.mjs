import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(ok,message)=>{if(!ok)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{
    const [{createPersonalityProfileService},{personalityProfilePage},{privateStorage}]=await Promise.all([
      import(`/src/app/personality-profile.js?smoke=${Date.now()}`),import(`/src/features/personality-profile/index.js?smoke=${Date.now()}`),import(`/src/core/storage.js?smoke=${Date.now()}`)
    ]);
    const session={getState:()=>({authenticated:true,user:{id:'smoke-user'}})};
    const profile=createPersonalityProfileService({session,privateStorage,clock:()=>new Date('2026-09-10T12:00:00.000Z')});
    profile.clear();
    profile.capture({date:'2026-09-10T11:00:00.000Z',scores:{O:{mean:4,band:'Higher expression'},C:{mean:3.2,band:'Midrange / mixed'},E:{mean:2.2,band:'Lower expression'},A:{mean:3,band:'Midrange / mixed'},S:{mean:4.1,band:'Higher expression'}}});
    let back=0,transform=0;const host=document.createElement('div');document.body.appendChild(host);const def=personalityProfilePage({profile,onBack:()=>back++,onTransform:()=>transform++});host.innerHTML=def.html;def.mount(host);
    const text=host.textContent||'',factorCount=host.querySelectorAll('[data-personality-factor]').length,privacy=text.includes('Private to this owner on this device'),versionSafety=text.includes('20-item IPIP-based Big Five self-reflection')&&text.includes('not a diagnosis'),presentation=host.querySelector('[data-personality-presentation]')?.textContent||'';
    host.querySelector('[data-personality-transform]')?.click();host.querySelector('[data-personality-back]')?.click();
    const metrics={innerWidth,scrollWidth:document.documentElement.scrollWidth};
    host.remove();profile.clear();
    return{text,factorCount,privacy,versionSafety,presentation,back,transform,metrics};
  });
  assert(result.factorCount===5,'Personality Profile must render all five factors.');
  assert(result.text.includes('Openness / Intellect')&&result.text.includes('Extraversion'),'Personality Profile factor labels did not render.');
  assert(result.privacy,'Personality Profile privacy boundary did not render.');
  assert(result.versionSafety,'Personality Profile provenance/safety copy did not render.');
  assert(result.presentation.includes('deeper context')&&result.presentation.includes('reflective'),'Presentation-only hints did not render.');
  assert(result.back===1&&result.transform===1,'Personality Profile navigation callbacks failed.');
  assert(result.metrics.innerWidth===390,'Personality Profile smoke did not execute at 390px.');
  assert(result.metrics.scrollWidth<=result.metrics.innerWidth+1,`Personality Profile caused horizontal overflow: ${result.metrics.scrollWidth}px > ${result.metrics.innerWidth}px.`);
  assert(errors.length===0,`Unexpected Personality Profile console/page errors: ${errors.join(' | ')}`);
  await page.close();
}
try{await run();console.log('BibleQuest v3 Personality Profile mobile browser regression passed.')}finally{await browser.close()}
