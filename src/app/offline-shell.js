const snapshot=state=>Object.freeze({status:state.status,ready:state.status==='ready'});
const SHELL_INITIATORS=new Set(['script','link','css','img']);

function collectShellUrls({performanceRef,locationRef}){
  const urls=new Set();
  try{if(locationRef?.href)urls.add(new URL(locationRef.href).href)}catch{}
  let entries=[];
  try{entries=performanceRef?.getEntriesByType?.('resource')||[]}catch{}
  for(const entry of entries){
    if(!SHELL_INITIATORS.has(String(entry?.initiatorType||'')))continue;
    try{
      const url=new URL(entry.name,locationRef?.href);
      if(url.origin===locationRef?.origin)urls.add(url.href);
    }catch{}
  }
  return [...urls];
}

function waitForPageLoad({documentRef,loadTarget}){
  if(!documentRef||documentRef.readyState==='complete'||typeof loadTarget?.addEventListener!=='function')return Promise.resolve();
  return new Promise(resolve=>{
    const finish=()=>{
      try{loadTarget.removeEventListener?.('load',finish)}catch{}
      resolve();
    };
    loadTarget.addEventListener('load',finish,{once:true});
  });
}

export function createOfflineShellService({
  serviceWorker=globalThis.navigator?.serviceWorker,
  performanceRef=globalThis.performance,
  locationRef=globalThis.location,
  MessageChannelCtor=globalThis.MessageChannel,
  documentRef=globalThis.document,
  loadTarget=globalThis,
  timeoutMs=4000
}={}){
  const subscribers=new Set();
  let state={status:'idle'},registration=null,startPromise=null,disposed=false;
  const publish=status=>{
    state={status};
    const value=snapshot(state);
    subscribers.forEach(subscriber=>subscriber(value));
    return value;
  };
  const warm=async worker=>{
    if(!worker?.postMessage)throw new Error('Offline shell worker is unavailable.');
    const urls=collectShellUrls({performanceRef,locationRef});
    if(!urls.length)return;
    const message={type:'BIBLEQUEST_WARM_SHELL',urls};
    if(typeof MessageChannelCtor!=='function'){
      worker.postMessage(message);
      return;
    }
    await new Promise((resolve,reject)=>{
      const channel=new MessageChannelCtor();
      let settled=false;
      const finish=(error=null)=>{
        if(settled)return;
        settled=true;
        clearTimeout(timer);
        try{channel.port1.close?.()}catch{}
        try{channel.port2.close?.()}catch{}
        if(error)reject(error);else resolve();
      };
      const timer=setTimeout(()=>finish(new Error('Offline shell warmup timed out.')),timeoutMs);
      channel.port1.onmessage=event=>event?.data?.ok===true?finish():finish(new Error('Offline shell warmup failed.'));
      try{worker.postMessage(message,[channel.port2])}catch(error){finish(error)}
    });
  };
  return Object.freeze({
    getState(){return snapshot(state)},
    subscribe(subscriber){
      if(typeof subscriber!=='function')throw new Error('Offline shell subscriber must be a function.');
      subscribers.add(subscriber);
      subscriber(snapshot(state));
      return()=>subscribers.delete(subscriber);
    },
    async start(){
      if(disposed)return snapshot({status:'disposed'});
      if(!serviceWorker?.register||!locationRef?.href)return publish('unsupported');
      if(startPromise)return startPromise;
      publish('registering');
      startPromise=(async()=>{
        registration=await serviceWorker.register('offline-shell-sw.js',{scope:'./'});
        const ready=serviceWorker.ready?await serviceWorker.ready:registration;
        const worker=ready?.active||registration?.active||registration?.waiting||registration?.installing;
        await waitForPageLoad({documentRef,loadTarget});
        await warm(worker);
        return publish('ready');
      })().catch(()=>publish('error'));
      return startPromise;
    },
    dispose(){
      if(disposed)return;
      disposed=true;
      subscribers.clear();
      registration=null;
    }
  });
}
