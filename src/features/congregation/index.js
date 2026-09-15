import { localization } from '../../app/localization.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[char]));

export const CONGREGATION_COPY = Object.freeze({
  en: Object.freeze({
    'congregation.title': 'Congregation',
    'congregation.eyebrow': 'MEMBERSHIP & ROLES',
    'congregation.heading': 'Your congregation',
    'congregation.description': 'Membership and role data come from the authenticated BibleQuest congregation records. Role visibility never replaces server-side permission checks.',
    'congregation.empty': 'You are not linked to an active congregation yet. Use an invite code below to join one.',
    'congregation.active': 'Active congregation',
    'congregation.use': 'Use {name}',
    'congregation.cardEyebrow': 'CONGREGATION',
    'congregation.role': 'Role:',
    'congregation.timezone': 'Timezone:',
    'congregation.unknownRole': 'This role is not recognized by the v3 permission model. Privileged controls stay locked.',
    'congregation.ministryAccess': 'Ministry access is available when a feature is rebuilt and the server authorizes the action.',
    'congregation.memberAccess': 'Member access is active for this congregation.',
    'congregation.loading': 'Loading membership…',
    'congregation.joinHeading': 'Join with invite code',
    'congregation.joinDescription': 'Joining never promotes your role in the browser. The trusted join service decides the membership.',
    'congregation.inviteCode': 'Invite code',
    'congregation.join': 'Join congregation',
    'congregation.signInPrompt': 'Sign in to view or join a congregation.',
    'congregation.openAccount': 'Open account',
    'congregation.backMore': 'Back to More',
    'congregation.loadError': 'Could not load congregation membership.',
    'congregation.switched': 'Active congregation changed to {name}.',
    'congregation.switchError': 'Could not switch active congregation.',
    'congregation.joining': 'Joining…',
    'congregation.updated': 'Congregation membership updated.',
    'congregation.joinError': 'Could not join congregation.'
  }),
  tl: Object.freeze({
    'congregation.title': 'Kongregasyon',
    'congregation.eyebrow': 'MEMBERSHIP AT MGA ROLE',
    'congregation.heading': 'Iyong kongregasyon',
    'congregation.description': 'Ang membership at role data ay mula sa authenticated BibleQuest congregation records. Ang nakikitang role ay hindi kapalit ng server-side permission checks.',
    'congregation.empty': 'Hindi ka pa naka-link sa aktibong kongregasyon. Gumamit ng invite code sa ibaba para sumali.',
    'congregation.active': 'Aktibong kongregasyon',
    'congregation.use': 'Gamitin ang {name}',
    'congregation.cardEyebrow': 'KONGREGASYON',
    'congregation.role': 'Role:',
    'congregation.timezone': 'Time zone:',
    'congregation.unknownRole': 'Hindi kinikilala ng v3 permission model ang role na ito. Mananatiling naka-lock ang mga privileged control.',
    'congregation.ministryAccess': 'Available ang ministry access kapag na-rebuild ang feature at pinahintulutan ng server ang action.',
    'congregation.memberAccess': 'Aktibo ang member access para sa kongregasyong ito.',
    'congregation.loading': 'Naglo-load ng membership…',
    'congregation.joinHeading': 'Sumali gamit ang invite code',
    'congregation.joinDescription': 'Hindi ina-upgrade ng browser ang iyong role kapag sumali. Ang trusted join service ang nagpapasya sa membership.',
    'congregation.inviteCode': 'Code ng imbitasyon',
    'congregation.join': 'Sumali sa kongregasyon',
    'congregation.signInPrompt': 'Mag-sign in para makita o salihan ang isang kongregasyon.',
    'congregation.openAccount': 'Buksan ang account',
    'congregation.backMore': 'Bumalik sa Higit pa',
    'congregation.loadError': 'Hindi ma-load ang congregation membership.',
    'congregation.switched': 'Pinalitan ang aktibong kongregasyon sa {name}.',
    'congregation.switchError': 'Hindi mapalitan ang aktibong kongregasyon.',
    'congregation.joining': 'Sumasali…',
    'congregation.updated': 'Na-update ang congregation membership.',
    'congregation.joinError': 'Hindi makasali sa kongregasyon.'
  })
});

function localText(locale,key,values){
  return localization.t(key,{locale,dictionaries:CONGREGATION_COPY,values});
}

