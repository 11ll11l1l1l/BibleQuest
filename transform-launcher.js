(() => {
  'use strict';
  const TARGET='./transform.html';
  const RETURN_KEY='bq_transform_return_action';

  function isTransformEntry(target){
    const item=target?.closest?.('[data-modern-item]');
    if(!item)return false;
    return item.querySelector('b')?.textContent?.trim()==='Transformation';
  }

  function openStandalone(){
    document.getElementById('bqModernSheet')?.classList.add('hidden');
    document.body.classList.remove('modern-sheet-open');
    location.assign(new URL(TARGET,location.href).href);
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
    if(!target||!isTransformEntry(target))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    openStandalone();
  },true);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',takePending,{once:true});
  else takePending();

  window.BQTransformLauncher={url:()=>new URL(TARGET,location.href).href,open:openStandalone};
})();
