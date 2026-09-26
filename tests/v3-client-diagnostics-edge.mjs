import {createClientDiagnosticsService,CLIENT_DIAGNOSTIC_CODES} from '../src/core/client-diagnostics.js';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
let now=Date.parse('2026-09-08T00:00:00Z'),calls=0,online=true,result={reachable:true,status:200,reason:'ok'};
let workerState={supported:true,controlled:true,state:'activated'},contentState={status:'ready',ready:true};
const diagnostics=createClientDiagnosticsService({
  probe:async()=>{calls++;if(result instanceof Error)throw result;return result},
  online:()=>online,
  clock:()=>now,
  serviceWorkerState:()=>workerState,
  contentState:()=>contentState
});

online=false;
let diagnosis=await diagnostics.classify(new Error('secret@example.com token ABCDEF0123456789ABCDEF0123456789'),{kind:'module',route:'reader'});
assert(diagnosis.code==='BQ-NET-001'&&diagnosis.serverReachable===false&&calls===0,'Offline diagnosis must not issue a probe.');
assert(Object.isFrozen(diagnosis)&&Object.isFrozen(diagnosis.build)&&!JSON.stringify(diagnosis).includes('secret@example.com')&&!JSON.stringify(diagnosis).includes('ABCDEF'),'Public diagnostics must be immutable and exclude arbitrary error data.');
assert(diagnosis.build.sha==='development'&&diagnosis.build.development===true,'Direct-source diagnostics must expose the V6 development build identity without inventing a release SHA.');

online=true;
diagnosis=await diagnostics.classify(new Error('module failure'),{kind:'module',route:'deep-questions'});
assert(diagnosis.code==='BQ-MOD-001'&&diagnosis.serverReachable===true&&calls===1,'Reachable route failure must classify as an app module failure.');
const cached=await diagnostics.classify(new Error('again'),{kind:'route',route:'study'});
assert(cached.code==='BQ-MOD-001'&&calls===1,'Recent connection probe must be reused.');
await diagnostics.classify(new Error('forced'),{kind:'feature',route:'games',forceProbe:true});
assert(calls===2,'Forced diagnosis must issue a fresh probe.');

now+=6000;result={reachable:false,status:503,reason:'http'};
diagnosis=await diagnostics.classify(new Error('load failed'),{kind:'module',route:'media'});
assert(diagnosis.code==='BQ-NET-002'&&diagnosis.serverReachable===false&&calls===3,'Unreachable host must classify separately from a module failure.');
now+=6000;result=new Error('probe exploded');
diagnosis=await diagnostics.classify(new Error('load failed'),{kind:'module',route:'recordings'});
assert(diagnosis.code==='BQ-NET-002'&&calls===4,'A throwing connectivity probe must fail safely as unreachable.');
diagnosis=await diagnostics.classify(new Error('other'),{kind:'unknown',route:'bad route / token'});
assert(diagnosis.code==='BQ-UNK-001'&&diagnosis.serverReachable===null&&diagnosis.route==='badroutetoken','Unknown failures must remain unclassified with a sanitized route.');

now+=6000;result={reachable:true,status:200,reason:'ok'};workerState={supported:true,controlled:true,state:'activated'};contentState={status:'ready',ready:true};
let runtime=await diagnostics.runtimeState({forceProbe:true});
assert(runtime.connectivity.browserOnline===true&&runtime.connectivity.serverReachable===true&&runtime.connectivity.status===200&&runtime.connectivity.reason==='ok','Runtime diagnostics must expose sanitized connectivity state.');
assert(runtime.serviceWorker.supported===true&&runtime.serviceWorker.controlled===true&&runtime.serviceWorker.state==='activated','Runtime diagnostics must expose safe service-worker state.');
assert(runtime.content.status==='ready'&&runtime.content.ready===true,'Runtime diagnostics must expose the existing offline-content readiness state.');
assert(Object.isFrozen(runtime)&&Object.isFrozen(runtime.connectivity)&&Object.isFrozen(runtime.serviceWorker)&&Object.isFrozen(runtime.content)&&Object.isFrozen(runtime.build),'Runtime diagnostics and nested views must be immutable.');

now+=6000;result={reachable:false,status:777,reason:'secret@example.com token ABCDEF0123456789'};workerState={supported:true,controlled:true,state:'https://secret.invalid/sw.js'};contentState={status:'private-note-token',ready:true};
runtime=await diagnostics.runtimeState({forceProbe:true});
const runtimeJson=JSON.stringify(runtime);
assert(runtime.connectivity.serverReachable===false&&runtime.connectivity.status===0&&runtime.connectivity.reason==='unknown','Runtime diagnostics must normalize invalid connectivity detail.');
assert(runtime.serviceWorker.state==='unknown'&&runtime.content.status==='unknown'&&runtime.content.ready===false,'Runtime diagnostics must fail closed for unknown SW/content states.');
assert(!runtimeJson.includes('secret@example.com')&&!runtimeJson.includes('ABCDEF')&&!runtimeJson.includes('secret.invalid')&&!runtimeJson.includes('private-note-token'),'Runtime diagnostics must exclude arbitrary/sensitive boundary strings.');
assert(Object.isFrozen(CLIENT_DIAGNOSTIC_CODES)&&Object.isFrozen(CLIENT_DIAGNOSTIC_CODES.MODULE),'Diagnostic code registry must be immutable.');
let dependencyError='';try{createClientDiagnosticsService({probe:null})}catch(error){dependencyError=error.message}
assert(/probe, online, and clock/i.test(dependencyError),'Diagnostics owner must require explicit boundaries.');
console.log('BibleQuest v3 client diagnostics edge regression passed.');
