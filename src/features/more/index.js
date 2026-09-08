export function morePage({pwaInstall,onCongregation}){
  return {
    title:'More',
    html:`<section class="bq-panel"><p class="bq-eyebrow">MORE</p><h1>More BibleQuest</h1><p>Only recovered and verified tools are exposed here. Later community, ministry and admin workflows remain intentionally unavailable.</p></section><section class="bq-panel" data-more-install hidden><p class="bq-eyebrow">INSTALL</p><h2>Keep BibleQuest on this device</h2><p>Install the app for a standalone BibleQuest window. Offline use is still being rebuilt.</p><button type="button" class="bq-primary-button" data-install-app>Install BibleQuest</button><p data-install-status aria-live="polite"></p></section><section class="bq-panel" data-more-congregation><p class="bq-eyebrow">CONGREGATION</p><h2>Membership & role</h2><p>View your active congregation role or join with an existing invite code.</p><button type="button" class="bq-primary-button" data-open-congregation>Open congregation access</button></section><section class="bq-panel"><p class="bq-eyebrow">RECOVERY STATUS</p><h2>More tools are still being rebuilt</h2><p>Journey Groups, encouragements, teams, assignments, Ministry Hub, notifications and Admin remain unavailable until their own verification milestones pass.</p></section>`,
    mount(root){
      const congregation=root.querySelector('[data-open-congregation]'),installPanel=root.querySelector('[data-more-install]'),installButton=root.querySelector('[data-install-app]'),installStatus=root.querySelector('[data-install-status]');
      const open=()=>onCongregation?.();
      const render=state=>{
        const visible=state?.canPrompt||state?.status==='prompting'||state?.status==='dismissed';
        installPanel?.toggleAttribute('hidden',!visible);
        installButton?.toggleAttribute('hidden',!state?.canPrompt&&state?.status!=='prompting');
        if(installButton)installButton.disabled=state?.status==='prompting';
        if(installStatus)installStatus.textContent=state?.status==='prompting'?'Opening the install prompt…':state?.status==='dismissed'?'Installation was not completed. You can try again when your browser offers it.':'';
      };
      const install=()=>{void pwaInstall?.prompt()};
      congregation?.addEventListener('click',open);installButton?.addEventListener('click',install);
      const unsubscribe=pwaInstall?.subscribe?.(render)||(()=>{});
      return()=>{congregation?.removeEventListener('click',open);installButton?.removeEventListener('click',install);unsubscribe()}
    }
  };
}
