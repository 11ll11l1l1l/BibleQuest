(() => {
  'use strict';
  const TARGET='./transform.html';

  function isTransformEntry(target){
    const item=target?.closest?.('[data-modern-item]');
    if(!item)return false;
    return item.querySelector('b')?.textContent?.trim()==='Transformation';
  }

  document.addEventListener('click',event=>{
    const target=event.target instanceof Element?event.target:null;
    if(!target||!isTransformEntry(target))return;
    event.preventDefault();
    event.stopImmediatePropagation();
    document.getElementById('bqModernSheet')?.classList.add('hidden');
    document.body.classList.remove('modern-sheet-open');
    location.assign(new URL(TARGET,location.href).href);
  },true);

  window.BQTransformLauncher={url:()=>new URL(TARGET,location.href).href};
})();
