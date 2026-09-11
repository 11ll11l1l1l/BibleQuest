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
    const eventDate=new Date(Date.now()+86400000).toISOString().slice(0,10);
    const otherEventDate=new Date(Date.now()+2*86400000).toISOString().slice(0,10);
    const saved=[];
    const congregationSaved=[{id:'cong-other',congregation_id:'cong-smoke',user_id:'another-leader',title:'Other leader event',notes:'',event_date:otherEventDate,all_day:true,recurrence_weeks:0}];
    const calls={updates:0,removals:0};
    const api={calendar:{
      async list(){return[]},
      async create(userId,ev){const row={id:`cloud-${saved.length+1}`,user_id:userId,title:ev.title,notes:ev.notes,event_date:ev.date,all_day:ev.allDay};saved.push(row);return row},
      async remove(){return true},
      async listCongregation(){return congregationSaved.slice()},
      async createCongregation(userId,congregationId,ev){const row={id:`cong-${congregationSaved.length+1}`,congregation_id:congregationId,user_id:userId,title:ev.title,notes:ev.notes,event_date:ev.date,all_day:ev.allDay,recurrence_weeks:ev.recurrenceWeeks||0};congregationSaved.push(row);return row},
      async updateCongregation(userId,congregationId,id,ev){calls.updates++;const row=congregationSaved.find(item=>item.id===id&&item.user_id===userId&&item.congregation_id===congregationId);if(!row)return null;Object.assign(row,{title:ev.title,notes:ev.notes,event_date:ev.date,all_day:ev.allDay,recurrence_weeks:ev.recurrenceWeeks||0});return{...row}},
      async removeCongregation(userId,congregationId,id){calls.removals++;const index=congregationSaved.findIndex(item=>item.id===id&&item.user_id===userId&&item.congregation_id===congregationId);if(index<0)return null;const[row]=congregationSaved.splice(index,1);return{id:row.id}}
    }};
    const assignments={snapshot:()=>({assignments:[{id:'a1',title:'Read Mark 1',dueAt:new Date(Date.now()+2*86400000).toISOString(),dueState:'assigned'}]})};
    const congregation={
      async load(){return[{congregationId:'cong-smoke',congregation:{name:'Smoke Test Congregation'}}]},
      can(){return true},
      assert(){return true}
    };
    const calendar=createCalendarService({session,privateStorage,api,assignments,congregation});

    let back=0;const host=document.createElement('div');document.body.appendChild(host);
    const def=calendarPage({calendar,onBack:()=>back++,onAccount:()=>{}});host.innerHTML=def.html;def.mount(host);
    await new Promise(resolve=>setTimeout(resolve,50));

    const beforeText=host.textContent||'';
    const form=host.querySelector('[data-calendar-add]');
    form.querySelector('input[name="title"]').value='Family devotion';
    form.querySelector('input[name="eventDate"]').value=eventDate;
    const addRect=form.querySelector('button[type="submit"]').getBoundingClientRect();
    form.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    await new Promise(resolve=>setTimeout(resolve,50));
    const afterText=host.textContent||'';

    const shareCheckbox=host.querySelector('[data-calendar-share]');
    const recurrenceInputBeforeCheck=host.querySelector('[data-calendar-recurrence]')?.disabled;
    shareCheckbox.checked=true;
    shareCheckbox.dispatchEvent(new Event('change',{bubbles:true}));
    const recurrenceInputAfterCheck=host.querySelector('[data-calendar-recurrence]')?.disabled;
    host.querySelector('input[name="title"]').value='Congregation potluck';
    host.querySelector('input[name="eventDate"]').value=eventDate;
    host.querySelector('input[name="recurrenceWeeks"]').value='2';
    host.querySelector('[data-calendar-add]').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    await new Promise(resolve=>setTimeout(resolve,50));
    const afterShareText=host.textContent||'';
    const ownerEditCount=host.querySelectorAll('[data-calendar-edit]').length;
    const ownerDeleteCount=host.querySelectorAll('[data-calendar-remove-congregation]').length;

    host.querySelector('[data-calendar-edit]')?.click();
    await new Promise(resolve=>setTimeout(resolve,20));
    const editingMarker=(host.textContent||'').includes('EDIT SHARED EVENT');
    const editForm=host.querySelector('[data-calendar-add]');
    const editPrefill={title:editForm?.querySelector('input[name="title"]')?.value||'',date:editForm?.querySelector('input[name="eventDate"]')?.value||'',recurrence:editForm?.querySelector('input[name="recurrenceWeeks"]')?.value||''};
    editForm.querySelector('input[name="title"]').value='Updated congregation potluck';
    editForm.querySelector('input[name="recurrenceWeeks"]').value='3';
    editForm.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
    await new Promise(resolve=>setTimeout(resolve,50));
    const afterEditText=host.textContent||'';
    const ownedAfterEdit=congregationSaved.find(item=>item.user_id==='calendar-smoke-user');

    host.querySelector('[data-calendar-remove-congregation]')?.click();
    await new Promise(resolve=>setTimeout(resolve,50));
    const afterDeleteText=host.textContent||'';
    host.querySelector('[data-calendar-back]')?.click();

    const metrics={innerWidth,scrollWidth:document.documentElement.scrollWidth,addButtonHeight:addRect?.height||0};
    host.remove();
    return{beforeText,afterText,afterShareText,afterEditText,afterDeleteText,saved,congregationSaved,calls,ownedAfterEdit,back,metrics,recurrenceInputBeforeCheck,recurrenceInputAfterCheck,ownerEditCount,ownerDeleteCount,editingMarker,editPrefill};
  });
  assert(result.beforeText.includes('Read Mark 1'),'Assignment due date did not appear in the agenda.');
  assert(result.beforeText.includes('Other leader event'),'A congregation event from another leader did not render read-only.');
  assert(result.afterText.includes('Family devotion'),'Newly added personal event did not render after submit.');
  assert(result.saved.length===1&&result.saved[0].title==='Family devotion','Add did not sync through the API boundary exactly once.');
  assert(result.recurrenceInputBeforeCheck===true,'Recurrence input must start disabled until sharing is checked.');
  assert(result.recurrenceInputAfterCheck===false,'Recurrence input must enable once sharing is checked.');
  assert(result.afterShareText.includes('Congregation potluck'),'Shared congregation event did not render after submit.');
  assert(result.ownerEditCount===1&&result.ownerDeleteCount===1,'Only the signed-in creator should receive edit/delete controls; non-owner shared events must remain read-only.');
  assert(result.editingMarker,'Edit control did not switch the existing Calendar form into shared-event edit mode.');
  assert(result.editPrefill.title==='Congregation potluck'&&result.editPrefill.recurrence==='2','Shared-event edit form did not preserve the current row values.');
  assert(result.calls.updates===1,'Shared-event save did not call updateCongregation exactly once.');
  assert(result.ownedAfterEdit?.title==='Updated congregation potluck'&&result.ownedAfterEdit?.recurrence_weeks===3,'Shared-event edit did not persist the changed title/recurrence.');
  assert(result.afterEditText.includes('Updated congregation potluck'),'Updated shared event did not re-render from server-authoritative state.');
  assert(result.calls.removals===1,'Shared-event delete did not call removeCongregation exactly once.');
  assert(result.congregationSaved.length===1&&result.congregationSaved[0].id==='cong-other','Owner delete must remove only the creator\'s row and preserve another leader\'s event.');
  assert(!result.afterDeleteText.includes('Updated congregation potluck')&&result.afterDeleteText.includes('Other leader event'),'Shared-event delete did not refresh the agenda correctly.');
  assert(result.saved.length===1,'Shared-event mutations must never touch personal event rows.');
  assert(result.back===1,'Back navigation callback did not fire.');
  assert(result.metrics.innerWidth===390,'Calendar smoke did not execute at 390px.');
  assert(result.metrics.scrollWidth<=result.metrics.innerWidth+1,`Calendar caused horizontal overflow: ${result.metrics.scrollWidth}px > ${result.metrics.innerWidth}px.`);
  assert(result.metrics.addButtonHeight>=44,`Calendar add-event target is too short for mobile: ${result.metrics.addButtonHeight}px.`);
  assert(errors.length===0,`Unexpected Calendar console/page errors: ${errors.join(' | ')}`);
  await page.close();
}
try{await run();console.log('BibleQuest v3 Calendar mobile browser regression passed.')}finally{await browser.close()}