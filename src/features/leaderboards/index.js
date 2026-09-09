const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const rankLabel=rank=>rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':`#${rank}`;
function boardRows(state){
  if(!state.rows.length)return '<section class="bq-account-section"><h2>No participants yet</h2><p>No active congregation members are available for this board.</p></section>';
  return `<section class="bq-account-section" aria-label="Leaderboard rankings"><ol class="bq-team-member-list">${state.rows.map(row=>`<li data-leaderboard-user="${esc(row.userId)}"><span><b>${rankLabel(row.rank)} ${esc(row.displayName)}</b><small>${state.lane==='overall'?'All scored activities':esc(state.lanes.find(lane=>lane.id===state.lane)?.label||state.lane)}</small></span><strong>${esc(row.points)} pts</strong></li>`).join('')}</ol></section>`;
}
export function leaderboardsPage({leaderboards,onAccount,onBack}={}){
  return{title:'Leaderboards',html:'<section class="bq-panel" data-leaderboards-view></section>',mount(root){
    const view=root.querySelector('[data-leaderboards-view]');let busy=false,disposed=false;
    const back=()=>'<button type="button" class="bq-secondary-button" data-leaderboards-back>Back to Community</button>';
    const bindCommon=()=>{view.querySelector('[data-leaderboards-back]')?.addEventListener('click',()=>onBack?.(),{once:true});view.querySelector('[data-leaderboards-account]')?.addEventListener('click',()=>onAccount?.(),{once:true});view.querySelector('[data-leaderboards-retry]')?.addEventListener('click',()=>load(),{once:true})};
    const renderSignedOut=(remoteAvailable=true)=>{view.innerHTML=`<p class="bq-eyebrow">LOCAL CONGREGATION BOARD</p><h1>Leaderboards</h1><p>${remoteAvailable?'Sign in to view your congregation leaderboard.':'Leaderboards are unavailable in local preview because rankings are congregation cloud data.'}</p>${remoteAvailable?'<button type="button" class="bq-primary-button" data-leaderboards-account>Open account</button>':''}${back()}`;bindCommon()};
    const bindFilters=()=>{
      view.querySelector('[data-leaderboard-congregation]')?.addEventListener('change',event=>load({congregationId:event.target.value}),{once:true});
      view.querySelectorAll('[data-leaderboard-period]').forEach(button=>button.addEventListener('click',()=>load({period:button.dataset.leaderboardPeriod}),{once:true}));
      view.querySelectorAll('[data-leaderboard-lane]').forEach(button=>button.addEventListener('click',()=>load({lane:button.dataset.leaderboardLane}),{once:true}));
    };
    const render=state=>{
      if(disposed)return;
      if(!state.authenticated||!state.remoteAvailable)return renderSignedOut(state.remoteAvailable);
      const congregationSelect=state.congregations.length>1?`<label>Congregation<select data-leaderboard-congregation>${state.congregations.map(row=>`<option value="${esc(row.id)}" ${row.id===state.congregationId?'selected':''}>${esc(row.name)}</option>`).join('')}</select></label>`:'';
      view.innerHTML=`<div class="bq-team-center-head"><div><p class="bq-eyebrow">LOCAL CONGREGATION BOARD</p><h1>${esc(state.congregationName||'Leaderboards')}</h1><p>Learning and participation points only. Rankings do not measure spiritual worth.</p></div>${back()}</div>${state.congregations.length?`<section class="bq-account-section"><div class="bq-account-form">${congregationSelect}</div><div class="bq-account-actions">${state.periods.map(row=>`<button type="button" class="${row.id===state.period?'bq-primary-button':'bq-secondary-button'}" data-leaderboard-period="${esc(row.id)}">${esc(row.label)}</button>`).join('')}</div><div class="bq-account-actions">${state.lanes.map(row=>`<button type="button" class="${row.id===state.lane?'bq-primary-button':'bq-secondary-button'}" data-leaderboard-lane="${esc(row.id)}">${esc(row.label)}</button>`).join('')}</div></section>${boardRows(state)}`:'<section class="bq-account-section"><h2>No congregation yet</h2><p>Join an active congregation before viewing local rankings.</p></section>'}`;bindCommon();bindFilters();
    };
    async function load(overrides={}){if(busy||disposed)return;busy=true;const previous=leaderboards.snapshot();view.innerHTML='<p class="bq-eyebrow">LOCAL CONGREGATION BOARD</p><h1>Leaderboards</h1><p role="status">Loading rankings…</p>';try{render(await leaderboards.load({congregationId:overrides.congregationId??previous.congregationId,period:overrides.period??previous.period,lane:overrides.lane??previous.lane}))}catch(error){if(disposed)return;if(error?.code==='BQ_LEADERBOARD_AUTH_REQUIRED'||error?.code==='BQ_LEADERBOARD_REMOTE_DISABLED')renderSignedOut(error?.code!=='BQ_LEADERBOARD_REMOTE_DISABLED');else{view.innerHTML=`<p class="bq-eyebrow">LOCAL CONGREGATION BOARD</p><h1>Leaderboards</h1><p class="bq-form-message" role="alert">${esc(error?.message||'Leaderboards could not load.')}</p><button type="button" class="bq-secondary-button" data-leaderboards-retry>Try again</button>${back()}`;bindCommon()}}finally{busy=false}}
    void load();return()=>{disposed=true;busy=false};
  }};
}
