import { chromium } from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

const assignment={
  id:'audit-a1',congregationId:'audit-c1',createdBy:'leader1',title:'Whole-app audit task',instructions:'Complete this audit task.',
  type:'custom',scriptureRefs:[],targetScope:'all',targetId:null,dueAt:null,scheduleAt:null,reminderAt:null,
  recurrenceRule:null,requiredReflection:false,minQuizScore:null,evidenceType:'none',points:5,dueState:'open',
  progress:{assignmentId:'audit-a1',userId:'audit-u1',status:'assigned',submission:'',leaderFeedback:'',completedAt:null,updatedAt:null}
};

const ready=(rows=[])=>({
  status:'ready',authenticated:true,remoteAvailable:true,userId:'audit-u1',congregations:[],congregationId:'audit-c1',congregationName:'Audit Church',role:'member',
  assignments:rows,activeId:'',publishTargets:{members:[],teams:[],groups:[]},activeReview:{assignmentId:'',status:'idle',responders:[],responses:[],error:''}
});

try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});

  const result=await page.evaluate(async({assignment})=>{
    const {assignmentsPage}=await import(`/src/features/assignments/index.js?v4wholeappstates=${Date.now()}`);
    const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    const ready=rows=>({status:'ready',authenticated:true,remoteAvailable:true,userId:'audit-u1',congregations:[],congregationId:'audit-c1',congregationName:'Audit Church',role:'member',assignments:rows,activeId:'',publishTargets:{members:[],teams:[],groups:[]},activeReview:{assignmentId:'',status:'idle',responders:[],responses:[],error:''}});

    const mount=async service=>{
      const host=document.createElement('div');
      host.dataset.wholeAppStateAudit='1';
      host.style.width='100%';
      const def=assignmentsPage({assignments:service,onBack:()=>{},onAccount:()=>{}});
      host.innerHTML=def.html;
      document.body.appendChild(host);
      const dispose=def.mount(host);
      await wait(20);
      return{host,dispose:()=>{dispose?.();host.remove()}};
    };

    const makeService=({initial,load,complete}={})=>{
      let state=structuredClone(initial||ready([]));
      return{
        snapshot:()=>state,
        async load(){return load?load(v=>{state=structuredClone(v)}):state},
        open(id){state={...state,activeId:id,activeReview:{assignmentId:id,status:'idle',responders:[],responses:[],error:''}};return state},
        close(){state={...state,activeId:'',activeReview:{assignmentId:'',status:'idle',responders:[],responses:[],error:''}};return state},
        async loadReview(id){state={...state,activeId:id,activeReview:{assignmentId:id,status:'ready',responders:[],responses:[],error:''}};return state},
        async loadPublishTargets(){return state},
        async publish(){return state},
        async start(){return state},
        async complete(id,submission,requirements){
          if(complete)return complete({id,submission,requirements,get:()=>state,set:v=>{state=structuredClone(v)}});
          return{state,awarded:0,alreadyCompleted:false};
        },
        async watch(){return()=>{}},stopSync(){},contract:{}
      };
    };

    const texts={};

    let resolveLoading;
    const loadingPromise=new Promise(resolve=>{resolveLoading=resolve});
    let mounted=await mount(makeService({initial:ready([]),load:async set=>{const next=await loadingPromise;set(next);return next}}));
    texts.loading=mounted.host.textContent||'';
    resolveLoading(ready([]));
    await wait(35);
    texts.emptyAfterLoading=mounted.host.textContent||'';
    mounted.dispose();

    for(const [key,state] of Object.entries({
      signedOut:{...ready([]),status:'signed-out',authenticated:false},
      offline:{...ready([]),status:'local-preview',remoteAvailable:false},
      noCongregation:{...ready([]),status:'no-congregation'}
    })){
      mounted=await mount(makeService({initial:state}));
      texts[key]=mounted.host.textContent||'';
      mounted.dispose();
    }

    const rawError='postgres audit_table service_role=AUDIT_SECRET';
    mounted=await mount(makeService({initial:ready([]),load:async()=>{throw new Error(rawError)}}));
    await wait(25);
    texts.error=mounted.host.textContent||'';
    mounted.dispose();

    const initial=ready([assignment]);
    mounted=await mount(makeService({initial,complete:async({id,get,set})=>{
      const current=get();
      const rows=current.assignments.map(row=>row.id===id?{...row,dueState:'completed',progress:{...row.progress,status:'completed',completedAt:'2026-09-12T00:00:00.000Z'}}:row);
      const next={...current,assignments:rows};set(next);return{state:next,awarded:5,alreadyCompleted:false};
    }}));
    mounted.host.querySelector('[data-assignment-open="audit-a1"]')?.click();
    await wait(20);
    mounted.host.querySelector('[data-assignment-complete="audit-a1"]')?.requestSubmit();
    await wait(35);
    texts.success=mounted.host.textContent||'';
    const successMetrics={
      innerWidth,
      htmlScrollWidth:document.documentElement.scrollWidth,
      bodyScrollWidth:document.body.scrollWidth,
      hostWidth:mounted.host.getBoundingClientRect().width,
      hostScrollWidth:mounted.host.scrollWidth
    };
    mounted.dispose();

    return{texts,rawError,successMetrics};
  },{assignment});

  assert(result.texts.loading.includes('Loading assignments'),'Browser state audit did not render a real loading state.');
  assert(result.texts.emptyAfterLoading.includes('No active assignments'),'Browser state audit did not transition loading → ready-empty.');
  assert(result.texts.signedOut.includes('Sign in to receive'),'Browser state audit did not render the signed-out state.');
  assert(result.texts.offline.includes('unavailable in local preview'),'Browser state audit did not render the offline/local-preview state.');
  assert(result.texts.noCongregation.includes('Join an active congregation'),'Browser state audit did not render the no-congregation empty/context state.');
  assert(result.texts.error.includes('Assignments could not load.')&&!result.texts.error.includes(result.rawError),'Browser error state is missing or leaked raw service details.');
  assert(result.texts.success.includes('Task completed')&&result.texts.success.includes('+5 pts'),'Browser state audit did not render the successful completion state.');
  assert(result.successMetrics.htmlScrollWidth<=result.successMetrics.innerWidth+1&&result.successMetrics.bodyScrollWidth<=result.successMetrics.innerWidth+1,'State transitions introduced document-level horizontal overflow.');
  assert(result.successMetrics.hostScrollWidth<=result.successMetrics.hostWidth+1,'State transition surface overflowed its audit host.');
  assert(errors.length===0,`Unexpected whole-app state-audit console/page errors: ${errors.join(' | ')}`);

  await page.close();
  console.log('BibleQuest v4 whole-app browser state matrix passed.');
}finally{
  await browser.close();
}
