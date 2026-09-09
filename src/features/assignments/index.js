const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const labels=Object.freeze({reading:'Reading','guided-study':'Guided Study',mission:'Mission',quiz:'Quiz',reflection:'Reflection',couples:'Couples',group:'Group activity',custom:'Custom'});
const ministryRoles=new Set(['facilitator','leader','pastor','admin']);
const statusLabel=status=>status==='completed'?'Completed':status==='started'?'Started':'Assigned';
const formatDate=value=>{if(!value)return'No deadline';try{return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(value))}catch{return String(value)}};

function listView(state){
  if(!state.assignments.length)return '<section class="bq-account-section"><h2>No active assignments</h2><p>No currently visible task has been assigned to this account in the selected congregation.</p></section>';
  return `<section class="bq-account-section"><h2>${ministryRoles.has(state.role)?'Congregation assignments':'Assigned to you'}</h2><div class="bq-team-member-list">${state.assignments.map(row=>`<article data-assignment-row="${esc(row.id)}"><span><b>${esc(row.title)}</b><small>${esc(labels[row.type]||row.type)} · ${esc(statusLabel(row.progress.status))} · ${esc(formatDate(row.dueAt))}</small></span><button type="button" class="bq-secondary-button" data-assignment-open="${esc(row.id)}">Open task</button></article>`).join('')}</div></section>`;
}

function detailView(state){
  const row=state.assignments.find(item=>item.id===state.activeId);if(!row)return'';
  const progress=row.progress,readOnly=ministryRoles.has(state.role),refs=row.scriptureRefs.length?`<div class="bq-account-actions" aria-label="Scripture references">${row.scriptureRefs.map(ref=>`<span class="bq-source-label">${esc(ref)}</span>`).join('')}</div>`:'';
  const response=progress.submission?`<div class="bq-form-message"><b>Your submitted response</b><p>${esc(progress.submission)}</p></div>`:'';
  const feedback=progress.leaderFeedback?`<div class="bq-form-message"><b>Leader feedback</b><p>${esc(progress.leaderFeedback)}</p></div>`:'';
  const start=!readOnly&&progress.status==='assigned'?`<button type="button" class="bq-secondary-button" data-assignment-start="${esc(row.id)}">Start task</button>`:'';
  const completion=!readOnly&&progress.status!=='completed'?`<form class="bq-account-form" data-assignment-complete="${esc(row.id)}"><label>Optional response to your leader<textarea name="submission" maxlength="4000" rows="4" placeholder="Share only what you intentionally want your leader to receive."></textarea></label><small>Your private Bible notes, journal, Transform answers and Couple Journey data are not attached.</small><button type="submit" class="bq-primary-button">Mark complete</button></form>`:'';
  const leaderNote=readOnly?'<p class="bq-form-message">This #73 surface is read-only for ministry roles. Leader assignment creation, review and administration belong to later assignment/ministry milestones.</p>':'';
  return `<section class="bq-account-section" data-assignment-detail="${esc(row.id)}"><div class="bq-team-center-head"><div><p class="bq-eyebrow">${esc(labels[row.type]||row.type)} · ${esc(statusLabel(progress.status))}</p><h2>${esc(row.title)}</h2></div><button type="button" class="bq-secondary-button" data-assignment-close>Close task</button></div>${row.instructions?`<p>${esc(row.instructions)}</p>`:'<p>No additional instructions were provided.</p>'}${refs}<p><b>Due:</b> ${esc(formatDate(row.dueAt))} · <b>Completion points:</b> ${esc(String(row.points))}</p>${leaderNote}<div class="bq-account-actions">${start}</div>${completion}${response}${feedback}</section>`;
}

