import {createClientDiagnosticsService,CLIENT_DIAGNOSTIC_CODES} from '../src/core/client-diagnostics.js';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
let now=Date.parse('2026-09-08T00:00:00Z'),calls=0,online=true,result={reachable:true,status:200,reason:'ok'};
const diagnostics=createClientDiagnosticsService({probe:async()=>{calls++;if(result instanceof Error)throw result;return result},online:()=>online,clock:()=>now});

online=false;
let diagnosis=await diagnostics.classify(new Error('secret@example.com token ABCDEF0123456789ABCDEF0123456789'),{kind:'module',route:'reader'});
assert(diagnosis.code==='BQ-NET-001'&&diagnosis.serverReachable===false&&calls===0,'Offline diagnosis must not issue a probe.');
assert(Object.isFrozen(diagnosis)&&!JSON.stringify(diagnosis).includes('secret@example.com')&&!JSON.stringify(diagnosis).includes('ABCDEF'),'Public diagnostics must be immutable and exclude arbitrary error data.');

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
assert(Object.isFrozen(CLIENT_DIAGNOSTIC_CODES)&&Object.isFrozen(CLIENT_DIAGNOSTIC_CODES.MODULE),'Diagnostic code registry must be immutable.');
let dependencyError='';try{createClientDiagnosticsService({probe:null})}catch(error){dependencyError=error.message}
assert(/probe, online, and clock/i.test(dependencyError),'Diagnostics owner must require explicit boundaries.');
console.log('BibleQuest v3 client diagnostics edge regression passed.');
