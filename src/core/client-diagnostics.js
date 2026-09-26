import { getBibleQuestBuildIdentity } from '../v6/build-identity.ts';

export const CLIENT_DIAGNOSTIC_CODES = Object.freeze({
  OFFLINE: Object.freeze({ code:'BQ-NET-001',category:'Connection',title:'Device is offline',message:'BibleQuest cannot reach the internet from this device.' }),
  UNREACHABLE: Object.freeze({ code:'BQ-NET-002',category:'Connection',title:'BibleQuest host is unreachable',message:'This device reports a connection, but the BibleQuest host could not be reached.' }),
  MODULE: Object.freeze({ code:'BQ-MOD-001',category:'App module',title:'Feature module failed',message:'The connection check passed, but this BibleQuest feature did not initialize correctly.' }),
  UNKNOWN: Object.freeze({ code:'BQ-UNK-001',category:'Unknown',title:'Unclassified error',message:'BibleQuest could not determine whether this failure came from the app or connection.' })
});

const SAFE_CONNECTION_REASONS=new Set(['ok','browser-offline','http','timeout','fetch-failed','probe','probe-failed','unknown']);
const SAFE_WORKER_STATES=new Set(['installing','installed','activating','activated','redundant','none','unknown']);
const SAFE_CONTENT_STATES=new Set(['idle','registering','ready','unsupported','error','disposed','unknown']);
const safeRoute=value=>String(value||'feature').trim().replace(/[^a-z0-9_-]/gi,'').slice(0,80)||'feature';
const safeConnectionReason=value=>SAFE_CONNECTION_REASONS.has(String(value||''))?String(value):'unknown';
const safeHttpStatus=value=>{
  const status=Number(value);
  return Number.isInteger(status)&&status>=0&&status<=599?status:0;
};
const safeWorkerState=value=>SAFE_WORKER_STATES.has(String(value||''))?String(value):'unknown';
const safeContentStatus=value=>SAFE_CONTENT_STATES.has(String(value||''))?String(value):'unknown';
const browserServiceWorkerState=()=>{
  const serviceWorker=globalThis.navigator?.serviceWorker;
  const controller=serviceWorker?.controller;
  return Object.freeze({
    supported:Boolean(serviceWorker),
    controlled:Boolean(controller),
    state:controller?.state||'none'
  });
};

export function createClientDiagnosticsService({
  probe,
  online=()=>globalThis.navigator?.onLine!==false,
  clock=()=>Date.now(),
  cacheMilliseconds=5000,
  serviceWorkerState=browserServiceWorkerState,
  contentState=()=>Object.freeze({status:'unknown',ready:false})
}={}){
  if(typeof probe!=='function'||typeof online!=='function'||typeof clock!=='function')throw new Error('Client diagnostics requires probe, online, and clock boundaries.');
  if(typeof serviceWorkerState!=='function'||typeof contentState!=='function')throw new Error('Client diagnostics requires service-worker and content-state boundaries.');
  let probeCache=null;
  const build=getBibleQuestBuildIdentity();

  const view=(definition,{route,reachable=null}={})=>Object.freeze({
    ...definition,
    route:safeRoute(route),
    serverReachable:reachable,
    build,
    at:new Date(clock()).toISOString()
  });

  const connection=async force=>{
    if(online()===false)return Object.freeze({reachable:false,reason:'browser-offline',status:0,offline:true});
    const now=clock();
    if(!force&&probeCache&&now-probeCache.at<cacheMilliseconds)return probeCache.value;
    let value;
    try{
      const result=await probe();
      value=Object.freeze({reachable:result?.reachable===true,reason:String(result?.reason||'probe'),status:Number(result?.status||0),offline:false});
    }catch{
      value=Object.freeze({reachable:false,reason:'probe-failed',status:0,offline:false});
    }
    probeCache={at:now,value};
    return value;
  };

  const runtimeState=async({forceProbe=false}={})=>{
    const connectivity=await connection(forceProbe);
    let worker={supported:false,controlled:false,state:'none'},content={status:'unknown',ready:false};
    try{worker=serviceWorkerState()||worker}catch{}
    try{content=contentState()||content}catch{}
    const workerSupported=worker?.supported===true;
    const workerControlled=workerSupported&&worker?.controlled===true;
    const workerState=workerSupported?safeWorkerState(worker?.state):'none';
    const contentStatus=safeContentStatus(content?.status);
    return Object.freeze({
      connectivity:Object.freeze({
        browserOnline:connectivity.offline!==true,
        serverReachable:connectivity.reachable===true,
        status:safeHttpStatus(connectivity.status),
        reason:safeConnectionReason(connectivity.reason)
      }),
      serviceWorker:Object.freeze({
        supported:workerSupported,
        controlled:workerControlled,
        state:workerState
      }),
      content:Object.freeze({
        status:contentStatus,
        ready:contentStatus==='ready'&&content?.ready===true
      }),
      build,
      at:new Date(clock()).toISOString()
    });
  };

  const classify=async(error,{kind='unknown',route='feature',forceProbe=false}={})=>{
    void error;
    if(online()===false)return view(CLIENT_DIAGNOSTIC_CODES.OFFLINE,{route,reachable:false});
    if(['module','route','feature'].includes(String(kind))){
      const result=await connection(forceProbe);
      return result.reachable
        ?view(CLIENT_DIAGNOSTIC_CODES.MODULE,{route,reachable:true})
        :view(CLIENT_DIAGNOSTIC_CODES.UNREACHABLE,{route,reachable:false});
    }
    return view(CLIENT_DIAGNOSTIC_CODES.UNKNOWN,{route});
  };

  return Object.freeze({
    classify,
    probeConnection:({force=false}={})=>connection(force),
    runtimeState,
    codes:CLIENT_DIAGNOSTIC_CODES
  });
}
