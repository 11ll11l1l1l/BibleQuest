(() => {
  const APP='biblequest_state_v4';
  const localDay=(d=new Date())=>{
    const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);
    return x.toISOString().slice(0,10);
  };
  const read=(key,f={})=>{try{return {...f,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return {...f}}};
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let scanQueued=false;

  function injectRecoveryLink(){
    const form=document.querySelector('#bqAccountLayer:not(.hidden) [data-account-login]');
    if(!form||form.querySelector('.bq-recovery-link,a[href*="reset.html"]'))return;
    const a=document.createElement('a');
    a.className='bq-recovery-link';
    a.href='./reset.html';
    a.textContent='Forgot password?';
    form.appendChild(a);
  }

  function alignPasswordFields(){
    document.querySelectorAll('[data-account-register] input[name="password"], [data-account-register] input[name="confirm_password"], [data-account-password] input[name="new_password"], [data-account-password] input[name="confirm_password"], .bq-recovery-card input[name="new_password"], .bq-recovery-card input[name="confirm_password"]').forEach(input=>{
      input.minLength=8;
      if(input.name==='password'&&input.closest('[data-account-register]'))input.placeholder='At least 8 characters';
    });
  }

  function journeyState(){
    const e=window.BQJourneyLoop?.read?.();
    const t=e?.daily?.[localDay()]||null;
    return {e,t,done:t?Object.keys(t.done||{}).length:0,total:t?.tasks?.length||5};
  }

  function nextRegion(){
    const s=read(APP,{mastery:{}});
    const m=s.mastery||{};
    const stages=[
      ['🌍','Creation','Genesis',Math.min(100,(Number(m.Genesis)||0)*2)],
      ['🏕️','Patriarchs','Genesis',Math.max(0,Math.min(100,((Number(m.Genesis)||0)-50)*2))],
      ['🌊','Exodus','Exodus',Number(m.Exodus)||0],
      ['🏰','Kingdom','History',Number(m.History)||0],
      ['🎵','Wisdom','Wisdom',Number(m.Wisdom)||0],
      ['📜','Prophets','Prophets',Number(m.Prophets)||0],
      ['✝️','Jesus','Gospels',Number(m.Gospels)||0],
      ['🔥','Early Church','Acts',Number(m.Acts)||0],
      ['✉️','Letters','Letters',Number(m.Letters)||0]
    ];
    return stages.find(x=>x[3]<60)||stages[stages.length-1];
  }

  function enhanceHome(){
    const card=document.querySelector('.today-journey-card');
    if(!card||card.querySelector('.bq-next-unlock'))return;
    const n=nextRegion();
    const el=document.createElement('div');
    el.className='bq-next-unlock';
    el.innerHTML=`<span>${n[0]}</span><div><b>Next world marker: ${esc(n[1])}</b><small>${Math.round(n[3])}% explored · Daily Journey evidence clears the path.</small></div>`;
    card.querySelector('.today-step-dots')?.insertAdjacentElement('afterend',el);
  }

  function enhanceWorld(){
    const layer=document.getElementById('bqWorldLayer');
    if(!layer||layer.classList.contains('hidden'))return;
    const map=layer.querySelector('.world-map');
    if(!map)return;
    const {t,done,total}=journeyState();
    if(!layer.querySelector('.bq-world-daily-bridge')){
      const bridge=document.createElement('section');
      bridge.className='bq-world-daily-bridge';
      bridge.innerHTML=`<div><small>TODAY MOVES THE MAP</small><b>${t?.completedAt?'Daily Journey complete':`${done}/${total} Daily Journey steps`}</b><p>${t?.completedAt?'Explore freely or review what you learned.':'Finish meaningful Bible activities to build the evidence that reveals your journey through Scripture.'}</p></div><button type="button" data-bq-world-journey>${t?.completedAt?'Review today':'Continue Journey'}</button>`;
      map.before(bridge);
      bridge.querySelector('[data-bq-world-journey]').onclick=()=>{
        layer.querySelector('[data-world-close]')?.click();
        setTimeout(()=>window.BQJourneyLoop?.open?.(),40);
      };
    }
    const buttons=[...map.querySelectorAll(':scope>button')];
    buttons.forEach(b=>b.classList.remove('bq-next-region'));
    const next=buttons.find(b=>{
      const text=b.querySelector('small')?.textContent||'';
      const pct=Number(text.match(/(\d+)%/)?.[1]||100);
      return pct<60;
    });
    next?.classList.add('bq-next-region');
  }

  function scan(){
    injectRecoveryLink();
    alignPasswordFields();
    enhanceHome();
    enhanceWorld();
  }
  function queueScan(){
    if(scanQueued)return;
    scanQueued=true;
    requestAnimationFrame(()=>{scanQueued=false;scan()});
  }
  new MutationObserver(queueScan).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('bq-journey-change',queueScan);
  window.addEventListener('bq-modern-home-rendered',queueScan);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueScan()});
  scan();
  setTimeout(scan,600);
  setTimeout(scan,1600);
  window.BQReleaseHardening={scan,appRoot:()=>window.BQ_CLOUD_CONFIG?.redirectUrl||new URL('./',location.href).href};
})();
