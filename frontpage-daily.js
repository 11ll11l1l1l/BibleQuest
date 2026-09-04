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
      body.bq-frontpage-focus .app>.hero{display:none!important}
      body.bq-frontpage-focus .app>.quick-stats{display:none!important}
      body.bq-frontpage-focus .modern-home>.bq-pinoy-hero{display:none!important}
      body.bq-frontpage-focus .modern-home>.modern-focus{display:none!important}
      body.bq-frontpage-focus .modern-home{margin-top:4px}
      body.bq-frontpage-focus .bq-engagement-stack{margin-top:0}
      body.bq-frontpage-focus .today-journey-card{order:-20}
      body.bq-frontpage-focus .journey-path-card{order:-10}
      body.bq-frontpage-focus .journey-season,
      body.bq-frontpage-focus .journey-season-empty{order:-5}
    `;
    document.head.appendChild(s);
  }

  let queued=false;
  function refresh(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;focusHome()});
  }

  const observer=new MutationObserver(refresh);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  injectStyles();
  refresh();
  setTimeout(refresh,700);
  setTimeout(refresh,1800);
  window.BQFrontDaily={openPrompt,refresh};
})();
