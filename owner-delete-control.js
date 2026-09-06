(() => {
  'use strict';
  const cfg=window.BQ_CLOUD_CONFIG||{};
  let client=null,owner=false,self='',layer=null,busy=false;
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const sleepReject=(ms,message)=>new Promise((_,reject)=>setTimeout(()=>reject(new Error(message)),ms));

  async function invoke(body){
    const s=(await client.auth.getSession()).data.session;
    if(!s?.access_token)throw new Error('Your Owner session expired. Sign in again.');
    const request=fetch(`${cfg.supabaseUrl}/functions/v1/bq-admin-ops`,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${s.access_token}`,'apikey':cfg.publishableKey},
      body:JSON.stringify(body)
    }).then(async r=>{
      const j=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(j.error||`Delete request failed (${r.status})`);
      return j;
    });
    return Promise.race([request,sleepReject(18000,'Account deletion timed out. Check the connection and try again.')]);
  }

  function ensureLayer(){
    if(layer)return layer;
    layer=document.createElement('div');
    layer.id='bqOwnerDeleteLayer';
    layer.className='owner-delete-layer hidden';
    layer.addEventListener('click',event=>{
      if(event.target.closest('[data-owner-delete-cancel]'))closeDialog();
    });
    document.body.appendChild(layer);
    return layer;
  }
  function closeDialog(){if(busy)return;ensureLayer().classList.add('hidden');document.body.classList.remove('owner-delete-open')}
  function showError(message){const box=ensureLayer().querySelector('[data-owner-delete-error]');if(!box)return;box.textContent=message;box.hidden=false}

  function showSelfExplanation(){
    const x=ensureLayer();
    x.innerHTML=`<div class="owner-delete-scrim" data-owner-delete-cancel></div><section class="owner-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="ownerDeleteTitle"><div class="owner-delete-icon">🔒</div><h2 id="ownerDeleteTitle">This Owner account cannot delete itself</h2><p>You are signed in with the only active BibleQuest Owner account. Deleting it would leave BibleQuest without an Owner.</p><p class="owner-delete-note">To retire this account, first grant Owner access to another trusted account, sign in as that other Owner, then delete this account from Admin.</p><button type="button" class="owner-delete-cancel" data-owner-delete-cancel>Close</button></section>`;
    x.classList.remove('hidden');document.body.classList.add('owner-delete-open');
  }

  function confirmDelete(id,card){
    if(id===self){showSelfExplanation();return}
    const name=card.querySelector('.admin-user-main b')?.textContent?.trim()||'this account';
    const email=card.querySelector('.admin-user-main small')?.textContent?.trim()||'';
    const phrase=`DELETE ${email||name}`;
    const x=ensureLayer();
    x.innerHTML=`<div class="owner-delete-scrim" data-owner-delete-cancel></div><section class="owner-delete-dialog danger" role="dialog" aria-modal="true" aria-labelledby="ownerDeleteTitle"><div class="owner-delete-icon">⚠️</div><small>OWNER CONTROL</small><h2 id="ownerDeleteTitle">Permanently delete account?</h2><p><b>${esc(name)}</b>${email?`<br><span>${esc(email)}</span>`:''}</p><p>This removes the sign-in account. BibleQuest will refuse deletion if this person still owns a congregation or small group.</p><label>Type <b>${esc(phrase)}</b> to confirm<input type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" data-owner-delete-confirm></label><div class="owner-delete-error" data-owner-delete-error hidden></div><div class="owner-delete-actions"><button type="button" class="owner-delete-cancel" data-owner-delete-cancel>Cancel</button><button type="button" class="owner-delete-confirm" data-owner-delete-submit disabled>Delete permanently</button></div></section>`;
    x.classList.remove('hidden');document.body.classList.add('owner-delete-open');
    const input=x.querySelector('[data-owner-delete-confirm]'),submit=x.querySelector('[data-owner-delete-submit]');
    input.addEventListener('input',()=>{submit.disabled=input.value!==phrase});
    submit.addEventListener('click',async()=>{
      if(input.value!==phrase||busy)return;
      busy=true;submit.disabled=true;input.disabled=true;submit.textContent='Deleting…';
      try{
        const result=await invoke({action:'delete_user',targetUserId:id});
        if(!result?.deleted)throw new Error('The server did not confirm account deletion.');
        x.classList.add('hidden');document.body.classList.remove('owner-delete-open');
        card.remove();
        document.querySelector('[data-admin-refresh]')?.click();
      }catch(error){
        busy=false;input.disabled=false;submit.textContent='Delete permanently';submit.disabled=input.value!==phrase;showError(error?.message||String(error));return;
      }
      busy=false;
    });
    setTimeout(()=>input.focus(),30);
  }

  function decorate(){
    if(!owner)return;
    document.querySelectorAll('.admin-user[data-user]').forEach(card=>{
      if(card.querySelector('.owner-delete-wrap'))return;
      const id=card.dataset.user;if(!id)return;
      const wrap=document.createElement('div');wrap.className='owner-delete-wrap';
      if(id===self){
        wrap.innerHTML='<div class="owner-delete-self"><b>Current Owner</b><small>The signed-in Owner cannot delete itself.</small></div><button type="button" class="owner-delete-account owner-delete-explain">Why?</button>';
        wrap.querySelector('button').onclick=showSelfExplanation;
      }else{
        wrap.innerHTML='<button type="button" class="owner-delete-account">Delete account permanently</button>';
        wrap.querySelector('button').onclick=()=>confirmDelete(id,card);
      }
      card.appendChild(wrap);
    });
  }

  async function boot(){
    try{
      if(!cfg.enabled||!window.supabase?.createClient)return;
      client=window.supabase.createClient(cfg.supabaseUrl,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
      const s=(await client.auth.getSession()).data.session;if(!s?.user)return;
      self=s.user.id;
      const st=await invoke({action:'status'});owner=st.role==='owner';if(!owner)return;
      decorate();
      new MutationObserver(decorate).observe(document.getElementById('adminApp')||document.body,{childList:true,subtree:true});
    }catch(error){console.warn('Owner delete control unavailable:',error?.message||error)}
  }
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!ensureLayer().classList.contains('hidden'))closeDialog()});
  boot();
})();