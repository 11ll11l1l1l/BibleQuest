const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function toolCard(tool,{privileged=false}={}){
  const action=tool.available&&tool.route
    ?`<button type="button" class="bq-primary-button" data-ministry-route="${esc(tool.route)}" data-ministry-tool-action="${esc(tool.id)}">Open ${esc(tool.label)}</button>`
    :`<button type="button" class="bq-secondary-button" disabled aria-disabled="true" data-ministry-deferred="${esc(tool.id)}">Not available yet</button>`;
  return `<article class="bq-panel" data-ministry-tool="${esc(tool.id)}" data-ministry-status="${tool.available?'available':'deferred'}"${privileged?' data-ministry-privileged-tool':''}><p class="bq-eyebrow">${privileged?'MINISTRY ROLE':'CONGREGATION TOOL'}</p><h3>${esc(tool.label)}</h3><p>${esc(tool.description)}</p>${action}</article>`;
}

function membershipRows(state){
  if(!state.congregations.length)return '<p>No active congregation membership is available.</p>';
  return state.congregations.map(row=>`<article class="bq-community-row" data-ministry-membership="${esc(row.congregationId)}"><div><p class="bq-eyebrow">${esc(row.roleLabel)}</p><h3>${esc(row.name)}</h3></div><span>${row.canMinistry?'Ministry role':row.canRead?'Member access':'Role unavailable'}</span></article>`).join('');
}

export function ministryHubPage({hub,onNavigate,onBack,onAccount,onCongregation}={}){
  return {title:'Ministry Hub',html:'<section class="bq-community" data-ministry-hub-view></section>',mount(root){
    const view=root.querySelector('[data-ministry-hub-view]');let disposed=false,busy=false;
    const bind=()=>{
      view.querySelector('[data-ministry-back]')?.addEventListener('click',()=>onBack?.(),{once:true});
      view.querySelector('[data-ministry-account]')?.addEventListener('click',()=>onAccount?.(),{once:true});
      view.querySelector('[data-ministry-congregation]')?.addEventListener('click',()=>onCongregation?.(),{once:true});
      view.querySelector('[data-ministry-retry]')?.addEventListener('click',load,{once:true});
      view.querySelectorAll('[data-ministry-route]').forEach(button=>button.addEventListener('click',()=>onNavigate?.(button.dataset.ministryRoute),{once:true}));
    };
    const intro='<div class="bq-community-head"><div><p class="bq-eyebrow">ASSIGNMENTS & MINISTRY</p><h1>Ministry Hub</h1><p>Open verified congregation tools from one role-aware portal. Ministry visibility never replaces server authorization.</p></div><button type="button" class="bq-secondary-button" data-ministry-back>Back to More</button></div>';
    const render=state=>{
      if(disposed)return;
      if(state.status==='signed-out')view.innerHTML=`${intro}<section class="bq-panel"><h2>Sign in to open congregation tools</h2><p>The Ministry Hub does not invent local membership or ministry authority in guest mode.</p><button type="button" class="bq-primary-button" data-ministry-account>Open account</button></section>`;
      else if(!state.hasReadableMembership){view.innerHTML=`${intro}<section class="bq-panel"><h2>Congregation access is required</h2>${membershipRows(state)}<p>A missing or unsupported role fails closed and receives no congregation or ministry controls.</p><button type="button" class="bq-primary-button" data-ministry-congregation>Open congregation access</button></section>`;}
      else{
        const memberTools=state.memberTools.map(tool=>toolCard(tool)).join('');
        const ministry=state.canMinistry?`<section data-ministry-privileged><p class="bq-eyebrow">MINISTRY ROLE ACCESS</p><h2>Ministry role tools</h2><p>These controls are shown only from the existing congregation role projection. Trusted actions authorize again on the server.</p>${state.ministryTools.map(tool=>toolCard(tool,{privileged:true})).join('')}</section>`:`<section class="bq-panel" data-ministry-member-boundary><h2>Member access</h2><p>Ministry-only controls are hidden for ordinary member roles.</p></section>`;
        view.innerHTML=`${intro}<section class="bq-panel"><h2>Your congregation role</h2>${membershipRows(state)}</section><section data-ministry-member-tools><p class="bq-eyebrow">OPEN TO VALID MEMBERS</p><h2>Congregation tools</h2>${memberTools}</section>${ministry}<section class="bq-panel"><p class="bq-eyebrow">MILESTONE BOUNDARY</p><h2>Deferred tools stay deferred</h2><p>Live Rooms, Notification Center, Workspace, Linked Activities, legacy polls/calendar/media and a new Leader Dashboard are not implemented by Ministry Hub #76.</p></section>`;
      }
      bind();
    };
    async function load(){if(busy||disposed)return;busy=true;view.innerHTML='<p class="bq-eyebrow">ASSIGNMENTS & MINISTRY</p><h1>Opening Ministry Hub…</h1>';try{render(await hub.load())}catch(error){if(disposed)return;view.innerHTML=`${intro}<section class="bq-panel"><h2>Ministry Hub could not load.</h2><p class="bq-form-message" role="alert">${esc(error?.message||'Try again.')}</p><button type="button" class="bq-secondary-button" data-ministry-retry>Try again</button></section>`;bind()}finally{busy=false}}
    void load();return()=>{disposed=true};
  }};
}
