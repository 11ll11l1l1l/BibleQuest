(() => {
  let resolved=false,role='';

  const isAdmin=()=>['owner','admin'].includes(role);
  function makeLink(className='level-chip',label='⚙ Admin'){
    const a=document.createElement('a');
    a.href='admin.html';
    a.dataset.bqAdminLink='1';
    a.className=className;
    a.textContent=label;
    a.style.textDecoration='none';
    return a;
  }
  function removeLinks(){document.querySelectorAll('[data-bq-admin-link]').forEach(x=>x.remove())}
  function inject(){
    if(!isAdmin()){removeLinks();return}
    document.querySelectorAll('.top-actions').forEach(host=>{
      if(host.querySelector('[data-bq-admin-link]'))return;
      const a=makeLink();
      a.style.color='inherit';a.style.display='inline-flex';a.style.alignItems='center';
      host.prepend(a);
    });
    document.querySelectorAll('#bqAccountLayer:not(.hidden) .account-brand').forEach(host=>{
      if(host.querySelector('[data-bq-admin-link]'))return;
      host.append(makeLink('account-secondary','Admin & ministry'));
    });
    document.querySelectorAll('.modern-footer-row').forEach(host=>{
      if(host.querySelector('[data-bq-admin-link]'))return;
      host.append(makeLink('','⚙ Admin & ministry'));
    });
  }
  async function check(){
    const acc=window.BQAccount,session=acc?.session?.(),client=acc?.client?.();
    if(!session?.user||!client){resolved=false;role='';removeLinks();return false}
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
})();