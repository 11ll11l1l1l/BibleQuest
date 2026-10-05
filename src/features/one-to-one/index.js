import { localization } from '../../app/localization.js';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const text = key => localization.t(`v7.pairing.${key}`);
const copy = key => escapeHtml(text(key));

export function oneToOnePage({service,subscribeContext,onAccount,onCongregation,onBack,onAuthoring=()=>{},onAssignments=()=>{},onPair=()=>{},onInvite=()=>{},isContextReady=()=>false}) {
  return {
    title:'ONE 2 ONE',
    html:`<section class="bq-panel"><h1>ONE 2 ONE</h1><p>${copy('overviewIntro')}</p><p data-pair-status role="status" aria-live="polite"></p><ul data-pair-results></ul><button type="button" data-pair-retry>${copy('reload')}</button><button type="button" data-pair-account>${copy('account')}</button><button type="button" data-pair-congregation>${copy('congregation')}</button><button type="button" data-pair-back>${copy('backGrow')}</button><button type="button" data-pair-authoring>${escapeHtml(localization.t('v7.authoring.title'))}</button><button type="button" data-pair-assignments>${escapeHtml(localization.t('v7.assignment.title'))}</button><button type="button" data-pair-invite>${escapeHtml(localization.t('v7.pairing.invite'))}</button></section>`,
    mount(root) {
      const status=root.querySelector('[data-pair-status]'),results=root.querySelector('[data-pair-results]');
      let operation=0,disposed=false;
      const load=async()=>{
        if(disposed)return;
        const request=++operation;
        results.innerHTML='';status.textContent=text('overviewLoading');
        try{
          const pairs=await service.listPairs();
          if(disposed||request!==operation)return;
          status.textContent=text(pairs.length?'overviewReady':'overviewEmpty');
          results.innerHTML=pairs.map(pair=>`<li><button type="button" data-open-pair="${escapeHtml(pair.id)}">${escapeHtml(localization.t('v7.pairing.title'))} — ${escapeHtml(localization.t(`v7.pairing.${pair.state}`))}</button></li>`).join('');
        }catch{
          if(disposed||request!==operation)return;
          status.textContent=text('error');
        }
      };
      const bindings=[['retry',()=>void load()],['account',onAccount],['congregation',onCongregation],['back',onBack],['authoring',onAuthoring],['assignments',onAssignments],['invite',onInvite]].map(([key,fn])=>[root.querySelector(`[data-pair-${key}]`),fn]);
      for(const [button,fn] of bindings)button.addEventListener('click',fn);
      const openPair=event=>{const button=event.target.closest?.('[data-open-pair]');if(button&&!disposed)onPair(button.getAttribute('data-open-pair'))};
      results.addEventListener('click',openPair);
      const unsubscribe=subscribeContext(()=>{if(disposed)return;operation++;results.innerHTML='';status.textContent=text('overviewChanged');if(isContextReady())void load();});
      void load();
      return ()=>{disposed=true;operation++;unsubscribe();results.removeEventListener('click',openPair);for(const [button,fn] of bindings)button.removeEventListener('click',fn)};
    }
  };
}
