const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_TOKEN_RE=/^[a-z0-9][a-z0-9._:/-]{0,79}$/i;
const PROPERTY_KEYS=new Set([
  'action','element','source','status','result','error_name','visibility',
  'install_state','offline','duration_bucket','count','content_type',
  'difficulty','completion','reason_code','language','role','assignment_type',
  'book_code','chapter','game','mode'
]);

function stableToken(value,max=80){
  const token=String(value??'').trim();
  if(!token||token.length>max||!SAFE_TOKEN_RE.test(token)||UUID_RE.test(token))return '';
  return token.toLowerCase();
}

function safeProperties(input){
  if(!input||typeof input!=='object'||Array.isArray(input))return {};
  const output={};
  for(const [key,value] of Object.entries(input)){
    if(!PROPERTY_KEYS.has(key))continue;
    if(value===null||typeof value==='boolean'||typeof value==='number'){output[key]=value;continue}
    if(typeof value==='string'&&value.length<=120)output[key]=value;
  }
  return output;
}

function platformLabel(nav){
  const hinted=String(nav?.userAgentData?.platform||'').trim();
  if(hinted&&hinted.length<=40)return hinted;
  const ua=String(nav?.userAgent||'');
  if(/Android/i.test(ua))return 'Android';
  if(/iPhone|iPad/i.test(ua))return 'iOS/iPadOS';
  if(/Windows/i.test(ua))return 'Windows';
  if(/Macintosh/i.test(ua))return 'macOS';
  if(/Linux/i.test(ua))return 'Linux';
  return 'Web';
}

function screenBucket(width){
  const value=Number(width)||0;
  if(value<=360)return 'xs';
  if(value<=430)return 'sm';
  if(value<=768)return 'md';
  if(value<=1280)return 'lg';
  return 'xl';
}

function durationBucket(milliseconds){
  const seconds=Math.max(0,Math.floor(Number(milliseconds||0)/1000));
  if(seconds<30)return 'lt30s';
  if(seconds<120)return '30s-2m';
  if(seconds<300)return '2m-5m';
  if(seconds<900)return '5m-15m';
  if(seconds<1800)return '15m-30m';
  return '30m+';
}

function storageRead(storage,key,fallback=''){
  try{return storage?.read?.(key,fallback)??fallback}catch{return fallback}
}
function storageWrite(storage,key,value){
  try{storage?.write?.(key,value)}catch{}
}

function stableElementAction(element){
  if(!element)return {action:'',element:''};
  const dataset=element.dataset||{};
  const candidates=[
    dataset.telemetryAction,dataset.action,dataset.route,dataset.nav,
    element.getAttribute?.('name'),element.id
  ];
  const action=candidates.map(value=>stableToken(value,64)).find(Boolean)||'';
  const type=stableToken(element.tagName?.toLowerCase?.()||element.getAttribute?.('role')||'',32);
  return {action,element:type};
}

