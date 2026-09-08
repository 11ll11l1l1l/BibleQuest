export const CLIENT_DIAGNOSTIC_CODES = Object.freeze({
  OFFLINE: Object.freeze({ code:'BQ-NET-001',category:'Connection',title:'Device is offline',message:'BibleQuest cannot reach the internet from this device.' }),
  UNREACHABLE: Object.freeze({ code:'BQ-NET-002',category:'Connection',title:'BibleQuest host is unreachable',message:'This device reports a connection, but the BibleQuest host could not be reached.' }),
  MODULE: Object.freeze({ code:'BQ-MOD-001',category:'App module',title:'Feature module failed',message:'The connection check passed, but this BibleQuest feature did not initialize correctly.' }),
  UNKNOWN: Object.freeze({ code:'BQ-UNK-001',category:'Unknown',title:'Unclassified error',message:'BibleQuest could not determine whether this failure came from the app or connection.' })
});

const safeRoute=value=>String(value||'feature').trim().replace(/[^a-z0-9_-]/gi,'').slice(0,80)||'feature';

export function createClientDiagnosticsService({ probe, online=()=>globalThis.navigator?.onLine!==false, clock=()=>Date.now(), cacheMilliseconds=5000 }={}){
  if(typeof probe!=='function'||typeof online!=='function'||typeof clock!=='function')throw new Error('Client diagnostics requires probe, online, and clock boundaries.');
  let probeCache=null;

  const view=(definition,{route,reachable=null}={})=>Object.freeze({
    ...definition,
    route:safeRoute(route),
    serverReachable:reachable,
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

  return Object.freeze({classify,probeConnection:({force=false}={})=>connection(force),codes:CLIENT_DIAGNOSTIC_CODES});
}
