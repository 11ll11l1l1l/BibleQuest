(() => {
  let lastFocus=null,wasOpen=false,queued=false;
  const visible=el=>Boolean(el&&!el.classList.contains('hidden')&&el.getClientRects().length);
  const focusables=el=>[...el.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(visible);

  function labelPath(root=document){
    root.querySelectorAll('.journey-path-scroll').forEach(strip=>{
      const nodes=[...strip.querySelectorAll('.journey-node')];
      nodes.forEach(node=>{
        const name=node.querySelector('b')?.textContent?.trim()||'Bible Journey marker';
        const progress=node.querySelector('small')?.textContent?.trim()||'';
        const current=node.classList.contains('current');
        if(current)node.setAttribute('aria-current','step');else node.removeAttribute('aria-current');
        node.setAttribute('aria-label',`${name}${progress?`, ${progress} explored`:''}${current?', current next path marker':''}`);
      });
      if(!strip.getAttribute('aria-label'))strip.setAttribute('aria-label','Bible Journey progression path');
    });
  }

  function labelLegacyDailyFallback(root=document){
    if(typeof window.BQJourneyLoop?.open!=='function')return;
    root.querySelectorAll('.quest-card.daily[data-action="daily"]').forEach(card=>{
      const kicker=card.querySelector('.kicker'),title=card.querySelector('h3'),copy=card.querySelector('p');
      if(kicker)kicker.textContent='CONTINUE YOUR JOURNEY';
      if(title)title.textContent='Daily Journey';
      if(copy)copy.textContent='Recall → context → learn → apply → reflect.';
      card.setAttribute('aria-label','Continue My Journey. Five steps: recall, context, learn, apply, reflect.');
    });
  }

  function enhanceLayer(){
    const layer=document.getElementById('bqJourneyLoop');
    const open=visible(layer);
    if(!layer){wasOpen=false;return}
    layer.setAttribute('role','dialog');
    layer.setAttribute('aria-modal','true');
    layer.setAttribute('aria-label','Daily Journey');
    if(open&&!wasOpen){
      lastFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
      requestAnimationFrame(()=>{
        const preferred=layer.querySelector('[data-journey-close]')||focusables(layer)[0];
        preferred?.focus?.({preventScroll:true});
      });
    } else if(!open&&wasOpen&&lastFocus?.isConnected){
      lastFocus.focus?.({preventScroll:true});
      lastFocus=null;
    }
    wasOpen=open;
  }

  function showWorldRecovery(){
    const card=document.querySelector('.journey-path-card');
    if(!card)return false;
    let status=card.querySelector('.journey-world-recovery');
    if(!status){
      status=document.createElement('p');
      status.className='journey-world-recovery';
      status.setAttribute('role','status');
      status.textContent='Bible World is unavailable right now. Your Journey Path is still here; Continue My Journey for the next step.';
      card.appendChild(status);
    }
    card.scrollIntoView?.({block:'center',behavior:'smooth'});
    const current=card.querySelector('.journey-node.current')||card.querySelector('.journey-node');
    current?.focus?.({preventScroll:true});
    return true;
  }

  function recoverWorldEntry(e){
    const trigger=e.target?.closest?.('[data-journey-world],[data-reveal-context]');
    if(!trigger||typeof window.BQWorld?.open==='function')return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if(trigger.matches('[data-reveal-context]')){
      const layer=document.getElementById('bqJourneyLoop');
      const close=layer?.querySelector('[data-journey-close]');
      if(close){close.click();requestAnimationFrame(showWorldRecovery);return}
    }
    showWorldRecovery();
  }

  function recoverLegacyDailyEntry(e){
    const trigger=e.target?.closest?.('.quest-card.daily[data-action="daily"]');
    if(!trigger||typeof window.BQJourneyLoop?.open!=='function')return;
    e.preventDefault();
    e.stopImmediatePropagation();
    window.BQJourneyLoop.open();
  }

  function refresh(){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;labelPath();labelLegacyDailyFallback();enhanceLayer()});
  }

  document.addEventListener('click',recoverWorldEntry,true);
  document.addEventListener('click',recoverLegacyDailyEntry,true);
  document.addEventListener('keydown',e=>{
    const layer=document.getElementById('bqJourneyLoop');
    if(!visible(layer)||!layer.contains(e.target))return;
    if(e.key==='Escape'){
      const close=layer.querySelector('[data-journey-close]');
      if(close){e.preventDefault();close.click()}
      return;
    }
    if(e.key!=='Tab')return;
    const items=focusables(layer);if(!items.length)return;
    const first=items[0],last=items[items.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  });

  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('bq-modern-home-rendered',refresh);
  document.addEventListener('DOMContentLoaded',refresh);
  refresh();
})();
