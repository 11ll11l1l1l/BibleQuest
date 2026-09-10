import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(ok,message)=>{if(!ok)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{
    const [{createPsychometricsEngine},{createPsychometricsService},{psychometricsPage},{privateStorage}]=await Promise.all([
      import(`/src/engines/psychometrics.js?smoke=${Date.now()}`),import(`/src/app/psychometrics.js?smoke=${Date.now()}`),import(`/src/features/psychometrics/index.js?smoke=${Date.now()}`),import(`/src/core/storage.js?smoke=${Date.now()}`)
    ]);
    const session={getState:()=>({authenticated:true,user:{id:'psych-smoke-user'}})};
    const engine=createPsychometricsEngine({clock:()=>new Date('2026-09-10T12:00:00.000Z')});
    const psychometrics=createPsychometricsService({engine,storage:privateStorage,session});psychometrics.clearCurrentOwner();
    let back=0,quick=0;const host=document.createElement('div');document.body.appendChild(host);const def=psychometricsPage({psychometrics,onBack:()=>back++,onQuickTransform:()=>quick++});host.innerHTML=def.html;let cleanup=def.mount(host);
    const homeText=host.textContent||'';
    const boundaries=homeText.includes('not a verdict on politics')&&homeText.includes('not a measure of salvation')&&homeText.includes('not a diagnosis');

    host.querySelector('[data-psych-open="neo"]')?.click();host.querySelector('[data-psych-begin]')?.click();
    const neoPageItems=host.querySelectorAll('[data-psych-item]').length,neoFirst=host.querySelector('[data-psych-answer]')?.getBoundingClientRect();
    host.querySelector('[data-psych-home]')?.click();host.querySelector('[data-psych-open="via"]')?.click();host.querySelector('[data-psych-begin]')?.click();
    const viaPageItems=host.querySelectorAll('[data-psych-item]').length;
    host.querySelector('[data-psych-home]')?.click();host.querySelector('[data-psych-open="rse"]')?.click();host.querySelector('[data-psych-begin]')?.click();
    for(let i=0;i<5;i++)host.querySelectorAll('[data-psych-item]')[i]?.querySelector('[data-value="0"]')?.click();
    const firstNext=host.querySelector('[data-psych-next]');const firstEnabled=Boolean(firstNext&&!firstNext.disabled);firstNext?.click();
    for(let i=0;i<5;i++)host.querySelectorAll('[data-psych-item]')[i]?.querySelector('[data-value="0"]')?.click();
    const finalNext=host.querySelector('[data-psych-next]');const finalEnabled=Boolean(finalNext&&!finalNext.disabled);finalNext?.click();
    const rseScore=host.querySelector('[data-psych-rse-score]')?.textContent||'';
    const saved=psychometrics.open().rse.result?.score;

    cleanup?.();host.innerHTML=def.html;cleanup=def.mount(host);host.querySelector('[data-psych-open="rse"]')?.click();const reopenedScore=host.querySelector('[data-psych-rse-score]')?.textContent||'';
    host.querySelector('[data-psych-home]')?.click();host.querySelector('[data-psych-quick]')?.click();host.querySelector('[data-psych-back]')?.click();
    const metrics={innerWidth,scrollWidth:document.documentElement.scrollWidth,neoButtonWidth:neoFirst?.width||0,neoButtonHeight:neoFirst?.height||0};
    cleanup?.();host.remove();psychometrics.clearCurrentOwner();
    return{homeText,boundaries,neoPageItems,viaPageItems,firstEnabled,finalEnabled,rseScore,saved,reopenedScore,back,quick,metrics};
  });
  assert(result.homeText.includes('IPIP-NEO-120')&&result.homeText.includes('IPIP-VIA-R')&&result.homeText.includes('Rosenberg Scale'),'Psychometrics hub did not render all three retained assessment families.');
  assert(result.boundaries,'Psychometrics interpretation safety warnings are missing.');
  assert(result.neoPageItems===10,'NEO mobile page must show 10 items.');
  assert(result.viaPageItems===8,'VIA mobile page must show 8 items.');
  assert(result.firstEnabled&&result.finalEnabled,'Rosenberg next/calculate controls did not enable after complete pages.');
  assert(result.rseScore.includes('15 / 30')&&result.saved===15,'Rosenberg browser flow did not calculate the retained score.');
  assert(result.reopenedScore.includes('15 / 30'),'Psychometrics result did not reopen from private persistence.');
  assert(result.back===1&&result.quick===1,'Psychometrics navigation callbacks failed.');
  assert(result.metrics.innerWidth===390,'Psychometrics smoke did not execute at 390px.');
  assert(result.metrics.scrollWidth<=result.metrics.innerWidth+1,`Psychometrics caused horizontal overflow: ${result.metrics.scrollWidth}px > ${result.metrics.innerWidth}px.`);
  assert(result.metrics.neoButtonHeight>=44,`Psychometrics rating target is too short for mobile: ${result.metrics.neoButtonHeight}px.`);
  assert(errors.length===0,`Unexpected Psychometrics console/page errors: ${errors.join(' | ')}`);
  await page.close();
}
try{await run();console.log('BibleQuest v3 Psychometrics mobile browser regression passed.')}finally{await browser.close()}
