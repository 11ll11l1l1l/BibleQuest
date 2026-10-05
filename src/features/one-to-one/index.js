import { localization } from '../../app/localization.js';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function oneToOnePage({service,subscribeContext,onAccount,onCongregation,onBack,onAuthoring=()=>{},onAssignments=()=>{},onPair=()=>{},onInvite=()=>{}}) {
  return {
    title:'ONE 2 ONE',
    html:`<section class="bq-panel"><h1>ONE 2 ONE</h1><p>Your mentor and mentee relationships in the selected congregation.</p><p data-pair-status role="status" aria-live="polite"></p><ul data-pair-results></ul><button type="button" data-pair-retry>Reload</button><button type="button" data-pair-account>Account</button><button type="button" data-pair-congregation>Choose congregation</button><button type="button" data-pair-back>Back to Grow</button><button type="button" data-pair-authoring>${escapeHtml(localization.t('v7.authoring.title'))}</button><button type="button" data-pair-assignments>${escapeHtml(localization.t('v7.assignment.title'))}</button><button type="button" data-pair-invite>${escapeHtml(localization.t('v7.pairing.invite'))}</button></section>`,
    mount(root) {
      const status=root.querySelector('[data-pair-status]'),results=root.querySelector('[data-pair-results]');
      let operation=0,disposed=false;
      const load=async()=>{
        const request=++operation;
        results.innerHTML='';status.textContent='Loading relationships…';
        try{
          const pairs=await service.listPairs();
          if(disposed||request!==operation)return;
          status.textContent=pairs.length?'Your relationships':'No relationships in this congregation.';
          results.innerHTML=pairs.map(pair=>`<li><button type="button" data-open-pair="${escapeHtml(pair.id)}">${escapeHtml(localization.t('v7.pairing.title'))} — ${escapeHtml(localization.t(`v7.pairing.${pair.state}`))}</button></li>`).join('');
        }catch(error){
          if(disposed||request!==operation)return;
          status.textContent=error?.message||'Relationships could not load. Try again.';
        }
      };
      const bindings=[['retry',()=>void load()],['account',onAccount],['congregation',onCongregation],['back',onBack],['authoring',onAuthoring],['assignments',onAssignments],['invite',onInvite]].map(([key,fn])=>[root.querySelector(`[data-pair-${key}]`),fn]);
      for(const [button,fn] of bindings)button.addEventListener('click',fn);
      const openPair=event=>{const button=event.target.closest?.('[data-open-pair]');if(button)onPair(button.getAttribute('data-open-pair'))};
      results.addEventListener('click',openPair);
      const unsubscribe=subscribeContext(()=>{operation++;results.innerHTML='';status.textContent='Account or congregation changed. Reload relationships.'});
      void load();
      return ()=>{disposed=true;operation++;unsubscribe();results.removeEventListener('click',openPair);for(const [button,fn] of bindings)button.removeEventListener('click',fn)};
    }
  };
}
