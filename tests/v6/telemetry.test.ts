import test from 'node:test';
import assert from 'node:assert/strict';
import { createTelemetryService } from '../../src/app/telemetry.js';

function harness(){
  const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222'];
  const batches:any[]=[];
  const data=new Map<string,unknown>();
  let state:any={status:'guest',authenticated:false,user:null};
  const runtime:any={
    crypto:{randomUUID:()=>ids.shift()},
    navigator:{language:'en-PH',userAgent:'Android',onLine:true},
    innerWidth:390,
    matchMedia:()=>({matches:false}),
    sessionStorage:{
      values:new Map<string,string>(),
      getItem(key:string){return this.values.get(key)||null},
      setItem(key:string,value:string){this.values.set(key,value)}
    },
    document:{visibilityState:'visible',addEventListener(){},removeEventListener(){}},
    addEventListener(){},removeEventListener(){}
  };
  const service=createTelemetryService({
    api:{enabled:()=>true,recordBatch:async(payload:any)=>{batches.push(payload);return {ok:true}}},
    session:{getState:()=>state},
    storage:{
      read:(key:string,fallback:any)=>data.has(key)?data.get(key):fallback,
      write:(key:string,value:any)=>{data.set(key,value);return value}
    },
    getRoute:()=> 'reader',
    runtime,
    clock:()=>120000,
    setTimeoutFn:()=>1,clearTimeoutFn:()=>{},setIntervalFn:()=>1,clearIntervalFn:()=>{}
  });
  return {service,batches,setState:(next:any)=>{state=next}};
}

test('guest and authenticated events keep one pseudonymous session and link identity',async()=>{
  const h=harness();
  h.service.start();
  h.service.trackRoute('reader');
  await h.service.flush();
  assert.equal(h.batches.length,1);
  assert.equal(h.batches[0].visitorId,'11111111-1111-4111-8111-111111111111');
  assert.equal(h.batches[0].sessionId,'22222222-2222-4222-8222-222222222222');
  assert.ok(h.batches[0].events.some((event:any)=>event.event_name==='identity_guest'));
  h.setState({status:'authenticated',authenticated:true,user:{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'}});
  h.service.syncSession();
  await h.service.flush();
  assert.ok(h.batches[1].events.some((event:any)=>event.event_name==='identity_authenticated'));
});

test('client telemetry drops arbitrary user-authored properties before transport',async()=>{
  const h=harness();
  h.service.track('study_complete','study',{action:'complete',result:'passed',note:'private reflection text',email:'person@example.com'});
  await h.service.flush();
  assert.deepEqual(h.batches[0].events[0].properties,{action:'complete',result:'passed'});
});
