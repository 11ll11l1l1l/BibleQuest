import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(ok,message)=>{if(!ok)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{
    const [{createMissionService},{missionPage}]=await Promise.all([
      import(`/src/app/mission.js?smoke=${Date.now()}`),import(`/src/features/mission/index.js?smoke=${Date.now()}`)
    ]);
    const openReview={overview:()=>({due:4,weakest:'Wisdom'})};
    const mission=createMissionService({openReview});
    let back=0,review=0,study=0;const host=document.createElement('div');document.body.appendChild(host);
    const def=missionPage({mission,onBack:()=>back++,onReview:()=>review++,onStudy:()=>study++});host.innerHTML=def.html;def.mount(host);
    const dueText=host.textContent||'';
    const startRect=host.querySelector('[data-mission-start]')?.getBoundingClientRect();
    host.querySelector('[data-mission-start]')?.click();
    host.querySelector('[data-mission-back]')?.click();
    const metrics={innerWidth,scrollWidth:document.documentElement.scrollWidth,startHeight:startRect?.height||0};
    host.remove();
    return{dueText,back,review,study,metrics};
  });
  assert(result.dueText.includes('4 reviews due'),'Mission did not recommend review when reviews are due.');
  assert(result.review===1&&result.study===0,'Starting the due-review recommendation did not call onReview.');
  assert(result.back===1,'Back navigation callback did not fire.');
  assert(result.metrics.innerWidth===390,'Innovation Suite smoke did not execute at 390px.');
  assert(result.metrics.scrollWidth<=result.metrics.innerWidth+1,`Innovation Suite caused horizontal overflow: ${result.metrics.scrollWidth}px > ${result.metrics.innerWidth}px.`);
  assert(result.metrics.startHeight>=44,`Mission start target is too short for mobile: ${result.metrics.startHeight}px.`);
  assert(errors.length===0,`Unexpected Innovation Suite console/page errors: ${errors.join(' | ')}`);
  await page.close();
}
try{await run();console.log('BibleQuest v3 Innovation Suite mobile browser regression passed.')}finally{await browser.close()}
