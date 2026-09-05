(() => {
  'use strict';
  const cfg=window.BQ_CLOUD_CONFIG||{};
  function fail(){
    try{sessionStorage.removeItem('bq_preview_mode_v1')}catch{}
    location.replace('./index.html?account=required');
  }
  async function boot(){
    try{
      if(!cfg.enabled||!cfg.supabaseUrl||!cfg.publishableKey||!window.supabase?.createClient){fail();return}
      const client=window.supabase.createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      const {data,error}=await client.auth.getSession();
      if(error||!data.session?.user){fail();return}
      document.documentElement.classList.add('bq-account-confirmed');
      window.dispatchEvent(new CustomEvent('bq-standalone-account-ready'));
    }catch(_err){fail()}
  }
  boot();
})();