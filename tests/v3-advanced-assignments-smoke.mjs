import {chromium} from 'playwright';
const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/',browser=await chromium.launch({headless:true}),assert=(ok,message)=>{if(!ok)throw new Error(message)};
async function run(){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});
  const result=await page.evaluate(async()=>{
    const stamp=Date.now(),[{createAssignmentsService},{assignmentsPage}]=await Promise.all([import(`/src/app/assignments.js?advanced=${stamp}`),import(`/src/features/assignments/index.js?advanced=${stamp}`)]);
    const NOW='2026-09-10T02:00:00.000Z';let progress=[],completedCall=null;
    const session={getState:()=>({authenticated:true,remoteAvailable:true,user:{id:'u1'}})};
    const congregation={load:async()=>[{congregationId:'c1',userId:'u1',role:'member',roleKnown:true,roleLabel:'Member',congregation:{id:'c1',name:'Test Church',timezone:'Asia/Tokyo'}}],assert:()=>true};
    const assignmentsRows=[
      {id:'advanced',congregation_id:'c1',created_by:'leader1',title:'Advanced study',instructions:'Reflect and record your quiz result.',assignment_type:'quiz',scripture_refs:['James 1:5'],target_scope:'all',target_id:null,due_at:'2026-09-10T04:00:00Z',schedule_at:'2026-09-10T01:00:00Z',reminder_at:'2026-09-10T03:00:00Z',recurrence_rule:'FREQ=WEEKLY',required_reflection:true,min_quiz_score:80,evidence_type:'confirmation',points:10,active:true,created_at:'2026-09-09T00:00:00Z',updated_at:NOW},
      {id:'scheduled',congregation_id:'c1',created_by:'leader1',title:'Tomorrow task',instructions:'Not open yet.',assignment_type:'reading',scripture_refs:[],target_scope:'all',target_id:null,due_at:'2026-09-11T05:00:00Z',schedule_at:'2026-09-11T01:00:00Z',reminder_at:null,recurrence_rule:null,required_reflection:false,min_quiz_score:null,evidence_type:'none',points:5,active:true,created_at:'2026-09-09T00:00:00Z',updated_at:NOW}
    ];
    const api={
      load:async()=>({assignments:assignmentsRows,progress}),
      start:async(_cid,id)=>({progress:{assignment_id:id,user_id:'u1',status:'started',submission:null,leader_feedback:null,completed_at:null,updated_at:NOW},awarded:0,alreadyCompleted:false}),
      complete:async(cid,id,submission,quizScore)=>{completedCall={cid,id,submission,quizScore};const row={assignment_id:id,user_id:'u1',status:'completed',submission,leader_feedback:'Reviewed',completed_at:NOW,updated_at:NOW};progress=[row];return{progress:row,awarded:10,alreadyCompleted:false}},
      subscribe:async()=>()=>{}
    };
    const assignments=createAssignmentsService({api,session,congregation,now:()=>new Date(NOW)}),host=document.createElement('div');host.innerHTML='<section class="bq-panel" data-assignments-view></section>';document.body.appendChild(host);const dispose=assignmentsPage({assignments,onBack:()=>{},onAccount:()=>{}}).mount(host);await new Promise(resolve=>setTimeout(resolve,40));
    const list=host.textContent||'';
    host.querySelector('[data-assignment-open="advanced"]')?.click();await new Promise(resolve=>setTimeout(resolve,10));
    const detail=host.querySelector('[data-assignment-detail="advanced"]')?.textContent||'',form=host.querySelector('[data-assignment-complete="advanced"]'),controls={reflectionRequired:Boolean(form?.querySelector('textarea[required]')),quizRequired:Boolean(form?.querySelector('input[name="quizScore"][required]')),confirmationRequired:Boolean(form?.querySelector('input[name="confirmed"][required]'))};
    form.querySelector('textarea[name="submission"]').value='I asked God for wisdom.';form.querySelector('input[name="quizScore"]').value='85';form.querySelector('input[name="confirmed"]').checked=true;form.requestSubmit();await new Promise(resolve=>setTimeout(resolve,60));const completed=host.querySelector('[data-assignment-detail="advanced"]')?.textContent||'';
    host.querySelector('[data-assignment-open="scheduled"]')?.click();await new Promise(resolve=>setTimeout(resolve,10));const scheduled={text:host.querySelector('[data-assignment-detail="scheduled"]')?.textContent||'',hasStart:Boolean(host.querySelector('[data-assignment-detail="scheduled"] [data-assignment-start]')),hasCompletion:Boolean(host.querySelector('[data-assignment-detail="scheduled"] [data-assignment-complete]')),hasScheduledMessage:Boolean(host.querySelector('[data-assignment-detail="scheduled"] [data-assignment-scheduled]'))};
    dispose?.();host.remove();return{list,detail,controls,completed,completedCall,scheduled};
  });
  assert(result.list.includes('Advanced study')&&result.list.includes('Tomorrow task')&&result.list.includes('Scheduled'),'Advanced assignment due state did not render in list.');
  assert(result.detail.includes('Opens')&&result.detail.includes('Reminder')&&result.detail.includes('Weekly recurrence rule')&&result.detail.includes('Written reflection required')&&result.detail.includes('Completion confirmation required')&&result.detail.includes('Quiz score ≥ 80%'),'Advanced assignment metadata did not render.');
  assert(result.controls.reflectionRequired&&result.controls.quizRequired&&result.controls.confirmationRequired,'Advanced completion controls did not reflect retained requirements.');
  assert(result.completed.includes('Completed')&&result.completed.includes('I asked God for wisdom.')&&result.completedCall?.quizScore===85,'Advanced completion did not hand validated requirements to trusted API and reload completion.');
  assert(result.scheduled.text.includes('opens')&&!result.scheduled.hasStart&&!result.scheduled.hasCompletion&&result.scheduled.hasScheduledMessage,'Scheduled assignment must render but block start/completion until opening time.');
  const metrics=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert(metrics.innerWidth===390,'Advanced Assignments smoke did not execute at 390px.');assert(metrics.scrollWidth<=metrics.innerWidth+1,`Advanced Assignments caused horizontal overflow: ${metrics.scrollWidth}px > ${metrics.innerWidth}px.`);assert(errors.length===0,`Unexpected Advanced Assignments console/page errors: ${errors.join(' | ')}`);await page.close();
}
try{await run();console.log('BibleQuest v3 Advanced Assignments mobile browser regression passed.')}finally{await browser.close()}
