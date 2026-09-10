import { createContentReportingService } from '../src/app/content-reporting.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const user={id:'user-1'};
let authenticated=true;
let rows=[{congregationId:'cong-1',userId:'user-1',role:'member',roleLabel:'Member',congregation:{name:'First Church'}}];
const submitted=[];
const api={async submit(row){submitted.push(JSON.parse(JSON.stringify(row)));return {id:String(submitted.length)}}};
const session={getState:()=>({authenticated,user:authenticated?user:null})};
const congregation={
  async load(){return rows.slice()},
  get(id){return rows.find(row=>row.congregationId===String(id))||null}
};
const reporting=createContentReportingService({api,session,congregation});

const prepared=await reporting.prepare();
assert(prepared.congregations.length===1&&prepared.congregations[0].id==='cong-1','Content reporting did not reuse the current congregation membership owner.');
assert(prepared.reasons.join(',')==='doctrinal,accuracy,wording,inappropriate,duplicate,source,other','Content reporting reasons do not match the retained backend contract.');

const context={contentKey:'v3:study:abc123',contentType:'question',contentSource:'v3-screen',contentRef:'John 3:16',contentText:'What does this passage say about God’s love?',contentPayload:{route:'study',title:'Guided Study'}};
const result=await reporting.submit({congregationId:'cong-1',context,reason:'accuracy',note:'Please verify the wording.'});
assert(result.id==='1','Successful content report did not return the backend report ID.');
assert(submitted.length===1,'Valid content report was not submitted exactly once.');
assert(submitted[0].reporter_id==='user-1'&&submitted[0].congregation_id==='cong-1','Reporter or congregation identity was not bound to verified owners.');
assert(submitted[0].content_key===context.contentKey&&submitted[0].content_text===context.contentText,'Exact reportable content context was not preserved.');
assert(submitted[0].reason==='accuracy'&&submitted[0].note==='Please verify the wording.','Reason/note were not preserved after validation.');

await reporting.submit({congregationId:'cong-1',context,reason:'other'});
assert(submitted.length===2,'Repeated valid reports were incorrectly deduplicated without a recovered idempotency contract.');
assert(submitted[1].note===null&&submitted[1].content_ref==='John 3:16','Optional note/reference normalization is incorrect.');

let rejected=false;
try{await reporting.submit({congregationId:'cong-1',context,reason:'technical'})}catch(error){rejected=error.code==='BQ_CONTENT_REPORT_REASON_INVALID'}
assert(rejected,'Unsupported legacy technical reason must fail closed against the real database contract.');

rejected=false;
try{await reporting.submit({congregationId:'cong-1',context:{...context,contentKey:'x'},reason:'other'})}catch(error){rejected=error.code==='BQ_CONTENT_REPORT_INVALID'}
assert(rejected,'Malformed content keys must be rejected before API submission.');

rejected=false;
try{await reporting.submit({congregationId:'cong-1',context,reason:'other',note:'x'.repeat(1201)})}catch(error){rejected=error.code==='BQ_CONTENT_REPORT_INVALID'}
assert(rejected,'Overlong report notes must be rejected before API submission.');

rows=[];
rejected=false;
try{await reporting.submit({congregationId:'cong-1',context,reason:'other'})}catch(error){rejected=error.code==='BQ_CONTENT_REPORT_MEMBERSHIP_REQUIRED'}
assert(rejected,'Content reporting must fail closed when current congregation membership disappears.');

rows=[{congregationId:'cong-1',userId:'user-1',role:'member',roleLabel:'Member',congregation:{name:'First Church'}}];
authenticated=false;
rejected=false;
try{await reporting.prepare()}catch(error){rejected=error.code==='BQ_CONTENT_REPORT_AUTH_REQUIRED'}
assert(rejected,'Signed-out content reporting preparation must fail closed.');

authenticated=true;
const failing=createContentReportingService({api:{async submit(){throw new Error('RLS denied report')}},session,congregation});
rejected=false;
try{await failing.submit({congregationId:'cong-1',context,reason:'source'})}catch(error){rejected=error.message==='RLS denied report'}
assert(rejected,'Backend/RLS errors must propagate instead of being converted to report success.');

console.log('BibleQuest v3 Content Reporting owner/validation edge regression passed.');
