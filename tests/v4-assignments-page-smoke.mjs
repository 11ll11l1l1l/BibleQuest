import {chromium} from 'playwright';

const BASE=process.env.BQ_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const assert=(ok,message)=>{if(!ok)throw new Error(message)};

const assignment={
  id:'a1',congregationId:'c1',createdBy:'leader1',title:'Private reflection',instructions:'Write one sentence.',
  type:'custom',scriptureRefs:[],targetScope:'all',targetId:null,dueAt:null,scheduleAt:null,reminderAt:null,
  recurrenceRule:null,requiredReflection:false,minQuizScore:null,evidenceType:'none',points:5,dueState:'open',
  progress:{assignmentId:'a1',userId:'u1',status:'assigned',submission:'',leaderFeedback:'',completedAt:null,updatedAt:null}
};

try{
  const page=await browser.newPage({viewport:{width:320,height:760},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE,{waitUntil:'networkidle'});

  const result=await page.evaluate(async assignment=>{
    const {assignmentsPage}=await import(`/src/features/assignments/index.js?v4accept=${Date.now()}`),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    const ready=(role='member',rows=[])=>({status:'ready',authenticated:true,remoteAvailable:true,userId:'u1',congregations:[],congregationId:'c1',congregationName:'Test Church',role,assignments:rows,activeId:'',publishTargets:{members:[],teams:[],groups:[]},activeReview:{assignmentId:'',status:'idle',responders:[],responses:[],error:''}});
    const makeService=({initial,loadError='',reviewError='',audienceError='',completeError=''})=>{let state=structuredClone(initial);return{snapshot:()=>state,async load(){if(loadError)throw new Error(loadError);return state},open(id){state={...state,activeId:id,activeReview:{assignmentId:id,status:'idle',responders:[],responses:[],error:''}};return state},close(){state={...state,activeId:'',activeReview:{assignmentId:'',status:'idle',responders:[],responses:[],error:''}};return state},async loadReview(id){state={...state,activeId:id,activeReview:reviewError?{assignmentId:id,status:'error',responders:[],responses:[],error:reviewError}:{assignmentId:id,status:'ready',responders:[],responses:[],error:''}};return state},async loadPublishTargets(){if(audienceError)throw new Error(audienceError);return state},async publish(){return state},async start(){return state},async complete(){if(completeError)throw new Error(completeError);return{state,awarded:0,alreadyCompleted:false}},async watch(){return()=>{}},stopSync(){},contract:{}}};
    const mount=async service=>{const host=document.createElement('div'),def=assignmentsPage({assignments:service,onBack:()=>{},onAccount:()=>{}});host.innerHTML=def.html;document.body.appendChild(host);const dispose=def.mount(host);await sleep(35);return{host,dispose:()=>{dispose?.();host.remove()}}};
    const texts={};

    for(const [key,state] of Object.entries({
      signedOut:{...ready(),status:'signed-out',authenticated:false},
      offline:{...ready(),status:'local-preview',remoteAvailable:false},
      noCongregation:{...ready(),status:'no-congregation'}
    })){
      const mounted=await mount(makeService({initial:state}));
      texts[key]=mounted.host.textContent||'';
      mounted.dispose();
    }

    const rawLoad='postgres relation bible_assignments token=SUPER_SECRET';
    let mounted=await mount(makeService({initial:ready(),loadError:rawLoad}));
    texts.loadError=mounted.host.textContent||'';
    mounted.dispose();

    mounted=await mount(makeService({initial:ready()}));
    texts.empty=mounted.host.textContent||'';
    const emptyMetrics={scrollWidth:document.documentElement.scrollWidth,innerWidth,minButton:Math.min(...[...mounted.host.querySelectorAll('button')].map(node=>node.getBoundingClientRect().height))};
    mounted.dispose();

    const rawReview='select * from private_responses where secret=LEAK_ME';
    mounted=await mount(makeService({initial:ready('member',[assignment]),reviewError:rawReview}));
    mounted.host.querySelector('[data-assignment-open="a1"]')?.click();
    await sleep(35);
    texts.reviewError=mounted.host.textContent||'';
    mounted.dispose();

    const rawAudience='service_role_key=LEAK_ME_AUDIENCE';
    mounted=await mount(makeService({initial:ready('leader'),audienceError:rawAudience}));
    mounted.host.querySelector('[data-assignment-targets]')?.click();
    await sleep(35);
    texts.audienceError=mounted.host.textContent||'';
    const mobilePublisherColumns=getComputedStyle(mounted.host.querySelector('[data-assignment-publish]')).gridTemplateColumns;
    mounted.dispose();

    const rawComplete='rpc complete_assignment failed: internal-secret';
    mounted=await mount(makeService({initial:ready('member',[assignment]),completeError:rawComplete}));
    mounted.host.querySelector('[data-assignment-open="a1"]')?.click();
    await sleep(30);
    mounted.host.querySelector('[data-assignment-complete="a1"]')?.requestSubmit();
    await sleep(35);
    texts.completeError=mounted.host.textContent||'';
    mounted.dispose();

    return{texts,emptyMetrics,mobilePublisherColumns,rawLoad,rawReview,rawAudience,rawComplete};
  },assignment);

  assert(result.texts.signedOut.includes('Sign in to receive'),'Signed-out Assignments state did not render.');
  assert(result.texts.offline.includes('unavailable in local preview'),'Offline/local-preview Assignments state did not render.');
  assert(result.texts.noCongregation.includes('Join an active congregation'),'No-congregation Assignments state did not render.');
  assert(result.texts.loadError.includes('Assignments could not load.')&&!result.texts.loadError.includes(result.rawLoad),'Load failure leaked raw backend details.');
  assert(result.texts.empty.includes('No active assignments')&&result.texts.empty.includes('Privacy boundary'),'Ready-empty Assignments state or privacy boundary did not render.');
  assert(result.texts.reviewError.includes('Response status could not load.')&&!result.texts.reviewError.includes(result.rawReview),'Response-review failure leaked raw service details.');
  assert(result.texts.audienceError.includes('Audience directory could not load.')&&!result.texts.audienceError.includes(result.rawAudience),'Audience-directory failure leaked raw service details.');
  assert(result.texts.completeError.includes('Task could not be completed.')&&!result.texts.completeError.includes(result.rawComplete),'Completion failure leaked raw service details.');
  assert(result.emptyMetrics.innerWidth===320&&result.emptyMetrics.scrollWidth<=321,'Assignments acceptance must not overflow at 320px.');
  assert(result.emptyMetrics.minButton>=44,'Assignments acceptance controls must retain at least 44px touch targets.');
  assert(result.mobilePublisherColumns.split(' ').length===1,'Assignments publisher must collapse to one column on a 320px phone.');

  await page.setViewportSize({width:1100,height:900});
  const desktop=await page.evaluate(async()=>{
    const {assignmentsPage}=await import(`/src/features/assignments/index.js?v4desktop=${Date.now()}`),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
    let state={status:'ready',authenticated:true,remoteAvailable:true,userId:'leader1',congregations:[],congregationId:'c1',congregationName:'Test Church',role:'leader',assignments:[],activeId:'',publishTargets:{members:[],teams:[],groups:[]},activeReview:{assignmentId:'',status:'idle',responders:[],responses:[],error:''}};
    const service={snapshot:()=>state,async load(){return state},async loadPublishTargets(){return state},async publish(){return state},async start(){return state},async complete(){return{state,awarded:0,alreadyCompleted:false}},async watch(){return()=>{}},stopSync(){},contract:{}};
    const host=document.createElement('div'),def=assignmentsPage({assignments:service,onBack:()=>{},onAccount:()=>{}});
    host.innerHTML=def.html;document.body.appendChild(host);
    const dispose=def.mount(host);await sleep(35);
    const form=host.querySelector('[data-assignment-publish]'),columns=getComputedStyle(form).gridTemplateColumns,metrics={innerWidth,scrollWidth:document.documentElement.scrollWidth};
    dispose?.();host.remove();
    return{columns,metrics};
  });
  assert(desktop.columns.split(' ').length>=2,'Assignments publisher must use the intentional wide two-column composition.');
  assert(desktop.metrics.innerWidth===1100&&desktop.metrics.scrollWidth<=1101,'Assignments acceptance must not overflow at desktop width.');
  assert(errors.length===0,`Unexpected V4 Assignments acceptance console/page errors: ${errors.join(' | ')}`);
  await page.close();
  console.log('BibleQuest v4 Assignments page browser acceptance passed.');
}finally{
  await browser.close();
}
