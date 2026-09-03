(() => {
  const APP_STORE = 'biblequest_state_v4';
  const META_STORE = 'biblequest_learning_v1';
  const DAY = 86400000;
  const CATEGORIES = ['Genesis','Exodus','History','Wisdom','Prophets','Gospels','Acts','Letters'];
  const intervals = [1,3,7,14,30];

  let overlay = null;
  let session = null;
  let observer = null;

  function today(){ return new Date().toISOString().slice(0,10); }
  function addDays(n){ const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
  function esc(s=''){ return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function shuffle(a){ const x=[...a]; for(let i=x.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [x[i],x[j]]=[x[j],x[i]]; } return x; }
  function loadJSON(key,fallback){ try{return {...fallback,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return {...fallback}} }
  function appState(){ return loadJSON(APP_STORE,{xp:0,answered:0,correct:0,seen:[],wrong:[],mastery:Object.fromEntries(CATEGORIES.map(x=>[x,0]))}); }
  function meta(){ return loadJSON(META_STORE,{questionStats:{},sessions:[],connectionStats:{seen:0,correct:0,last:null}}); }
  function saveMeta(m){ localStorage.setItem(META_STORE,JSON.stringify(m)); }
  function saveApp(s){ localStorage.setItem(APP_STORE,JSON.stringify(s)); }

  function category(book=''){
    if(book==='Genesis') return 'Genesis';
    if(['Exodus','Leviticus','Numbers','Deuteronomy'].includes(book)) return 'Exodus';
    if(['Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther'].includes(book)) return 'History';
    if(['Job','Psalms','Proverbs','Ecclesiastes','Song of Songs'].includes(book)) return 'Wisdom';
    if(['Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi'].includes(book)) return 'Prophets';
    if(['Matthew','Mark','Luke','John'].includes(book)) return 'Gospels';
    if(book==='Acts') return 'Acts';
    return 'Letters';
  }

  function ensureScript(src,globalName){
    if(window[globalName]) return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const existing=document.querySelector(`script[data-learning-pack="${src}"]`);
      if(existing){ existing.addEventListener('load',resolve,{once:true}); existing.addEventListener('error',reject,{once:true}); return; }
      const s=document.createElement('script'); s.src=src; s.dataset.learningPack=src; s.onload=resolve; s.onerror=()=>reject(new Error(`Could not load ${src}`)); document.body.appendChild(s);
    });
  }

  function statFor(q){ const m=meta(); return m.questionStats[q.id]||{seen:0,correct:0,wrong:0,streak:0,nextDue:null,last:null}; }
  function dueCount(){
    const m=meta(), t=today();
    const due=Object.values(m.questionStats||{}).filter(s=>s.nextDue && s.nextDue<=t).length;
    const app=appState();
    return Math.max(due,(app.wrong||[]).length);
  }
  function evidenceAccuracy(){
    const list=Object.values(meta().questionStats||{}); const seen=list.reduce((n,s)=>n+(s.seen||0),0); const correct=list.reduce((n,s)=>n+(s.correct||0),0);
    return seen?Math.round(correct/seen*100):0;
  }
  function weakestTrack(){
    const s=appState();
    const explored=CATEGORIES.filter(k=>(s.mastery?.[k]||0)>0);
    if(!explored.length) return null;
    return explored.sort((a,b)=>(s.mastery?.[a]||0)-(s.mastery?.[b]||0))[0];
  }

  function recordQuestion(q,good,{award=false}={}){
    if(!q?.id) return;
    const m=meta();
    const st=m.questionStats[q.id]||{seen:0,correct:0,wrong:0,streak:0,nextDue:null,last:null};
    st.seen++;
    st.last=today();
    if(good){
      st.correct++;
      st.streak=Math.min(5,(st.streak||0)+1);
      st.nextDue=addDays(intervals[Math.max(0,st.streak-1)]||30);
    }else{
      st.wrong++;
      st.streak=0;
      st.nextDue=today();
    }
    m.questionStats[q.id]=st;
    saveMeta(m);

    if(award){
      const s=appState();
      s.answered=(s.answered||0)+1;
      if(good){ s.correct=(s.correct||0)+1; s.xp=(s.xp||0)+10; s.wrong=(s.wrong||[]).filter(id=>id!==q.id); }
      else { s.xp=(s.xp||0)+3; s.wrong=s.wrong||[]; if(!s.wrong.includes(q.id)) s.wrong.push(q.id); }
      s.seen=s.seen||[]; if(!s.seen.includes(q.id)) s.seen.push(q.id);
      const k=category(q.book); s.mastery=s.mastery||{}; s.mastery[k]=Math.min(100,(s.mastery[k]||0)+(good?5:2));
      saveApp(s);
    }
  }

  function rankQuestions(bank){
    const s=appState(), m=meta(), t=today(), wrong=new Set(s.wrong||[]);
    return bank.map(q=>{
      const st=m.questionStats[q.id]||{};
      let p=Math.random()*8;
      if(wrong.has(q.id)) p+=70;
      if(st.nextDue && st.nextDue<=t) p+=55;
      if(!st.seen) p+=30;
      const attempts=st.seen||0, misses=st.wrong||0;
      if(attempts) p+=(misses/attempts)*35;
      p+=(100-(s.mastery?.[category(q.book)]||0))*0.22;
      if(q.mode==='context') p+=8;
      if(q.mode==='connection') p+=10;
      return {q,p};
    }).sort((a,b)=>b.p-a.p);
  }

  function smartBank(bank,count=7){
    const ranked=rankQuestions(bank), out=[], per={};
    for(const item of ranked){
      const k=category(item.q.book);
      if((per[k]||0)>=3) continue;
      out.push(item.q); per[k]=(per[k]||0)+1;
      if(out.length>=count) break;
    }
    if(out.length<count){
      for(const item of ranked){ if(!out.includes(item.q)){ out.push(item.q); if(out.length>=count) break; } }
    }
    return out;
  }

  function getOverlay(){
    if(!overlay){ overlay=document.createElement('div'); overlay.className='learning-overlay'; document.body.appendChild(overlay); }
    overlay.classList.add('open');
    return overlay;
  }
  function closeOverlay(reload=false){ if(overlay) overlay.classList.remove('open'); session=null; if(reload) location.reload(); }

  async function startSmart(){
    try{
      await ensureScript('data/questions.js','BQ_QUESTIONS');
      const bank=smartBank(window.BQ_QUESTIONS||[],7);
      session={type:'smart',items:bank,index:0,score:0,answered:false};
      renderSmart();
    }catch(e){ showError(e.message); }
  }

  function renderSmart(){
    const root=getOverlay();
    if(session.index>=session.items.length) return renderSmartResults();
    const q=session.items[session.index], st=statFor(q);
    root.innerHTML=`<div class="learning-shell"><header><button data-learn-close>← BibleQuest</button><span>Adaptive Review</span><em>${session.index+1}/${session.items.length}</em></header>
      <div class="learning-progress"><i style="width:${session.index/session.items.length*100}%"></i></div>
      <section class="learning-card"><div class="learning-kicker">${st.nextDue&&st.nextDue<=today()?'DUE REVIEW':!st.seen?'NEW':'REINFORCEMENT'} · ${esc(category(q.book))}</div><h1>${esc(q.q)}</h1>
      <div class="learning-choices">${q.choices.map((c,i)=>`<button data-smart-choice="${i}"><span>${String.fromCharCode(65+i)}</span>${esc(c)}</button>`).join('')}</div><div id="learnFeedback"></div></section></div>`;
    bindOverlay();
  }

  function answerSmart(i){
    if(session.answered) return; session.answered=true;
    const q=session.items[session.index], good=i===q.answer;
    if(good) session.score++;
    recordQuestion(q,good,{award:true});
    const root=getOverlay();
    root.querySelectorAll('[data-smart-choice]').forEach((b,n)=>{ b.disabled=true; if(n===q.answer)b.classList.add('good'); else if(n===i&&!good)b.classList.add('bad'); });
    root.querySelector('#learnFeedback').innerHTML=`<div class="learning-feedback"><b>${good?'✓ Remembered':'Review target added'}</b><p>${esc(q.why)}</p><span>📖 ${esc(q.ref)}</span></div><button class="learning-primary" data-smart-next>${session.index+1===session.items.length?'See learning result':'Next'}</button>`;
    bindOverlay();
  }

  function renderSmartResults(){
    const m=meta(); m.sessions.push({date:today(),type:'adaptive',score:session.score,total:session.items.length}); m.sessions=m.sessions.slice(-60); saveMeta(m);
    const pct=Math.round(session.score/session.items.length*100), weak=weakestTrack(), due=dueCount();
    getOverlay().innerHTML=`<div class="learning-shell"><section class="learning-result"><div class="learning-orb">${pct>=85?'🧠':'🌱'}</div><div class="learning-kicker">ADAPTIVE SESSION COMPLETE</div><h1>${session.score}/${session.items.length}</h1><p>${pct>=85?'Strong retrieval today. Spacing will bring these items back later.':'Useful misses. The engine has shortened the review interval for the weak items.'}</p><div class="learning-metrics"><div><b>${evidenceAccuracy()}%</b><span>tracked accuracy</span></div><div><b>${due}</b><span>due now</span></div><div><b>${weak||'—'}</b><span>weakest explored area</span></div></div><button class="learning-primary" data-learn-finish>Return to BibleQuest</button></section></div>`;
    bindOverlay();
  }

  async function startConnections(){
    try{
      await ensureScript('data/connections.js','BQ_CONNECTIONS');
      session={type:'connections',items:shuffle(window.BQ_CONNECTIONS||[]).slice(0,5),index:0,score:0,answered:false};
      renderConnection();
    }catch(e){ showError(e.message); }
  }

  function renderConnection(){
    const root=getOverlay();
    if(session.index>=session.items.length) return renderConnectionResults();
    const q=session.items[session.index];
    root.innerHTML=`<div class="learning-shell"><header><button data-learn-close>← BibleQuest</button><span>Scripture Connections</span><em>${session.index+1}/${session.items.length}</em></header><div class="learning-progress"><i style="width:${session.index/session.items.length*100}%"></i></div>
      <section class="learning-card"><div class="learning-kicker">${esc(q.kind)} · ${esc(q.theme)}</div><div class="connection-pair"><article><b>${esc(q.left.ref)}</b><p>${esc(q.left.label)}</p></article><div>↔</div><article><b>${esc(q.right.ref)}</b><p>${esc(q.right.label)}</p></article></div><h1>${esc(q.q)}</h1><div class="learning-choices">${q.choices.map((c,i)=>`<button data-connection-choice="${i}"><span>${String.fromCharCode(65+i)}</span>${esc(c)}</button>`).join('')}</div><div id="learnFeedback"></div></section></div>`;
    bindOverlay();
  }

  function answerConnection(i){
    if(session.answered) return; session.answered=true;
    const q=session.items[session.index], good=i===q.answer;
    if(good)session.score++;
    const m=meta(); m.connectionStats=m.connectionStats||{seen:0,correct:0,last:null}; m.connectionStats.seen++; if(good)m.connectionStats.correct++; m.connectionStats.last=today(); saveMeta(m);
    const s=appState(); s.answered=(s.answered||0)+1; if(good){s.correct=(s.correct||0)+1;s.xp=(s.xp||0)+12}else{s.xp=(s.xp||0)+4} saveApp(s);
    const root=getOverlay(); root.querySelectorAll('[data-connection-choice]').forEach((b,n)=>{b.disabled=true;if(n===q.answer)b.classList.add('good');else if(n===i&&!good)b.classList.add('bad')});
    root.querySelector('#learnFeedback').innerHTML=`<div class="learning-feedback"><b>${good?'✓ Textual connection identified':'Read the link again'}</b><p>${esc(q.why)}</p><span>📖 ${esc(q.left.ref)} · ${esc(q.right.ref)}</span></div><button class="learning-primary" data-connection-next>${session.index+1===session.items.length?'See results':'Next connection'}</button>`;
    bindOverlay();
  }

  function renderConnectionResults(){
    const pct=Math.round(session.score/session.items.length*100), m=meta();
    getOverlay().innerHTML=`<div class="learning-shell"><section class="learning-result"><div class="learning-orb">🔗</div><div class="learning-kicker">SCRIPTURE CONNECTIONS COMPLETE</div><h1>${session.score}/${session.items.length}</h1><p>${pct>=80?'You identified the explicit cross-Scripture links well.':'Re-reading both referenced passages is more valuable than memorizing the quiz answer.'}</p><div class="learning-metrics"><div><b>${m.connectionStats?.seen||0}</b><span>links studied</span></div><div><b>${m.connectionStats?.seen?Math.round((m.connectionStats.correct||0)/m.connectionStats.seen*100):0}%</b><span>connection accuracy</span></div><div><b>Direct</b><span>textual links only</span></div></div><button class="learning-primary" data-learn-finish>Return to BibleQuest</button></section></div>`;
    bindOverlay();
  }

  function showError(msg){
    getOverlay().innerHTML=`<div class="learning-shell"><section class="learning-result"><div class="learning-orb">📦</div><h1>Learning pack unavailable</h1><p>${esc(msg)}</p><button class="learning-primary" data-learn-close>Close</button></section></div>`; bindOverlay();
  }

  function bindOverlay(){
    const root=getOverlay();
    root.querySelectorAll('[data-learn-close]').forEach(b=>b.onclick=()=>closeOverlay(false));
    root.querySelectorAll('[data-smart-choice]').forEach(b=>b.onclick=()=>answerSmart(+b.dataset.smartChoice));
    root.querySelectorAll('[data-connection-choice]').forEach(b=>b.onclick=()=>answerConnection(+b.dataset.connectionChoice));
    const sn=root.querySelector('[data-smart-next]'); if(sn)sn.onclick=()=>{session.index++;session.answered=false;renderSmart()};
    const cn=root.querySelector('[data-connection-next]'); if(cn)cn.onclick=()=>{session.index++;session.answered=false;renderConnection()};
    const finish=root.querySelector('[data-learn-finish]'); if(finish)finish.onclick=()=>closeOverlay(true);
  }

  function injectHome(){
    const stack=document.querySelector('.feature-stack');
    if(!stack||stack.querySelector('[data-start-smart]')) return;
    const due=dueCount(), weak=weakestTrack(), accuracy=evidenceAccuracy();
    const card=document.createElement('button'); card.className='quest-card adaptive-card'; card.dataset.startSmart='1';
    card.innerHTML=`<div class="quest-icon">🧠</div><div><span class="kicker">ADAPTIVE · ${due?`${due} DUE`:'SMART MIX'}</span><h3>Smart Review</h3><p>${due?'Prioritizes due and previously missed questions.':weak?`Builds a 7-question round around weak evidence, including ${esc(weak)}.`:'Starts a learning baseline, then adapts future review intervals.'}</p><small class="adaptive-evidence">${accuracy?`${accuracy}% tracked retrieval accuracy`:'No tracked retrieval baseline yet'}</small></div><span class="go">›</span>`;
    const grid=stack.querySelector('.mode-grid'); stack.insertBefore(card,grid||null); card.onclick=startSmart;
    if(grid&&!grid.querySelector('[data-start-connections]')){
      const c=document.createElement('button'); c.className='mode-card connection-mode'; c.dataset.startConnections='1'; c.innerHTML='<span>🔗</span><b>Scripture Connections</b><small>See how later passages use earlier texts</small>'; c.onclick=startConnections; grid.appendChild(c);
    }
  }

  function injectJourney(){
    const panel=[...document.querySelectorAll('.panel')].find(x=>x.querySelector('h1')?.textContent.trim()==='Bible Journey');
    if(!panel||panel.querySelector('.adaptive-journey')) return;
    const s=appState(), weak=weakestTrack(), due=dueCount(), accuracy=evidenceAccuracy();
    const box=document.createElement('section'); box.className='adaptive-journey';
    box.innerHTML=`<div><div class="learning-kicker">KNOWLEDGE EVIDENCE</div><h2>${due?'Review is ready':weak?`Next focus: ${esc(weak)}`:'Build your baseline'}</h2><p>Journey bars show exploration. This separate layer uses actual retrieval history so exposure is not mistaken for mastery.</p></div><div class="adaptive-journey-stats"><span><b>${accuracy}%</b>tracked accuracy</span><span><b>${due}</b>due review</span><span><b>${Object.keys(meta().questionStats||{}).length}</b>questions tracked</span></div><div class="actions"><button class="primary" data-start-smart>Smart Review</button><button class="secondary" data-start-connections>Connections</button></div>`;
    const summary=panel.querySelector('.journey-summary'); if(summary)summary.insertAdjacentElement('afterend',box); else panel.prepend(box);
    box.querySelector('[data-start-smart]').onclick=startSmart; box.querySelector('[data-start-connections]').onclick=startConnections;
  }

  function observeExistingQuiz(e){
    const b=e.target.closest?.('[data-choice]'); if(!b) return;
    const qText=document.querySelector('.question-card h2')?.textContent.trim(); if(!qText||!window.BQ_QUESTIONS) return;
    const q=window.BQ_QUESTIONS.find(x=>x.q===qText); if(!q) return;
    const chosen=Number(b.dataset.choice); setTimeout(()=>recordQuestion(q,chosen===q.answer,{award:false}),0);
  }

  function inject(){ injectHome(); injectJourney(); }

  document.addEventListener('click',observeExistingQuiz,true);
  observer=new MutationObserver(()=>inject());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  inject();
  window.BQ_LEARNING={startSmart,startConnections,dueCount,evidenceAccuracy};
})();
