(() => {
  'use strict';

  const VERSION='pwa-v77-diagnostic-codes';
  const sent=new Map();
  const shown=new Map();
  let probeCache={at:0,value:null};
  let lastVisibleAt=Date.now();
  let watchdogExpected=performance.now()+2500;

  const account=()=>window.BQAccount;
  const client=()=>account()?.client?.();
  const session=()=>account()?.session?.();
  const safe=s=>String(s||'').replace(/[<>]/g,'').slice(0,900);

  const CODES=Object.freeze({
    OFFLINE:{code:'BQ-NET-001',category:'Connection',title:'Device is offline',message:'BibleQuest cannot reach the internet from this device.'},
    UNREACHABLE:{code:'BQ-NET-002',category:'Connection',title:'Internet path unavailable',message:'The device reports a connection, but BibleQuest cannot reach its server.'},
    AUTH:{code:'BQ-AUTH-001',category:'Account',title:'Sign-in required',message:'This action needs a valid BibleQuest session.'},
    FORBIDDEN:{code:'BQ-AUTH-002',category:'Account',title:'Permission denied',message:'The account is signed in but does not have permission for this action.'},
    INPUT:{code:'BQ-INP-001',category:'Input',title:'Invalid input',message:'The information entered is not valid for this action.'},
    RATE:{code:'BQ-SRV-429',category:'Server',title:'Too many requests',message:'The server is temporarily rate-limiting requests.'},
    SERVER:{code:'BQ-SRV-500',category:'Server',title:'Server unavailable',message:'The internet connection is working, but the BibleQuest service returned a server error.'},
    DATA:{code:'BQ-DATA-001',category:'Data',title:'Data request failed',message:'The internet connection is working, but the requested BibleQuest data could not be loaded.'},
    DATA_TIMEOUT:{code:'BQ-DATA-002',category:'Data',title:'Data request timed out',message:'The internet connection is working, but the BibleQuest data request did not finish in time.'},
    MODULE:{code:'BQ-MOD-001',category:'App module',title:'Feature module failed',message:'The internet connection is working, but part of the BibleQuest app did not initialize correctly.'},
    MODULE_TIMEOUT:{code:'BQ-MOD-002',category:'App module',title:'Feature module timed out',message:'The internet connection is working, but a BibleQuest feature did not initialize in time.'},
    RESOURCE:{code:'BQ-MOD-003',category:'App resource',title:'App resource failed to load',message:'A required BibleQuest script or style failed to load.'},
    RUNTIME:{code:'BQ-APP-001',category:'App',title:'Application error',message:'BibleQuest encountered a JavaScript error. This is an app problem, not an internet diagnosis.'},
    PROMISE:{code:'BQ-APP-002',category:'App',title:'Async application error',message:'A BibleQuest background operation failed after the internet connection was checked.'},
    FREEZE:{code:'BQ-UI-001',category:'App freeze',title:'BibleQuest became unresponsive',message:'The main app thread stopped responding for several seconds. This indicates an app/UI stall rather than a slow internet request.'},
    UNKNOWN:{code:'BQ-UNK-001',category:'Unknown',title:'Unclassified error',message:'BibleQuest could not determine the failure type automatically.'}
  });

  function redact(text=''){
    return String(text)
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email]')
      .replace(/https?:\/\/\S+/gi,'[url]')
      .replace(/[A-F0-9]{24,}/gi,'[token]')
      .slice(0,1800);
  }

  function surface(){
    const open=[...document.querySelectorAll('[id$="Layer"]:not(.hidden),.modern-sheet:not(.hidden),[role="dialog"]:not(.hidden)')].at(-1);
    return (open?.id||open?.className||location.pathname||'BibleQuest').toString().slice(0,120);
  }

  function statusOf(error){
    const raw=Number(error?.status||error?.statusCode||error?.response?.status||0);
    return Number.isFinite(raw)?raw:0;
  }

  function textOf(error){return String(error?.message||error||'Unknown error')}

  function authLike(error){
    const status=statusOf(error),text=textOf(error).toLowerCase();
    return status===401||/jwt|session|not authenticated|sign in|login required/.test(text);
  }

  function forbiddenLike(error){
    const status=statusOf(error),text=textOf(error).toLowerCase();
    return status===403||/permission denied|not allowed|forbidden|row-level security/.test(text);
  }

  function timeoutLike(error,context={}){
    const text=textOf(error).toLowerCase();
    return context.kind==='timeout'||context.kind==='module-timeout'||error?.name==='TimeoutError'||error?.bqTimedOut===true||/timed out|timeout|took too long|did not load within/.test(text);
  }

  async function probeConnection(force=false){
    if(navigator.onLine===false)return {reachable:false,reason:'browser-offline',status:0};
    if(!force&&probeCache.value&&Date.now()-probeCache.at<5000)return probeCache.value;
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),3500);
    let value;
    try{
      const url=new URL('./manifest.webmanifest',location.href);
      url.searchParams.set('bq-net-probe',String(Date.now()));
      const response=await fetch(url.href,{method:'GET',cache:'no-store',credentials:'same-origin',signal:controller.signal,headers:{'X-BibleQuest-Probe':'1'}});
      value={reachable:response.ok,status:response.status,reason:response.ok?'ok':'http'};
    }catch(error){
      value={reachable:false,status:0,reason:error?.name==='AbortError'?'timeout':'fetch-failed'};
    }finally{clearTimeout(timer)}
    probeCache={at:Date.now(),value};
    return value;
  }

  function detail(base,error,context,probe){
    return {...base,detail:safe(textOf(error)),kind:context.kind||'runtime',feature:safe(context.feature||''),surface:surface(),online:navigator.onLine!==false,serverReachable:probe?.reachable??null,httpStatus:statusOf(error)||probe?.status||0,at:new Date().toISOString()};
  }

  async function diagnose(error,context={}){
    if(error?.bqCode){
      return detail({code:String(error.bqCode),category:safe(error.bqCategory||'App'),title:safe(error.bqTitle||'BibleQuest error'),message:safe(error.bqMessage||textOf(error))},error,context,null);
    }

    const kind=String(context.kind||'runtime');
    const status=statusOf(error);
    if(kind==='freeze')return detail(CODES.FREEZE,error,context,null);
    if(kind==='error')return detail(CODES.RUNTIME,error,context,null);
    if(kind==='resource'){
      if(navigator.onLine===false)return detail(CODES.OFFLINE,error,context,{reachable:false,status:0});
      const probe=await probeConnection(true);
      return detail(probe.reachable?CODES.RESOURCE:CODES.UNREACHABLE,error,context,probe);
    }
    if(kind==='input')return detail(CODES.INPUT,error,context,null);
    if(authLike(error))return detail(CODES.AUTH,error,context,null);
    if(forbiddenLike(error))return detail(CODES.FORBIDDEN,error,context,null);
    if(status===429)return detail(CODES.RATE,error,context,null);
    if(status>=500)return detail(CODES.SERVER,error,context,null);
    if(navigator.onLine===false)return detail(CODES.OFFLINE,error,context,{reachable:false,status:0});

    const networkSensitive=['promise','network','data','feature-launch','capability-recovery','module','module-timeout','timeout','server','cloud'].includes(kind)||timeoutLike(error,context)||/failed to fetch|networkerror|load failed|could not be loaded/i.test(textOf(error));
    let probe=null;
    if(networkSensitive){
      probe=await probeConnection(true);
      if(!probe.reachable)return detail(CODES.UNREACHABLE,error,context,probe);
    }

    if((kind==='data'||kind==='cloud'||kind==='server')&&timeoutLike(error,context))return detail(CODES.DATA_TIMEOUT,error,context,probe);
    if(kind==='data'||kind==='cloud'||kind==='server')return detail(CODES.DATA,error,context,probe);
    if(kind==='module-timeout'||(kind==='feature-launch'&&timeoutLike(error,context)))return detail(CODES.MODULE_TIMEOUT,error,context,probe);
    if(kind==='feature-launch'||kind==='capability-recovery'||kind==='module')return detail(CODES.MODULE,error,context,probe);
    if(kind==='promise')return detail(CODES.PROMISE,error,context,probe);
    return detail(CODES.UNKNOWN,error,context,probe);
  }

  async function report(message,stack='',context={}){
    const c=client(),s=session();
    if(!c||!s?.user)return false;
    const safeMessage=redact(message),key=`${context.code||''}:${safeMessage.slice(0,240)}`,last=sent.get(key)||0;
    if(Date.now()-last<60000)return false;
    sent.set(key,Date.now());
    let congregationId=null;
    try{congregationId=window.BQCloud?.status?.()?.activeCongregation?.id||null}catch{}
    const row={
      user_id:s.user.id,
      congregation_id:congregationId,
      app_version:VERSION,
      surface:surface(),
      message:safeMessage,
      stack:redact(stack).slice(0,3000)||null,
      context:{kind:context.kind||'runtime',code:context.code||null,category:context.category||null,path:location.pathname,server_reachable:context.serverReachable??null,http_status:context.httpStatus||null,feature:context.feature||null}
    };
    try{await c.from('bible_client_errors').insert(row);return true}catch{return false}
  }

  function dismissNotice(){document.getElementById('bqDiagnosticNotice')?.remove()}

  function present(diagnostic,options={}){
    if(!diagnostic?.code)return;
    const key=`${diagnostic.code}:${diagnostic.feature||diagnostic.surface}`;
    if(!options.force&&Date.now()-(shown.get(key)||0)<15000)return;
    shown.set(key,Date.now());
    dismissNotice();
    const node=document.createElement('section');
    node.id='bqDiagnosticNotice';
    node.setAttribute('role','alert');
    node.setAttribute('aria-live','assertive');
    node.style.cssText='position:fixed;left:12px;right:12px;bottom:max(14px,env(safe-area-inset-bottom));z-index:2147483646;max-width:620px;margin:auto;padding:14px 16px;border:1px solid rgba(36,48,40,.22);border-radius:16px;background:#fff;color:#243028;box-shadow:0 14px 40px rgba(0,0,0,.22);font:500 14px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
    const connection=diagnostic.serverReachable===true?'Internet check: reachable':diagnostic.serverReachable===false?'Internet check: failed':'';
    node.innerHTML=`<button type="button" data-bq-diagnostic-close aria-label="Close" style="float:right;border:0;background:transparent;font:700 22px/1 system-ui;cursor:pointer">×</button><small style="display:block;font-weight:800;letter-spacing:.04em">${safe(diagnostic.code)} · ${safe(diagnostic.category)}</small><b style="display:block;margin-top:3px;font-size:16px">${safe(diagnostic.title)}</b><p style="margin:6px 0 0">${safe(diagnostic.message)}</p>${connection?`<small style="display:block;margin-top:7px;opacity:.72">${safe(connection)}</small>`:''}`;
    node.querySelector('[data-bq-diagnostic-close]')?.addEventListener('click',dismissNotice);
    document.body.appendChild(node);
  }

  async function diagnoseAndPresent(error,context={},options={}){
    const d=await diagnose(error,context);
    present(d,options);
    report(`${d.code}: ${textOf(error)}`,error?.stack||'',{...context,code:d.code,category:d.category,serverReachable:d.serverReachable,httpStatus:d.httpStatus,feature:d.feature}).catch(()=>{});
    return d;
  }

  function codedError(code,message,extra={}){
    const error=new Error(message||code);
    error.bqCode=code;
    Object.assign(error,extra);
    return error;
  }

  window.addEventListener('error',event=>{
    const target=event.target;
    const tag=String(target?.tagName||'').toUpperCase();
    const criticalResource=target&&target!==window&&['SCRIPT','LINK'].includes(tag)&&(target.src||target.href);
    if(target&&target!==window&&!criticalResource)return;
    const error=event.error||new Error(criticalResource?`Resource failed to load: ${target.src||target.href}`:(event.message||'Unknown client error'));
    diagnoseAndPresent(error,{kind:criticalResource?'resource':'error',feature:criticalResource?'App resource':''}).catch(()=>{});
  },true);

  window.addEventListener('unhandledrejection',event=>{
    const error=event.reason instanceof Error?event.reason:new Error(String(event.reason||'Unhandled rejection'));
    diagnoseAndPresent(error,{kind:'promise'}).catch(()=>{});
  });

  window.addEventListener('offline',()=>{
    const d=detail(CODES.OFFLINE,new Error('Browser offline event'),{kind:'network'}, {reachable:false,status:0});
    present(d,{force:true});
  });
  window.addEventListener('online',()=>{probeCache={at:0,value:null}});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){lastVisibleAt=Date.now();watchdogExpected=performance.now()+2500}});

  setInterval(()=>{
    const now=performance.now(),delay=now-watchdogExpected;
    watchdogExpected=now+2500;
    if(document.visibilityState!=='visible'||Date.now()-lastVisibleAt<8000||delay<5500)return;
    const error=new Error(`Main thread stalled for approximately ${Math.round(delay)} ms`);
    diagnoseAndPresent(error,{kind:'freeze',durationMs:Math.round(delay),feature:'Current screen'}).catch(()=>{});
  },2500);

  window.BQDiagnostics={VERSION,CODES,report,diagnose,present,diagnoseAndPresent,probeConnection,codedError,dismissNotice,version:VERSION};
})();