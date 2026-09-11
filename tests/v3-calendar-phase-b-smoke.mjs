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
  const asset=await page.request.get(`${BASE}assets/calendar-feature-icons.svg`);
  assert(asset.ok(),`Calendar Phase B icon sprite failed to load: ${asset.status()}`);
  const assetText=await asset.text();
  for(const id of['planner','personal','assignment','congregation','empty'])assert(assetText.includes(`id="${id}"`),`Loaded Calendar sprite missing ${id}.`);

  const result=await page.evaluate(async()=>{
    const {calendarPage}=await import(`/src/features/calendar/index.js?phaseb=${Date.now()}`);
    const today=new Date(Date.now()+86400000).toISOString().slice(0,10);
    const state={owner:'guest',accountUserId:'calendar-owner',scope:'guest-device',canShareWithCongregation:true,congregationName:'Phase B Church',events:[],agenda:[{date:today,events:[
      {id:'personal-1',source:'personal',ownerId:'',date:today,title:'Family devotion',notes:'',allDay:true,recurrenceWeeks:0},
      {id:'assignment-1',source:'assignment',ownerId:'',date:today,title:'Read Mark 1',notes:'',allDay:true,recurrenceWeeks:0},
      {id:'congregation-1',source:'congregation',ownerId:'calendar-owner',date:today,title:'Church gathering',notes:'',allDay:true,recurrenceWeeks:0}
    ]}]};
    const calendar={getState:()=>state,load:async()=>state,addEvent:async()=>state,updateCongregationEvent:async()=>state,removeCongregationEvent:async()=>state,removeEvent:async()=>state};
    const host=document.createElement('div');document.body.appendChild(host);const def=calendarPage({calendar,onBack:()=>{}});host.innerHTML=def.html;const dispose=def.mount(host);await new Promise(resolve=>setTimeout(resolve,30));
    const hrefs=[...host.querySelectorAll('.bq-calendar-icon use')].map(node=>node.getAttribute('href'));
    const eventHrefs=[...host.querySelectorAll('.bq-calendar-event .bq-calendar-icon use')].map(node=>node.getAttribute('href'));
    const hero=host.querySelector('.bq-calendar-icon--hero')?.getBoundingClientRect();
    const eventIcon=host.querySelector('.bq-calendar-icon--event')?.getBoundingClientRect();
    const visibleButtons=[...host.querySelectorAll('button')].filter(node=>{const style=getComputedStyle(node),box=node.getBoundingClientRect();return style.display!=='none'&&style.visibility!=='hidden'&&box.width>0&&box.height>0});
    const metrics={innerWidth,scrollWidth:document.documentElement.scrollWidth,minTarget:Math.min(...visibleButtons.map(node=>node.getBoundingClientRect().height)),heroWidth:hero?.width||0,eventIconWidth:eventIcon?.width||0};
    const text=host.innerHTML;dispose?.();host.remove();return{hrefs,eventHrefs,metrics,text};
  });
  assert(result.hrefs.includes('assets/calendar-feature-icons.svg#planner'),'Calendar hero must use the planner symbol.');
  for(const id of['personal','assignment','congregation'])assert(result.eventHrefs.includes(`assets/calendar-feature-icons.svg#${id}`),`Calendar event artwork missing ${id} symbol.`);
  assert(new Set(result.eventHrefs).size===3,'Calendar event sources must use distinct semantic symbols.');
  assert(!/[📌⛪🗓]/u.test(result.text),'Calendar browser output must not contain the retired emoji event artwork.');
  assert(result.metrics.heroWidth>=32,'Calendar hero artwork is not visibly rendered.');
  assert(result.metrics.eventIconWidth>=24,'Calendar event artwork is undersized.');
  assert(result.metrics.innerWidth===390,'Calendar Phase B browser acceptance did not execute at 390px.');
  assert(result.metrics.scrollWidth<=result.metrics.innerWidth+1,`Calendar Phase B introduced horizontal overflow: ${result.metrics.scrollWidth}px > ${result.metrics.innerWidth}px.`);
  assert(result.metrics.minTarget>=44,`Calendar Phase B action target below 44px: ${result.metrics.minTarget}px.`);
  assert(errors.length===0,`Unexpected Calendar Phase B console/page errors: ${errors.join(' | ')}`);
  await page.close();
  console.log('BibleQuest v3 Calendar Phase B mobile browser acceptance passed.');
}finally{await browser.close()}
