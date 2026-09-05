(() => {
  let timer=null,renderScheduled=false,observer=null;
  const report=(code,error)=>window.BQRuntime?.report?.('journey-cloud',code,error);

  async function sync(){
    const loop=window.BQJourneyLoop;if(!loop)return;
    const client=window.BQAccount?.client?.()||window.BQ_SUPABASE_CLIENT;if(!client)return;
    try{
      const sr=await client.auth.getSession(),user=sr.data?.session?.user;if(!user)return;
      const e=loop.read?.(),d=(()=>{const x=new Date(),y=new Date(x.getTime()-x.getTimezoneOffset()*60000);return y.toISOString().slice(0,10)})(),t=e?.daily?.[d];if(!t)return;
      const done=Object.keys(t.done||{}).length;
      const r=await client.from('bible_daily_journey_status').upsert({user_id:user.id,journey_date:d,status:t.completedAt?'complete':'started',completed_steps:done,total_steps:t.tasks?.length||5,season_key:t.seasonKey||null,updated_at:new Date().toISOString()},{onConflict:'user_id,journey_date'});
      if(r.error)throw r.error;
      try{await window.BQAccount?.pushProgress?.()}catch(error){report('progress_snapshot_failed',error)}
      window.dispatchEvent(new CustomEvent('bq-journey-cloud-synced'));
    }catch(error){
      // Local Journey remains fully usable offline; record only a sanitized local diagnostic.
      report('daily_status_sync_failed',error);
    }
  }

  function schedule(){clearTimeout(timer);timer=setTimeout(sync,900)}

  function retargetHero(){
    const b=document.querySelector('[data-pinoy-mission]');if(!b)return;
    b.setAttribute('aria-label',"Continue today's Bible Journey");
    const title=b.querySelector('b'),sub=b.querySelector('small');
    if(title)title.textContent='Today’s Journey';
    if(sub)sub.textContent='Continue your 3–5 min path';
    b.onclick=()=>window.BQJourneyLoop?.open?.();
  }

  function secondaryActions(){
    const home=document.querySelector('.modern-home'),stack=home?.querySelector('.bq-engagement-stack');if(!home||!stack)return;
    const legacyReview=document.querySelector('.modern-focus [data-modern-review]');legacyReview?.removeAttribute('data-modern-review');
    stack.querySelectorAll('[data-daily5-play]').forEach(x=>x.remove());
    let row=stack.querySelector('.journey-familiar-tools');
    if(!row){row=document.createElement('div');row.className='journey-mini-row journey-familiar-tools';stack.appendChild(row)}
    let review=row.querySelector('[data-modern-review]');
    if(!review){review=document.createElement('button');review.type='button';review.dataset.modernReview='1';review.textContent='🧠 Smart Review';row.replaceChildren(review)}
    if(!review.dataset.bound){review.dataset.bound='1';review.onclick=()=>{const old=document.querySelector('.modern-focus .modern-review');if(old)old.click();else window.BQOpenReview?.open?.()}}
  }

  function refreshHome(){retargetHero();secondaryActions()}
  function queueRefresh(){if(renderScheduled)return;renderScheduled=true;requestAnimationFrame(()=>{renderScheduled=false;refreshHome()})}

  function startObserver(){
    if(observer)return;
    const root=document.getElementById('app');if(!root)return;
    observer=new MutationObserver(()=>{if(root.querySelector('.bq-engagement-stack')||root.querySelector('.bq-pinoy-hero'))queueRefresh()});
    observer.observe(root,{childList:true,subtree:true});
  }

  window.addEventListener('bq-journey-change',()=>{schedule();queueRefresh()});
  window.addEventListener('bq-account-profile',()=>{schedule();queueRefresh()});
  window.addEventListener('bq-modern-home-rendered',queueRefresh);
  document.addEventListener('DOMContentLoaded',()=>{startObserver();queueRefresh();schedule()},{once:true});
  setTimeout(()=>{startObserver();queueRefresh()},500);
  window.BQJourneyCloud={sync};
})();
