(() => {
  const APP_STORE = 'biblequest_state_v4';
  const REVIEW_STORE = 'biblequest_open_review_v1';
  const DAY = 86400000;
  const INTERVALS = [1, 3, 7, 14, 30];
  const CATEGORY_CODES = {
    Genesis: ['GEN'],
    Exodus: ['EXO','LEV','NUM','DEU'],
    History: ['JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST'],
    Wisdom: ['JOB','PSA','PRO','ECC','SNG'],
    Prophets: ['ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL'],
    Gospels: ['MAT','MRK','LUK','JHN'],
    Acts: ['ACT'],
    Letters: ['ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV']
  };

  let overlay = null;
  let manifest = null;
  let session = null;
  const packCache = new Map();

  function today(){ return new Date().toISOString().slice(0,10); }
  function addDays(n){ const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
  function esc(s=''){ return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function shuffle(a){ const x=[...a]; for(let i=x.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; } return x; }
  function read(key,fallback){ try{return {...fallback,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return {...fallback}} }
  function appState(){ return read(APP_STORE,{xp:0,answered:0,correct:0,deckReview:{},deckStats:{},mastery:{}}); }
  function reviewState(){ return read(REVIEW_STORE,{items:{},sessions:[]}); }
  function saveApp(s){ localStorage.setItem(APP_STORE,JSON.stringify(s)); }
  function saveReview(s){ localStorage.setItem(REVIEW_STORE,JSON.stringify(s)); }
  function keyFor(code,id){ return `${code}:${id}`; }

  function weakestCategory(){
    const s=appState();
    const rows=Object.keys(CATEGORY_CODES).map((name,i)=>({name,value:Number(s.mastery?.[name]||0),i}));
    const min=Math.min(...rows.map(x=>x.value));
    const tied=rows.filter(x=>x.value===min);
    const day=Math.floor(Date.now()/DAY);
    return tied[day%tied.length]?.name || 'Genesis';
  }

  function countDue(){
    const rs=reviewState(), t=today();
    const scheduled=Object.values(rs.items||{}).filter(x=>x.nextDue && x.nextDue<=t).length;
    const app=appState();
    const legacy=Object.values(app.deckReview||{}).reduce((n,ids)=>n+(Array.isArray(ids)?ids.length:0),0);
    return Math.max(scheduled,legacy);
  }

  async function getManifest(){
    if(manifest) return manifest;
    const r=await fetch('data/packs/manifest.json');
    if(!r.ok) throw new Error(`Question-pack index unavailable (${r.status}).`);
    manifest=await r.json();
    return manifest;
  }

  async function getPack(code){
    if(packCache.has(code)) return packCache.get(code);
    const m=await getManifest();
    const info=(m.question_books||[]).find(x=>x.code===code);
    if(!info) return [];
    const r=await fetch(info.path);
    if(!r.ok) throw new Error(`${info.name} question pack unavailable (${r.status}).`);
    const rows=await r.json();
    packCache.set(code,rows);
    return rows;
  }

  function snapshot(code,book,row,existing={}){
    return {
      key:keyFor(code,row.id), code, book,
      id:row.id, q:row.q, a:row.a||'', r:row.r||'',
      seen:existing.seen||0, got:existing.got||0, again:existing.again||0,
      streak:existing.streak||0, nextDue:existing.nextDue||null, last:existing.last||null
    };
  }

  async function legacyReviewCandidates(limit){
    const app=appState(), rs=reviewState(), out=[];
    const entries=Object.entries(app.deckReview||{}).filter(([,ids])=>Array.isArray(ids)&&ids.length);
    for(const [code,ids] of entries){
      if(out.length>=limit) break;
      const m=await getManifest();
      const info=(m.question_books||[]).find(x=>x.code===code);
      if(!info) continue;
      const rows=await getPack(code), wanted=new Set(ids);
      for(const row of rows){
        if(!wanted.has(row.id)) continue;
        const k=keyFor(code,row.id);
        out.push(snapshot(code,info.name,row,rs.items?.[k]||{}));
        if(out.length>=limit) break;
      }
    }
    return out;
  }

  async function freshCandidates(limit,exclude){
    const m=await getManifest(), weak=weakestCategory();
    const allowed=new Set(CATEGORY_CODES[weak]||[]);
    let books=(m.question_books||[]).filter(x=>allowed.has(x.code));
    if(!books.length) books=[...(m.question_books||[])];
    books=shuffle(books);
    const rs=reviewState(), out=[];
    for(const info of books.slice(0,3)){
      const rows=shuffle(await getPack(info.code));
      for(const row of rows){
        const k=keyFor(info.code,row.id);
        if(exclude.has(k) || rs.items?.[k]) continue;
        out.push(snapshot(info.code,info.name,row));
        exclude.add(k);
        if(out.length>=limit) return out;
      }
    }
    return out;
  }

  async function buildSession(count=7){
    const rs=reviewState(), t=today();
    const scheduled=Object.values(rs.items||{})
      .filter(x=>x.nextDue && x.nextDue<=t)
      .sort((a,b)=>String(a.nextDue).localeCompare(String(b.nextDue)) || ((a.got||0)/(a.seen||1))-((b.got||0)/(b.seen||1)));
    const out=scheduled.slice(0,count), keys=new Set(out.map(x=>x.key));
    if(out.length<count){
      const legacy=await legacyReviewCandidates(count-out.length);
      for(const x of legacy){ if(!keys.has(x.key)){ out.push(x); keys.add(x.key); } }
    }
    if(out.length<count){
      out.push(...await freshCandidates(count-out.length,keys));
    }
    return out.slice(0,count);
  }

  function getOverlay(){
    if(!overlay){ overlay=document.createElement('div'); overlay.className='open-review-overlay'; document.body.appendChild(overlay); }
    overlay.classList.add('open');
    return overlay;
  }
  function close(reload=false){ if(overlay) overlay.classList.remove('open'); session=null; if(reload) location.reload(); }

  function renderLoading(){
    getOverlay().innerHTML=`<div class="open-review-shell"><section class="open-review-result"><div class="open-review-orb">📚</div><div class="eyebrow">OPEN BIBLE LIBRARY</div><h1>Building your review…</h1><p>BibleQuest is loading only the book packs needed for this session.</p></section></div>`;
  }

  async function start(){
    renderLoading();
    try{
      const items=await buildSession(7);
      if(!items.length) throw new Error('No open recall questions were available.');
      session={items,index:0,got:0,again:0,revealed:false,gained:0};
      renderCard();
    }catch(e){
      getOverlay().innerHTML=`<div class="open-review-shell"><section class="open-review-result"><div class="open-review-orb">📦</div><h1>Open review unavailable</h1><p>${esc(e.message)}</p><button class="open-review-primary" data-open-review-close>Close</button></section></div>`;
      bindOverlay();
    }
  }

  function renderCard(){
    if(session.index>=session.items.length) return renderResults();
    const item=session.items[session.index], rs=reviewState(), saved=rs.items?.[item.key]||item;
    const label=saved.nextDue&&saved.nextDue<=today()?'DUE REVIEW':saved.seen?'REINFORCEMENT':'NEW OPEN QUESTION';
    getOverlay().innerHTML=`<div class="open-review-shell"><header><button data-open-review-close>← BibleQuest</button><span>Open Smart Review</span><em>${session.index+1}/${session.items.length}</em></header>
      <div class="open-review-progress"><i style="width:${session.index/session.items.length*100}%"></i></div>
      <section class="open-review-card"><div class="open-review-kicker">${label} · ${esc(item.book)}</div><h1>${esc(item.q)}</h1>
      ${session.revealed?`<div class="open-answer"><span>REFERENCE ANSWER</span><p>${esc(item.a||'No reference answer supplied in this source record.')}</p>${item.r?`<b>📖 ${esc(item.r)}</b>`:''}</div><p class="open-review-hint">Rate your recall, not whether the wording matched exactly.</p><div class="open-review-actions"><button class="open-review-again" data-open-review-rate="again">🔁 Review again</button><button class="open-review-primary" data-open-review-rate="got">✓ Got it</button></div>`:`<p class="open-review-hint">Answer from memory first. Then reveal the source answer.</p><button class="open-review-primary" data-open-review-reveal>Reveal answer</button>`}
      <div class="open-review-license">unfoldingWord Translation Questions v90 · CC BY-SA 4.0</div></section></div>`;
    bindOverlay();
  }

  function record(gotIt){
    const item=session.items[session.index], rs=reviewState();
    const prev=rs.items?.[item.key]||item;
    const st={...prev,seen:(prev.seen||0)+1,last:today()};
    if(gotIt){
      st.got=(prev.got||0)+1;
      st.streak=Math.min(5,(prev.streak||0)+1);
      st.nextDue=addDays(INTERVALS[Math.max(0,st.streak-1)]||30);
      session.got++; session.gained+=5;
    }else{
      st.again=(prev.again||0)+1;
      st.streak=0; st.nextDue=today();
      session.again++; session.gained+=1;
    }
    rs.items=rs.items||{}; rs.items[item.key]=st; saveReview(rs);

    const app=appState();
    app.answered=(app.answered||0)+1;
    app.xp=(app.xp||0)+(gotIt?5:1);
    app.correct=(app.correct||0)+(gotIt?1:0);
    app.deckReview=app.deckReview||{}; app.deckReview[item.code]=app.deckReview[item.code]||[];
    if(gotIt) app.deckReview[item.code]=app.deckReview[item.code].filter(id=>id!==item.id);
    else if(!app.deckReview[item.code].includes(item.id)) app.deckReview[item.code].push(item.id);
    app.deckStats=app.deckStats||{}; app.deckStats[item.code]=app.deckStats[item.code]||{seen:0,got:0,again:0};
    app.deckStats[item.code].seen++;
    if(gotIt) app.deckStats[item.code].got++; else app.deckStats[item.code].again++;
    saveApp(app);

    session.index++; session.revealed=false;
    renderCard();
  }

  function renderResults(){
    const rs=reviewState();
    rs.sessions=rs.sessions||[]; rs.sessions.push({date:today(),got:session.got,again:session.again,total:session.items.length}); rs.sessions=rs.sessions.slice(-90); saveReview(rs);
    const all=Object.values(rs.items||{}), seen=all.reduce((n,x)=>n+(x.seen||0),0), got=all.reduce((n,x)=>n+(x.got||0),0);
    const acc=seen?Math.round(got/seen*100):0;
    getOverlay().innerHTML=`<div class="open-review-shell"><section class="open-review-result"><div class="open-review-orb">${session.again?'🌱':'🧠'}</div><div class="eyebrow">OPEN REVIEW COMPLETE</div><h1>${session.got}/${session.items.length}</h1><p>${session.again?`${session.again} item${session.again===1?'':'s'} will return sooner. Correct recalls are now spaced farther apart.`:'Everything was recalled. These items will return later instead of being drilled immediately.'}</p><div class="open-review-metrics"><div><b>+${session.gained}</b><span>XP</span></div><div><b>${acc}%</b><span>open recall accuracy</span></div><div><b>${countDue()}</b><span>due now</span></div></div><button class="open-review-primary" data-open-review-finish>Return to BibleQuest</button></section></div>`;
    bindOverlay();
  }

  function bindOverlay(){
    const root=getOverlay();
    root.querySelectorAll('[data-open-review-close]').forEach(b=>b.onclick=()=>close(false));
    const reveal=root.querySelector('[data-open-review-reveal]'); if(reveal) reveal.onclick=()=>{session.revealed=true;renderCard();};
    root.querySelectorAll('[data-open-review-rate]').forEach(b=>b.onclick=()=>record(b.dataset.openReviewRate==='got'));
    const finish=root.querySelector('[data-open-review-finish]'); if(finish) finish.onclick=()=>close(true);
  }

  function injectHome(){
    const library=document.querySelector('.quest-card.library');
    if(!library || document.querySelector('[data-open-review]')) return;
    const due=countDue();
    library.insertAdjacentHTML('afterend',`<button class="quest-card open-smart" data-open-review><div class="quest-icon">🧠</div><div><span class="kicker">${due?`${due} DUE / REVIEW`:'ADAPTIVE OPEN LIBRARY'}</span><h3>Open Smart Review</h3><p>${due?'Weak and overdue open-library questions first.':'Adaptive recall drawn from the open Bible question packs you study.'}</p></div><span class="go">›</span></button>`);
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest?.('[data-open-review]');
    if(btn){ e.preventDefault(); start(); }
  });

  const observer=new MutationObserver(injectHome);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',injectHome);
  setTimeout(injectHome,80);

  window.BQOpenReview={start,countDue,weakestCategory};
})();
