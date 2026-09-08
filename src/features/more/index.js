export function morePage({pwaInstall,onCouplesFamily,onCongregation,onBackup}){
  return {
    title:'More',
    html:`<section class="bq-panel"><p class="bq-eyebrow">MORE</p><h1>More BibleQuest</h1><p>Only recovered and verified tools are exposed here. Later community, ministry and admin workflows remain intentionally unavailable.</p></section><section class="bq-panel" data-more-couples><p class="bq-eyebrow">GROW TOGETHER</p><h2>Couples & family</h2><p>Christ-centered conversation cards, listening practice, couple check-ins, repair conversations, and local 7-day practices.</p><button type="button" class="bq-primary-button" data-open-couples-family>Open Grow Together</button></section><section class="bq-panel" data-more-install hidden><p class="bq-eyebrow">INSTALL</p><h2>Keep BibleQuest on this device</h2><p>Install the app for a standalone BibleQuest window. Opened bundled Bible books can be reused offline after they have been loaded once.</p><button type="button" class="bq-primary-button" data-install-app>Install BibleQuest</button><p data-install-status aria-live="polite"></p></section><section class="bq-panel" data-more-backup><p class="bq-eyebrow">DEVICE DATA</p><h2>Backup & reset</h2><p>Export, restore, or reset this device's portable BibleQuest v3 local learning state without touching account sign-in or cloud data.</p><button type="button" class="bq-primary-button" data-open-backup>Open backup controls</button></section><section class="bq-panel" data-more-congregation><p class="bq-eyebrow">CONGREGATION</p><h2>Membership & role</h2><p>View your active congregation role or join with an existing invite code.</p><button type="button" class="bq-primary-button" data-open-congregation>Open congregation access</button></section><section class="bq-panel"><p class="bq-eyebrow">RECOVERY STATUS</p><h2>More tools are still being rebuilt</h2><p>Couples cloud, Journey Groups, encouragements, teams, assignments, Ministry Hub, notifications and Admin remain unavailable until their own verification milestones pass.</p></section>`,
    mount(root){
      const couplesButton=root.querySelector('[data-open-couples-family]'),congregation=root.querySelector('[data-open-congregation]'),backupButton=root.querySelector('[data-open-backup]'),installPanel=root.querySelector('[data-more-install]'),installButton=root.querySelector('[data-install-app]'),installStatus=root.querySelector('[data-install-status]');
      const openCouples=()=>onCouplesFamily?.(),open=()=>onCongregation?.(),openBackup=()=>onBackup?.();
      const render=state=>{
        const visible=state?.canPrompt||state?.status==='prompting'||state?.status==='dismissed';
        installPanel?.toggleAttribute('hidden',!visible);
        installButton?.toggleAttribute('hidden',!state?.canPrompt&&state?.status!=='prompting');
        if(installButton)installButton.disabled=state?.status==='prompting';
        if(installStatus)installStatus.textContent=state?.status==='prompting'?'Opening the install prompt…':state?.status==='dismissed'?'Installation was not completed. You can try again when your browser offers it.':'';
      };
      const install=()=>{void pwaInstall?.prompt()};
      couplesButton?.addEventListener('click',openCouples);congregation?.addEventListener('click',open);backupButton?.addEventListener('click',openBackup);installButton?.addEventListener('click',install);
      const unsubscribe=pwaInstall?.subscribe?.(render)||(()=>{});
      return()=>{couplesButton?.removeEventListener('click',openCouples);congregation?.removeEventListener('click',open);backupButton?.removeEventListener('click',openBackup);installButton?.removeEventListener('click',install);unsubscribe()}
    }
  };
}
