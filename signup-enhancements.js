(() => {
  // Compatibility shim for account/profile surfaces rendered by older modules.
  // Account creation itself is owned by account.js so there is exactly one auth submit path.
  const FIELD='church_group';
  const isTaglish=()=> (localStorage.getItem('biblequest_ui_language_v1')||'taglish')==='taglish';
  const copy=()=>isTaglish()?{label:'Church / fellowship group',hint:'Private sa account mo. Para sa group support at organization; hindi ito ipinapakita sa leaderboard.',placeholder:'Hal. church name, fellowship group, o none yet'}:{label:'Church / fellowship group',hint:'Private to your account. Used for group support and organization; not shown on leaderboards.',placeholder:'e.g. church name, fellowship group, or none yet'};

  function value(){return String(window.BQAccount?.profile?.()?.church_group||'')}
  function churchField(current=''){
    const c=copy(),label=document.createElement('label');
    label.dataset.churchGroupField='1';
    label.innerHTML=`${c.label}<span class="account-note">${c.hint}</span><input name="${FIELD}" maxlength="120" placeholder="${c.placeholder}">`;
    label.querySelector('input').value=current||'';
    return label;
  }
  function inject(root=document){
    root.querySelectorAll?.('form[data-account-register],form[data-account-profile]').forEach(form=>{
      if(form.querySelector(`[name="${FIELD}"]`))return;
      const anchor=form.querySelector('[name="preferred_name"]')?.closest('label');
      const field=churchField(form.matches('[data-account-profile]')?value():'');
      if(anchor?.nextSibling)anchor.parentNode.insertBefore(field,anchor.nextSibling);else if(anchor)anchor.after(field);else form.prepend(field);
    });
  }

  const obs=new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1)inject(n)});
  document.addEventListener('DOMContentLoaded',()=>{inject();obs.observe(document.documentElement,{childList:true,subtree:true})});
  setTimeout(inject,100);
})();
