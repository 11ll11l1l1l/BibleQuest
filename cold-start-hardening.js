(() => {
  const APP='biblequest_state_v4';
  const GROWTH='biblequest_growth_v1';
  const READER='biblequest_reader_v1';
  const SEQUENCE='biblequest_sequence_v1';
  const STORY='biblequest_story_journey_v1';
  const COUPLES='biblequest_couples_v1';
  const REVIEW='biblequest_open_review_v1';
  const LEARNING='biblequest_learning_v1';
  const SAVED='biblequest_saved_passage_v1';
  const DEVICE='biblequest_device_key_v1';
  const ERROR_KEY='bq_startup_last_error_v1';
  const ALIASES=[
    {actual:'biblequest_transform_v2',transport:'biblequest_transformation_v1'},
    {actual:LEARNING,transport:'biblequest_learning_engine_v1'}
  ];
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

  function replaceState(key,r,value){backup(key,r.raw);try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
  function removeUnsafe(key,r){backup(key,r.raw);try{localStorage.removeItem(key)}catch{}}

  function hydrateAliases(){
    for(const a of ALIASES){
      const t=readJson(a.transport);if(!isObject(t.value)||t.value.__bq_alias!==a.actual||!('value' in t.value))continue;
      try{localStorage.setItem(a.actual,JSON.stringify(t.value.value))}catch{}
    }
  }

  function mirrorAlias(actual,value){
    const a=ALIASES.find(x=>x.actual===actual);if(!a)return;
    let parsed;try{parsed=JSON.parse(String(value))}catch{return}
    const envelope={__bq_alias:a.actual,version:1,value:parsed};
    try{Storage.prototype.setItem.call(localStorage,a.transport,JSON.stringify(envelope))}catch{try{localStorage.setItem(a.transport,JSON.stringify(envelope))}catch{}}
  }

  function installAliasMirror(){
    try{
      if(window.__BQ_STORAGE_ALIAS_INSTALLED__||typeof Storage==='undefined')return;
      const native=Storage.prototype.setItem;
      Storage.prototype.setItem=function(key,value){native.call(this,key,value);if(this===localStorage&&ALIASES.some(a=>a.actual===key)){let parsed;try{parsed=JSON.parse(String(value))}catch{return}const a=ALIASES.find(x=>x.actual===key);native.call(this,a.transport,JSON.stringify({__bq_alias:a.actual,version:1,value:parsed}))}};
      window.__BQ_STORAGE_ALIAS_INSTALLED__=true;
    }catch{}
  }

  function primeAliases(){for(const a of ALIASES){let raw='';try{raw=localStorage.getItem(a.actual)||''}catch{}if(raw)mirrorAlias(a.actual,raw)}}

  function sanitizeApp(){
    const r=readJson(APP);if(!r.raw)return;
    if(!isObject(r.value)){removeUnsafe(APP,r);return}
    const s={...r.value};let changed=false;
    for(const key of ['seen','wrong','achievements'])if(!Array.isArray(s[key])){s[key]=[];changed=true}
    for(const key of ['mastery','settings','profile','deckReview','deckStats','polls'])if(!isObject(s[key])){s[key]={};changed=true}
    for(const key of ['xp','answered','correct','situations','rounds']){const next=finite(s[key],0);if(next!==s[key]){s[key]=next;changed=true}}
    const streak=finite(s.streak,1,1);if(streak!==s.streak){s.streak=streak;changed=true}
    if(typeof s.profile.name!=='string'){s.profile={...s.profile,name:safeString(s.profile.name)};changed=true}
    Object.keys(s.deckReview).forEach(k=>{if(!Array.isArray(s.deckReview[k])){s.deckReview[k]=[];changed=true}});
    Object.keys(s.deckStats).forEach(k=>{if(!isObject(s.deckStats[k])){delete s.deckStats[k];changed=true}});
    if(changed)replaceState(APP,r,s)
  }

  function sanitizeGrowth(){
    const r=readJson(GROWTH);if(!r.raw)return;
    if(!isObject(r.value)){removeUnsafe(GROWTH,r);return}
    const g={...r.value};if(g.engagementV2==null)return;
    if(!isObject(g.engagementV2)){delete g.engagementV2;replaceState(GROWTH,r,g);return}
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
      if(!isObject(row)||!Array.isArray(row.tasks)||row.tasks.length===0){delete e.daily[day];changed=true;continue}
      const tasks=row.tasks.filter(t=>isObject(t)&&typeof t.id==='string');if(!tasks.length){delete e.daily[day];changed=true;continue}
      const next={...row,tasks};if(tasks.length!==row.tasks.length)changed=true;
      if(!isObject(next.done)){next.done={};changed=true}
      if(!isObject(next.baseline)){next.baseline={};changed=true}
      e.daily[day]=next;
    }
    for(const [day,row] of Object.entries(e.history))if(!isObject(row)){delete e.history[day];changed=true}
    if(changed){g.engagementV2=e;replaceState(GROWTH,r,g)}
  }

  function sanitizeReader(){
    const r=readJson(READER);if(!r.raw)return;if(!isObject(r.value)){removeUnsafe(READER,r);return}
    const s={...r.value};let changed=false;
    if(s.code!=null&&typeof s.code!=='string'){delete s.code;changed=true}
    if(s.name!=null&&typeof s.name!=='string'){delete s.name;changed=true}
    if(s.chapter!=null){const n=Math.max(1,Math.floor(finite(s.chapter,1,1)));if(n!==s.chapter){s.chapter=n;changed=true}}
    if(changed)replaceState(READER,r,s)
  }

  function sanitizeSequence(){
    const r=readJson(SEQUENCE);if(!r.raw)return;if(!isObject(r.value)){removeUnsafe(SEQUENCE,r);return}
    const s={...r.value};let changed=false;for(const key of ['played','solved','streak','best']){const n=Math.floor(finite(s[key],0));if(n!==s[key]){s[key]=n;changed=true}}if(changed)replaceState(SEQUENCE,r,s)
  }

  function sanitizeStory(){
    const r=readJson(STORY);if(!r.raw)return;if(!isObject(r.value)){removeUnsafe(STORY,r);return}
    const s={...r.value};let changed=false;if(!Array.isArray(s.completed)){s.completed=[];changed=true}else{s.completed=[...new Set(s.completed.filter(x=>typeof x==='string'))]}
    if(s.current!=null&&!isObject(s.current)){s.current=null;changed=true}if(!isObject(s.review)){s.review={};changed=true}if(changed)replaceState(STORY,r,s)
  }

  function sanitizeCouples(){
    const r=readJson(COUPLES);if(!r.raw)return;if(!isObject(r.value)){removeUnsafe(COUPLES,r);return}
    const s={...r.value};let changed=false;for(const key of ['favorites','history','commitments','checkins'])if(!Array.isArray(s[key])){s[key]=[];changed=true}
    const n=Math.floor(finite(s.listenCount,0));if(n!==s.listenCount){s.listenCount=n;changed=true}if(changed)replaceState(COUPLES,r,s)
  }

  function sanitizeReview(){
    const r=readJson(REVIEW);if(!r.raw)return;if(!isObject(r.value)){removeUnsafe(REVIEW,r);return}
    const s={...r.value};let changed=false;if(!isObject(s.items)){s.items={};changed=true}if(!Array.isArray(s.sessions)){s.sessions=[];changed=true}if(changed)replaceState(REVIEW,r,s)
  }

  function sanitizeLearning(){
    const r=readJson(LEARNING);if(!r.raw)return;if(!isObject(r.value)){removeUnsafe(LEARNING,r);return}
    const s={...r.value};let changed=false;if(!isObject(s.questionStats)){s.questionStats={};changed=true}if(!Array.isArray(s.sessions)){s.sessions=[];changed=true}if(!isObject(s.connectionStats)){s.connectionStats={seen:0,correct:0,last:null};changed=true}if(changed)replaceState(LEARNING,r,s)
  }

  function sanitizeSaved(){const r=readJson(SAVED);if(r.raw&&!isObject(r.value))removeUnsafe(SAVED,r)}
  function sanitizeAll(){sanitizeApp();sanitizeGrowth();sanitizeReader();sanitizeSequence();sanitizeStory();sanitizeCouples();sanitizeReview();sanitizeLearning();sanitizeSaved();primeAliases()}

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
      const wait=window.__BQ_HAD_DEVICE_AT_START__?500:2500;
      if(Date.now()-settledSince>=wait){dismiss();return}
    }else settledSince=0;
    if(Date.now()-startedAt>15000)fail()
  }

  function capture(reason){
    lastError=redact(reason?.message||reason?.reason?.message||reason?.reason||reason||'startup error');
    try{sessionStorage.setItem(ERROR_KEY,JSON.stringify({at:new Date().toISOString(),message:lastError}))}catch{}
  }

  try{window.__BQ_HAD_DEVICE_AT_START__=Boolean(localStorage.getItem(DEVICE))}catch{window.__BQ_HAD_DEVICE_AT_START__=false}
  hydrateAliases();installAliasMirror();sanitizeAll();installUuidFallback();
  window.addEventListener('pagehide',primeAliases,true);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')primeAliases()},true);
  window.addEventListener('error',e=>capture(e.error||e.message),true);
  window.addEventListener('unhandledrejection',e=>capture(e.reason),true);
  ensureGate();timer=setInterval(tick,100);tick();
  window.BQStartupGate={dismiss,fail,sanitize:sanitizeAll,lastError:()=>lastError,syncProgressAliases:primeAliases};
})();