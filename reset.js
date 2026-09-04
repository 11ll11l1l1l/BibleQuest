(() => {
  const cfg=window.BQ_CLOUD_CONFIG||{};
  const form=document.getElementById('resetForm');
  const message=document.getElementById('resetMessage');
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function show(text,error=false){message.innerHTML=`<div class="reset-msg${error?' error':''}">${esc(text)}</div>`}
  if(!window.supabase?.createClient||!cfg.supabaseUrl||!cfg.publishableKey){
    show('Password recovery is temporarily unavailable.',true);
    return;
  }
  const client=window.supabase.createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const email=String(new FormData(form).get('email')||'').trim();
    const button=form.querySelector('button');button.disabled=true;button.textContent='Sending…';message.innerHTML='';
    try{
      const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:cfg.redirectUrl});
      if(error)throw error;
      show('If that email belongs to a BibleQuest account, a password reset link has been sent.');
      button.textContent='Email sent';
    }catch(err){
      show(err.message||String(err),true);
      button.disabled=false;button.textContent='Send password reset email';
    }
  });
})();
