import { localization } from '../../app/localization.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icons=Object.freeze({assignment:'📮',feedback:'💬',devotional:'📖',announcement:'📣',activity:'🧭',encouragement:'💛',poll:'📊',award:'🏅',media:'🎬',info:'🔔'});

export function notificationCenterPage({notifications,onNavigate,onBack,onAccount}){
  const locale=localization.getLocale();
  const tr=(key,values)=>localization.t(key,{locale,values});
  const relativeTime=iso=>{
    const minutes=Math.max(0,Math.floor((Date.now()-Date.parse(iso))/60000));
    if(minutes<1)return tr('notificationCenter.time.now');if(minutes<60)return `${minutes}m`;if(minutes<1440)return `${Math.floor(minutes/60)}h`;return `${Math.floor(minutes/1440)}d`;
  };
  const itemHtml=item=>{
    const open=item.route?`<button type="button" class="bq-primary-button" data-notification-open="${escapeHtml(item.id)}">${escapeHtml(tr('notificationCenter.open'))}</button>`:`<button type="button" class="bq-secondary-button" disabled title="${escapeHtml(tr('notificationCenter.destinationUnavailable'))}">${escapeHtml(tr('notificationCenter.unavailable'))}</button>`;
    return `<article class="bq-panel notification-center-item${item.isRead?'':' is-unread'}" data-notification-item="${escapeHtml(item.id)}"><div class="notification-center-row"><span class="notification-center-icon" data-notification-type="${escapeHtml(item.type)}" aria-hidden="true">${icons[item.type]||'🔔'}</span><div class="notification-center-copy"><div class="notification-center-heading"><h3>${escapeHtml(item.title)}</h3>${item.isRead?'':`<span class="notification-center-dot" aria-label="${escapeHtml(tr('notificationCenter.unread'))}">${escapeHtml(tr('notificationCenter.unread'))}</span>`}</div>${item.body?`<p>${escapeHtml(item.body)}</p>`:''}<small>${escapeHtml(relativeTime(item.createdAt))} · ${escapeHtml(item.type)}</small></div></div><div class="notification-center-actions">${open}<button type="button" class="bq-secondary-button" data-notification-read="${escapeHtml(item.id)}" data-read-next="${item.isRead?'0':'1'}">${escapeHtml(tr(item.isRead?'notificationCenter.markUnread':'notificationCenter.markRead'))}</button></div></article>`;
  };
  const frame=(heading,message,action='')=>`<section class="bq-panel"><p class="bq-eyebrow">${escapeHtml(tr('notificationCenter.eyebrow'))}</p><h1>${escapeHtml(heading)}</h1><p>${message}</p>${action}</section>`;
  const renderState=state=>{
    if(state.status==='signed-out')return frame(tr('notificationCenter.heading'),escapeHtml(tr('notificationCenter.signedOut')),`<button type="button" class="bq-primary-button" data-notification-account>${escapeHtml(tr('notificationCenter.openAccount'))}</button>`);
    if(state.status==='unavailable')return frame(tr('notificationCenter.heading'),escapeHtml(state.error||tr('notificationCenter.inboxUnavailable')));
    if(state.status==='error')return frame(tr('notificationCenter.unavailableHeading'),escapeHtml(state.error||tr('notificationCenter.loadError')),`<button type="button" class="bq-primary-button" data-notification-refresh>${escapeHtml(tr('common.retry'))}</button>`);
    if(state.status==='loading'||state.status==='idle')return frame(tr('notificationCenter.heading'),`<span aria-live="polite">${escapeHtml(tr('notificationCenter.loading'))}</span>`);
    const items=state.items||[];
    return `<section class="bq-panel notification-center-header"><p class="bq-eyebrow">${escapeHtml(tr('notificationCenter.eyebrow'))}</p><h1>${escapeHtml(tr('notificationCenter.heading'))}</h1><p>${tr('notificationCenter.summary',{unread:Number(state.unread||0),count:items.length})}</p><div class="notification-center-actions"><button type="button" class="bq-secondary-button" data-notification-refresh>${escapeHtml(tr('notificationCenter.refresh'))}</button><button type="button" class="bq-secondary-button" data-notification-read-all ${state.unread?'':'disabled'}>${escapeHtml(tr('notificationCenter.markAllRead'))}</button></div></section>${items.length?`<section class="notification-center-list" aria-label="${escapeHtml(tr('nav.notifications'))}">${items.map(itemHtml).join('')}</section>`:`<section class="bq-panel"><h2>${escapeHtml(tr('notificationCenter.emptyHeading'))}</h2><p>${escapeHtml(tr('notificationCenter.emptyDescription'))}</p></section>`}`;
  };

  return {
    title:tr('notificationCenter.heading'),
    html:frame(tr('notificationCenter.heading'),escapeHtml(tr('notificationCenter.loading'))),
    mount(root){
      let active=true,busy=false;
      const paint=()=>{if(!active)return;root.innerHTML=`<div class="notification-center-toolbar"><button type="button" class="bq-secondary-button" data-notification-back>← ${escapeHtml(tr('nav.more'))}</button></div>${renderState(notifications.snapshot())}`;bind()};
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
