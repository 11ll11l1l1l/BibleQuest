(() => {
  const CLOUD='biblequest_cloud_v1';
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const cloud=()=>{try{return JSON.parse(localStorage.getItem(CLOUD)||'{}')}catch{return {}}};
  const cid=()=>cloud().activeCongregationId||'';
  const account=()=>window.BQAccount,client=()=>account()?.client?.()||window.BQ_SUPABASE_CLIENT||null,session=()=>account()?.session?.()||null;
  const leaders=new Set(['facilitator','leader','pastor','admin']);
  let role='',teams=[],teamMembers=[],members=[],message='',scheduled=false;

  function layer(){let x=document.getElementById('bqTeamLayer');if(!x){x=document.createElement('div');x.id='bqTeamLayer';x.className='completion-layer hidden';document.body.appendChild(x)}return x}
  function close(){layer().classList.add('hidden');document.body.classList.remove('completion-open')}
  const canManage=()=>leaders.has(role);
  const glyph=a=>window.BQAvatar?.glyph?.(a)||'🙂';
  const member=id=>members.find(x=>x.user_id===id)||{display_name:'Member',avatar:{},role:'member'};
  const teamRows=id=>teamMembers.filter(x=>x.team_id===id);

  async function invoke(body){const r=await client().functions.invoke('bq-team',{body:{congregationId:cid(),...body}});if(r.error)throw r.error;if(r.data?.error)throw new Error(r.data.error);return r.data}

  async function load(){
    const c=client(),s=session(),congregationId=cid();
    if(!c||!s||!congregationId){role='';teams=[];teamMembers=[];members=[];return render()}
    const own=await c.from('bible_congregation_members').select('role').eq('congregation_id',congregationId).eq('user_id',s.user.id).eq('active',true).maybeSingle();if(own.error)throw own.error;role=own.data?.role||'member';
    const [t,m]=await Promise.all([
      c.from('bible_teams').select('id,congregation_id,created_by,team_type,name,active,created_at').eq('congregation_id',congregationId).eq('active',true).order('name'),
      c.from('bible_congregation_members').select('user_id,display_name,avatar,role').eq('congregation_id',congregationId).eq('active',true).order('display_name')
    ]);if(t.error)throw t.error;if(m.error)throw m.error;teams=t.data||[];members=m.data||[];
    const ids=teams.map(x=>x.id);teamMembers=[];if(ids.length){const tm=await c.from('bible_team_members').select('team_id,user_id,joined_at').in('team_id',ids);if(tm.error)throw tm.error;teamMembers=tm.data||[]}
    render();syncAssignmentTeams();
  }

  function teamCard(t){
    const rows=teamRows(t.id),ids=new Set(rows.map(x=>x.user_id)),available=members.filter(x=>!ids.has(x.user_id));
    return `<article class="assignment-card"><div class="assignment-icon">🧩</div><div class="assignment-main"><div class="assignment-meta"><span>CLOUD TEAM</span><span>${rows.length} member${rows.length===1?'':'s'}</span></div><h3>${esc(t.name)}</h3><div class="cloud-members">${rows.map(x=>{const p=member(x.user_id);return `<span>${glyph(p.avatar)} ${esc(p.display_name||'Member')} · ${esc(p.role||'member')}${canManage()&&x.user_id!==t.created_by?` <button type="button" data-team-remove="${t.id}" data-user="${x.user_id}" aria-label="Remove ${esc(p.display_name||'member')}">×</button>`:''}</span>`}).join('')||'<span>No members yet</span>'}</div>${canManage()?`<form class="assignment-submit" data-team-add="${t.id}"><label>Add congregation member<select name="user" ${available.length?'':'disabled'}>${available.length?available.map(p=>`<option value="${p.user_id}">${esc(p.display_name)} · ${esc(p.role)}</option>`).join(''):'<option>Everyone is already on this team</option>'}</select></label><div><button ${available.length?'':'disabled'}>Add member</button>${t.created_by===session()?.user?.id||role==='admin'?`<button type="button" class="secondary" data-team-archive="${t.id}">Archive</button>`:''}</div></form>`:''}</div></article>`
  }

  function render(error=''){
    const x=layer(),signed=Boolean(client()&&session()),congregationId=cid();
    let body='';
    if(!signed)body='<div class="completion-empty"><span>🔐</span><b>Sign in to manage cloud teams.</b></div>';
    else if(!congregationId)body='<div class="completion-empty"><span>⛪</span><b>Join a congregation first.</b><p>Teams are scoped to one congregation.</p></div>';
    else body=`<section class="completion-hero assignment-hero"><small>CLOUD TEAMS</small><h1>Reusable teams for assignments.</h1><p>Create a team once, add congregation members, then target that team from Assignments & Tasks. Journey Groups remain separate small-group relationships.</p></section>${message?`<div class="completion-message">${esc(message)}</div>`:''}${error?`<div class="completion-message error">${esc(error)}</div>`:''}${canManage()?`<form class="assignment-create" data-team-create><label>New team name<input name="name" maxlength="60" placeholder="Youth Team A" required></label><button>Create team</button></form>`:'<div class="privacy-note"><b>View only</b><p>Facilitators, leaders, pastors and congregation admins manage team membership.</p></div>'}<div class="completion-section"><h2>Active teams</h2><small>${teams.length}</small></div><section class="assignment-list">${teams.length?teams.map(teamCard).join(''):'<div class="completion-empty"><span>🧩</span><b>No cloud teams yet.</b><p>A leader can create the first team here.</p></div>'}</section>`;
    x.innerHTML=`<main class="completion-shell assignment-shell"><header class="completion-top"><button data-team-close>← BibleQuest</button><b>Cloud Teams</b><span>🧩</span></header>${body}</main>`;
    x.classList.remove('hidden');document.body.classList.add('completion-open');bind();x.scrollTop=0;
  }

  function bind(){
    const x=layer();x.querySelector('[data-team-close]')?.addEventListener('click',close);
    x.querySelector('[data-team-create]')?.addEventListener('submit',e=>{e.preventDefault();const name=new FormData(e.currentTarget).get('name');invoke({action:'create',name}).then(()=>{message='Team created.';return load()}).catch(err=>render(err.message||String(err)))});
    x.querySelectorAll('[data-team-add]').forEach(f=>f.addEventListener('submit',e=>{e.preventDefault();const targetUserId=new FormData(e.currentTarget).get('user');invoke({action:'add',teamId:f.dataset.teamAdd,targetUserId}).then(()=>{message='Member added.';return load()}).catch(err=>render(err.message||String(err)))}));
    x.querySelectorAll('[data-team-remove]').forEach(b=>b.addEventListener('click',()=>invoke({action:'remove',teamId:b.dataset.teamRemove,targetUserId:b.dataset.user}).then(()=>{message='Member removed.';return load()}).catch(err=>render(err.message||String(err)))));
    x.querySelectorAll('[data-team-archive]').forEach(b=>b.addEventListener('click',()=>{if(!confirm('Archive this team? Existing assignment history stays intact.'))return;invoke({action:'archive',teamId:b.dataset.teamArchive}).then(()=>{message='Team archived.';return load()}).catch(err=>render(err.message||String(err))) }));
  }

  async function open(){message='';try{await load()}catch(err){render(err.message||String(err))}}

  async function teamOptions(){const c=client(),congregationId=cid();if(!c||!congregationId)return [];const r=await c.from('bible_teams').select('id,name,team_type').eq('congregation_id',congregationId).eq('active',true).order('name');if(r.error)throw r.error;return r.data||[]}
  async function populateTeamTarget(scope,target,wrap){
    if(scope.value!=='team')return;const rows=await teamOptions();wrap.classList.remove('hidden');target.innerHTML=rows.length?rows.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join(''):'<option value="">No cloud team available</option>';
    let note=wrap.querySelector('[data-team-target-note]');if(!note){note=document.createElement('small');note.dataset.teamTargetNote='1';wrap.appendChild(note)}note.textContent=rows.length?'Manage membership in Cloud Teams.':'Create a Cloud Team before targeting one.';
  }
  function syncAssignmentTeams(){
    const root=document.getElementById('bqAssignmentLayer');if(!root||root.classList.contains('hidden'))return;const scope=root.querySelector('[data-assignment-scope]'),target=root.querySelector('[data-assignment-target]'),wrap=root.querySelector('[data-assignment-target-wrap]');if(!scope||!target||!wrap)return;
    if(!scope.dataset.cloudTeamBound){scope.dataset.cloudTeamBound='1';scope.addEventListener('change',()=>{if(scope.value==='team')populateTeamTarget(scope,target,wrap).catch(()=>{});else wrap.querySelector('[data-team-target-note]')?.remove()})}
    if(scope.value==='team')populateTeamTarget(scope,target,wrap).catch(()=>{});
    const form=root.querySelector('[data-assignment-create]');if(form&&!form.querySelector('[data-manage-cloud-teams]')){const b=document.createElement('button');b.type='button';b.className='secondary';b.dataset.manageCloudTeams='1';b.textContent='🧩 Manage Cloud Teams';b.onclick=open;form.appendChild(b)}
  }

  function injectTogether(){const sheet=document.getElementById('bqModernSheet');if(!sheet||sheet.classList.contains('hidden'))return;const title=sheet.querySelector('.modern-sheet-head h2')?.textContent?.trim();if(title!=='Together')return;const list=sheet.querySelector('.modern-sheet-list');if(!list||list.querySelector('[data-cloud-teams-open]'))return;const b=document.createElement('button');b.dataset.cloudTeamsOpen='1';b.innerHTML='<span>🧩</span><div><b>Cloud Teams</b><small>Create assignment teams and manage members</small></div><i>›</i>';b.onclick=()=>{sheet.classList.add('hidden');document.body.classList.remove('modern-sheet-open');open()};list.appendChild(b)}
  async function injectRoster(){const x=document.getElementById('bqCommunityLayer');if(!x||x.classList.contains('hidden')||!x.querySelector('.roster-head small'))return;if(!/CLOUD MEMBERSHIP/i.test(x.querySelector('.roster-head small').textContent||''))return;const own=await client()?.from('bible_congregation_members').select('role').eq('congregation_id',cid()).eq('user_id',session()?.user?.id||'').eq('active',true).maybeSingle();if(!leaders.has(own?.data?.role||''))return;const head=x.querySelector('.roster-head');if(head&&!head.querySelector('[data-cloud-teams-open]')){const b=document.createElement('button');b.dataset.cloudTeamsOpen='1';b.textContent='🧩 Manage Cloud Teams';b.onclick=open;head.appendChild(b)}}

  function schedule(){if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;syncAssignmentTeams();injectTogether();injectRoster().catch(()=>{})})}
  const obs=new MutationObserver(schedule);obs.observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('DOMContentLoaded',schedule);setTimeout(schedule,500);
  window.BQTeams={open,refresh:load,options:teamOptions};
})();
