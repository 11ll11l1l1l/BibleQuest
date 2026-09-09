import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(ok,message)=>{if(!ok)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{
    const [{createAssignmentsService},{assignmentsPage}]=await Promise.all([import(`/src/app/assignments.js?smoke=${Date.now()}`),import(`/src/features/assignments/index.js?smoke=${Date.now()}`)]);
    let sessionState={authenticated:true,remoteAvailable:true,user:{id:'u1'}},progress=[],syncCallback=null,cleaned=0,title='Read John 1';
    const session={getState:()=>sessionState};
    const congregation={load:async()=>[{congregationId:'c1',userId:'u1',role:'member',roleKnown:true,roleLabel:'Member',congregation:{id:'c1',name:'Test Church',timezone:'Asia/Tokyo'}}],assert:()=>true};
    const assignment=()=>({id:'a1',congregation_id:'c1',created_by:'leader1',title,instructions:'Read carefully and write one sentence if you want.',assignment_type:'reading',scripture_refs:['John 1'],target_scope:'all',target_id:null,due_at:'2026-09-12T10:00:00Z',points:5,active:true,created_at:'2026-09-09T00:00:00Z',updated_at:'2026-09-10T00:00:00Z'});
    const api={
      load:async()=>({assignments:[assignment()],progress}),
      start:async()=>{progress=[{assignment_id:'a1',user_id:'u1',status:'started',submission:null,leader_feedback:null,completed_at:null,updated_at:new Date().toISOString()}];return{progress:progress[0],awarded:0,alreadyCompleted:false}},
      complete:async(_cid,_id,submission)=>{progress=[{assignment_id:'a1',user_id:'u1',status:'completed',submission,leader_feedback:'Thank you for completing this.',completed_at:new Date().toISOString(),updated_at:new Date().toISOString()}];return{progress:progress[0],awarded:5,alreadyCompleted:false}},
      subscribe:async(_cid,_uid,listener)=>{syncCallback=listener;return()=>{cleaned++}}
    };
    const assignments=createAssignmentsService({api,session,congregation});const host=document.createElement('div');host.innerHTML='<section class="bq-panel" data-assignments-view></section>';document.body.appendChild(host);
    const pageDef=assignmentsPage({assignments,onBack:()=>{},onAccount:()=>{}}),dispose=pageDef.mount(host);await new Promise(resolve=>setTimeout(resolve,40));
    const initial={heading:host.querySelector('h1')?.textContent||'',row:host.querySelector('[data-assignment-row="a1"]')?.textContent||''};
    host.querySelector('[data-assignment-open="a1"]')?.click();await new Promise(resolve=>setTimeout(resolve,10));const opened={detail:host.querySelector('[data-assignment-detail="a1"]')?.textContent||''};
    host.querySelector('[data-assignment-start="a1"]')?.click();await new Promise(resolve=>setTimeout(resolve,40));const started=host.querySelector('[data-assignment-detail="a1"]')?.textContent||'';
    const form=host.querySelector('[data-assignment-complete="a1"]');form.querySelector('textarea[name="submission"]').value='I noticed the Word was with God.';form.requestSubmit();await new Promise(resolve=>setTimeout(resolve,60));const completed=host.querySelector('[data-assignment-detail="a1"]')?.textContent||'';
    title='Read John 1 again';syncCallback?.();await new Promise(resolve=>setTimeout(resolve,50));const synced={row:host.querySelector('[data-assignment-row="a1"]')?.textContent||'',message:host.textContent.includes('Assignment status synced.')};
    dispose?.();host.remove();sessionState={authenticated:false,remoteAvailable:true,user:null};const signedOut=await assignments.load();
    return{initial,opened,started,completed,synced,cleaned,signedOut:signedOut.status};
  });
  assert(result.initial.heading==='Test Church','Assignments congregation heading did not render.');assert(result.initial.row.includes('Read John 1')&&result.initial.row.includes('Assigned'),'Received assignment did not render.');
  assert(result.opened.detail.includes('Read carefully')&&result.opened.detail.includes('John 1'),'Assignment detail/open flow failed.');assert(result.started.includes('Started'),'Assignment started state did not reload.');
  assert(result.completed.includes('Completed')&&result.completed.includes('I noticed the Word was with God.')&&result.completed.includes('Thank you for completing this.'),'Assignment completion/own feedback state did not render.');
  assert(result.synced.row.includes('Read John 1 again')&&result.synced.message,'Realtime assignment signal did not refresh server truth.');assert(result.cleaned===1,'Assignment realtime channel was not cleaned up exactly once.');assert(result.signedOut==='signed-out','Signed-out Assignments did not fail closed.');
  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert(metrics.innerWidth===390,'Assignments smoke did not execute at 390px.');assert(metrics.scrollWidth<=metrics.innerWidth+1,`Assignments caused horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(errors.length===0,`Unexpected Assignments console/page errors: ${errors.join(' | ')}`);await page.close();
}
try{await run();console.log('BibleQuest v3 Assignments mobile browser regression passed.')}finally{await browser.close()}
