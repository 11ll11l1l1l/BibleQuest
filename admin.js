(() => {
  const cfg=window.BQ_CLOUD_CONFIG||{};
  const root=document.getElementById('adminApp');
  const roleChip=document.getElementById('adminRole');
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let client=null,session=null,adminRole='',users=[];

  function message(title,body,action=''){
    root.className='admin-message';
    root.innerHTML=`<h1>${esc(title)}</h1><p>${esc(body)}</p>${action}`;
  }
  function toast(text,error=false){
    document.querySelector('.admin-toast')?.remove();
    const el=document.createElement('div');el.className=`admin-toast${error?' error':''}`;el.textContent=text;document.body.appendChild(el);setTimeout(()=>el.remove(),3500);
  }
  function closeModal(){document.querySelector('.admin-modal-layer')?.remove()}
  function showResetCode(user,res){
    closeModal();
    const expires=new Date(res.expiresAt);
    const layer=document.createElement('div');layer.className='admin-modal-layer';
    layer.innerHTML=`<section class="admin-modal" role="dialog" aria-modal="true" aria-label="One-time password recovery code">
      <div class="admin-modal-kicker">ONE-TIME RECOVERY</div>
      <h2>${esc(user.name)} password reset</h2>
      <p>Give this code privately to the account owner. They must enter their <b>registered email address</b>, this code, and a new password.</p>
      <div class="admin-reset-code" data-reset-code>${esc(res.resetCode)}</div>
      <div class="admin-reset-meta">For ${esc(res.emailMasked||user.email)} · expires ${Number.isNaN(expires.getTime())?'in 15 minutes':expires.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} · maximum 5 failed attempts</div>
      <div class="admin-modal-actions"><button data-copy-code>Copy code</button><a href="${esc(res.resetUrl||'./reset.html')}" target="_blank" rel="noopener">Open reset page</a></div>
      <div class="admin-security-note"><b>Important:</b> this code is shown only now. BibleQuest stores only its SHA-256 hash. It is not based on the user's name and it is not their new password.</div>
      <button class="admin-modal-close" data-close-modal>Done</button>
    </section>`;
    document.body.appendChild(layer);
    layer.querySelector('[data-close-modal]').onclick=closeModal;
    layer.addEventListener('click',e=>{if(e.target===layer)closeModal()});
    layer.querySelector('[data-copy-code]').onclick=async e=>{try{await navigator.clipboard.writeText(res.resetCode);e.currentTarget.textContent='Copied'}catch{toast('Copy failed. Select the code manually.',true)}};
  }
  async function invoke(body){
    const current=(await client.auth.getSession()).data.session;
    if(!current?.access_token)throw new Error('Your session expired. Sign in again.');
    const r=await fetch(`${cfg.supabaseUrl}/functions/v1/bq-admin`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${current.access_token}`,'apikey':cfg.publishableKey},body:JSON.stringify(body)});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.error||`Admin request failed (${r.status})`);
    return data;
  }
  const roleLabel=r=>({owner:'Owner',admin:'Admin',pastor:'Pastor',leader:'Leader',member:'Member'}[r]||r);
  const roleNote=r=>({owner:'Full site authority. Cannot be changed by an admin.',admin:'Can manage users, password recovery, leaders and pastors.',pastor:'Ministry role. No account-admin or password access.',leader:'Leader tools only. No account-admin or password access.',member:'Regular BibleQuest access.'}[r]||'');
  function roleOptions(current){
    const allowed=adminRole==='owner'?['member','leader','pastor','admin','owner']:['member','leader','pastor'];
    return allowed.map(r=>`<option value="${r}" ${r===current?'selected':''}>${roleLabel(r)}</option>`).join('');
  }
  function congregationOptions(current){
    const roles=adminRole==='owner'?['member','facilitator','leader','pastor','admin']:['member','facilitator','leader','pastor'];
    return roles.map(r=>`<option value="${r}" ${r===current?'selected':''}>${r[0].toUpperCase()+r.slice(1)}</option>`).join('');
  }
  function relative(iso){if(!iso)return 'Never';const d=new Date(iso);if(Number.isNaN(d.getTime()))return 'Unknown';const days=Math.floor((Date.now()-d.getTime())/86400000);if(days<=0)return 'Today';if(days===1)return 'Yesterday';if(days<30)return `${days} days ago`;return d.toLocaleDateString();}

  function render(){
    const term=(root.querySelector('[data-admin-search]')?.value||'').toLowerCase();
    const filtered=users.filter(u=>`${u.name} ${u.email} ${u.role}`.toLowerCase().includes(term));
    const counts={owner:0,admin:0,pastor:0,leader:0};users.forEach(u=>{if(counts[u.role]!==undefined)counts[u.role]++});
    root.className='';
    root.innerHTML=`
      <section class="admin-toolbar">
        <input class="admin-search" data-admin-search placeholder="Search name, email or role…" value="${esc(term)}">
        <button class="admin-refresh" data-admin-refresh>Refresh</button>
      </section>
      <section class="admin-summary">
        <div class="admin-stat"><b>${users.length}</b><span>Users</span></div>
        <div class="admin-stat"><b>${counts.pastor}</b><span>Pastors</span></div>
        <div class="admin-stat"><b>${counts.leader}</b><span>Leaders</span></div>
        <div class="admin-stat"><b>${counts.admin+counts.owner}</b><span>Site admins</span></div>
      </section>
      <section class="admin-users">${filtered.map(userCard).join('')||'<div class="admin-empty">No matching users.</div>'}</section>`;
    bind();
  }
  function userCard(u){
    const isSelf=u.id===session.user.id;
    const lockedByAdmin=adminRole!=='owner'&&['admin','owner'].includes(u.role);
    const disableRole=(isSelf&&u.role==='owner')||lockedByAdmin;
    return `<article class="admin-user" data-user="${esc(u.id)}">
      <div class="admin-user-main">
        <b>${esc(u.name||'Member')}</b><small>${esc(u.email||'No email')}</small>
        <div class="admin-meta">Joined ${relative(u.createdAt)} · Last sign-in ${relative(u.lastSignInAt||u.lastActiveAt)}</div>
      </div>
      <div class="admin-rolebox">
        <label>App access
          <select data-role-user="${esc(u.id)}" ${disableRole?'disabled':''}>${roleOptions(u.role)}</select>
        </label>
        <div class="role-note">${esc(roleNote(u.role))}</div>
      </div>
      <div class="admin-actions">
        <button class="admin-reset" data-reset-user="${esc(u.id)}" ${!u.email?'disabled':''}>Generate reset code</button>
      </div>
      ${(u.memberships||[]).length?`<div class="memberships"><div class="memberships-title">Congregation permissions</div>${u.memberships.map(m=>`<div class="membership-row"><span>${esc(m.congregationName)}</span><label>Role<select data-congregation-role data-user-id="${esc(u.id)}" data-congregation-id="${esc(m.congregationId)}">${congregationOptions(m.role)}</select></label></div>`).join('')}</div>`:''}
    </article>`;
  }
  function bind(){
    root.querySelector('[data-admin-search]')?.addEventListener('input',e=>{const value=e.target.value;render();const input=root.querySelector('[data-admin-search]');input.value=value;input.focus();input.setSelectionRange(value.length,value.length)});
    root.querySelector('[data-admin-refresh]')?.addEventListener('click',loadUsers);
    root.querySelectorAll('[data-role-user]').forEach(sel=>sel.addEventListener('change',async e=>{
      const target=e.currentTarget;const user=users.find(x=>x.id===target.dataset.roleUser);if(!user)return;
      const next=target.value,previous=user.role;
      if(['admin','owner'].includes(next)&&!confirm(`Grant ${roleLabel(next)} access to ${user.name}? This includes site administration privileges.`)){target.value=previous;return}
      target.disabled=true;
      try{await invoke({action:'set_role',targetUserId:user.id,role:next});user.role=next;toast(`${user.name} is now ${roleLabel(next)}.`);render()}
      catch(err){target.value=previous;target.disabled=false;toast(err.message,true)}
    }));
    root.querySelectorAll('[data-reset-user]').forEach(btn=>btn.addEventListener('click',async e=>{
      const target=e.currentTarget;const user=users.find(x=>x.id===target.dataset.resetUser);if(!user)return;
      if(!confirm(`Generate a one-time recovery code for ${user.name}? Any older unused code for this account will stop working.`))return;
      target.disabled=true;target.textContent='Generating…';
      try{const res=await invoke({action:'issue_reset_code',targetUserId:user.id});showResetCode(user,res);target.textContent='Generate new code';target.disabled=false}
      catch(err){target.disabled=false;target.textContent='Generate reset code';toast(err.message,true)}
    }));
    root.querySelectorAll('[data-congregation-role]').forEach(sel=>sel.addEventListener('change',async e=>{
      const el=e.currentTarget;const old=(users.find(x=>x.id===el.dataset.userId)?.memberships||[]).find(m=>m.congregationId===el.dataset.congregationId)?.role||'member';
      el.disabled=true;
      try{await invoke({action:'set_congregation_role',targetUserId:el.dataset.userId,congregationId:el.dataset.congregationId,role:el.value});const u=users.find(x=>x.id===el.dataset.userId);const m=(u?.memberships||[]).find(x=>x.congregationId===el.dataset.congregationId);if(m)m.role=el.value;toast('Congregation role updated.');el.disabled=false}
      catch(err){el.value=old;el.disabled=false;toast(err.message,true)}
    }));
  }
  async function loadUsers(){
    try{const data=await invoke({action:'list_users',page:1,perPage:200});users=data.users||[];adminRole=data.role||adminRole;roleChip.textContent=roleLabel(adminRole);roleChip.className=`admin-badge role-${adminRole}`;render()}
    catch(err){message('Could not load admin users',err.message,`<p><a class="admin-back" href="./">Back to BibleQuest</a></p>`)}
  }
  async function boot(){
    if(!cfg.enabled||!cfg.supabaseUrl||!cfg.publishableKey||!window.supabase?.createClient){return message('Admin unavailable','BibleQuest cloud configuration is not available on this page.');}
    client=window.supabase.createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const result=await client.auth.getSession();session=result.data.session;
    if(!session)return message('Sign in required','Sign in to BibleQuest with your owner/admin account, then open this page again.',`<p><a class="admin-back" href="./">Open BibleQuest</a></p>`);
    try{const status=await invoke({action:'status'});adminRole=status.role;roleChip.textContent=roleLabel(adminRole);roleChip.className=`admin-badge role-${adminRole}`;await loadUsers()}
    catch(err){roleChip.textContent='No access';message('Admin access required',err.message,`<p><a class="admin-back" href="./">Back to BibleQuest</a></p>`)}
  }
  boot().catch(err=>message('Admin page error',err.message||String(err)));
})();