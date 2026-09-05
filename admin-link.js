(() => {
  let resolved=false,role='';

  const isAdmin=()=>['owner','admin'].includes(role);
  const roleLabel=()=>role==='owner'?'PLATFORM OWNER':role==='admin'?'SITE ADMIN':'';
  function makeLink(className='level-chip',label='⚙ Admin'){
    const a=document.createElement('a');
    a.href='admin.html';
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
  function inject(){
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
  async function check(){
    const acc=window.BQAccount,session=acc?.session?.(),client=acc?.client?.();
    if(!session?.user||!client){resolved=false;role='';removeInjected();return false}
    let next='';
    const direct=await client.from('bible_app_access').select('role,active').eq('user_id',session.user.id).maybeSingle();
    if(!direct.error&&direct.data?.active)next=String(direct.data.role||'');
    if(!next){
      const status=await client.functions.invoke('bq-admin',{body:{action:'status'}}).catch(()=>({error:true}));
      if(!status?.error&&status?.data?.role)next=String(status.data.role);
    }
    role=next;resolved=true;inject();
    window.dispatchEvent(new CustomEvent('bq-admin-access',{detail:{role,allowed:isAdmin()}}));
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(!resolved)check().catch(()=>{});else inject();
    if(tries>120&&resolved)clearInterval(timer);
  },500);
  new MutationObserver(()=>{if(resolved)inject()}).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){resolved=false;check().catch(()=>{})}});
  window.addEventListener('bq-modern-home-rendered',inject);
  window.addEventListener('bq-account-created',()=>{resolved=false;check().catch(()=>{})});
  window.BQAdminAccess={refresh:check,status:()=>({resolved,role,allowed:isAdmin(),label:roleLabel()})};
})();