(() => {
  // Keep the Daily Journey as the first, obvious action on Home. Personal focus remains
  // available through the Journey card's secondary "What are you carrying today?" action.
  // This file intentionally does not auto-open a chooser on first visit: that prompt added
  // choice friction before the user's core daily task and duplicated JourneyLoop.openSupport().
  function focusHome(){
    const home=document.querySelector('.modern-home');
    if(!home)return false;
    document.body.classList.add('bq-frontpage-focus','bq-engagement-home');
    const stack=home.querySelector('.bq-engagement-stack');
    if(stack&&home.firstElementChild!==stack)home.insertBefore(stack,home.firstElementChild);
    return Boolean(stack?.querySelector('.today-journey-card'));
  }

  function showJourneyError(){
    const card=document.querySelector('.today-journey-card');
    if(!card)return false;
    let note=card.querySelector('[data-journey-open-error]');
    if(!note){
      note=document.createElement('p');
      note.dataset.journeyOpenError='true';
      note.setAttribute('role','alert');
      note.textContent='Daily Journey could not open. Please try Continue My Journey again.';
      card.appendChild(note);
    }
    note.hidden=false;
    return false;
  }

  // Compatibility daily entry points must converge on the five-step Daily Journey rather
  // than reopening the retired Daily 5 game. The visible primary Journey button remains a
  // safe fallback if another script initialized before the Journey API was exposed.
  function openDailyJourney(){
    focusHome();
    if(typeof window.BQJourneyLoop?.open==='function'){
      window.BQJourneyLoop.open();
      return true;
    }
    const primary=document.querySelector('.today-journey-card .journey-primary');
    if(primary){
      primary.click();
      return true;
    }
    return showJourneyError();
  }

  function consolidateLegacyDailyCopy(){
    const legacyFocus=document.querySelector('[data-modern-daily]');
    if(legacyFocus){
      const title=legacyFocus.querySelector('h2');
      const copy=legacyFocus.querySelector('p');
      if(title&&!/Nice work/i.test(title.textContent||'')&&title.textContent!=='Continue My Journey')title.textContent='Continue My Journey';
      if(copy&&!/Balik ka bukas/i.test(copy.textContent||'')&&copy.textContent!=='Recall → context → learn → apply → reflect.')copy.textContent='Recall → context → learn → apply → reflect.';
    }
    const legacyPlay=document.querySelector('[data-modern-item="play:0"]');
    if(legacyPlay){
      const title=legacyPlay.querySelector('b');
      const copy=legacyPlay.querySelector('small');
      if(title&&title.textContent!=='Daily Journey')title.textContent='Daily Journey';
      if(copy&&copy.textContent!=='Recall → context → learn → apply → reflect')copy.textContent='Recall → context → learn → apply → reflect';
    }
  }

  // Backward-compatible entry point for any old caller. Route it to the existing opt-in
  // support/focus surface instead of restoring the obsolete blocking modal.
  function openPrompt(){
    focusHome();
    window.BQJourneyLoop?.openSupport?.();
  }

  function injectStyles(){
    if(document.getElementById('frontDailyStyles'))return;
    const s=document.createElement('style');
    s.id='frontDailyStyles';
    s.textContent=`
      body.bq-frontpage-focus #app>.app>.hero{display:none!important}
      body.bq-frontpage-focus #app>.app>.quick-stats{display:none!important}
      body.bq-frontpage-focus .modern-home>.bq-pinoy-hero{display:none!important}
      body.bq-frontpage-focus .modern-home>.modern-focus{display:none!important}
      body.bq-frontpage-focus .modern-home{margin-top:2px}
      body.bq-frontpage-focus .bq-engagement-stack{margin-top:0}
      body.bq-frontpage-focus .today-journey-card{order:-40}
      body.bq-frontpage-focus .journey-path-card{order:-30}
      body.bq-frontpage-focus .journey-season,
      body.bq-frontpage-focus .journey-season-empty{order:-20}
      body.bq-frontpage-focus .journey-mini-row{order:-10}
    `;
    document.head.appendChild(s);
  }

  let queued=false;
  function refresh(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      focusHome();
      consolidateLegacyDailyCopy();
    });
  }

  // Capture only the two known modern compatibility daily controls. Their original onclick
  // handlers launch the legacy Daily 5 game, so stop that handler and open JourneyLoop instead.
  document.addEventListener('click',e=>{
    const legacyDaily=e.target.closest?.('[data-modern-daily],[data-modern-item="play:0"]');
    if(!legacyDaily)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openDailyJourney();
  },true);

  const observer=new MutationObserver(refresh);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  window.addEventListener('bq-modern-home-rendered',refresh);
  injectStyles();
  refresh();
  setTimeout(refresh,700);
  setTimeout(refresh,1800);
  window.BQFrontDaily={openPrompt,openDailyJourney,refresh};
})();
