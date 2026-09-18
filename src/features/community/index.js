import { localization } from '../../app/localization.js';

const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const communityActions=[
  {route:'congregation',art:'assets/v4/community/congregation.png',title:'community.action.membership.title',description:'community.action.membership.description',enabled:()=>true},
  {route:'leaderboards',art:'assets/v4/community/leaderboards.png',title:'community.action.leaderboards.title',description:'community.action.leaderboards.description',enabled:state=>state.status==='ready'&&state.congregations.length},
  {route:'recognition',art:'assets/v4/community/recognition.png',title:'community.action.recognition.title',description:'community.action.recognition.description',enabled:state=>state.status==='ready'&&state.congregations.length},
  {route:'assignments',art:'assets/v4/ministry-more/assignments.png',title:'community.action.assignments.title',description:'community.action.assignments.description',enabled:state=>state.status==='ready'&&state.congregations.length},
  {route:'live-rooms',art:'assets/v4/community/live-rooms.png',title:'community.action.liveRooms.title',description:'community.action.liveRooms.description',enabled:state=>state.status==='ready'&&state.congregations.length},
  {route:'journey-groups',art:'assets/v4/community/journey-groups.png',title:'community.action.journeyGroups.title',description:'community.action.journeyGroups.description',enabled:state=>state.status==='ready'},
  {route:'encouragements',art:'assets/v4/community/encouragements.png',title:'community.action.encouragements.title',description:'community.action.encouragements.description',enabled:state=>state.status==='ready'&&state.groups.length},
];

function readyView(state,tx){
  const congregations=state.congregations.length?state.congregations.map(row=>`<article class="bq-community-row"><div><p class="bq-eyebrow">${esc(row.roleLabel)}</p><h3>${esc(row.name)}</h3></div><span>${esc(tx(row.canMinistry?'community.role.ministry':'community.role.member'))}</span></article>`).join(''):`<p>${esc(tx('community.congregations.empty'))}</p>`;
  const groups=state.groups.length?state.groups.map(row=>`<article class="bq-community-row"><div><p class="bq-eyebrow">${esc(row.role)}</p><h3>${esc(row.name)}</h3></div><span>${esc(row.memberCount)}/${esc(row.maxMembers)} ${esc(tx('community.members.count'))}</span></article>`).join(''):`<p>${esc(tx('community.groups.empty'))}</p>`;
  return `<section class="bq-community-summary" aria-label="${esc(tx('community.summary.aria'))}"><div><strong>${state.congregations.length}</strong><span>${esc(tx('community.summary.congregations'))}</span></div><div><strong>${state.groups.length}</strong><span>${esc(tx('community.summary.groups'))}</span></div><div><strong>${state.encouragementCount}</strong><span>${esc(tx('community.summary.encouragements'))}</span></div></section><section class="bq-panel"><h2>${esc(tx('community.congregations.heading'))}</h2>${congregations}</section><section class="bq-panel"><h2>${esc(tx('community.groups.heading'))}</h2>${groups}</section>`;
}

export function communityPage({bridge,onNavigate,onBack,onAccount}={}){
  const locale=localization.getLocale();
  const tx=(key,values)=>localization.t(key,{locale,values});
  return{title:tx('community.title'),html:'<section class="bq-community" data-community-view></section>',mount(root){
    const view=root.querySelector('[data-community-view]');let disposed=false,busy=false;
    const bind=()=>{
      view.querySelector('[data-community-back]')?.addEventListener('click',()=>onBack?.(),{once:true});
      view.querySelector('[data-community-account]')?.addEventListener('click',()=>onAccount?.(),{once:true});
      view.querySelector('[data-community-retry]')?.addEventListener('click',load,{once:true});
      view.querySelectorAll('[data-community-route]').forEach(button=>button.addEventListener('click',()=>onNavigate?.(button.dataset.communityRoute),{once:true}));
    };
    const actions=state=>`<section class="bq-community-grid">${communityActions.map(action=>`<button type="button" data-community-route="${action.route}" ${action.enabled(state)?'':'disabled'}><img class="bq-community-art" src="${action.art}" alt="" aria-hidden="true"><b>${esc(tx(action.title))}</b><small>${esc(tx(action.description))}</small></button>`).join('')}</section>`;
    const render=state=>{if(disposed)return;const intro=`<div class="bq-community-head"><div><p class="bq-eyebrow">${esc(tx('community.eyebrow'))}</p><h1>${esc(tx('community.intro.heading'))}</h1><p>${esc(tx('community.intro.description'))}</p></div><button type="button" class="bq-secondary-button" data-community-back>${esc(tx('community.backMore'))}</button></div>`;
      if(state.status==='signed-out')view.innerHTML=`${intro}<section class="bq-panel"><h2>${esc(tx('community.signedOut.heading'))}</h2><p>${esc(tx('community.signedOut.description'))}</p><button type="button" class="bq-primary-button" data-community-account>${esc(tx('community.openAccount'))}</button></section>${actions(state)}`;
      else if(state.status==='local-preview')view.innerHTML=`${intro}<section class="bq-panel"><h2>${esc(tx('community.localPreview.heading'))}</h2><p>${esc(tx('community.localPreview.description'))}</p></section>${actions(state)}`;
      else view.innerHTML=`${intro}${actions(state)}${readyView(state,tx)}<section class="bq-panel bq-community-boundary"><h2>${esc(tx('community.boundary.heading'))}</h2><p>${esc(tx('community.boundary.description'))}</p></section>`;bind()};
    async function load(){if(busy||disposed)return;busy=true;view.innerHTML=`<p class="bq-eyebrow">${esc(tx('community.eyebrow'))}</p><h1 role="status">${esc(tx('community.loading'))}</h1>`;try{render(await bridge.load())}catch(error){if(disposed)return;view.innerHTML=`<p class="bq-eyebrow">${esc(tx('community.eyebrow'))}</p><h1>${esc(tx('community.error.heading'))}</h1><p class="bq-form-message" role="alert">${esc(error?.message||tx('community.error.fallback'))}</p><button type="button" class="bq-secondary-button" data-community-retry>${esc(tx('common.retry'))}</button><button type="button" class="bq-secondary-button" data-community-back>${esc(tx('community.backMore'))}</button>`;bind()}finally{busy=false}}
    void load();return()=>{disposed=true};
  }};
}
