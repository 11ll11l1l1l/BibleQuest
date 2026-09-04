(() => {
  function refresh(){
    document.querySelectorAll('#app .source-box').forEach(box=>{
      if(/Backend:\s*Off|Progress:\s*This device only/i.test(box.textContent||'')){
        const s=window.BQAccount?.status?.()||{};
        box.innerHTML=s.signedIn?'<b>Account:</b> Cloud connected<br><b>Progress:</b> Synced to your BibleQuest account, with this device used as a working cache<br><b>Private notes:</b> Cloud-backed and visible only to your account in the app<br><b>Content delivery:</b> On-demand Bible packs + offline runtime cache':'<b>Account:</b> Sign in required on the live BibleQuest site<br><b>Progress:</b> Cloud-backed after sign-in<br><b>Content delivery:</b> On-demand Bible packs + offline runtime cache';
      }
    });
    document.querySelectorAll('#app .card').forEach(card=>{
      const h=card.querySelector('h3');
      if(h&&/Local progress/i.test(h.textContent||'')){
        h.textContent='Cloud progress';
        const p=card.querySelector('p');if(p)p.textContent='Your device keeps a fast working copy, while signed-in progress is synchronized to your BibleQuest account.';
        const actions=card.querySelector('.actions');if(actions)actions.innerHTML='<button class="secondary" data-account-open>Account & devices</button><button class="secondary" data-notes-open>My notes</button>';
      }
    });
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-reader-save]'))setTimeout(()=>{const n=document.getElementById('readerNotice');if(n&&window.BQAccount?.status?.().signedIn)n.innerHTML='<div class="reader-notice">✓ Passage saved to your BibleQuest progress and queued for cloud sync.</div>'},30);
  });
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true});
  refresh();
})();