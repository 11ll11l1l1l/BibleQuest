const esc=(value='')=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function formHtml(){
  return `<section class="bq-panel bq-reset-card"><p class="bq-eyebrow">ACCOUNT RECOVERY</p><h1>Recover your account</h1><p>Use your registered email and the recovery code you saved when your account was created or rotated later in Account → Security.</p><div class="bq-reset-help"><b>Still signed in on another device?</b><span>Use that device instead: open Account → Security & recovery to change your password or generate a new recovery code.</span></div><form class="bq-account-form" data-reset-recovery-form novalidate><label>Registered email<input name="email" type="email" autocomplete="email" required></label><label>Recovery code<input name="recovery_code" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="BQ-XXXXX-XXXXX-XXXXX-XXXXX" required></label><label>New password<input name="new_password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required placeholder="At least 8 characters"></label><label>Confirm new password<input name="confirm_password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required placeholder="Type the new password again"></label><button class="bq-primary-button" type="submit" data-reset-submit>Reset password securely</button><button class="bq-secondary-button" type="button" data-reset-cancel>Cancel</button><p class="bq-form-message" role="alert" aria-live="polite" data-reset-message></p></form><p class="bq-reset-note">For security, an email address alone is not enough to recover an account. If both the password and recovery code are lost and no signed-in device remains, BibleQuest cannot automatically prove account ownership.</p></section>`;
}

function successHtml(code){
  return `<section class="bq-panel bq-reset-card"><p class="bq-eyebrow">PASSWORD UPDATED</p><h1>Save your replacement recovery code</h1><p>Your old recovery code is no longer valid. Save this replacement before leaving this page.</p><div class="bq-recovery-code" data-reset-recovery-code>${esc(code)}</div><button type="button" class="bq-secondary-button" data-reset-copy>Copy recovery code</button><label class="bq-save-check"><input type="checkbox" data-reset-saved> I saved my new recovery code somewhere safe.</label><button type="button" class="bq-primary-button" data-reset-finish disabled>Return to BibleQuest and sign in</button><p class="bq-form-message" aria-live="polite" data-reset-message></p></section>`;
}

export function resetRecoveryPage({recovery,onCancel,onHome}={}){
  if(!recovery?.submit||!recovery?.cancel||!recovery?.acknowledgeSaved)throw new Error('Reset Recovery page requires its state owner.');
  return {title:'Account recovery',html:'<section data-reset-recovery-view></section>',mount(root){
    const view=root.querySelector('[data-reset-recovery-view]');
    let disposed=false;
    const state=()=>recovery.getState?.()||{status:'ready',error:'',recoveryCode:'',codeSaved:false};
    const setBusy=active=>{
      view.querySelectorAll('input,button').forEach(control=>control.disabled=active);
      const submit=view.querySelector('[data-reset-submit]');
      if(submit){submit.disabled=active;submit.textContent=active?'Resetting…':'Reset password securely'}
    };
    const showError=message=>{const node=view.querySelector('[data-reset-message]');if(node)node.textContent=message||''};
    const renderSuccess=()=>{
      if(disposed)return;const current=state();
      view.innerHTML=successHtml(current.recoveryCode);
      const saved=view.querySelector('[data-reset-saved]'),finish=view.querySelector('[data-reset-finish]');
      saved?.addEventListener('change',event=>{const next=recovery.acknowledgeSaved(event.currentTarget.checked);if(finish)finish.disabled=!next.codeSaved});
      view.querySelector('[data-reset-copy]')?.addEventListener('click',async event=>{
        const code=state().recoveryCode;
        try{await navigator.clipboard.writeText(code);event.currentTarget.textContent='Copied'}
        catch{showError('Copy the recovery code manually from the code above.')}
      });
      finish?.addEventListener('click',()=>{if(!state().codeSaved)return;recovery.clear?.();onHome?.()},{once:true});
    };
    const renderForm=()=>{
      if(disposed)return;view.innerHTML=formHtml();
      const form=view.querySelector('[data-reset-recovery-form]');
      form?.addEventListener('submit',async event=>{
        event.preventDefault();const data=new FormData(form);showError('');setBusy(true);
        try{
          await recovery.submit({email:data.get('email'),recoveryCode:data.get('recovery_code'),newPassword:data.get('new_password'),confirmPassword:data.get('confirm_password')});
          renderSuccess();
        }catch(error){setBusy(false);showError(error?.message||state().error||'Account recovery failed.')}
      });
      view.querySelector('[data-reset-cancel]')?.addEventListener('click',()=>{try{recovery.cancel();onCancel?.()}catch(error){showError(error?.message||'This recovery request cannot be cancelled right now.')}},{once:true});
    };
    renderForm();
    return()=>{disposed=true;recovery.clear?.()};
  }};
}
