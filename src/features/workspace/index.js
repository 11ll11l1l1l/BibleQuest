const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));
const reference=note=>`${note.book||'Bible'} ${note.chapter||1}${note.verseStart?`:${note.verseStart}${note.verseEnd?`–${note.verseEnd}`:''}`:''}`;

function noteRows(items){
  if(!items.length)return '<p data-workspace-empty>No cloud notes are available in this view.</p>';
  return items.map(note=>`<article class="bq-panel" data-workspace-note="${esc(note.id)}"><p class="bq-eyebrow">${esc(note.noteType||'NOTE')}${note.isPinned?' · PINNED':''}</p><h3>${esc(note.title||reference(note))}</h3><p><b>${esc(reference(note))}</b></p><p>${esc(note.content)}</p><div class="bq-reader-nav"><button type="button" class="bq-secondary-button" data-workspace-open-scripture="${esc(note.id)}">Open Scripture</button><button type="button" class="bq-secondary-button" data-workspace-cloud-notes>Open Cloud Notes</button></div></article>`).join('');
}

function memberships(state){
  if(state.membershipError)return `<p class="bq-form-message" data-workspace-membership-error>${esc(state.membershipError)}</p><p>Workspace remains private; role lookup failure does not grant sharing.</p>`;
  if(!state.memberships.length)return '<p>No active congregation role is required for this private Workspace.</p>';
  return state.memberships.map(row=>`<div class="bq-community-row" data-workspace-membership="${esc(row.congregationId)}"><div><p class="bq-eyebrow">${esc(row.roleLabel)}</p><b>${esc(row.name)}</b></div><span>${row.roleKnown?'Private only':'Unsupported role · no access expansion'}</span></div>`).join('');
}

export function workspacePage({workspace,onNavigate,onBack,onAccount}={}){
  return {title:'Bible Workspace',html:'<section class="bq-community" data-workspace-view></section>',mount(root){
    const host=root.querySelector('[data-workspace-view]');let disposed=false,busy=false,results=null,query='';
    const intro=()=>`<div class="bq-community-head"><div><p class="bq-eyebrow">PRIVATE STUDY</p><h1>Bible Workspace</h1><p>Your Workspace composes verified Cloud Notes and Reader state without creating another data owner.</p></div><button type="button" class="bq-secondary-button" data-workspace-back>Back to More</button></div>`;
    const bind=()=>{
      host.querySelector('[data-workspace-back]')?.addEventListener('click',()=>onBack?.(),{once:true});
      host.querySelector('[data-workspace-account]')?.addEventListener('click',()=>onAccount?.(),{once:true});
      host.querySelector('[data-workspace-retry]')?.addEventListener('click',load,{once:true});
      host.querySelectorAll('[data-workspace-tab]').forEach(button=>button.addEventListener('click',()=>{results=null;query='';workspace.saveView(button.dataset.workspaceTab);render(workspace.snapshot())},{once:true}));
      host.querySelectorAll('[data-workspace-cloud-notes]').forEach(button=>button.addEventListener('click',()=>onNavigate?.(workspace.cloudNotesRoute()),{once:true}));
      host.querySelector('[data-workspace-reader]')?.addEventListener('click',()=>onNavigate?.(workspace.readerRoute()),{once:true});
      host.querySelectorAll('[data-workspace-open-scripture]').forEach(button=>button.addEventListener('click',()=>{try{onNavigate?.(workspace.openScripture(button.dataset.workspaceOpenScripture))}catch(error){const node=host.querySelector('[data-workspace-message]');if(node)node.textContent=error?.message||'Could not open Scripture.'}},{once:true}));
      host.querySelector('[data-workspace-search]')?.addEventListener('submit',event=>{event.preventDefault();query=String(new FormData(event.currentTarget).get('query')||'').trim();results=workspace.search(query);render(workspace.snapshot())},{once:true});
    };
    const render=state=>{
      if(disposed)return;
      if(state.status==='signed-out')host.innerHTML=`${intro()}<section class="bq-panel"><h2>Sign in to use your private Workspace</h2><p>Cloud study material is not loaded in guest mode.</p><button type="button" class="bq-primary-button" data-workspace-account>Open account</button></section>`;
      else if(state.status==='unavailable')host.innerHTML=`${intro()}<section class="bq-panel"><h2>Workspace cloud content is unavailable</h2><p>Local preview does not receive private account data.</p></section>`;
      else if(state.status==='ready'){
        const context=state.readerContext||{},view=state.view==='notes'?'notes':'overview',items=results??state.notes;
        const tabs=`<div class="bq-reader-nav" data-workspace-tabs><button type="button" class="bq-secondary-button" data-workspace-tab="overview" aria-pressed="${view==='overview'}">Overview</button><button type="button" class="bq-secondary-button" data-workspace-tab="notes" aria-pressed="${view==='notes'}">Cloud notes</button></div>`;
        const overview=`<section class="bq-panel" data-workspace-overview><p class="bq-eyebrow">WORKSPACE STATE</p><h2>${state.notes.length} cloud note${state.notes.length===1?'':'s'}</h2><p>Current Reader context: <b>${esc(context.book||'JHN')} ${Number(context.chapter)||1}</b> · ${esc(context.translation||'bsb')}</p><div class="bq-reader-nav"><button type="button" class="bq-primary-button" data-workspace-cloud-notes>Open Cloud Notes</button><button type="button" class="bq-secondary-button" data-workspace-reader>Open Reader</button></div></section><section class="bq-panel" data-workspace-role-boundary><p class="bq-eyebrow">ROLE / SESSION BOUNDARY</p><h2>Workspace stays private</h2>${memberships(state)}<p>No congregation role, including leader/pastor/admin, enables Workspace sharing or cross-user data.</p></section>`;
        const notes=`<section data-workspace-notes-view><section class="bq-panel"><p class="bq-eyebrow">CLOUD NOTES</p><h2>Search loaded private notes</h2><form data-workspace-search><label>Search notes<input name="query" value="${esc(query)}" maxlength="120" placeholder="Search title, note, book or tag"></label><button type="submit" class="bq-primary-button">Search</button></form>${results!==null?`<p>${items.length} result${items.length===1?'':'s'} for “${esc(query)}”.</p>`:''}<p class="bq-form-message" data-workspace-message aria-live="polite"></p></section>${noteRows(items)}</section>`;
        host.innerHTML=`${intro()}${tabs}${view==='overview'?overview:notes}<section class="bq-panel" data-workspace-legacy-boundary><p class="bq-eyebrow">RECOVERED SAFETY BOUNDARY</p><p>Legacy bookmark/highlight direct-table writes remain disabled until an authoritative storage/RLS contract is separately recovered and verified.</p></section>`;
      }else host.innerHTML=`${intro()}<section class="bq-panel"><h2>Workspace could not load</h2><p class="bq-form-message" role="alert">${esc(state.error||'Try again.')}</p><button type="button" class="bq-secondary-button" data-workspace-retry>Try again</button></section>`;
      bind();
    };
    async function load(){if(busy||disposed)return;busy=true;host.innerHTML='<p class="bq-eyebrow">PRIVATE STUDY</p><h1>Opening Bible Workspace…</h1>';try{render(await workspace.load())}catch{render(workspace.snapshot())}finally{busy=false}}
    void load();return()=>{disposed=true};
  }};
}
