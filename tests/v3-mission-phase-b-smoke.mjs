import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  const asset=await page.request.get(`${BASE}assets/mission-feature-icons.svg`);
  assert(asset.ok(),`Mission Phase B icon sprite failed to load: ${asset.status()}`);
  const assetText=await asset.text();
  for(const id of['review','study'])assert(assetText.includes(`id="${id}"`),`Loaded Mission sprite missing ${id}.`);

  const result=await page.evaluate(async()=>{
    const {missionPage}=await import(`/src/features/mission/index.js?phaseb=${Date.now()}`);
    const render=async rec=>{
      let back=0,review=0,study=0;
      const mission={recommend:()=>Object.freeze(rec)};
      const host=document.createElement('div');document.body.appendChild(host);
      const def=missionPage({mission,onBack:()=>back++,onReview:()=>review++,onStudy:()=>study++});
      host.innerHTML=def.html;def.mount(host);
      await new Promise(resolve=>setTimeout(resolve,20));
      const use=host.querySelector('.bq-mission-art use')?.getAttribute('href')||'';
      const art=host.querySelector('.bq-mission-art')?.getBoundingClientRect();
      const artWrap=host.querySelector('.bq-mission-art-wrap')?.getBoundingClientRect();
      const start=host.querySelector('[data-mission-start]')?.getBoundingClientRect();
      const backButton=host.querySelector('[data-mission-back]')?.getBoundingClientRect();
      const text=host.innerHTML;
      host.querySelector('[data-mission-start]')?.click();
      host.querySelector('[data-mission-back]')?.click();
      const route={back,review,study};
      host.remove();
      return{use,artWidth:art?.width||0,artWrapWidth:artWrap?.width||0,startHeight:start?.height||0,backHeight:backButton?.height||0,text,route};
    };
    const review=await render({icon:'🧠',title:'4 reviews due',text:'Start with retrieval practice before adding more new material.',action:'review'});
    const study=await render({icon:'📘',title:'Strengthen Wisdom',text:'Your evidence is lighter here. Read a passage, then retrieve what you remember.',action:'study'});
    return{review,study,innerWidth,scrollWidth:document.documentElement.scrollWidth};
  });

  assert(result.review.use==='assets/mission-feature-icons.svg#review','Review recommendation must render review artwork.');
  assert(result.study.use==='assets/mission-feature-icons.svg#study','Study recommendation must render study artwork.');
  assert(result.review.use!==result.study.use,'Mission recommendation states must use distinct semantic artwork.');
  assert(result.review.route.review===1&&result.review.route.study===0,'Review Mission primary action route changed.');
  assert(result.study.route.study===1&&result.study.route.review===0,'Study Mission primary action route changed.');
  assert(result.review.route.back===1&&result.study.route.back===1,'Mission Back callback did not remain available in both states.');
  for(const state of[result.review,result.study]){
    assert(!/[🧠📘]/u.test(state.text),'Mission browser output must not contain engine compatibility emoji artwork.');
    assert(state.artWidth>=40&&state.artWrapWidth>=64,'Mission semantic artwork is not visibly rendered.');
    assert(state.startHeight>=44&&state.backHeight>=44,'Mission Phase B action target below 44px.');
  }
  assert(result.innerWidth===390,'Mission Phase B browser acceptance did not execute at 390px.');
  assert(result.scrollWidth<=result.innerWidth+1,`Mission Phase B introduced horizontal overflow: ${result.scrollWidth}px > ${result.innerWidth}px.`);
  assert(errors.length===0,`Unexpected Mission Phase B console/page errors: ${errors.join(' | ')}`);
  await page.close();
  console.log('BibleQuest v3 Mission Phase B mobile browser acceptance passed.');
}finally{await browser.close()}
