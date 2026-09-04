(() => {
  const cfg=window.BQ_CLOUD_CONFIG||{},form=document.getElementById('resetForm'),message=document.getElementById('resetMessage');
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function show(text,error=false){message.innerHTML=`<div class="reset-msg${error?' error':''}">${esc(text)}</div>`}
  function apiHeaders(){return {'Content-Type':'application/json','apikey':cfg.publishableKey,'Authorization':`Bearer ${cfg.publishableKey}`}}
  if(!cfg.supabaseUrl||!cfg.publishableKey){show('Account recovery is temporarily unavailable.',true);return}
  form.addEventListener('submit',async e=>{
    e.preventDefault();const fd=new FormData(form),email=String(fd.get('email')||'').trim(),recovery_code=String(fd.get('recovery_code')||'').trim(),new_password=String(fd.get('new_password')||''),confirm_password=String(fd.get('confirm_password')||'');
    if(new_password.length<8){show('Use a new password with at least 8 characters.',true);return}if(new_password!==confirm_password){show('The new passwords do not match.',true);return}
    const button=form.querySelector('button');button.disabled=true;button.textContent='Resetting…';message.innerHTML='';
    try{
      const response=await fetch(`${cfg.supabaseUrl}/functions/v1/bq-password-reset`,{method:'POST',headers:apiHeaders(),body:JSON.stringify({action:'reset',email,recovery_code,new_password,confirm_password})});
      const data=await response.json().catch(()=>({}));if(!response.ok||!data.ok)throw new Error(data.error||'Recovery request failed.');
      const code=String(data.recovery_code||'');form.innerHTML=`<div class="reset-msg"><b>Password updated.</b><br>Your old recovery code is no longer valid. Save this new one now.</div><div class="reset-code" data-new-recovery>${esc(code)}</div><button type="button" data-copy-new>Copy new recovery code</button><label style="display:flex;gap:8px;align-items:flex-start;margin-top:12px"><input type="checkbox" data-saved-new style="width:auto;margin-top:3px"> I saved my new recovery code somewhere safe.</label><button type="button" data-finish-recovery disabled>Return to BibleQuest and sign in</button>`;
      const saved=form.querySelector('[data-saved-new]'),finish=form.querySelector('[data-finish-recovery]');saved.onchange=()=>finish.disabled=!saved.checked;finish.onclick=()=>location.replace('./');form.querySelector('[data-copy-new]').onclick=async ev=>{try{await navigator.clipboard.writeText(code);ev.currentTarget.textContent='Copied'}catch{ev.currentTarget.textContent='Copy manually from the code above'}};
    }catch(err){show(err.message||String(err),true);button.disabled=false;button.textContent='Reset password securely'}
  });
})();
