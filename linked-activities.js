(() => {
  const CLOUD='biblequest_cloud_v1';
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const parse=()=>{try{return JSON.parse(localStorage.getItem(CLOUD)||'{}')}catch{return {}}};
  const cid=()=>parse().activeCongregationId||'';
  const account=()=>window.BQAccount;
  const client=()=>account()?.client?.()||window.BQ_SUPABASE_CLIENT||null;
  const session=()=>account()?.session?.()||null;
  let originalRoster=null,scheduled=false,labelBusy=false;

  function communityLayer(){
    let x=document.getElementById('bqCommunityLayer');
    if(!x){x=document.createElement('div');x.id='bqCommunityLayer';x.className='community-layer hidden';document.body.appendChild(x)}
    return x;
  }

  async function openCloudRoster(){
    const c=client(),s=session(),congregationId=cid();
    if(!c||!s||!congregationId){if(originalRoster)return originalRoster();return window.BQCommunity?.open?.()}
    const [cong,rows]=await Promise.all([
      c.from('bible_congregations').select('id,name,timezone').eq('id',congregationId).single(),
      c.from('bible_congregation_members').select('user_id,display_name,avatar,role,joined_at').eq('congregation_id',congregationId).eq('active',true).order('display_name')
    ]);
    if(cong.error)throw cong.error;if(rows.error)throw rows.error;
    const members=rows.data||[],x=communityLayer(),glyph=a=>window.BQAvatar?.glyph?.(a)||'🙂';
    const roleLabel=r=>({admin:'Congregation Admin',pastor:'Pastor',leader:'Leader',facilitator:'Facilitator',member:'Member'})[r]||'Member';
    x.innerHTML=`<main class="community-app"><header class="community-top"><button data-cloud-roster-back>← Community</button><b>Congregation Roster</b><span>☁️</span></header><section class="roster-head"><small>CLOUD MEMBERSHIP</small><h1>${esc(cong.data?.name||'Your congregation')}</h1><p>${members.length} active member${members.length===1?'':'s'}. This is the signed-in congregation roster, not the one-device play roster.</p></section><section class="roster-list">${members.map(m=>`<article><div class="roster-person ${m.user_id===s.user.id?'active':''}"><span>${glyph(m.avatar)}</span><div><b>${esc(m.display_name||'Member')}${m.user_id===s.user.id?' · you':''}</b><small>${esc(roleLabel(m.role))}${m.joined_at?` · joined ${new Date(m.joined_at).toLocaleDateString()}`:''}</small></div></div></article>`).join('')||'<div class="empty-board">No active congregation members.</div>'}</section><div class="community-note"><b>Privacy</b><p>This roster shows preferred display name, avatar and congregation role only. It does not expose email, passwords, private notes or account recovery information.</p></div></main>`;
    x.classList.remove('hidden');document.body.classList.add('community-open');x.scrollTop=0;
    x.querySelector('[data-cloud-roster-back]')?.addEventListener('click',()=>window.BQCommunity?.open?.());
  }

  function patchRoster(){
    const api=window.BQCommunity;if(!api||api.__cloudRosterPatched)return;
    originalRoster=api.openRoster?.bind(api)||null;
    api.openRoster=()=>openCloudRoster().catch(err=>{console.warn('BibleQuest cloud roster:',err);originalRoster?.()});
    api.__cloudRosterPatched=true;
  }

  async function journeyGroups(){
    const c=client(),congregationId=cid();if(!c||!congregationId)return [];
    const r=await c.from('bible_groups').select('id,name').eq('congregation_id',congregationId).eq('active',true).order('name');
    if(r.error)throw r.error;return r.data||[];
  }

  async function populateJourneyGroupTarget(select,wrap){
    const groups=await journeyGroups();
    wrap?.classList.remove('hidden');
    select.innerHTML=groups.length?groups.map(g=>`<option value="${esc(g.id)}">${esc(g.name)}</option>`).join(''):'<option value="">No Journey Group available</option>';
    let note=wrap?.querySelector('[data-group-target-note]');if(!note&&wrap){note=document.createElement('small');note.dataset.groupTargetNote='1';wrap.appendChild(note)}
    if(note)note.textContent=groups.length?'Only active members of the selected Journey Group will receive this assignment.':'Create or join a Journey Group before targeting one.';
  }

  function enhanceAssignmentForm(){
    const root=document.getElementById('bqAssignmentLayer');if(!root||root.classList.contains('hidden'))return;
    const scope=root.querySelector('[data-assignment-scope]'),target=root.querySelector('[data-assignment-target]'),wrap=root.querySelector('[data-assignment-target-wrap]');
    if(scope&&target&&wrap){
      if(!scope.querySelector('option[value="group"]')){const o=document.createElement('option');o.value='group';o.textContent='One Journey Group';const team=scope.querySelector('option[value="team"]');scope.insertBefore(o,team||null)}
      if(!scope.dataset.linkedGroupBound){scope.dataset.linkedGroupBound='1';scope.addEventListener('change',()=>{if(scope.value==='group')populateJourneyGroupTarget(target,wrap).catch(err=>console.warn('BibleQuest group target:',err));else wrap.querySelector('[data-group-target-note]')?.remove()})}
      if(scope.value==='group')populateJourneyGroupTarget(target,wrap).catch(()=>{});
    }
    const type=root.querySelector('[data-assignment-create] select[name="type"]');
    if(type){const couples=type.querySelector('option[value="couples"]'),group=type.querySelector('option[value="group"]');if(couples)couples.textContent='Couple Journey (linked accounts)';if(group)group.textContent='Journey Group activity'}
    refreshGroupLabels().catch(()=>{});
  }

  async function refreshGroupLabels(){
    if(labelBusy)return;const root=document.getElementById('bqAssignmentLayer'),c=client();if(!root||!c)return;
    const cards=[...root.querySelectorAll('.assignment-card')];if(!cards.length)return;
    const ids=[...new Set(cards.map(card=>card.querySelector('[data-assignment-start],[data-assignment-complete],[data-assignment-archive]')?.dataset.assignmentStart||card.querySelector('[data-assignment-complete]')?.dataset.assignmentComplete||card.querySelector('[data-assignment-archive]')?.dataset.assignmentArchive).filter(Boolean))];
    if(!ids.length)return;labelBusy=true;
    try{
      const a=await c.from('bible_assignments').select('id,target_scope,target_id').in('id',ids);if(a.error)return;
      const groupRows=(a.data||[]).filter(x=>x.target_scope==='group'&&x.target_id),groupIds=[...new Set(groupRows.map(x=>x.target_id))];if(!groupIds.length)return;
      const g=await c.from('bible_groups').select('id,name').in('id',groupIds);const names=new Map((g.data||[]).map(x=>[x.id,x.name]));const byId=new Map((a.data||[]).map(x=>[x.id,x]));
      cards.forEach(card=>{const b=card.querySelector('[data-assignment-start],[data-assignment-complete],[data-assignment-archive]'),id=b?.dataset.assignmentStart||b?.dataset.assignmentComplete||b?.dataset.assignmentArchive,row=byId.get(id);if(row?.target_scope!=='group')return;const spans=card.querySelectorAll('.assignment-meta span');if(spans[1])spans[1].textContent=names.get(row.target_id)||'Journey Group'});
    }finally{labelBusy=false}
  }

  function closeAssignments(){const x=document.getElementById('bqAssignmentLayer');x?.classList.add('hidden');document.body.classList.remove('completion-open')}
  async function launchLinkedAssignment(button){
    const type=button.dataset.type,id=button.dataset.assignmentStart,c=client(),s=session(),congregationId=cid();if(!c||!s||!congregationId)return;
    const r=await c.functions.invoke('bq-assignment',{body:{action:'start',congregationId,assignmentId:id}});if(r.error)throw r.error;
    account()?.track?.('leader_assignment','started',{assignment_id:id,assignment_type:type,linked_activity:true}).catch?.(()=>{});
    closeAssignments();
    setTimeout(()=>{if(type==='couples')window.BQCoupleCloud?.open?.();else window.BQJourneyGroups?.open?.()},40);
  }

  function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;patchRoster();enhanceAssignmentForm()})}

  document.addEventListener('click',e=>{
    const roster=e.target.closest?.('[data-community-roster]');
    if(roster&&client()&&session()&&cid()){e.preventDefault();e.stopImmediatePropagation();openCloudRoster().catch(err=>console.warn('BibleQuest cloud roster:',err));return}
    const start=e.target.closest?.('[data-assignment-start]');
    if(start&&['couples','group'].includes(start.dataset.type||'')){e.preventDefault();e.stopImmediatePropagation();launchLinkedAssignment(start).catch(err=>alert(err.message||String(err)))}
  },true);

  const obs=new MutationObserver(schedule);obs.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',schedule);setTimeout(schedule,300);
  window.BQLinkedActivities={openCloudRoster,enhanceAssignmentForm,refreshGroupLabels};
})();
