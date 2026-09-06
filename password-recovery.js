(() => {
  'use strict';
  // Compatibility helper only. BibleQuest recovery uses a saved recovery code,
  // not confirmation/recovery email links. Normalize legacy reset.html links too.
  function inject(){
    document.querySelectorAll('a[href="reset.html"],a[href="./reset.html"]').forEach(a=>a.setAttribute('href','reset'));
    document.querySelectorAll('[data-account-login]').forEach(form=>{
      if(form.querySelector('[data-password-reset-link]')||form.querySelector('a[href="reset"]'))return;
      const a=document.createElement('a');a.href='reset';a.dataset.passwordResetLink='1';a.textContent='Forgot password or need account recovery?';a.style.cssText='display:block;text-align:center;font-size:13px;font-weight:800;color:#45654b;text-decoration:none;padding:4px';form.appendChild(a)
    })
  }
  const obs=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1)inject()});
  document.addEventListener('DOMContentLoaded',()=>{inject();obs.observe(document.documentElement,{childList:true,subtree:true})});
  setTimeout(inject,120);
})();