export function createTelemetryService({
  api,
  session,
  storage,
  transientStorage,
  getRoute=()=> 'home',
  runtime=globalThis,
  uuid=()=>runtime.crypto?.randomUUID?.()||'',
  clock=()=>Date.now(),
  setTimeoutFn=(fn,ms)=>runtime.setTimeout(fn,ms),
  clearTimeoutFn=id=>runtime.clearTimeout(id),
  setIntervalFn=(fn,ms)=>runtime.setInterval(fn,ms),
  clearIntervalFn=id=>runtime.clearInterval(id)
}={}){
  if(!api||!session||!storage||!transientStorage)throw new Error('Telemetry service requires API, session and storage boundaries.');

  const enabled=api.enabled?.()!==false;
  let visitorId=String(storageRead(storage,'telemetry-visitor-id',''));
  if(!UUID_RE.test(visitorId)){
    visitorId=String(uuid());
    if(UUID_RE.test(visitorId))storageWrite(storage,'telemetry-visitor-id',visitorId);
  }

  const sessionKey='telemetry-session-id';
  let sessionId=String(storageRead(transientStorage,sessionKey,''));
  if(!UUID_RE.test(sessionId)){
    sessionId=String(uuid());
    if(UUID_RE.test(sessionId))storageWrite(transientStorage,sessionKey,sessionId);
  }

  let queue=[];
  let flushTimer=null;
  let heartbeatTimer=null;
  let flushing=null;
  let started=false;
  let disposed=false;
  let lastIdentity='';
  let lastRoute='';
  const startedAt=clock();
  const doc=runtime.document;
  const nav=runtime.navigator||{};

  const context=()=>({
    platform:platformLabel(nav),
    locale:String(nav.language||'unknown').slice(0,24),
    app_version:'v6',
    is_pwa:Boolean(runtime.matchMedia?.('(display-mode: standalone)')?.matches||nav.standalone===true),
    screen_bucket:screenBucket(runtime.innerWidth)
  });

  const routeNow=()=>stableToken(getRoute?.()||'home',80)||'home';

  const scheduleFlush=(delay=4000)=>{
    if(!enabled||disposed||flushTimer!==null)return;
    flushTimer=setTimeoutFn(()=>{flushTimer=null;void flush()},delay);
  };

  const enqueue=(eventName,feature=routeNow(),properties={})=>{
    if(!enabled||disposed||!UUID_RE.test(visitorId)||!UUID_RE.test(sessionId))return;
    const name=stableToken(eventName,64);
    if(!name)return;
    const route=routeNow();
    const safeFeature=stableToken(feature,80)||route||'app';
    queue.push(Object.freeze({
      event_name:name,
      feature:safeFeature,
      route:route||safeFeature,
      properties:safeProperties(properties)
    }));
    if(queue.length>100)queue=queue.slice(-100);
    if(queue.length>=10)void flush();else scheduleFlush();
  };

  async function flush(){
    if(!enabled||!queue.length)return;
    if(flushing)return flushing;
    if(flushTimer!==null){clearTimeoutFn(flushTimer);flushTimer=null}
    const batch=queue.splice(0,25);
    flushing=Promise.resolve(api.recordBatch({
      visitorId,
      sessionId,
      events:batch,
      context:context()
    })).catch(()=>{
      queue=[...batch,...queue].slice(0,100);
    }).finally(()=>{
      flushing=null;
      if(queue.length&&!disposed)scheduleFlush(8000);
    });
    return flushing;
  }

  const syncSession=sessionState=>{
    if(!enabled||disposed)return;
    const state=sessionState||session.getState?.()||{};
    const userId=state.authenticated===true&&state.user?.id?String(state.user.id):'';
    const identity=userId?'user:'+userId:(state.status==='booting'?'booting':'guest');
    if(identity===lastIdentity)return;
    lastIdentity=identity;
    if(identity==='booting')return;
    enqueue(userId?'identity_authenticated':'identity_guest','account',{
      status:userId?'authenticated':'guest'
    });
    if(userId)void flush();
  };

  const trackRoute=route=>{
    const safe=stableToken(route,80)||'not-found';
    lastRoute=safe;
    enqueue('route_view',safe,{source:'router'});
  };

  const track=(eventName,feature,properties)=>enqueue(eventName,feature,properties);

  const onClick=event=>{
    const origin=event?.target;
    const target=origin?.closest?.('[data-telemetry-action],[data-action],[data-route],[data-nav],button,a');
    if(!target)return;
    const descriptor=stableElementAction(target);
    if(!descriptor.action)return;
    enqueue('ui_action',routeNow(),descriptor);
  };

  const onSubmit=event=>{
    const form=event?.target;
    const descriptor=stableElementAction(form);
    if(!descriptor.action)return;
    enqueue('form_submit',routeNow(),descriptor);
  };

  const onError=event=>{
    const name=stableToken(event?.error?.name||'error',64)||'error';
    enqueue('client_error',routeNow(),{error_name:name});
    void flush();
  };

  const onUnhandled=event=>{
    const name=stableToken(event?.reason?.name||'unhandledrejection',64)||'unhandledrejection';
    enqueue('client_error',routeNow(),{error_name:name});
    void flush();
  };

  const onVisibility=()=>{
    const visibility=doc?.visibilityState==='hidden'?'hidden':'visible';
    enqueue('visibility',routeNow(),{visibility});
    if(visibility==='hidden')void flush();
  };

  function start(){
    if(started||disposed||!enabled)return;
    started=true;
    enqueue('session_start',routeNow(),{
      install_state:context().is_pwa?'standalone':'browser',
      offline:nav.onLine===false
    });
    syncSession(session.getState?.());
    doc?.addEventListener?.('click',onClick,true);
    doc?.addEventListener?.('submit',onSubmit,true);
    doc?.addEventListener?.('visibilitychange',onVisibility);
    runtime.addEventListener?.('error',onError);
    runtime.addEventListener?.('unhandledrejection',onUnhandled);
    heartbeatTimer=setIntervalFn(()=>{
      if(doc?.visibilityState==='hidden')return;
      enqueue('heartbeat',lastRoute||routeNow(),{
        duration_bucket:durationBucket(clock()-startedAt),
        offline:nav.onLine===false
      });
      void flush();
    },60000);
  }

  function dispose(){
    if(disposed)return;
    enqueue('session_end',lastRoute||routeNow(),{duration_bucket:durationBucket(clock()-startedAt)});
    if(flushTimer!==null){clearTimeoutFn(flushTimer);flushTimer=null}
    if(heartbeatTimer!==null){clearIntervalFn(heartbeatTimer);heartbeatTimer=null}
    doc?.removeEventListener?.('click',onClick,true);
    doc?.removeEventListener?.('submit',onSubmit,true);
    doc?.removeEventListener?.('visibilitychange',onVisibility);
    runtime.removeEventListener?.('error',onError);
    runtime.removeEventListener?.('unhandledrejection',onUnhandled);
    void flush();
    disposed=true;
  }

  return Object.freeze({
    start,
    dispose,
    flush,
    track,
    trackRoute,
    syncSession,
    getVisitorId:()=>visitorId,
    getSessionId:()=>sessionId
  });
}
