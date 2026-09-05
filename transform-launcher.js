(() => {
  'use strict';
  const TARGET='./transform.html';
  const PSYCH_TARGET='./psychometrics.html';
  const RETURN_KEY='bq_transform_return_action';

  function isTransformEntry(target){
    const item=target?.closest?.('[data-modern-item]');
    if(!item)return false;
    return item.querySelector('b')?.textContent?.trim()==='Transformation';
  }

  function closeSheet(){
    document.getElementById('bqModernSheet')?.classList.add('hidden');
    document.body.classList.remove('modern-sheet-open');
  }

  function openStandalone(){
    closeSheet();
    location.assign(new URL(TARGET,location.href).href);
  }

  function openPsychometrics(){
    closeSheet();
    location.assign(new URL(PSYCH_TARGET,location.href).href);
  }

  function backToGrow(){
    if(typeof window.BQModernHome?.openHub==='function')window.BQModernHome.openHub('grow');
    else closeSheet();
  }

  function openTransformMenu(){
    const sheet=document.getElementById('bqModernSheet');
    const host=sheet?.querySelector('#modernSheetContent');
    if(!sheet||!host){openStandalone();return;}
    host.innerHTML='<header class="modern-sheet-head"><div><span>🪞</span><div><small>GROW</small><h2>Transformation</h2><p>Understand patterns you may not notice in yourself, then decide what deserves attention or change.</p></div></div><button data-bq-transform-back aria-label="Back">‹</button></header><div class="modern-sheet-list"><button data-bq-transform-quick><span>🌱</span><div><b>Quick Transform</b><small>20-item personality · thinking patterns · reflection · action plan</small></div><i>›</i></button><button data-bq-transform-psych><span>🔬</span><div><b>Psychometrics Lab</b><small>120-item personality · 30 facets · 24 strengths · self-esteem · raw results · deeper interpretation</small></div><i>›</i></button></div><div class="modern-source-list"><article><b>Purpose</b><p>These tools are for self-realization, not labeling or preaching. First see the measured tendency as clearly as possible. Then examine how it actually shows up in your habits, relationships, decisions, triggers, strengths and blind spots. For Christian users, Scripture is provided afterward as a reflection lens—not as part of the score.</p></article></div>';
    sheet.classList.remove('hidden');
    document.body.classList.add('modern-sheet-open');
  }

  function takePending(){
    let action='';
    try{action=sessionStorage.getItem(RETURN_KEY)||'';if(action)sessionStorage.removeItem(RETURN_KEY)}catch(_e){}
    if(!action)return;
    const selector=action==='reader'?'[data-reader-open]':action==='wisdom'?'[data-action="situation"]':'';
    if(!selector)return;
    let tries=0;
    const attempt=()=>{
      const el=document.querySelector(selector);
      if(el){el.click();return}
      tries+=1;
      if(tries<8)setTimeout(attempt,200);
    };
    setTimeout(attempt,120);
  }

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target)return;
    if(target.closest('[data-bq-transform-quick]')){event.preventDefault();event.stopImmediatePropagation();openStandalone();return;}
    if(target.closest('[data-bq-transform-psych]')){event.preventDefault();event.stopImmediatePropagation();openPsychometrics();return;}
    if(target.closest('[data-bq-transform-back]')){event.preventDefault();event.stopImmediatePropagation();backToGrow();return;}
    if(!isTransformEntry(target))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openTransformMenu();
  },true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',takePending,{once:true});
  else takePending();

  window.BQ_TRANSFORMATION={open:openStandalone,menu:openTransformMenu,mode:'standalone-route',version:4};
  window.BQTransformLauncher={url:()=>new URL(TARGET,location.href).href,open:openStandalone,menu:openTransformMenu};
  window.BQPsychometrics={url:()=>new URL(PSYCH_TARGET,location.href).href,open:openPsychometrics};
})();