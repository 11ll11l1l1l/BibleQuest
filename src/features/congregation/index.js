const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function membershipRows(rows,activeMembership){
  if(!rows.length)return '<p data-congregation-empty>You are not linked to an active congregation yet. Use an invite code below to join one.</p>';
  const activeId=String(activeMembership?.congregationId||'');
  const switchable=rows.length>1;
  return rows.map(row=>{
    const isActive=row.congregationId===activeId;
    const activeState=isActive
      ?'<p class="bq-form-message" data-congregation-active aria-current="true">Active congregation</p>'
      :switchable?`<p><button type="button" class="bq-secondary-button" data-congregation-switch="${escapeHtml(row.congregationId)}">Use ${escapeHtml(row.congregation.name)}</button></p>`:'';
    return `<article class="bq-account-section" data-congregation-row="${escapeHtml(row.congregationId)}"${isActive?' data-congregation-current="true"':''}><p class="bq-eyebrow">CONGREGATION</p><h2>${escapeHtml(row.congregation.name)}</h2><p><b>Role:</b> <span data-congregation-role>${escapeHtml(row.roleLabel)}</span></p>${row.congregation.timezone?`<p><b>Timezone:</b> ${escapeHtml(row.congregation.timezone)}</p>`:''}${row.roleKnown?'':`<p class="bq-form-message">This role is not recognized by the permission model. Privileged controls stay locked.</p>`}<p>${row.roleKnown&&row.role!=='member'?'Ministry features check role permissions again on the server.':'Member access is active for this congregation.'}</p>${activeState}</article>`;
  }).join('');
}

