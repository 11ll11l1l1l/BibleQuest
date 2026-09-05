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

  function ensurePsychometricsEntry(){
    const sheet=document.getElementById('bqModernSheet');
    if(!sheet||sheet.classList.contains('hidden'))return;
    const list=sheet.querySelector('.modern-sheet-list');
    const title=sheet.querySelector('.modern-sheet-head h2')?.textContent?.trim();
    if(!list||title!=='Grow'||list.querySelector('[data-bq-psychometrics]'))return;
    const button=document.createElement('button');
    button.type='button';
    button.setAttribute('data-bq-psychometrics','1');
    button.innerHTML='<span>🔬</span><div><b>Psychometrics Lab</b><small>120-item personality · 24 strengths · self-esteem</small></div><i>›</i>';
    button.addEventListener('click',openPsychometrics);
    const transform=[...list.querySelectorAll('button')].find(x=>x.querySelector('b')?.textContent?.trim()==='Transformation');
    if(transform)transform.after(button);else list.appendChild(button);
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
    if(target.closest('[data-modern-hub="grow"]'))setTimeout(ensurePsychometricsEntry,0);
    if(!isTransformEntry(target))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openStandalone();
  },true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',takePending,{once:true});
  else takePending();

  // Fail-safe compatibility APIs keep standalone tools isolated from the main SPA.
  window.BQ_TRANSFORMATION={open:openStandalone,mode:'standalone-route',version:2};
  window.BQTransformLauncher={url:()=>new URL(TARGET,location.href).href,open:openStandalone};
  window.BQPsychometrics={url:()=>new URL(PSYCH_TARGET,location.href).href,open:openPsychometrics};
})();