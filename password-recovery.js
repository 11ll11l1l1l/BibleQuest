(() => {
  // Compatibility helper only. BibleQuest recovery now uses a saved recovery code,
  // not confirmation/recovery email links.
  function inject(){
    document.querySelectorAll('[data-account-login]').forEach(form=>{
      if(form.querySelector('[data-password-reset-link]')||form.querySelector('a[href="reset.html"]'))return;
      const a=document.createElement('a');a.href='reset.html';a.dataset.passwordResetLink='1';a.textContent='Forgot password or need account recovery?';a.style.cssText='display:block;text-align:center;font-size:13px;font-weight:800;color:#45654b;text-decoration:none;padding:4px';form.appendChild(a)
    })
  }
  const obs=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1)inject()});
  document.addEventListener('DOMContentLoaded',()=>{inject();obs.observe(document.documentElement,{childList:true,subtree:true})});
  setTimeout(inject,120);
})();