function membershipRows(rows,activeMembership,locale){
  const tr=(key,values)=>localText(locale,key,values);
  if(!rows.length)return `<p data-congregation-empty>${escapeHtml(tr('congregation.empty'))}</p>`;
  const activeId=String(activeMembership?.congregationId||'');
  const switchable=rows.length>1;
  return rows.map(row=>{
    const isActive=row.congregationId===activeId;
    const activeState=isActive
      ?`<p class="bq-form-message" data-congregation-active aria-current="true">${escapeHtml(tr('congregation.active'))}</p>`
      :switchable?`<p><button type="button" class="bq-secondary-button" data-congregation-switch="${escapeHtml(row.congregationId)}">${escapeHtml(tr('congregation.use',{name:row.congregation.name}))}</button></p>`:'';
    return `<article class="bq-account-section" data-congregation-row="${escapeHtml(row.congregationId)}"${isActive?' data-congregation-current="true"':''}><p class="bq-eyebrow">${escapeHtml(tr('congregation.cardEyebrow'))}</p><h2>${escapeHtml(row.congregation.name)}</h2><p><b>${escapeHtml(tr('congregation.role'))}</b> <span data-congregation-role>${escapeHtml(row.roleLabel)}</span></p>${row.congregation.timezone?`<p><b>${escapeHtml(tr('congregation.timezone'))}</b> ${escapeHtml(row.congregation.timezone)}</p>`:''}${row.roleKnown?'':`<p class="bq-form-message">${escapeHtml(tr('congregation.unknownRole'))}</p>`}<p>${escapeHtml(tr(row.roleKnown&&row.role!=='member'?'congregation.ministryAccess':'congregation.memberAccess'))}</p>${activeState}</article>`;
  }).join('');
}

export function congregationPage({membership,onAccount,onBack}){
  const signedIn=membership.isAuthenticated();
  const locale=localization.getLocale();
  const tr=(key,values)=>localText(locale,key,values);
  return {
    title:tr('congregation.title'),
    html:`<section class="bq-panel bq-account-panel" data-congregation-view><p class="bq-eyebrow">${escapeHtml(tr('congregation.eyebrow'))}</p><h1>${escapeHtml(tr('congregation.heading'))}</h1><p>${escapeHtml(tr('congregation.description'))}</p>${signedIn?`<div data-congregation-list><p>${escapeHtml(tr('congregation.loading'))}</p></div><div class="bq-account-section"><h2>${escapeHtml(tr('congregation.joinHeading'))}</h2><p>${escapeHtml(tr('congregation.joinDescription'))}</p><form class="bq-account-form" data-congregation-join novalidate><label>${escapeHtml(tr('congregation.inviteCode'))}<input name="invite_code" autocomplete="off" inputmode="text" maxlength="32" required></label><button type="submit" class="bq-primary-button">${escapeHtml(tr('congregation.join'))}</button></form><p class="bq-form-message" data-congregation-message aria-live="polite"></p></div>`:`<div class="bq-account-section" data-congregation-auth><p>${escapeHtml(tr('congregation.signInPrompt'))}</p><button type="button" class="bq-primary-button" data-congregation-account>${escapeHtml(tr('congregation.openAccount'))}</button></div>`}<div class="bq-account-actions"><button type="button" class="bq-secondary-button" data-congregation-back>${escapeHtml(tr('congregation.backMore'))}</button></div></section>`,
    mount(root){
      const list=root.querySelector('[data-congregation-list]');
      const message=root.querySelector('[data-congregation-message]');
      const setMessage=value=>{if(message)message.textContent=value||''};
      const render=rows=>{if(list)list.innerHTML=membershipRows(rows,membership.getActive(),locale)};
      const refresh=async()=>{
        if(!signedIn)return;
        try{render(await membership.load())}
        catch(error){if(list)list.innerHTML=`<p class="bq-form-message">${escapeHtml(error?.message||tr('congregation.loadError'))}</p>`}
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
              render(membership.list());
              setMessage(tr('congregation.switched',{name:active.congregation.name}));
            }catch(error){setMessage(error?.message||tr('congregation.switchError'))}
          }
        }
      };
      const onSubmit=async event=>{
        const form=event.target instanceof HTMLFormElement?event.target:null;if(!form?.matches('[data-congregation-join]'))return;
        event.preventDefault();setMessage('');
        const button=form.querySelector('button[type="submit"]');if(button){button.disabled=true;button.textContent=tr('congregation.joining')}
        try{
          const rows=await membership.join(new FormData(form).get('invite_code'));
          form.reset();render(rows);setMessage(tr('congregation.updated'));
        }catch(error){setMessage(error?.message||tr('congregation.joinError'))}
        finally{if(button){button.disabled=false;button.textContent=tr('congregation.join')}}
      };
      root.addEventListener('click',onClick);root.addEventListener('submit',onSubmit);refresh();
      return()=>{root.removeEventListener('click',onClick);root.removeEventListener('submit',onSubmit)};
    }
  };
}
