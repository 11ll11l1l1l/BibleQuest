const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function membershipRows(rows){
  if(!rows.length)return '<p data-congregation-empty>You are not linked to an active congregation yet. Use an invite code below to join one.</p>';
  return rows.map(row=>`<article class="bq-account-section" data-congregation-row="${escapeHtml(row.congregationId)}"><p class="bq-eyebrow">CONGREGATION</p><h2>${escapeHtml(row.congregation.name)}</h2><p><b>Role:</b> <span data-congregation-role>${escapeHtml(row.roleLabel)}</span></p>${row.congregation.timezone?`<p><b>Timezone:</b> ${escapeHtml(row.congregation.timezone)}</p>`:''}${row.roleKnown?'':`<p class="bq-form-message">This role is not recognized by the v3 permission model. Privileged controls stay locked.</p>`}<p>${row.roleKnown&&row.role!=='member'?'Ministry access is available when a feature is rebuilt and the server authorizes the action.':'Member access is active for this congregation.'}</p></article>`).join('');
}

export function congregationPage({membership,onAccount,onBack}){
  const signedIn=membership.isAuthenticated();
  return {
    title:'Congregation',
    html:`<section class="bq-panel bq-account-panel" data-congregation-view><p class="bq-eyebrow">MEMBERSHIP & ROLES</p><h1>Your congregation</h1><p>Membership and role data come from the authenticated BibleQuest congregation records. Role visibility never replaces server-side permission checks.</p>${signedIn?`<div data-congregation-list><p>Loading membership…</p></div><div class="bq-account-section"><h2>Join with invite code</h2><p>Joining never promotes your role in the browser. The trusted join service decides the membership.</p><form class="bq-account-form" data-congregation-join novalidate><label>Invite code<input name="invite_code" autocomplete="off" inputmode="text" maxlength="32" required></label><button type="submit" class="bq-primary-button">Join congregation</button></form><p class="bq-form-message" data-congregation-message aria-live="polite"></p></div>`:`<div class="bq-account-section" data-congregation-auth><p>Sign in to view or join a congregation.</p><button type="button" class="bq-primary-button" data-congregation-account>Open account</button></div>`}<div class="bq-account-actions"><button type="button" class="bq-secondary-button" data-congregation-back>Back to More</button></div></section>`,
    mount(root){
      const list=root.querySelector('[data-congregation-list]');
      const message=root.querySelector('[data-congregation-message]');
      const setMessage=value=>{if(message)message.textContent=value||''};
      const render=rows=>{if(list)list.innerHTML=membershipRows(rows)};
      const refresh=async()=>{
        if(!signedIn)return;
        try{render(await membership.load())}
        catch(error){if(list)list.innerHTML=`<p class="bq-form-message">${escapeHtml(error?.message||'Could not load congregation membership.')}</p>`}
      };
      const onClick=event=>{
        const target=event.target instanceof Element?event.target:null;if(!target)return;
        if(target.closest('[data-congregation-account]'))onAccount?.();
        else if(target.closest('[data-congregation-back]'))onBack?.();
      };
      const onSubmit=async event=>{
        const form=event.target instanceof HTMLFormElement?event.target:null;if(!form?.matches('[data-congregation-join]'))return;
        event.preventDefault();setMessage('');
        const button=form.querySelector('button[type="submit"]');if(button){button.disabled=true;button.textContent='Joining…'}
        try{
          const rows=await membership.join(new FormData(form).get('invite_code'));
          form.reset();render(rows);setMessage('Congregation membership updated.');
        }catch(error){setMessage(error?.message||'Could not join congregation.')}
        finally{if(button){button.disabled=false;button.textContent='Join congregation'}}
      };
      root.addEventListener('click',onClick);root.addEventListener('submit',onSubmit);refresh();
      return()=>{root.removeEventListener('click',onClick);root.removeEventListener('submit',onSubmit)};
    }
  };
}
