(() => {
  const MESSAGE='Transform is temporarily unavailable while we rebuild it for Android stability. The rest of BibleQuest is available.';
  let notice=null;

  function closeNotice(){notice?.remove();notice=null}
  function showNotice(){
    closeNotice();
    notice=document.createElement('section');
    notice.className='bq-transform-quarantine';
    notice.setAttribute('role','status');
    notice.innerHTML=`<div><b>Transform temporarily offline</b><p>${MESSAGE}</p><div><button type="button" data-tq-wisdom>Open Situations & Wisdom</button><button type="button" data-tq-close>Close</button></div></div>`;
    document.body.appendChild(notice);
    notice.querySelector('[data-tq-close]').onclick=closeNotice;
    notice.querySelector('[data-tq-wisdom]').onclick=()=>{closeNotice();document.querySelector('[data-action="situation"]')?.click()};
  }

  function removeLegacyEntry(){
    document.querySelectorAll('[data-transform-tab]').forEach(el=>el.remove());
    const sheet=document.getElementById('bqModernSheet');
    sheet?.querySelectorAll('[data-modern-item]').forEach(btn=>{
      const label=btn.querySelector('b')?.textContent?.trim();
      if(label==='Transformation'){
        btn.dataset.transformQuarantined='1';
        const small=btn.querySelector('small');
        if(small)small.textContent='Temporarily offline for stability';
      }
    });
  }

  document.addEventListener('click',e=>{
    const target=e.target instanceof Element?e.target:null;
    if(!target)return;
    const transformTab=target.closest('[data-transform-tab]');
    const item=target.closest('[data-modern-item]');
    const isTransformItem=item?.querySelector('b')?.textContent?.trim()==='Transformation';
    if(transformTab||isTransformItem){
      e.preventDefault();
      e.stopImmediatePropagation();
      showNotice();
      return;
    }
    if(target.closest('[data-modern-hub="grow"]'))setTimeout(removeLegacyEntry,0);
  },true);

  document.addEventListener('DOMContentLoaded',removeLegacyEntry);
  window.addEventListener('bq-modern-home-rendered',removeLegacyEntry);
  setTimeout(removeLegacyEntry,0);
  setTimeout(removeLegacyEntry,300);

  // Deliberately no Transform runtime is exposed in production while quarantined.
  try{delete window.BQ_TRANSFORMATION}catch{window.BQ_TRANSFORMATION=undefined}
  window.BQTransformQuarantine={active:true,show:showNotice,refresh:removeLegacyEntry};
})();
