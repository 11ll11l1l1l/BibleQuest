(() => {
  // Keep Daily Journey as the first, obvious action on Home. Personal focus remains
  // available through the Journey card's secondary "What are you carrying today?" action.
  function focusHome(){
    const home=document.querySelector('.modern-home');
    if(!home)return false;
    document.body.classList.add('bq-frontpage-focus','bq-engagement-home');
    const stack=home.querySelector('.bq-engagement-stack');
    if(stack&&home.firstElementChild!==stack)home.insertBefore(stack,home.firstElementChild);
    return Boolean(stack?.querySelector('.today-journey-card'));
  }

  function showJourneyError(){
    window.BQRuntime?.report?.('frontpage','journey_open_failed',new Error('Daily Journey API unavailable'));
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

  function openDailyJourney(){
    focusHome();
    if(typeof window.BQJourneyLoop?.open==='function'){
      window.BQJourneyLoop.open();
      return true;
    }
    const primary=document.querySelector('.today-journey-card .journey-primary');
    if(primary){primary.click();return true}
    return showJourneyError();
  }

  // Backward-compatible entry point for callers that used the old first-visit prompt.
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
    requestAnimationFrame(()=>{queued=false;focusHome()});
  }

  const appRoot=document.getElementById('app');
  const observer=new MutationObserver(refresh);
  if(appRoot)observer.observe(appRoot,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  window.addEventListener('bq-modern-home-rendered',refresh);
  window.addEventListener('bq-journey-change',refresh);
  injectStyles();
  refresh();
  setTimeout(refresh,700);
  window.BQFrontDaily={openPrompt,openDailyJourney,refresh};
})();
