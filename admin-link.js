(() => {
  let resolved=false,role='',retryTimer=null,retryCount=0;
  const DEFAULT_CONGREGATION='ICAC';
  const MAX_RETRIES=20;
  const RETRY_MS=500;

  const isAdmin=()=>['owner','admin'].includes(role);
  const roleLabel=()=>role==='owner'?'PLATFORM OWNER':role==='admin'?'SITE ADMIN':'';
  function makeLink(className='level-chip',label='⚙ Admin'){
    const a=document.createElement('a');
    a.href='admin';
    a.dataset.bqAdminLink='1';
    a.className=className;
    a.textContent=label;
    a.style.textDecoration='none';
    return a;
  }
  function removeInjected(){
    document.querySelectorAll('[data-bq-admin-link],[data-bq-platform-role]').forEach(x=>x.remove());
  }
  function makeRoleChip(){
    const chip=document.createElement('span');
    chip.dataset.bqPlatformRole='1';
    chip.className='account-chip';
    chip.textContent=roleLabel();
    chip.title=role==='owner'?'This signed-in BibleQuest account has full platform Owner authority.':'This signed-in BibleQuest account has site administration authority.';
    return chip;
  }
  function enforceRegistrationCongregation(){
    document.querySelectorAll('#bqAccountLayer:not(.hidden) form[data-account-register] input[name="church_group"]').forEach(input=>{
      input.value=DEFAULT_CONGREGATION;
      input.readOnly=true;
      input.setAttribute('aria-readonly','true');
      input.dataset.bqDefaultCongregation='1';
      input.placeholder=DEFAULT_CONGREGATION;
      const label=input.closest('label');
      const note=label?.querySelector('.account-note');
      if(note)note.textContent='Assigned automatically to ICAC. A BibleQuest administrator can correct your congregation later.';
    });
  }
  function inject(){
    enforceRegistrationCongregation();
    if(!isAdmin()){removeInjected();return}
    document.querySelectorAll('.top-actions').forEach(host=>{
      if(role==='owner'&&!host.querySelector('[data-bq-platform-role]')){
        const chip=document.createElement('span');chip.dataset.bqPlatformRole='1';chip.className='level-chip';chip.textContent='OWNER';chip.title='BibleQuest platform owner';host.prepend(chip);
      }
      if(host.querySelector('[data-bq-admin-link]'))return;
      const a=makeLink();
      a.style.color='inherit';a.style.display='inline-flex';a.style.alignItems='center';
      host.prepend(a);
    });
    document.querySelectorAll('#bqAccountLayer:not(.hidden) .account-brand').forEach(host=>{
      if(!host.querySelector('[data-bq-platform-role]'))host.insertBefore(makeRoleChip(),host.querySelector('[data-account-close]')||null);
      if(!host.querySelector('[data-bq-admin-link]'))host.append(makeLink('account-secondary','Admin & ministry'));
    });
    document.querySelectorAll('#bqAccountLayer:not(.hidden) .account-profile-head>div').forEach(host=>{
      if(!host.querySelector('[data-bq-platform-role]'))host.prepend(makeRoleChip());
    });
    document.querySelectorAll('.modern-footer-row').forEach(host=>{
      if(host.querySelector('[data-bq-admin-link]'))return;
      host.append(makeLink('','⚙ Admin & ministry'));
    });
  }
  function stopRetry(){
    if(retryTimer){clearTimeout(retryTimer);retryTimer=null}
  }
  function scheduleRetry(){
    if(resolved||retryTimer||retryCount>=MAX_RETRIES)return;
    retryTimer=setTimeout(()=>{
      retryTimer=null;
      retryCount++;
      check().then(ok=>{if(!ok)scheduleRetry()}).catch(()=>scheduleRetry());
    },RETRY_MS);
  }
  async function check(){
    enforceRegistrationCongregation();
    const acc=window.BQAccount,session=acc?.session?.(),client=acc?.client?.();
    if(!session?.user){resolved=true;role='';removeInjected();stopRetry();return true}
    if(!client){resolved=false;scheduleRetry();return false}
    let next='';
    const direct=await client.from('bible_app_access').select('role,active').eq('user_id',session.user.id).maybeSingle();
    if(!direct.error&&direct.data?.active)next=String(direct.data.role||'');
    if(!next){
      const status=await client.functions.invoke('bq-admin',{body:{action:'status'}}).catch(()=>({error:true}));
      if(!status?.error&&status?.data?.role)next=String(status.data.role);
      else if(direct.error){resolved=false;scheduleRetry();return false}
    }
    role=next;resolved=true;stopRetry();inject();
    window.dispatchEvent(new CustomEvent('bq-admin-access',{detail:{role,allowed:isAdmin()}}));
    return true;
  }
  function refresh(){
    resolved=false;retryCount=0;stopRetry();
    return check().then(ok=>{if(!ok)scheduleRetry();return ok});
  }

  document.addEventListener('click',event=>{
    if(!event.target.closest('[data-account-open],[data-auth-tab]'))return;
    queueMicrotask(()=>{enforceRegistrationCongregation();if(resolved)inject()});
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh().catch(()=>{})});
  window.addEventListener('bq-modern-home-rendered',()=>{enforceRegistrationCongregation();if(resolved)inject()});
  window.addEventListener('bq-account-created',()=>refresh().catch(()=>{}));
  refresh().catch(()=>{});
  window.BQAdminAccess={refresh,status:()=>({resolved,role,allowed:isAdmin(),label:roleLabel()})};
})();
