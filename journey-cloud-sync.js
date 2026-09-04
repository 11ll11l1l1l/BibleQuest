(() => {
  let timer=null;
  async function sync(){
    const loop=window.BQJourneyLoop;if(!loop)return;
    const client=window.BQAccount?.client?.()||window.BQ_SUPABASE_CLIENT;if(!client)return;
    try{
      const sr=await client.auth.getSession(),user=sr.data?.session?.user;if(!user)return;
      const e=loop.read?.(),d=(()=>{const x=new Date(),y=new Date(x.getTime()-x.getTimezoneOffset()*60000);return y.toISOString().slice(0,10)})(),t=e?.daily?.[d];if(!t)return;
      const done=Object.keys(t.done||{}).length;
      const r=await client.from('bible_daily_journey_status').upsert({user_id:user.id,journey_date:d,status:t.completedAt?'complete':'started',completed_steps:done,total_steps:t.tasks?.length||5,season_key:t.seasonKey||null,updated_at:new Date().toISOString()},{onConflict:'user_id,journey_date'});
      if(r.error)throw r.error;
      await window.BQAccount?.pushProgress?.().catch?.(()=>{});
      window.dispatchEvent(new CustomEvent('bq-journey-cloud-synced'));
    }catch{/* local journey remains usable offline */}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(sync,900)}
  function retargetHero(){const b=document.querySelector('[data-pinoy-mission]');if(!b)return;b.setAttribute('aria-label',"Continue today's Bible Journey");const title=b.querySelector('b'),sub=b.querySelector('small');if(title)title.textContent='Today’s Journey';if(sub)sub.textContent='Continue your 3–5 min path';b.onclick=()=>window.BQJourneyLoop?.open?.()}
  window.addEventListener('bq-journey-change',schedule);
  window.addEventListener('bq-account-profile',schedule);
  window.addEventListener('bq-modern-home-rendered',()=>setTimeout(retargetHero,0));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{retargetHero();schedule()},800));
  window.BQJourneyCloud={sync};
})();
