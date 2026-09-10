import { createContentModerationService } from '../src/app/content-moderation.js';
import { createGameLauncherService } from '../src/app/games.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
let sessionState={authenticated:false,remoteAvailable:true,user:null};
let memberships=[];
let apiRows=[];
let apiError=null;
const apiCalls=[];
const api={async list(id){apiCalls.push(id);if(apiError)throw apiError;return apiRows.map(row=>({...row}))}};
const session={getState:()=>sessionState};
const congregation={async load(){return memberships.map(row=>({...row,congregation:{...row.congregation}}))}};
const moderation=createContentModerationService({api,session,congregation});

let state=await moderation.refresh();
assert(state.status==='inactive'&&apiCalls.length===0,'Signed-out moderation must remain inactive without a policy read.');
assert(moderation.applyCore([{id:'q1'},{id:'q2'}]).length===2,'Signed-out moderation must preserve verified base content.');

sessionState={authenticated:true,remoteAvailable:false,user:{id:'user-1'}};
state=await moderation.refresh();
assert(state.status==='local-preview'&&apiCalls.length===0,'Local preview must not fabricate remote policy.');

sessionState={authenticated:true,remoteAvailable:true,user:{id:'user-1'}};
memberships=[
  {congregationId:'cong-1',role:'member',roleLabel:'Member',congregation:{name:'First Church'}},
  {congregationId:'cong-2',role:'leader',roleLabel:'Leader',congregation:{name:'Second Church'}}
];
apiRows=[
  {congregation_id:'cong-1',content_key:'question:core:q1',content_type:'question',origin:'review',decision:'remove',updated_at:'2026-09-11T00:00:00Z'},
  {congregation_id:'cong-1',content_key:'question:core:q2',content_type:'question',origin:'review',decision:'include',updated_at:'2026-09-11T00:00:00Z'},
  {congregation_id:'cong-1',content_key:'question:RUT:a1',content_type:'question',origin:'review',decision:'exempt',updated_at:'2026-09-11T00:00:00Z'},
  {congregation_id:'cong-1',content_key:'question:RUT:qz9',content_type:'question',origin:'quarantine',decision:'include',updated_at:'2026-09-11T00:00:00Z'},
  {congregation_id:'cong-2',content_key:'question:core:q3',content_type:'question',origin:'review',decision:'remove',updated_at:'2026-09-11T00:00:00Z'},
  {congregation_id:'cong-1',content_key:'bad-key',content_type:'question',origin:'review',decision:'remove',updated_at:'2026-09-11T00:00:00Z'},
  {congregation_id:'cong-1',content_key:'question:core:q4',content_type:'story',origin:'review',decision:'remove',updated_at:'2026-09-11T00:00:00Z'},
  {congregation_id:'cong-1',content_key:'question:core:q5',content_type:'question',origin:'legacy',decision:'remove',updated_at:'2026-09-11T00:00:00Z'},
  {congregation_id:'cong-1',content_key:'question:core:q6',content_type:'question',origin:'review',decision:'hide',updated_at:'2026-09-11T00:00:00Z'}
];
state=await moderation.refresh();
assert(state.status==='ready'&&state.congregationId==='cong-1','Moderation must choose the first active membership deterministically.');
assert(state.decisionCount===4,'Malformed, cross-congregation, wrong-type, origin, or decision rows must be discarded.');
assert(apiCalls.at(-1)==='cong-1','Moderation policy read was not scoped to the selected congregation.');
const core=moderation.applyCore([{id:'q1'},{id:'q2'},{id:'q3'}]);
assert(core.map(row=>row.id).join(',')==='q2,q3','Core remove/exempt policy did not suppress only matching content.');
assert(moderation.hasRecallIncludes('RUT')===true&&moderation.hasRecallIncludes('GEN')===false,'Recall include detection is not scoped to the exact book prefix.');
const recall=moderation.applyRecall('RUT',[{id:'a1'},{id:'a2'}],[{id:'qz9',safety:{action:'quarantine',topics:['salvation']}},{id:'a2',safety:{action:'quarantine'}},{id:'none',safety:{action:'quarantine'}}]);
assert(recall.map(row=>row.id).join(',')==='a2,qz9','Recall policy did not combine suppression and explicit quarantine restoration correctly.');
const restored=recall.find(row=>row.id==='qz9');
assert(restored.safety.originalAction==='quarantine'&&restored.safety.action==='allow'&&restored.safety.moderationOverride==='include','Restored Recall item is missing moderation override metadata.');

let rejected=false;
try{await moderation.select('cong-x')}catch(error){rejected=error.code==='BQ_CONTENT_MODERATION_SCOPE_DENIED'}
assert(rejected,'Explicit moderation scope must reject a congregation outside current membership.');
apiRows=[];
state=await moderation.select('cong-2');
assert(state.status==='ready'&&state.congregationId==='cong-2'&&state.decisionCount===0,'Valid explicit moderation scope switch failed.');
const loadedAt=state.loadedAt;
apiError=new Error('policy unavailable');
state=await moderation.refresh();
assert(state.status==='stale'&&state.loadedAt===loadedAt&&state.decisionCount===0,'A failed refresh must retain even an empty previously successful policy as stale.');
apiError=null;
memberships=[];
state=await moderation.refresh();
assert(state.status==='no-membership'&&state.congregationId===''&&state.decisionCount===0,'Lost membership must clear moderation scope and policy.');

const storageData=new Map();
const storage={read:(key,fallback)=>storageData.has(key)?storageData.get(key):fallback,write:(key,value)=>storageData.set(key,value)};
const progress={record(){}};
const recallOwner={
  quarantineLoads:0,
  async loadManifest(){return {books:[{code:'RUT',name:'Ruth',questions:2,path:'data/packs/questions/RUT.json'}],source:'source',license:'license'}},
  async loadBook(){return {book:{code:'RUT',name:'Ruth',questions:2,path:'data/packs/questions/RUT.json'},source:'source',license:'license',items:[{id:'a1'},{id:'a2'}]}},
  async loadQuarantine(){this.quarantineLoads+=1;return [{id:'qz9',safety:{action:'quarantine'}}]}
};
const blockedGames=createGameLauncherService({progress,storage,recall:recallOwner,moderation:{applyCore:()=>[],applyRecall:(_code,rows)=>rows,hasRecallIncludes:()=>false}});
rejected=false;
try{blockedGames.start('quick-recall')}catch(error){rejected=error.message.includes('current content policy')}
assert(rejected,'Games must fail explicitly when moderation removes every question in a requested core mode.');

const baseGames=createGameLauncherService({progress,storage,recall:recallOwner,moderation:{applyCore:rows=>rows,applyRecall:(_code,rows)=>rows,hasRecallIncludes:()=>false}});
await baseGames.startRecallBook('RUT');
assert(recallOwner.quarantineLoads===0,'Games must not load quarantine content without an explicit matching include policy.');

const overrideGames=createGameLauncherService({progress,storage,recall:recallOwner,moderation:{applyCore:rows=>rows,applyRecall:(_code,rows,quarantine)=>[...rows,...quarantine],hasRecallIncludes:()=>true}});
const overrideState=await overrideGames.startRecallBook('RUT');
assert(recallOwner.quarantineLoads===1&&overrideState.total===3,'Games did not request and consume quarantined candidates for an explicit include policy.');

console.log('BibleQuest v3 Content Moderation owner/policy edge regression passed.');