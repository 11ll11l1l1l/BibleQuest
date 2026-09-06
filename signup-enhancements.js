(() => {
  // Compatibility shim for account/profile surfaces rendered by older modules.
  // Account creation itself is owned by account.js so there is exactly one submit path.
  const FIELD='church_group';
  function value(){return String(window.BQAccount?.profile?.()?.church_group||'')}
  function churchField(current=''){const label=document.createElement('label');label.dataset.churchGroupField='1';label.innerHTML=`Church / fellowship group<span class="account-note">Private to your account. Used for group support and organization; not shown on leaderboards.</span><input name="${FIELD}" maxlength="120" placeholder="e.g. church name, fellowship group, or none yet">`;label.querySelector('input').value=current||'';return label}
  function inject(root=document){root.querySelectorAll?.('form[data-account-register],form[data-account-profile]').forEach(form=>{if(form.querySelector(`[name="${FIELD}"]`))return;const anchor=form.querySelector('[name="preferred_name"]')?.closest('label'),field=churchField(form.matches('[data-account-profile]')?value():'');if(anchor?.nextSibling)anchor.parentNode.insertBefore(field,anchor.nextSibling);else if(anchor)anchor.after(field);else form.prepend(field)})}
  function loadTutorial(){if(window.BQTutorial||document.querySelector('script[data-bq-tutorial-loader]'))return;const s=document.createElement('script');s.src='onboarding-tutorial.js';s.defer=true;s.dataset.bqTutorialLoader='1';document.head.appendChild(s)}
  const obs=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1)inject(n)});
  document.addEventListener('DOMContentLoaded',()=>{inject();loadTutorial();obs.observe(document.documentElement,{childList:true,subtree:true})});
  setTimeout(()=>{inject();loadTutorial()},100);
})();
