import {chromium} from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(condition,message)=>{if(!condition)throw new Error(message)};

async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});await page.locator('[data-route-link="more"]').click();await page.waitForURL(/#\/more$/);await page.locator('[data-open-couples-cloud]').waitFor();
  await page.locator('[data-open-couples-cloud]').click();await page.waitForURL(/#\/couples-cloud$/);await page.locator('[data-couples-cloud-view]').waitFor();
  const previewText=(await page.locator('[data-couples-cloud-view]').textContent())||'';assert(previewText.includes('disabled in local preview'),'Couples cloud must fail closed in local preview.');assert(previewText.includes('Private Notes')&&previewText.includes('Transformation results'),'Couples cloud signed-out/preview UI lost privacy boundary.');
  let metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('[data-couples-cloud-view] button')].map(node=>node.getBoundingClientRect().height))}));assert(metrics.scrollWidth<=metrics.innerWidth+1,`Couples cloud preview mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(metrics.minTarget>=44,`Couples cloud preview touch target below 44px: ${metrics.minTarget}px.`);

  await page.evaluate(async()=>{
    const {couplesCloudPage}=await import('/src/features/couples-cloud/index.js');
    const now='2026-09-08T12:00:00.000Z';let state={authenticated:true,remoteAvailable:true,pair:{id:'pair-ui',userA:'user-a',userB:'user-b',status:'active'},shared:[{id:'j1',pairId:'pair-ui',authorId:'user-b',itemType:'journey',body:'1|Pray Honestly',createdAt:now,updatedAt:now}],inviteCode:''};
    const couples={snapshot:()=>Object.freeze({...state,shared:state.shared.slice()}),async load(){return this.snapshot()},async createPair(){return this.snapshot()},async join(){return this.snapshot()},async leave(){state={...state,pair:null,shared:[]};return this.snapshot()},async completeJourney(step,title,commitment){if(!state.shared.some(row=>row.itemType==='journey'&&row.body===`${step}|${title}`))state.shared.push({id:`j${state.shared.length+1}`,pairId:'pair-ui',authorId:'user-a',itemType:'journey',body:`${step}|${title}`,createdAt:now,updatedAt:now});if(commitment)state.shared.push({id:`c${state.shared.length+1}`,pairId:'pair-ui',authorId:'user-a',itemType:'commitment',body:String(commitment),createdAt:now,updatedAt:now});return this.snapshot()}};
    document.body.innerHTML='<div id="cloud-test"></div>';const root=document.getElementById('cloud-test'),pageDef=couplesCloudPage({couples,onBack:()=>{},onAccount:()=>{}});root.innerHTML=pageDef.html;window.__couplesCleanup=pageDef.mount(root);
  });
  await page.locator('[data-couple-cloud-step="1"]').click();await page.locator('[data-couple-cloud-complete] textarea').fill('We will listen before advice.');await page.locator('[data-couple-cloud-complete] button[type="submit"]').click();await page.locator('.bq-couples-cloud-history article').waitFor();
  const activeText=(await page.locator('[data-couples-cloud-view]').textContent())||'';assert(activeText.includes('2/7'),'Completing a shared journey step did not update synchronized completion count.');assert(activeText.includes('We will listen before advice.'),'Shared commitment did not render after synchronized save.');assert(activeText.includes('No marriage score'),'Couples cloud lost its non-competitive framing.');
  metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...[...document.querySelectorAll('[data-couples-cloud-view] button')].map(node=>node.getBoundingClientRect().height))}));assert(metrics.scrollWidth<=metrics.innerWidth+1,`Couples cloud active mobile overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(metrics.minTarget>=44,`Couples cloud active touch target below 44px: ${metrics.minTarget}px.`);assert(errors.length===0,`Unexpected Couples cloud console/page errors: ${errors.join(' | ')}`);
  await page.evaluate(()=>window.__couplesCleanup?.());await page.close();
}
try{await run();console.log('BibleQuest v3 Couples cloud mobile browser regression passed.')}finally{await browser.close()}
