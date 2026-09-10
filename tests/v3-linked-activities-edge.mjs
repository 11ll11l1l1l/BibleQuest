import {createLinkedActivitiesService,normalizeLinkedActivity} from '../src/app/linked-activities.js';
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
const expectCode=async(fn,code)=>{try{await fn();throw new Error(`Expected ${code}`)}catch(error){if(error.code!==code)throw error}};

let rows=[
  {id:'reading',type:'reading'},
  {id:'study',type:'guided-study'},
  {id:'mission',type:'mission'},
  {id:'quiz',type:'quiz'},
  {id:'reflection',type:'reflection'},
  {id:'couples',type:'couples'},
  {id:'group',type:'group'},
  {id:'custom',type:'custom'},
  {id:'explicit-wisdom',type:'custom',linkedActivity:{kind:'wisdom'}},
  {id:'explicit-journey',type:'custom',linkedActivity:{kind:'journey'}},
  {id:'explicit-live',type:'custom',linkedActivity:{kind:'live'}},
  {id:'bad-kind',type:'custom',linkedActivity:{kind:'javascript:alert(1)'}},
  {id:'bad-shape',type:'custom',linkedActivity:'reader'}
];
let state={status:'ready',activeId:'',assignments:rows},starts=[],completions=[];
const assignments={
  snapshot:()=>state,
  async start(id){starts.push(id);state={...state,activeId:id};return state},
  async complete(id,submission,requirements){completions.push({id,submission,requirements});if(requirements?.reject){const error=new Error('Requirement rejected.');error.code='BQ_ASSIGNMENT_REFLECTION_REQUIRED';throw error}return{state,awarded:5,alreadyCompleted:false}}
};
const linked=createLinkedActivitiesService({assignments});
const expected={reading:'reader',study:'study',mission:'mission',quiz:'open-review',reflection:'cloud-notes',couples:'couples-cloud',group:'journey-groups','explicit-wisdom':'wisdom-situations','explicit-journey':'mission'};
for(const [id,route] of Object.entries(expected)){const target=linked.describe(id);assert(target.present&&target.available&&target.route===route,`${id} did not resolve to ${route}`)}
assert(linked.describe('custom').present===false,'Unlinked custom assignment must stay instruction-only.');
const live=linked.describe('explicit-live');assert(live.present&&!live.available&&live.reason==='live-rooms-deferred','Live Rooms must fail closed while #43 is deferred.');
await expectCode(()=>linked.launch('custom'),'BQ_LINKED_ACTIVITY_UNLINKED');
await expectCode(()=>linked.launch('explicit-live'),'BQ_LINKED_ACTIVITY_UNAVAILABLE');
await expectCode(()=>Promise.resolve(linked.describe('bad-kind')),'BQ_LINKED_ACTIVITY_KIND');
await expectCode(()=>Promise.resolve(linked.describe('bad-shape')),'BQ_LINKED_ACTIVITY_RESPONSE');
await expectCode(()=>Promise.resolve(normalizeLinkedActivity([])),'BQ_LINKED_ACTIVITY_RESPONSE');
const opened=await linked.launch('reading');assert(opened.route==='reader'&&starts.join(',')==='reading','Launch must delegate start before returning the verified route.');
const completed=await linked.complete('reading','done',{confirmed:true});assert(completed.awarded===5&&completions.length===1&&completions[0].submission==='done','Completion handoff must delegate to Assignments.');
await expectCode(()=>linked.complete('reading','',{reject:true}),'BQ_ASSIGNMENT_REFLECTION_REQUIRED');
assert(completions.length===2,'Linked completion must not swallow assignment requirement failures.');
console.log('BibleQuest v3 Linked Activities edge regression passed.');
