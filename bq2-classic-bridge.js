(()=>{'use strict';
function mount(){
  document.body.classList.add('bq-classic-compat');
  if(document.querySelector('.classic-return'))return;
  const a=document.createElement('a');
  a.className='classic-return';
  a.href='./#/features';
  a.textContent='← Rebuilt BibleQuest';
  a.setAttribute('aria-label','Return to rebuilt BibleQuest feature hub');
  document.body.appendChild(a);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
