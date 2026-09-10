import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(ok,message)=>{if(!ok)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{
    location.hash='#/home';
    const [{createAssignmentsService},{assignmentsPage}]=await Promise.all([import(`/src/app/assignments.js?linked=${Date.now()}`),import(`/src/features/assignments/index.js?linked=${Date.now()}`)]);
    let progress=[],startCalls=0,completeCalls=0;
    const session={getState:()=>({authenticated:true,remoteAvailable:true,user:{id:'u1'}})};
    const congregation={load:async()=>[{congregationId:'c1',userId:'u1',role:'member',roleKnown:true,roleLabel:'Member',congregation:{id:'c1',name:'Linked Church',timezone:'Asia/Tokyo'}}],assert:()=>true};
    const assignment={id:'a1',congregation_id:'c1',created_by:'leader1',title:'Read John 1',instructions:'Open the linked Reader, then return and mark complete.',assignment_type:'reading',scripture_refs:['John 1'],target_scope:'all',target_id:null,due_at:'2026-09-12T10:00:00Z',points:5,active:true,created_at:'2026-09-09T00:00:00Z',updated_at:'2026-09-10T00:00:00Z'};
    const api={load:async()=>({assignments:[assignment],progress}),start:async()=>{startCalls++;progress=[{assignment_id:'a1',user_id:'u1',status:'started',submission:null,leader_feedback:null,completed_at:null,updated_at:new Date().toISOString()}];return{progress:progress[0],awarded:0,alreadyCompleted:false}},complete:async(_cid,_id,submission)=>{completeCalls++;progress=[{assignment_id:'a1',user_id:'u1',status:'completed',submission,leader_feedback:null,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()}];return{progress:progress[0],awarded:5,alreadyCompleted:false}},subscribe:async()=>()=>{}};
    const assignments=createAssignmentsService({api,session,congregation});const host=document.createElement('div');host.innerHTML='<section class="bq-panel" data-assignments-view></section>';document.body.appendChild(host);const dispose=assignmentsPage({assignments,onBack:()=>{},onAccount:()=>{}}).mount(host);await new Promise(resolve=>setTimeout(resolve,40));
    host.querySelector('[data-assignment-open="a1"]')?.click();await new Promise(resolve=>setTimeout(resolve,10));
    const before={linked:Boolean(host.querySelector('[data-assignment-linked="a1"]')),handoff:host.querySelector('[data-linked-completion-handoff]')?.textContent||'',legacyStart:Boolean(host.querySelector('[data-assignment-start="a1"]'))};
    host.querySelector('[data-assignment-linked="a1"]')?.click();await new Promise(resolve=>setTimeout(resolve,80));
    const afterLaunch={hash:location.hash,startCalls,status:host.querySelector('[data-assignment-detail="a1"]')?.textContent||'',reopen:host.querySelector('[data-assignment-linked="a1"]')?.textContent||''};
    const form=host.querySelector('[data-assignment-complete="a1"]');form.querySelector('textarea[name="submission"]').value='Finished the linked reading.';form.requestSubmit();await new Promise(resolve=>setTimeout(resolve,70));
    const afterComplete={completeCalls,text:host.querySelector('[data-assignment-detail="a1"]')?.textContent||''};
    dispose?.();host.remove();location.hash='#/home';return{before,afterLaunch,afterComplete};
  });
  assert(result.before.linked,'Reading assignment did not expose the linked activity action.');assert(result.before.handoff.includes('return to this assignment')&&result.before.handoff.includes('cannot award assignment completion'),'Completion handoff boundary was not visible.');assert(!result.before.legacyStart,'Linked assignment must not also expose the generic Start task action.');
  assert(result.afterLaunch.startCalls===1,'Linked launch did not call the existing Assignments start boundary exactly once.');assert(result.afterLaunch.hash==='#/reader','Linked reading did not navigate through the verified Reader hash route.');assert(result.afterLaunch.status.includes('Started')&&result.afterLaunch.reopen.includes('Reopen linked activity'),'Started linked task did not preserve reopen/completion handoff state.');
  assert(result.afterComplete.completeCalls===1&&result.afterComplete.text.includes('Completed')&&result.afterComplete.text.includes('Finished the linked reading.'),'Linked completion did not hand back to the existing Assignments completion owner.');
  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert(metrics.innerWidth===390,'Linked Activities smoke did not execute at 390px.');assert(metrics.scrollWidth<=metrics.innerWidth+1,`Linked Activities caused horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(errors.length===0,`Unexpected Linked Activities console/page errors: ${errors.join(' | ')}`);await page.close();
}
try{await run();console.log('BibleQuest v3 Linked Activities mobile browser regression passed.')}finally{await browser.close()}
