(() => {
  'use strict';
  const cfg=window.BQ_CLOUD_CONFIG||{},E2E='bq_e2e_account_v1';
  function localTestAuth(){try{return ['127.0.0.1','localhost'].includes(location.hostname)&&sessionStorage.getItem(E2E)==='1'}catch{return false}}
  function fail(){try{sessionStorage.removeItem('bq_preview_mode_v1')}catch{}location.replace('./index.html?account=required');return false}
  async function boot(){
    try{
      if(localTestAuth()){document.documentElement.classList.add('bq-account-confirmed');return true}
      if(!cfg.enabled||!cfg.supabaseUrl||!cfg.publishableKey||!window.supabase?.createClient)return fail();
      const client=window.supabase.createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      const {data,error}=await client.auth.getSession();if(error||!data.session?.user)return fail();
      document.documentElement.classList.add('bq-account-confirmed');window.dispatchEvent(new CustomEvent('bq-standalone-account-ready'));return true;
    }catch(_err){return fail()}
  }
  const ready=boot();window.BQStandaloneGate={ready,isLocalTestAuth:localTestAuth};
})();