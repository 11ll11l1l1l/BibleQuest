(() => {
  const KEY='biblequest_runtime_health_v1';
  const MAX=30;
  const onceKeys=new Set();
  const scheduled=new Map();
  let reporting=false;

  const cleanText=(value='')=>String(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi,'[id]')
    .replace(/https?:\/\/[^\s)]+/gi,url=>{try{const u=new URL(url);return `${u.origin}${u.pathname}`}catch{return '[url]'}})
    .replace(/[A-Za-z0-9_-]{40,}/g,'[token]')
    .slice(0,240);

  function read(){
    try{
      const parsed=JSON.parse(localStorage.getItem(KEY)||'[]');
      return Array.isArray(parsed)?parsed:[];
    }catch{return []}
  }

  function persist(rows){
    try{localStorage.setItem(KEY,JSON.stringify(rows.slice(-MAX)))}catch{}
  }

  function safeMeta(meta={}){
    const out={};
    Object.entries(meta||{}).slice(0,8).forEach(([key,value])=>{
      if(['string','number','boolean'].includes(typeof value))out[cleanText(key).slice(0,32)]=typeof value==='string'?cleanText(value):value;
    });
    return out;
  }

  function report(module='app',code='runtime_error',error=null,meta={}){
    if(reporting)return;
    reporting=true;
    try{
      const row={
        at:new Date().toISOString(),
        module:cleanText(module).slice(0,48)||'app',
        code:cleanText(code).slice(0,64)||'runtime_error',
        name:cleanText(error?.name||'Error').slice(0,48),
        message:cleanText(error?.message||error||''),
        online:navigator.onLine!==false,
        path:location.pathname,
        meta:safeMeta(meta)
      };
      const rows=read();rows.push(row);persist(rows);
      window.dispatchEvent(new CustomEvent('bq-runtime-health',{detail:{module:row.module,code:row.code}}));
      Promise.resolve(window.BQAccount?.track?.('runtime_health','failure',{module:row.module,code:row.code,online:row.online})).catch(()=>{});
    }catch{}finally{reporting=false}
  }

  function once(key,fn){
    if(onceKeys.has(key))return false;
    onceKeys.add(key);
    try{fn?.();return true}catch(error){report('runtime',`once_${key}`,error);return false}
  }

  function schedule(key,fn){
    if(scheduled.has(key))return;
    const id=requestAnimationFrame(()=>{
      scheduled.delete(key);
      try{fn?.()}catch(error){report('runtime',`schedule_${key}`,error)}
    });
    scheduled.set(key,id);
  }

  function clear(){try{localStorage.removeItem(KEY)}catch{}}
  function diagnostics(){
    const rows=read();
    const byModule={};
    rows.forEach(x=>byModule[x.module]=(byModule[x.module]||0)+1);
    return {entries:rows.length,byModule,online:navigator.onLine!==false,once:[...onceKeys]};
  }

  window.addEventListener('error',event=>{
    const target=event.target;
    if(target&&target!==window){
      const src=target.src||target.href||'';
      if(src)report('asset','load_failed',new Error('Required asset failed to load'),{asset:src.split('/').pop()?.split('?')[0]||'asset'});
      return;
    }
    report('window','uncaught_error',event.error||new Error(event.message||'Uncaught error'),{file:String(event.filename||'').split('/').pop()});
  },true);

  window.addEventListener('unhandledrejection',event=>{
    const reason=event.reason instanceof Error?event.reason:new Error(String(event.reason||'Unhandled promise rejection'));
    report('promise','unhandled_rejection',reason);
  });

  window.BQRuntime=Object.freeze({report,read,clear,once,schedule,diagnostics});
})();
