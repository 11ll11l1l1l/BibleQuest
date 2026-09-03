(() => {
  const APP='biblequest_state_v4';
  let scheduled=false;

  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function state(){try{return JSON.parse(localStorage.getItem(APP)||'{}')}catch{return {}}}
  function today(){return new Date().toISOString().slice(0,10)}
  function due(){try{return window.BQOpenReview?.countDue?.()||0}catch{return 0}}

  function trigger(selector,fn){
    closeSheet();
    const el=document.querySelector(selector);
    if(el){el.click();return true}
    if(fn){fn();return true}
    return false;
  }

  const hubs={
    play:{icon:'🎮',title:'Play',sub:'Games & challenges',items:[
      ['⚡','Daily 5','Balanced 2–3 minute session',()=>trigger('[data-action="daily"]')],
      ['🧠','Smart Review','Balikan ang weak at due questions',()=>trigger('[data-open-review]')],
      ['🎯','Quick Play','10 mixed questions',()=>trigger('[data-action="quick"]')],
      ['🗣️','Who Said It?','Guess the speaker from a real BSB verse',()=>trigger('[data-who-said]')],
      ['➡️','What Happens Next?','Story sequence from Open Bible Stories',()=>trigger('[data-story-next]')],
      ['🧩','Verse Order','Ayusin ang tunay na verse sequence',()=>trigger('[data-sequence-open]')],
      ['🕵️','Bible Detective','Guess from clues',()=>trigger('[data-action="detective"]')],
      ['⏳','Timeline','Put Bible events in order',()=>trigger('[data-action="timeline"]')],
      ['🧠','Context Mode','Understand why, not just who',()=>trigger('[data-action="context"]')]
    ]},
    read:{icon:'📖',title:'Read',sub:'Bible & story library',items:[
      ['📚','Bible Reader','English BSB · one book at a time',()=>trigger('[data-reader-open]')],
      ['🏕️','Story Journey','50 illustrated foundational stories',()=>trigger('[data-storyjourney-open]')],
      ['🗃️','Recall Decks','Open questions by Bible book',()=>trigger('[data-action="decks"]')],
      ['🔁','Review Mistakes','Core questions you missed',()=>trigger('[data-action="review"]')]
    ]},
    grow:{icon:'🌱',title:'Grow',sub:'Wisdom & self-awareness',items:[
      ['🧭','Situations & Wisdom','Real-life decisions through biblical principles',()=>trigger('[data-action="situation"]')],
      ['🧬','Transformation','Personality, bias lab, and Growth Lab',()=>{closeSheet();window.BQ_TRANSFORMATION?.open?.()}],
      ['💭','Think Deeper','Faith, motives, planning and forgiveness',()=>trigger('[data-route="discuss"]')],
      ['🗺️','Journey','See Bible learning progress',()=>trigger('[data-route="journey"]')]
    ]},
    together:{icon:'💞',title:'Together',sub:'Couples & shared growth',items:[
      ['💞','Grow Together','Christ-centered couples conversations',()=>trigger('[data-couples-open]')],
      ['👂','Listen First','Practice understanding before replying',()=>{trigger('[data-couples-open]');setTimeout(()=>document.querySelector('[data-couple-mode="listen"]')?.click(),120)}],
      ['🕊️','Repair Room','A guided ordinary-conflict repair flow',()=>{trigger('[data-couples-open]');setTimeout(()=>document.querySelector('[data-couple-mode="repair"]')?.click(),120)}],
      ['✝️','Us & God','Questions for growing with Christ together',()=>{trigger('[data-couples-open]');setTimeout(()=>document.querySelector('[data-couple-category="christ"]')?.click(),120)}]
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
    host.innerHTML=`<header class="modern-sheet-head"><div><span>ℹ️</span><div><small>TRANSPARENT SOURCES</small><h2>Sources</h2><p>Alam mo kung saan galing ang content.</p></div></div><button data-modern-close aria-label="Close">×</button></header><div class="modern-source-list"><article><b>BSB · Berean Standard Bible</b><p>English Bible text sa Reader at verse-text games.</p></article><article><b>unfoldingWord Translation Questions v90</b><p>Open recall questions/reference answers · CC BY-SA 4.0.</p></article><article><b>Open Bible Stories</b><p>Illustrated Bible-story retelling · CC BY-SA 4.0. Hindi Bible translation.</p></article></div>`;
    el.classList.remove('hidden');document.body.classList.add('modern-sheet-open');
  }

  function render(){
    const hero=document.querySelector('.hero');
    const stats=document.querySelector('.quick-stats');
    if(!hero||!stats){document.body.classList.remove('bq-modern-home');document.querySelector('.modern-home')?.remove();return}
    document.body.classList.add('bq-modern-home');
    let host=document.querySelector('.modern-home');
    if(!host){host=document.createElement('section');host.className='modern-home';stats.after(host)}
    const s=state(),isDone=s.dailyDone===today(),review=due(),name=s.profile?.name?`, ${esc(s.profile.name)}`:'';
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
      <section class="modern-footer-row"><button data-modern-sources>ℹ️ Sources & Bible version</button><span>Local-first · no account needed</span></section>`;
    host.querySelector('[data-modern-daily]').onclick=()=>trigger('[data-action="daily"]');
    host.querySelector('[data-modern-review]').onclick=()=>trigger('[data-open-review]');
    host.querySelectorAll('[data-modern-hub]').forEach(b=>b.onclick=()=>openHub(b.dataset.modernHub));
    host.querySelector('[data-modern-sources]').onclick=sourceSheet;
  }

  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;render()})}
  const obs=new MutationObserver(schedule);obs.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',schedule);setTimeout(schedule,250);
  window.BQModernHome={render,openHub};
})();