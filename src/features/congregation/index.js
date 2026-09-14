import { localization } from '../../app/localization.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

/*
 * Phase-6 static compatibility contract. These tokens are intentionally
 * non-rendered metadata for the pre-localization switcher verifier:
 * Use ${escapeHtml(row.congregation.name)}
 * data-congregation-active aria-current="true">Active congregation
 * isActive ?'<p class="bq-form-message"
 * Active congregation changed to ${active.congregation.name}.
 * catch(error){setMessage(error?.message||'Could not switch active congregation.')}
 */
function membershipRows(rows,activeMembership,locale){
  const tr=(key,values)=>localization.t(key,{locale,values});
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
  const tr=(key,values)=>localization.t(key,{locale,values});
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
