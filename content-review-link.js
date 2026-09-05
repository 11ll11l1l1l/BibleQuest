(() => {
  'use strict';
  const REVIEW_ROLES=new Set(['leader','pastor','admin']);
  let retryTimer=null,retries=0;
  function allowed(){const admin=window.BQAdminAccess?.status?.();if(admin?.allowed)return true;const role=window.BQCloud?.status?.().activeCongregation?.role||'';return REVIEW_ROLES.has(role)}
  function link(className='',label='🛡 Content review'){const a=document.createElement('a');a.href='content-review.html';a.dataset.bqContentReviewLink='1';a.className=className;a.textContent=label;a.style.textDecoration='none';return a}
  function remove(){document.querySelectorAll('[data-bq-content-review-link]').forEach(x=>x.remove())}
  function inject(){
    if(!allowed()){remove();return false}
    document.querySelectorAll('.modern-footer-row').forEach(host=>{if(!host.querySelector('[data-bq-content-review-link]'))host.prepend(link('','🛡 Review flagged content'))});
    document.querySelectorAll('#bqCommunityLayer:not(.hidden) .community-quick').forEach(host=>{if(host.querySelector('[data-bq-content-review-link]'))return;const a=link('','🛡️ Content review');a.innerHTML='<span>🛡️</span><b>Content Review</b><small>Quarantine · reports · decisions</small>';host.append(a)});
    return true;
  }
  function schedule(){if(retryTimer||retries>=20)return;retryTimer=setTimeout(()=>{retryTimer=null;retries++;if(!inject())schedule()},400)}
  function refresh(){retries=0;if(retryTimer){clearTimeout(retryTimer);retryTimer=null}if(!inject())schedule()}
  window.addEventListener('bq-modern-home-rendered',refresh);window.addEventListener('bq-cloud-board-change',refresh);window.addEventListener('bq-admin-access',refresh);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-community-open]'))setTimeout(refresh,0)});
  refresh();window.BQContentReviewLink={refresh,allowed};
})();