export function assignmentsPage({assignments,onBack,onAccount}={}){
  return{title:'Assignments',html:'<section class="bq-panel" data-assignments-view></section>',mount(root){
    const view=root.querySelector('[data-assignments-view]');let disposed=false,busy=false,stopRemote=null,message='';
    const stopWatch=()=>{if(stopRemote){try{stopRemote()}catch{}stopRemote=null}assignments.stopSync?.()};
    const back=()=>'<button type="button" class="bq-secondary-button" data-assignments-back>Back to Community</button>';
    const bindCommon=()=>{view.querySelector('[data-assignments-back]')?.addEventListener('click',()=>onBack?.(),{once:true});view.querySelector('[data-assignments-account]')?.addEventListener('click',()=>onAccount?.(),{once:true});view.querySelector('[data-assignments-retry]')?.addEventListener('click',()=>load(),{once:true})};
    const render=state=>{
      if(disposed)return;
      if(state.status==='signed-out'){view.innerHTML=`<p class="bq-eyebrow">CONGREGATION TASKS</p><h1>Assignments</h1><p>Sign in to receive and complete congregation assignments across your devices.</p><button type="button" class="bq-primary-button" data-assignments-account>Open account</button>${back()}`;bindCommon();return}
      if(state.status==='local-preview'){view.innerHTML=`<p class="bq-eyebrow">CONGREGATION TASKS</p><h1>Assignments</h1><p>Assignments are cloud-backed and unavailable in local preview.</p>${back()}`;bindCommon();return}
      if(state.status==='no-congregation'){view.innerHTML=`<p class="bq-eyebrow">CONGREGATION TASKS</p><h1>Assignments</h1><p>Join an active congregation before receiving assignments.</p>${back()}`;bindCommon();return}
      const congregationSelect=state.congregations.length>1?`<label>Congregation<select data-assignment-congregation>${state.congregations.map(row=>`<option value="${esc(row.id)}" ${row.id===state.congregationId?'selected':''}>${esc(row.name)}</option>`).join('')}</select></label>`:'';
      view.innerHTML=`<div class="bq-team-center-head"><div><p class="bq-eyebrow">CONGREGATION TASKS</p><h1>${esc(state.congregationName||'Assignments')}</h1><p>Receive, open and complete tasks through your signed-in congregation account.</p></div>${back()}</div>${message?`<p class="bq-form-message" role="status">${esc(message)}</p>`:''}${congregationSelect?`<section class="bq-account-section"><div class="bq-account-form">${congregationSelect}</div></section>`:''}${listView(state)}${detailView(state)}<section class="bq-account-section"><h2>Privacy boundary</h2><p>Only the response you intentionally submit here is shared through assignment progress. Private study notes and other personal BibleQuest data stay outside Assignments.</p></section>`;
      bindCommon();
      view.querySelector('[data-assignment-congregation]')?.addEventListener('change',event=>{stopWatch();void load({congregationId:event.target.value})},{once:true});
      view.querySelectorAll('[data-assignment-open]').forEach(button=>button.addEventListener('click',()=>{message='';render(assignments.open(button.dataset.assignmentOpen))},{once:true}));
      view.querySelector('[data-assignment-close]')?.addEventListener('click',()=>{message='';render(assignments.close())},{once:true});
      view.querySelector('[data-assignment-start]')?.addEventListener('click',async event=>{if(busy)return;busy=true;message='';try{render(await assignments.start(event.currentTarget.dataset.assignmentStart));message='Task started.';render(assignments.snapshot())}catch(error){message=error?.message||'Task could not be started.';render(assignments.snapshot())}finally{busy=false}}, {once:true});
      view.querySelector('[data-assignment-complete]')?.addEventListener('submit',async event=>{event.preventDefault();if(busy)return;busy=true;message='';try{const id=event.currentTarget.dataset.assignmentComplete,submission=new FormData(event.currentTarget).get('submission')||'',result=await assignments.complete(id,submission);message=result.alreadyCompleted?'This task was already completed.':`Task completed${result.awarded?` · +${result.awarded} pts`:''}.`;render(result.state)}catch(error){message=error?.message||'Task could not be completed.';render(assignments.snapshot())}finally{busy=false}});
    };
    async function startWatch(){stopWatch();try{stopRemote=await assignments.watch((next,error)=>{if(disposed)return;if(error){message='Assignment status changed, but refresh failed. Use Retry.';render(assignments.snapshot());return}message='Assignment status synced.';render(next)})}catch{stopRemote=null}}
    async function load(overrides={}){if(busy||disposed)return;busy=true;message='';view.innerHTML='<p class="bq-eyebrow">CONGREGATION TASKS</p><h1>Assignments</h1><p role="status">Loading assignments…</p>';try{const state=await assignments.load(overrides);render(state);if(state.status==='ready')void startWatch()}catch(error){if(disposed)return;view.innerHTML=`<p class="bq-eyebrow">CONGREGATION TASKS</p><h1>Assignments</h1><p class="bq-form-message" role="alert">${esc(error?.message||'Assignments could not load.')}</p><button type="button" class="bq-secondary-button" data-assignments-retry>Try again</button>${back()}`;bindCommon()}finally{busy=false}}
    void load();return()=>{disposed=true;stopWatch();assignments.close?.()};
  }};
}
