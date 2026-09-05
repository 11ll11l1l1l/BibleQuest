(() => {
  const APP='biblequest_state_v4';
  let scheduled=false,lastSignature='';

  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function state(){try{return JSON.parse(localStorage.getItem(APP)||'{}')}catch{return {}}}
  function today(){return new Date().toISOString().slice(0,10)}
  function due(){try{return window.BQOpenReview?.countDue?.()||0}catch{return 0}}

  function featureFailure(label,retry){
    const el=sheet(),host=el.querySelector('#modernSheetContent');
    host.innerHTML=`<header class="modern-sheet-head"><div><span>⚠️</span><div><small>RECOVERABLE ERROR</small><h2>${esc(label)} could not open</h2><p>BibleQuest is still running. Try again, or close this message and continue elsewhere.</p></div></div><button data-modern-close aria-label="Close">×</button></header><div class="modern-source-list"><article class="modern-feature-failure" role="alert"><b>Feature unavailable right now</b><p>The feature module did not respond. Your current BibleQuest screen and saved progress were not discarded.</p><div class="actions"><button class="primary" data-feature-retry>Try again</button><button class="secondary" data-modern-close>Close</button></div></article></div>`;
    host.querySelector('[data-feature-retry]')?.addEventListener('click',()=>{
      closeSheet();
      setTimeout(()=>retry?.(),0);
    });
    el.classList.remove('hidden');
    document.body.classList.add('modern-sheet-open');
    return false;
  }

  function runFeature(label,action,retry){
    closeSheet();
    try{
      const result=action();
      if(result&&typeof result.then==='function')result.catch(()=>featureFailure(label,retry));
      return true;
    }catch(_err){
      return featureFailure(label,retry);
    }
  }

  function trigger(selector,label='This feature'){
    closeSheet();
    const el=document.querySelector(selector);
    if(el){
      try{el.click();return true}catch(_err){return featureFailure(label,()=>trigger(selector,label))}
    }
    return featureFailure(label,()=>trigger(selector,label));
  }

  function openApi(label,getApi,method='open'){
    const retry=()=>openApi(label,getApi,method);
    let api;
    try{api=getApi()}catch(_err){return featureFailure(label,retry)}
    const fn=api?.[method];
    if(typeof fn!=='function')return featureFailure(label,retry);
    return runFeature(label,()=>fn.call(api),retry);
  }

  const hubs={
    play:{icon:'🎮',title:'Play',sub:'Games & challenges',items:[
      ['⚡','Daily 5','Balanced 2–3 minute session',()=>trigger('[data-action="daily"]','Daily 5')],
      ['🧠','Smart Review','Balikan ang weak at due questions',()=>trigger('[data-open-review]','Smart Review')],
      ['🎯','Quick Play','10 mixed questions',()=>trigger('[data-action="quick"]','Quick Play')],
      ['🗣️','Who Said It?','Guess the speaker from a real BSB verse',()=>trigger('[data-who-said]','Who Said It?')],
      ['➡️','What Happens Next?','Story sequence from Open Bible Stories',()=>trigger('[data-story-next]','What Happens Next?')],
      ['🧩','Verse Order','Ayusin ang tunay na verse sequence',()=>trigger('[data-sequence-open]','Verse Order')],
      ['🕵️','Bible Detective','Guess from clues',()=>trigger('[data-action="detective"]','Bible Detective')],
      ['🧭','Characters & Places','Who Am I, Where Is It, and Scripture connections',()=>openApi('Characters & Places',()=>window.BQExplorer)],
      ['⏳','Timeline','Put Bible events in order',()=>trigger('[data-action="timeline"]','Timeline')],
      ['🧠','Context Mode','Understand why, not just who',()=>trigger('[data-action="context"]','Context Mode')]
    ]},
    read:{icon:'📖',title:'Read',sub:'Bible, context & notes',items:[
      ['📚','Bible Reader','BSB · Tagalog ULB · NLT',()=>trigger('[data-reader-open]','Bible Reader')],
      ['📘','Guided Study','Read → Observe → Understand → Discuss → Apply → Pray',()=>openApi('Guided Study',()=>window.BQStudy)],
      ['אΩ','Hebrew & Greek Context','Lemma, transliteration, morphology, brief gloss, and careful context',()=>openApi('Hebrew & Greek Context',()=>window.BQContextLab)],
      ['🗂️','Bible Workspace','Cloud highlights, bookmarks, notes, and search',()=>openApi('Bible Workspace',()=>window.BQWorkspace)],
      ['🏕️','Story Journey','50 illustrated foundational stories',()=>trigger('[data-storyjourney-open]','Story Journey')],
      ['🗃️','Recall Decks','Open questions by Bible book',()=>trigger('[data-action="decks"]','Recall Decks')],
      ['🔁','Review Mistakes','Core questions you missed',()=>trigger('[data-action="review"]','Review Mistakes')]
    ]},
    grow:{icon:'🌱',title:'Grow',sub:'Mission, rewards & journey',items:[
      ['🎯','My Mission','A focused ~6 minute next step based on your learning',()=>openApi('My Mission',()=>window.BQMission)],
      ['🗺️','Bible World','Travel through the biblical story with your avatar',()=>openApi('Bible World',()=>window.BQWorld)],
      ['🎁','Avatar Vault','Unlock special looks by completing real BibleQuest milestones',()=>openApi('Avatar Vault',()=>window.BQAvatarVault)],
      ['🧭','Situations & Wisdom','Real-life decisions through biblical principles',()=>trigger('[data-action="situation"]','Situations & Wisdom')],
      ['🧬','Transformation','Personality, bias lab, and Growth Lab',()=>openApi('Transformation',()=>window.BQ_TRANSFORMATION)],
      ['💭','Think Deeper','Faith, motives, planning and forgiveness',()=>trigger('[data-route="discuss"]','Think Deeper')],
      ['🎖️','My Achievements','Badges across learning, wisdom, reading and consistency',()=>openApi('My Achievements',()=>window.BQCommunity,'openBadges')]
    ]},
    together:{icon:'👥',title:'Together',sub:'Tasks, live rooms & couples',items:[
      ['📮','Assignments & Tasks','Pastor/leader activities, due dates, submissions, and completion',()=>openApi('Assignments & Tasks',()=>window.BQAssignments)],
      ['🟢','Community Live','See who is online and recent public congregation activity',()=>openApi('Community Live',()=>window.BQPresence)],
      ['📡','Live BibleQuest Room','One code · many phones · live quiz, poll, hunt or discussion',()=>openApi('Live BibleQuest Room',()=>window.BQLiveRooms)],
      ['🎮','Play Together','Pass-the-phone team games and conversation circles',()=>openApi('Play Together',()=>window.BQGroupPlay)],
      ['🏁','Church Challenges','7-day, 30-day, Acts, family and couples challenges',()=>openApi('Church Challenges',()=>window.BQChallenges)],
      ['💞','Couple Journey','Link two accounts for a private shared growth journey',()=>openApi('Couple Journey',()=>window.BQCoupleCloud)],
      ['❤️','Grow Together','Christ-centered couples conversations and repair tools',()=>trigger('[data-couples-open]','Grow Together')],
      ['🏆','Leaderboards & Awards','Today · this week · all time · multiple fields',()=>openApi('Leaderboards & Awards',()=>window.BQCommunity,'openBoard')],
      ['🎖️','Congregation Badges','Achievement paths across BibleQuest',()=>openApi('Congregation Badges',()=>window.BQCommunity,'openBadges')],
      ['👥','Congregation Roster','Cloud members, roles and congregation identity',()=>openApi('Congregation Roster',()=>window.BQCommunity,'openRoster')]
    ]}
  };

  function sheet(){
    let el=document.getElementById('bqModernSheet');
    if(!el){
      el=document.createElement('div');
      el.id='bqModernSheet';
      el.className='modern-sheet hidden';
      el.innerHTML='<div class="modern-sheet-scrim" data-modern-close></div><section class="modern-sheet-panel"><div class="modern-sheet-handle"></div><div id="modernSheetContent"></div></section>';
      document.body.appendChild(el);
      el.addEventListener('click',e=>{if(e.target.closest('[data-modern-close]'))closeSheet()});
    }
    return el;
  }
  function closeSheet(){const el=sheet();el.classList.add('hidden');document.body.classList.remove('modern-sheet-open')}
  function openHub(key){
    const hub=hubs[key];if(!hub)return;
    const el=sheet(),host=el.querySelector('#modernSheetContent');
    host.innerHTML=`<header class="modern-sheet-head"><div><span>${hub.icon}</span><div><small>BIBLEQUEST</small><h2>${hub.title}</h2><p>${hub.sub}</p></div></div><button data-modern-close aria-label="Close">×</button></header><div class="modern-sheet-list">${hub.items.map((x,i)=>`<button data-modern-item="${key}:${i}"><span>${x[0]}</span><div><b>${esc(x[1])}</b><small>${esc(x[2])}</small></div><i>›</i></button>`).join('')}</div>`;
    host.querySelectorAll('[data-modern-item]').forEach(b=>{b.onclick=()=>{const [k,i]=b.dataset.modernItem.split(':');hubs[k].items[+i][3]()}});
    el.classList.remove('hidden');document.body.classList.add('modern-sheet-open');
  }

  function sourceSheet(){
    const el=sheet(),host=el.querySelector('#modernSheetContent');
    host.innerHTML=`<header class="modern-sheet-head"><div><span>ℹ️</span><div><small>TRANSPARENT SOURCES</small><h2>Bible versions & sources</h2><p>Alam mo kung saan galing ang Scripture at study content.</p></div></div><button data-modern-close aria-label="Close">×</button></header><div class="modern-source-list"><article><b>BSB · Berean Standard Bible</b><p>Main English Bible text. Inside BibleQuest as on-demand book packs; offline after first load.</p></article><article><b>TGL · banal na Bibliya / Tagalog ULB</b><p>Tagalog Scripture text. Door43 World Missions Community · CC BY-SA 4.0 · on-demand book packs.</p></article><article><b>NLT · New Living Translation</b><p>Main connected English option. Loads inside BibleQuest through Tyndale’s official API; internet required.</p></article><article><b>STEPBible TBESH / TBESG</b><p>Hebrew and Greek lemma, transliteration, morphology and brief gloss used by Context Lab · STEP Bible / Tyndale House Cambridge · CC BY 4.0.</p></article><article><b>unfoldingWord Translation Questions v90</b><p>Open recall questions/reference answers · CC BY-SA 4.0.</p></article><article><b>Open Bible Stories</b><p>Illustrated Bible-story retelling · CC BY-SA 4.0. Hindi Bible translation.</p></article></div>`;
    el.classList.remove('hidden');document.body.classList.add('modern-sheet-open');
  }

  function render(){
    const hero=document.querySelector('.hero');
    const stats=document.querySelector('.quick-stats');
    if(!hero||!stats){
      document.body.classList.remove('bq-modern-home');
      document.querySelector('.modern-home')?.remove();
      lastSignature='';
      return;
    }
    document.body.classList.add('bq-modern-home');
    let host=document.querySelector('.modern-home');
    const isNew=!host;
    if(!host){host=document.createElement('section');host.className='modern-home';stats.after(host)}
    const s=state(),isDone=s.dailyDone===today(),review=due(),rawName=s.profile?.name||'',name=rawName?`, ${esc(rawName)}`:'';
    const signature=[isDone,review,rawName,s.xp||0,s.answered||0].join('|');
    if(!isNew&&signature===lastSignature)return;
    lastSignature=signature;
    host.innerHTML=`
      <section class="modern-focus">
        <button class="modern-daily ${isDone?'done':''}" data-modern-daily>
          <div class="modern-focus-icon">${isDone?'✓':'⚡'}</div>
          <div><small>${isDone?'TODAY COMPLETE':'TODAY · 2–3 MIN'}</small><h2>${isDone?'Nice work'+name+'.':'Daily 5'+name}</h2><p>${isDone?'Balik ka bukas, or play another mode.':'Isang balanced session para tuloy-tuloy ang Bible learning.'}</p></div><i>›</i>
        </button>
        <button class="modern-review" data-modern-review><span>🧠</span><div><b>${review?review+' due':'Smart Review'}</b><small>${review?'Ready for review':'Adaptive recall'}</small></div></button>
      </section>
      <div class="modern-label"><span>Explore</span><small>Pili ka lang ng gusto mong gawin.</small></div>
      <section class="modern-hubs">
        ${Object.entries(hubs).map(([k,h])=>`<button class="modern-hub ${k}" data-modern-hub="${k}"><span>${h.icon}</span><div><b>${h.title}</b><small>${h.sub}</small></div><i>›</i></button>`).join('')}
      </section>
      <section class="modern-footer-row"><button data-modern-sources>ℹ️ Sources & Bible versions</button><span>Cloud account · private notes · congregation sync</span></section>`;
    host.querySelector('[data-modern-daily]').onclick=()=>trigger('[data-action="daily"]','Daily 5');
    host.querySelector('[data-modern-review]').onclick=()=>trigger('[data-open-review]','Smart Review');
    host.querySelectorAll('[data-modern-hub]').forEach(b=>b.onclick=()=>openHub(b.dataset.modernHub));
    host.querySelector('[data-modern-sources]').onclick=sourceSheet;
    window.dispatchEvent(new CustomEvent('bq-modern-home-rendered'));
  }

  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;render()})}
  const obs=new MutationObserver(schedule);obs.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',schedule);setTimeout(schedule,250);
  window.BQModernHome={render,openHub};
})();