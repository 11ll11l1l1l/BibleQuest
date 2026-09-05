(() => {
  const APP='biblequest_state_v4';
  const GROWTH='biblequest_growth_v1';
  const DEVICE='biblequest_device_key_v1';
  const ERROR_KEY='bq_startup_last_error_v1';
  const startedAt=Date.now();
  let gate=null,timer=null,settledSince=0,lastError='';

  const isObject=v=>Boolean(v)&&typeof v==='object'&&!Array.isArray(v);
  const finite=(v,fallback=0,min=0)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,n):fallback};
  const safeString=v=>typeof v==='string'?v:'';
  const redact=v=>String(v||'').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email]').replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g,'[token]').replace(/https?:\/\/[^\s]+/g,'[url]').slice(0,500);

  function backup(key,raw){
    if(!raw||raw.length>250000)return;
    try{sessionStorage.setItem(`${key}_cold_start_backup`,raw)}catch{}
  }

  function readJson(key){
    let raw='';
    try{raw=localStorage.getItem(key)||'';if(!raw)return {raw:'',value:null};return {raw,value:JSON.parse(raw)}}catch{backup(key,raw);return {raw,value:null,invalid:true}}
  }

  function sanitizeApp(){
    const r=readJson(APP);if(!r.raw)return;
    if(!isObject(r.value)){backup(APP,r.raw);try{localStorage.removeItem(APP)}catch{};return}
    const s={...r.value};let changed=false;
    for(const key of ['seen','wrong','achievements'])if(!Array.isArray(s[key])){s[key]=[];changed=true}
    for(const key of ['mastery','settings','profile','deckReview','deckStats','polls'])if(!isObject(s[key])){s[key]={};changed=true}
    for(const key of ['xp','answered','correct','situations','rounds']){const next=finite(s[key],0);if(next!==s[key]){s[key]=next;changed=true}}
    const streak=finite(s.streak,1,1);if(streak!==s.streak){s.streak=streak;changed=true}
    if(typeof s.profile.name!=='string'){s.profile={...s.profile,name:safeString(s.profile.name)};changed=true}
    Object.keys(s.deckReview).forEach(k=>{if(!Array.isArray(s.deckReview[k])){s.deckReview[k]=[];changed=true}});
    Object.keys(s.deckStats).forEach(k=>{if(!isObject(s.deckStats[k])){delete s.deckStats[k];changed=true}});
    if(changed){backup(APP,r.raw);try{localStorage.setItem(APP,JSON.stringify(s))}catch{}}
  }

  function sanitizeGrowth(){
    const r=readJson(GROWTH);if(!r.raw)return;
    if(!isObject(r.value)){backup(GROWTH,r.raw);try{localStorage.removeItem(GROWTH)}catch{};return}
    const g={...r.value};if(g.engagementV2==null)return;
    if(!isObject(g.engagementV2)){backup(GROWTH,r.raw);delete g.engagementV2;try{localStorage.setItem(GROWTH,JSON.stringify(g))}catch{};return}
    const e={...g.engagementV2};let changed=false;
    if(!isObject(e.daily)){e.daily={};changed=true}
    if(!isObject(e.history)){e.history={};changed=true}
    if(!isObject(e.streak)){e.streak={};changed=true}
    if(!isObject(e.streak.graceByMonth)){e.streak={...e.streak,graceByMonth:{}};changed=true}
    const streakCount=finite(e.streak.count,0);if(streakCount!==e.streak.count){e.streak={...e.streak,count:streakCount};changed=true}
    if(typeof e.streak.lastMeaningful!=='string'){e.streak={...e.streak,lastMeaningful:''};changed=true}
    if(!isObject(e.season)){e.season={};changed=true}
    if(!Array.isArray(e.season.completed)){e.season={...e.season,completed:[]};changed=true}
    const seasonProgress=finite(e.season.progress,0);if(seasonProgress!==e.season.progress){e.season={...e.season,progress:seasonProgress};changed=true}
    for(const [day,row] of Object.entries(e.daily)){
      if(!isObject(row)){delete e.daily[day];changed=true;continue}
      if(!Array.isArray(row.tasks)||row.tasks.length===0){delete e.daily[day];changed=true;continue}
      const tasks=row.tasks.filter(t=>isObject(t)&&typeof t.id==='string');if(tasks.length!==row.tasks.length||tasks.length===0){if(!tasks.length)delete e.daily[day];else e.daily[day]={...row,tasks};changed=true;if(!tasks.length)continue}
      const next={...(e.daily[day]||row)};
      if(!isObject(next.done)){next.done={};changed=true}
      if(!isObject(next.baseline)){next.baseline={};changed=true}
      e.daily[day]=next;
    }
    for(const [day,row] of Object.entries(e.history))if(!isObject(row)){delete e.history[day];changed=true}
    if(changed){backup(GROWTH,r.raw);g.engagementV2=e;try{localStorage.setItem(GROWTH,JSON.stringify(g))}catch{}}
  }

  function installUuidFallback(){
    try{
      if(!window.crypto||typeof crypto.randomUUID==='function'||typeof crypto.getRandomValues!=='function')return;
      const uuid=()=>{const b=new Uint8Array(16);crypto.getRandomValues(b);b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=[...b].map(x=>x.toString(16).padStart(2,'0'));return `${h.slice(0,4).join('')}-${h.slice(4,6).join('')}-${h.slice(6,8).join('')}-${h.slice(8,10).join('')}-${h.slice(10).join('')}`};
      try{Object.defineProperty(crypto,'randomUUID',{configurable:true,value:uuid})}catch{try{crypto.randomUUID=uuid}catch{}}
    }catch{}
  }

  function style(){
    if(document.getElementById('bqColdStartStyle'))return;
    const s=document.createElement('style');s.id='bqColdStartStyle';s.textContent=`#bqStartupGate{position:fixed;inset:0;z-index:2147483646;background:#f6f7f2;display:grid;place-items:center;padding:24px;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#203329}#bqStartupGate .bq-start-card{width:min(92vw,420px);text-align:center}#bqStartupGate .bq-start-mark{font-size:52px;line-height:1;margin-bottom:14px}#bqStartupGate h1{font-size:24px;margin:0 0 8px}#bqStartupGate p{font-size:14px;line-height:1.5;margin:0;color:#5d6c63}#bqStartupGate .bq-start-line{height:5px;border-radius:99px;background:#dfe5df;overflow:hidden;margin:22px auto 0;max-width:260px}#bqStartupGate .bq-start-line i{display:block;height:100%;width:40%;background:#45654b;border-radius:inherit;animation:bqStartMove 1.1s ease-in-out infinite alternate}#bqStartupGate button{margin-top:18px;border:0;border-radius:12px;padding:11px 16px;font-weight:800;background:#45654b;color:#fff}#bqStartupGate[data-error="1"] .bq-start-line{display:none}@keyframes bqStartMove{to{transform:translateX(150%)}}`;
    document.head.appendChild(s);
  }

  function ensureGate(){
    if(gate?.isConnected)return gate;style();gate=document.createElement('div');gate.id='bqStartupGate';gate.setAttribute('role','status');gate.setAttribute('aria-live','polite');gate.innerHTML='<div class="bq-start-card"><div class="bq-start-mark">🐑</div><h1>Opening BibleQuest…</h1><p>Checking your account and saved progress safely.</p><div class="bq-start-line"><i></i></div></div>';document.body.appendChild(gate);return gate
  }
  function dismiss(){clearInterval(timer);timer=null;gate?.remove();gate=null}
  function fail(){const g=ensureGate();g.dataset.error='1';g.innerHTML=`<div class="bq-start-card"><div class="bq-start-mark">⚠️</div><h1>BibleQuest could not finish starting.</h1><p>Your saved progress was not deleted. Reload to retry the safe startup.${lastError?' A startup error was captured for diagnostics.':''}</p><button type="button" data-bq-start-reload>Reload BibleQuest</button></div>`;g.querySelector('[data-bq-start-reload]').onclick=()=>location.reload()}

  function accountLayerOpen(){return Boolean(document.querySelector('#bqAccountLayer:not(.hidden)'))||document.body.classList.contains('account-open')}
  function tick(){
    if(accountLayerOpen()){dismiss();return}
    const cfg=window.BQ_CLOUD_CONFIG;if(cfg&&cfg.enabled===false){dismiss();return}
    const api=window.BQAccount,status=api?.status?.();
    if(status?.signedIn&&status.profile){
      if(!settledSince)settledSince=Date.now();
      const hadDevice=Boolean(window.__BQ_HAD_DEVICE_AT_START__);
      const wait=hadDevice?500:2500;
      if(Date.now()-settledSince>=wait){dismiss();return}
    }else settledSince=0;
    if(Date.now()-startedAt>15000)fail()
  }

  function capture(reason){
    lastError=redact(reason?.message||reason?.reason?.message||reason?.reason||reason||'startup error');
    try{sessionStorage.setItem(ERROR_KEY,JSON.stringify({at:new Date().toISOString(),message:lastError}))}catch{}
  }

  try{window.__BQ_HAD_DEVICE_AT_START__=Boolean(localStorage.getItem(DEVICE))}catch{window.__BQ_HAD_DEVICE_AT_START__=false}
  sanitizeApp();sanitizeGrowth();installUuidFallback();
  window.addEventListener('error',e=>capture(e.error||e.message),true);
  window.addEventListener('unhandledrejection',e=>capture(e.reason),true);
  ensureGate();timer=setInterval(tick,100);tick();
  window.BQStartupGate={dismiss,fail,sanitize:()=>{sanitizeApp();sanitizeGrowth()},lastError:()=>lastError};
})();