export function congregationPage({membership,onAccount,onBack}){
  const signedIn=membership.isAuthenticated();
  return {
    title:'Congregation',
    html:`<section class="bq-panel bq-account-panel" data-congregation-view><p class="bq-eyebrow">MEMBERSHIP & ROLES</p><h1>Your congregation</h1><p>Membership and role data come from the authenticated BibleQuest congregation records. Role visibility never replaces server-side permission checks.</p>${signedIn?`<div data-congregation-list><p>Loading membership…</p></div><div class="bq-account-section"><h2>Join with invite code</h2><p>Joining never promotes your role in the browser. The trusted join service decides the membership.</p><form class="bq-account-form" data-congregation-join novalidate><label>Invite code<input name="invite_code" autocomplete="off" inputmode="text" maxlength="32" required></label><button type="submit" class="bq-primary-button">Join congregation</button></form><p class="bq-form-message" data-congregation-message aria-live="polite"></p></div>`:`<div class="bq-account-section" data-congregation-auth><p>Sign in to view or join a congregation.</p><button type="button" class="bq-primary-button" data-congregation-account>Open account</button></div>`}<div class="bq-account-actions"><button type="button" class="bq-secondary-button" data-congregation-back>Back to More</button></div></section>`,
    mount(root){
      const list=root.querySelector('[data-congregation-list]');
      const message=root.querySelector('[data-congregation-message]');
      let managedMembers=[];
      const setMessage=value=>{if(message)message.textContent=value||''};
      const render=rows=>{
        if(!list)return;
        const active=membership.getActive();
        const owner=Boolean(active?.userId&&active?.congregation?.ownerId===active.userId);
        const memberSection=active?.role==='admin'?`<section class="bq-account-section" data-congregation-members-section><p class="bq-eyebrow">MEMBER & ROLE MANAGEMENT</p><h2>Congregation members</h2><p>Role changes and deactivation are recorded. The server protects the congregation owner and last active admin.</p>${managedMembers.map(member=>{const locked=member.role==='admin'&&!owner;return `<form class="bq-account-form" data-congregation-member-form data-member-id="${escapeHtml(member.userId)}"><b>${escapeHtml(member.displayName)}</b><label>Role<select name="role"${locked?' disabled':''}>${membership.roles().filter(role=>role!=='admin'||owner).map(role=>`<option value="${role}"${member.role===role?' selected':''}>${role[0].toUpperCase()+role.slice(1)}</option>`).join('')}</select></label><label><input type="checkbox" name="active"${member.active?' checked':''}${locked?' disabled':''}> Active congregation membership</label>${locked?'<p>Only the congregation owner can change an admin membership.</p>':`<button type="submit" class="bq-secondary-button">Save ${escapeHtml(member.displayName)}</button>`}</form>`}).join('')||'<p>No member records were returned.</p>'}</section>`:'';
        const settings=active?.role==='admin'?`<section class="bq-account-section" data-congregation-settings-section><p class="bq-eyebrow">CONGREGATION ADMIN</p><h2>Congregation settings</h2><p>Update the name and time zone used by congregation schedules. The server checks your admin membership again when saving.</p><form class="bq-account-form" data-congregation-settings><label>Congregation name<input name="name" minlength="2" maxlength="100" value="${escapeHtml(active.congregation.name)}" required></label><label>IANA time zone<input name="timezone" maxlength="64" value="${escapeHtml(active.congregation.timezone||'Asia/Tokyo')}" placeholder="Asia/Tokyo" required></label><button type="submit" class="bq-primary-button">Save congregation settings</button></form></section>`:'';
        list.innerHTML=`${membershipRows(rows,active)}${settings}${memberSection}`;
      };
      const refresh=async()=>{
        if(!signedIn)return;
        try{
          const rows=await membership.load();managedMembers=[];render(rows);
          if(membership.getActive()?.role==='admin'){try{managedMembers=await membership.loadManagedMembers()}catch(error){setMessage(error?.message||'Could not load congregation members.')}render(rows)}
        }
        catch(error){if(list)list.innerHTML=`<p class="bq-form-message">${escapeHtml(error?.message||'Could not load congregation membership.')}</p>`}
      };
      const onClick=event=>{
        const target=event.target instanceof Element?event.target:null;if(!target)return;
        if(target.closest('[data-congregation-account]'))onAccount?.();
        else if(target.closest('[data-congregation-back]'))onBack?.();
        else{
          const switchButton=target.closest('[data-congregation-switch]');
          if(switchButton){
            setMessage('');
            try{
              const active=membership.setActive(switchButton.getAttribute('data-congregation-switch'));
              managedMembers=[];
              render(membership.list());
              setMessage(`Active congregation changed to ${active.congregation.name}.`);
              void refresh();
            }catch(error){setMessage(error?.message||'Could not switch active congregation.')}
          }
        }
      };
      const onSubmit=async event=>{
        const form=event.target instanceof HTMLFormElement?event.target:null;if(!form)return;
        if(form.matches('[data-congregation-join]')){
          event.preventDefault();setMessage('');
          const button=form.querySelector('button[type="submit"]');if(button){button.disabled=true;button.textContent='Joining…'}
          try{const rows=await membership.join(new FormData(form).get('invite_code'));form.reset();render(rows);setMessage('Congregation membership updated.')}
          catch(error){setMessage(error?.message||'Could not join congregation.')}
          finally{if(button){button.disabled=false;button.textContent='Join congregation'}}
        }else if(form.matches('[data-congregation-settings]')){
          event.preventDefault();setMessage('');
          const button=form.querySelector('button[type="submit"]');if(button){button.disabled=true;button.textContent='Saving…'}
          const values=new FormData(form);
          try{const rows=await membership.updateSettings({name:values.get('name'),timezone:values.get('timezone')});render(rows);setMessage('Congregation settings saved.')}
          catch(error){setMessage(error?.message||'Could not save congregation settings.')}
          finally{if(button){button.disabled=false;button.textContent='Save congregation settings'}}
        }else if(form.matches('[data-congregation-member-form]')){
          event.preventDefault();setMessage('');
          const button=form.querySelector('button[type="submit"]');if(button){button.disabled=true;button.textContent='Saving…'}
          const values=new FormData(form),target=form.dataset.memberId;
          try{managedMembers=await membership.manageMember({userId:target,role:values.get('role'),active:values.has('active')});render(membership.list());setMessage('Congregation member access updated.')}
          catch(error){setMessage(error?.message||'Could not update this member.');render(membership.list())}
          finally{if(button){button.disabled=false;button.textContent='Save member access'}}
        }
      };
      root.addEventListener('click',onClick);root.addEventListener('submit',onSubmit);refresh();
      return()=>{root.removeEventListener('click',onClick);root.removeEventListener('submit',onSubmit)};
    }
  };
}
