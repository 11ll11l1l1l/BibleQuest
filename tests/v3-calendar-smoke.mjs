import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(ok,message)=>{if(!ok)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{
    const [{createCalendarService},{calendarPage},{privateStorage}]=await Promise.all([
      import(`/src/app/calendar.js?smoke=${Date.now()}`),import(`/src/features/calendar/index.js?smoke=${Date.now()}`),import(`/src/core/storage.js?smoke=${Date.now()}`)
    ]);
    const session={getState:()=>({authenticated:true,user:{id:'calendar-smoke-user'}})};
    const saved=[];
    const api={calendar:{async list(){return[]},async create(userId,ev){const row={id:`cloud-${saved.length+1}`,user_id:userId,title:ev.title,notes:ev.notes,event_date:ev.date,all_day:ev.allDay};saved.push(row);return row},async remove(){return true}}};
    const assignments={snapshot:()=>({assignments:[{id:'a1',title:'Read Mark 1',dueAt:new Date(Date.now()+2*86400000).toISOString(),dueState:'assigned'}]})};
    const calendar=createCalendarService({session,privateStorage,api,assignments});

    let back=0;const host=document.createElement('div');document.body.appendChild(host);
    const def=calendarPage({calendar,onBack:()=>back++,onAccount:()=>{}});host.innerHTML=def.html;def.mount(host);
    await new Promise(resolve=>setTimeout(resolve,50));

    const beforeText=host.textContent||'';
    const form=host.querySelector('[data-calendar-add]');
    form.querySelector('input[name="title"]').value='Family devotion';
    const eventDate=new Date(Date.now()+86400000).toISOString().slice(0,10);
    form.querySelector('input[name="eventDate"]').value=eventDate;
    const addRect=form.querySelector('button[type="submit"]').getBoundingClientRect();
    form.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    await new Promise(resolve=>setTimeout(resolve,50));
    const afterText=host.textContent||'';
    host.querySelector('[data-calendar-back]')?.click();

    const metrics={innerWidth,scrollWidth:document.documentElement.scrollWidth,addButtonHeight:addRect?.height||0};
    host.remove();
    return{beforeText,afterText,saved,back,metrics};
  });
  assert(result.beforeText.includes('Read Mark 1'),'Assignment due date did not appear in the agenda.');
  assert(result.afterText.includes('Family devotion'),'Newly added personal event did not render after submit.');
  assert(result.saved.length===1&&result.saved[0].title==='Family devotion','Add did not sync through the API boundary exactly once.');
  assert(result.back===1,'Back navigation callback did not fire.');
  assert(result.metrics.innerWidth===390,'Calendar smoke did not execute at 390px.');
  assert(result.metrics.scrollWidth<=result.metrics.innerWidth+1,`Calendar caused horizontal overflow: ${result.metrics.scrollWidth}px > ${result.metrics.innerWidth}px.`);
  assert(result.metrics.addButtonHeight>=44,`Calendar add-event target is too short for mobile: ${result.metrics.addButtonHeight}px.`);
  assert(errors.length===0,`Unexpected Calendar console/page errors: ${errors.join(' | ')}`);
  await page.close();
}
try{await run();console.log('BibleQuest v3 Calendar mobile browser regression passed.')}finally{await browser.close()}
