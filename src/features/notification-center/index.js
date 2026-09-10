const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icons=Object.freeze({assignment:'📮',feedback:'💬',devotional:'📖',announcement:'📣',activity:'🧭',encouragement:'💛',poll:'📊',award:'🏅',media:'🎬',info:'🔔'});
const relativeTime=iso=>{
  const minutes=Math.max(0,Math.floor((Date.now()-Date.parse(iso))/60000));
  if(minutes<1)return 'now';if(minutes<60)return `${minutes}m`;if(minutes<1440)return `${Math.floor(minutes/60)}h`;return `${Math.floor(minutes/1440)}d`;
};

function itemHtml(item){
  const open=item.route?`<button type="button" class="bq-primary-button" data-notification-open="${escapeHtml(item.id)}">Open</button>`:'<button type="button" class="bq-secondary-button" disabled title="This destination is not migrated yet.">Unavailable</button>';
  return `<article class="bq-panel notification-center-item${item.isRead?'':' is-unread'}" data-notification-item="${escapeHtml(item.id)}"><div class="notification-center-row"><span class="notification-center-icon" aria-hidden="true">${icons[item.type]||'🔔'}</span><div class="notification-center-copy"><div class="notification-center-heading"><h3>${escapeHtml(item.title)}</h3>${item.isRead?'':'<span class="notification-center-dot" aria-label="Unread">Unread</span>'}</div>${item.body?`<p>${escapeHtml(item.body)}</p>`:''}<small>${escapeHtml(relativeTime(item.createdAt))} · ${escapeHtml(item.type)}</small></div></div><div class="notification-center-actions">${open}<button type="button" class="bq-secondary-button" data-notification-read="${escapeHtml(item.id)}" data-read-next="${item.isRead?'0':'1'}">${item.isRead?'Mark unread':'Mark read'}</button></div></article>`;
}

export function notificationCenterPage({notifications,onNavigate,onBack,onAccount}){
  const renderState=state=>{
    if(state.status==='signed-out')return `<section class="bq-panel"><p class="bq-eyebrow">INBOX</p><h1>Notification Center</h1><p>Sign in to load your private BibleQuest inbox.</p><button type="button" class="bq-primary-button" data-notification-account>Open Account</button></section>`;
    if(state.status==='unavailable')return `<section class="bq-panel"><p class="bq-eyebrow">INBOX</p><h1>Notification Center</h1><p>${escapeHtml(state.error||'Inbox is unavailable here.')}</p></section>`;
    if(state.status==='error')return `<section class="bq-panel"><p class="bq-eyebrow">INBOX</p><h1>Inbox unavailable</h1><p>${escapeHtml(state.error||'Notification Center could not load.')}</p><button type="button" class="bq-primary-button" data-notification-refresh>Try again</button></section>`;
    if(state.status==='loading'||state.status==='idle')return `<section class="bq-panel"><p class="bq-eyebrow">INBOX</p><h1>Notification Center</h1><p aria-live="polite">Loading your inbox…</p></section>`;
    const items=state.items||[];
    return `<section class="bq-panel notification-center-header"><p class="bq-eyebrow">INBOX</p><h1>Notification Center</h1><p><strong>${Number(state.unread||0)}</strong> unread · ${items.length} current notification${items.length===1?'':'s'}.</p><div class="notification-center-actions"><button type="button" class="bq-secondary-button" data-notification-refresh>Refresh</button><button type="button" class="bq-secondary-button" data-notification-read-all ${state.unread?'':'disabled'}>Mark all read</button></div></section>${items.length?`<section class="notification-center-list" aria-label="Notifications">${items.map(itemHtml).join('')}</section>`:`<section class="bq-panel"><h2>No notifications yet</h2><p>Assignments, recognition and other supported BibleQuest updates will appear here when they are available.</p></section>`}`;
  };

  return {
    title:'Notification Center',
    html:`<section class="bq-panel"><p class="bq-eyebrow">INBOX</p><h1>Notification Center</h1><p>Loading your inbox…</p></section>`,
    mount(root){
      let active=true,busy=false;
      const paint=()=>{if(!active)return;root.innerHTML=`<div class="notification-center-toolbar"><button type="button" class="bq-secondary-button" data-notification-back>← More</button></div>${renderState(notifications.snapshot())}`;bind()};
      const run=async operation=>{if(busy)return;busy=true;try{await operation()}catch{}finally{busy=false;paint()}};
      const bind=()=>{
        root.querySelector('[data-notification-back]')?.addEventListener('click',()=>onBack?.(),{once:true});
        root.querySelector('[data-notification-account]')?.addEventListener('click',()=>onAccount?.(),{once:true});
        root.querySelector('[data-notification-refresh]')?.addEventListener('click',()=>void run(()=>notifications.refresh()),{once:true});
        root.querySelector('[data-notification-read-all]')?.addEventListener('click',()=>void run(()=>notifications.markAllRead()),{once:true});
        root.querySelectorAll('[data-notification-read]').forEach(button=>button.addEventListener('click',()=>void run(()=>notifications.setRead(button.dataset.notificationRead,button.dataset.readNext==='1')),{once:true}));
        root.querySelectorAll('[data-notification-open]').forEach(button=>button.addEventListener('click',()=>void run(async()=>{const route=await notifications.openTarget(button.dataset.notificationOpen);if(active&&route)onNavigate?.(route)}),{once:true}));
      };
      paint();
      void run(()=>notifications.load());
      return()=>{active=false};
    }
  };
}
