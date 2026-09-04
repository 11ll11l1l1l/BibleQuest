(() => {
  let checked=false,role='';
  function inject(){
    if(!['owner','admin'].includes(role))return;
    document.querySelectorAll('.top-actions').forEach(host=>{
      if(host.querySelector('[data-bq-admin-link]'))return;
      const a=document.createElement('a');
      a.href='admin.html';a.dataset.bqAdminLink='1';a.className='level-chip';a.textContent='⚙ Admin';
      a.style.textDecoration='none';a.style.color='inherit';a.style.display='inline-flex';a.style.alignItems='center';
      host.prepend(a);
    });
  }
  async function check(){
    const acc=window.BQAccount,session=acc?.session?.(),client=acc?.client?.();
    if(!session?.user||!client)return false;
    const {data,error}=await client.from('bible_app_access').select('role,active').eq('user_id',session.user.id).maybeSingle();
    if(error)return false;
    checked=true;role=data?.active?data.role:'';inject();return true;
  }
  let tries=0;const timer=setInterval(()=>{tries++;if(!checked)check().catch(()=>{});else inject();if(tries>30&&checked)clearInterval(timer)},500);
  new MutationObserver(()=>{if(checked)inject()}).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){checked=false;check().catch(()=>{})}});
})();