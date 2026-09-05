(() => {
  'use strict';
  const preview=()=>Boolean(window.BQGuestAccess?.isPreview?.()),signed=()=>Boolean(window.BQAccount?.session?.());
  let wall=null,banner=null,queued=false;
  function allowed(el){
    if(!el)return true;
    if(el.closest('#bqAccountLayer,.account-layer'))return true;
    if(el.closest('.reader-layer,.reader-shell,[data-reader-root]'))return true;
    if(el.closest('#bqTutorialLayer,.tutorial-layer,.tutorial-shell,[data-tutorial-root]'))return true;
    if(el.closest('[data-account-open],[data-bq-preview-account],[data-modern-read],[data-reader-open],[data-open-reader],[data-tutorial-open],[data-tutorial-launch],[data-launch-tutorial],[data-route="home"],.brand,.brand-btn'))return true;
    const text=(el.textContent||'').trim();
    if(text.startsWith('←')||text==='×'||/\b(back|close|home)\b/i.test(el.className||''))return true;
    return false;
  }
  function ensureBanner(){if(banner)return banner;banner=document.createElement('div');banner.className='bq-preview-banner';banner.innerHTML='<span><b>Preview mode:</b> Bible Reader and Tutorial are available. Create an account to unlock the full BibleQuest journey.</span><button type="button">Create account / Sign in</button>';banner.querySelector('button').onclick=()=>window.BQGuestAccess?.openAccount?.();document.body.prepend(banner);return banner}
  function ensureWall(){if(wall)return wall;wall=document.createElement('div');wall.className='bq-preview-wall hidden';wall.innerHTML='<section class="bq-preview-card"><small>FULL BIBLEQUEST ACCOUNT REQUIRED</small><h2>Create an account to unlock this feature</h2><p>Journeys, games, saved progress, rankings, groups, assignments, polls, ministry messages, Transform, notes and community activity require a BibleQuest account.</p><div class="bq-preview-actions"><button type="button" class="bq-preview-create">Create / Sign in</button><button type="button" class="bq-preview-close">Continue preview</button></div></section>';wall.querySelector('.bq-preview-create').onclick=()=>{wall.classList.add('hidden');window.BQGuestAccess?.openAccount?.()};wall.querySelector('.bq-preview-close').onclick=()=>wall.classList.add('hidden');document.body.appendChild(wall);return wall}
  function showWall(){ensureWall().classList.remove('hidden')}
  function decorate(){queued=false;ensureBanner();document.body.classList.toggle('bq-preview-mode',preview()&&!signed());if(!preview()||signed()){document.querySelectorAll('.bq-preview-locked').forEach(x=>{x.classList.remove('bq-preview-locked');x.removeAttribute('aria-disabled')});return}document.querySelectorAll('#app button,#app a,.modern-home button,.modern-home a').forEach(el=>{if(allowed(el)){el.classList.remove('bq-preview-locked');el.removeAttribute('aria-disabled')}else{el.classList.add('bq-preview-locked');el.setAttribute('aria-disabled','true')}})}
  function schedule(){if(queued)return;queued=true;queueMicrotask(decorate)}
  document.addEventListener('click',e=>{if(!preview()||signed())return;const el=e.target.closest?.('button,a,[role="button"]');if(!el||allowed(el))return;e.preventDefault();e.stopImmediatePropagation();showWall()},true);
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('bq-preview-ready',schedule);window.addEventListener('bq-account-created',schedule);window.addEventListener('load',schedule,{once:true});queueMicrotask(schedule);
  window.BQPreviewAccess={refresh:decorate,openAccountWall:showWall};
})();