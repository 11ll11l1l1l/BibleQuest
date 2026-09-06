(() => {
  const cfg=window.BQ_CLOUD_CONFIG||{};
  let client=null, busy=false;
  function getClient(){
    if(client)return client;
    if(!window.supabase?.createClient||!cfg.supabaseUrl||!cfg.publishableKey)return null;
    client=window.supabase.createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    return client;
  }
  function toast(text,error=false){
    document.querySelector('.admin-toast[data-hardening-toast]')?.remove();
    const el=document.createElement('div');
    el.className=`admin-toast${error?' error':''}`;
    el.dataset.hardeningToast='1';
    el.textContent=text;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),4500);
  }
  async function sendReset(userId,button){
    if(busy)return;
    const c=getClient();if(!c)throw new Error('Account service unavailable.');
    const session=(await c.auth.getSession()).data.session;
    if(!session?.access_token)throw new Error('Your admin session expired. Sign in again.');
    busy=true;const old=button.textContent;button.disabled=true;button.textContent='Sending…';
    try{
      const r=await fetch(`${cfg.supabaseUrl}/functions/v1/bq-admin`,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`,'apikey':cfg.publishableKey},
        body:JSON.stringify({action:'send_password_reset',targetUserId:userId})
      });
      const data=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(data.error||`Reset request failed (${r.status})`);
      toast('Password reset email sent.');
      button.textContent='Reset email sent';
    }finally{
      busy=false;button.disabled=false;
      setTimeout(()=>{if(button.isConnected)button.textContent=old||'Send reset email'},1800);
    }
  }
  function fix(){
    document.querySelectorAll('[data-reset-user]').forEach(b=>{
      b.textContent='Send reset email';
      b.title='Send the official Supabase password-reset email';
    });
    document.querySelectorAll('.admin-modal-layer').forEach(x=>x.remove());
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-reset-user]');
    if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();
    const id=b.dataset.resetUser;
    if(!id)return;
    if(!confirm('Send this account a password reset email?'))return;
    sendReset(id,b).catch(err=>toast(err.message||String(err),true));
  },true);
  new MutationObserver(fix).observe(document.documentElement,{subtree:true,childList:true});
  fix();
})();
