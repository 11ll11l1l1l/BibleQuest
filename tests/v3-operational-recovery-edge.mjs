import { createOperationalRecoveryService } from '../src/app/operational-recovery.js';

const assert=(condition,message)=>{if(!condition)throw new Error(message)};
const reports=[];
let retryCount=0,homeCount=0;
const recovery=createOperationalRecoveryService({report:(error,context)=>reports.push({message:error.message,context})});

assert(recovery.getState()===null,'Recovery must start empty.');
const first=recovery.capture({route:'deep-questions',error:new Error('private technical detail'),retry:()=>{retryCount++},home:()=>{homeCount++}});
assert(Object.isFrozen(first)&&first.route==='deep-questions'&&first.title==='Deep Questions could not open','Recovery must expose an immutable route-safe view.');
assert(!JSON.stringify(first).includes('private technical detail'),'Public recovery state must not expose arbitrary technical error text.');
assert(reports.length===1&&reports[0].context.route==='deep-questions','Failure reporting did not receive bounded context.');

const second=recovery.capture({route:'reader',error:'reader failed',retry:()=>{retryCount++},home:()=>{homeCount++}});
assert(second.id!==first.id&&recovery.getState().route==='reader','A newer failure must replace the active failure.');
assert(!recovery.dismiss(first.id)&&recovery.getState().id===second.id,'A stale recovery view must not clear a newer failure.');
const retried=await recovery.retry();
assert(retried.ok&&retryCount===1&&recovery.getState()===null,'Retry must clear recovery and invoke the registered action once.');
assert(!(await recovery.retry()).ok&&retryCount===1,'Retry without active recovery must be inert.');

recovery.capture({route:'games',error:new Error('failed'),retry:()=>{},home:()=>{homeCount++}});
const homed=await recovery.home();
assert(homed.ok&&homeCount===1&&recovery.getState()===null,'Home must clear recovery and invoke the router-owned action once.');

let repeated=0;
const beforeRepeated=recovery.capture({route:'study',error:new Error('first failure'),retry:()=>{repeated++;throw new Error('second failure')},home:()=>{}});
const retryFailure=await recovery.retry();
assert(!retryFailure.ok&&repeated===1&&recovery.getState()?.route==='study','A failed Retry must be captured again without escaping.');
assert(recovery.getState().id!==beforeRepeated.id&&recovery.getState().id===retryFailure.failure.id,'Repeated failure must replace the prior recovery state.');
recovery.dismiss();

let operationCount=0;
const failedRun=recovery.run({route:'transform',operation:()=>{operationCount++;throw new Error('mount failure')},retry:()=>{},home:()=>{}});
assert(!failedRun.ok&&operationCount===1&&recovery.getState()?.route==='transform','Route operation failure must be contained.');
const successfulRun=recovery.run({route:'home',operation:()=>{operationCount++;return 42},retry:()=>{},home:()=>{}});
assert(successfulRun.ok&&successfulRun.value===42&&operationCount===2&&recovery.getState()===null,'Successful route operation must clear stale recovery.');

const reportingFailure=createOperationalRecoveryService({report:()=>{throw new Error('report unavailable')}});
assert(!reportingFailure.run({route:'learn',operation:()=>{throw new Error('feature failed')},retry:()=>{},home:()=>{}}).ok,'Reporting failure must not break route containment.');
assert(reportingFailure.dismiss(),'Recovery dismissal failed.');
let dependencyError='';try{createOperationalRecoveryService({report:null})}catch(error){dependencyError=error.message}
assert(/reporting callback/i.test(dependencyError),'Recovery owner must reject an invalid reporting dependency.');

console.log('BibleQuest v3 operational recovery edge regression passed.');
