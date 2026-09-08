export function morePage({onCongregation}){
  return {
    title:'More',
    html:`<section class="bq-panel"><p class="bq-eyebrow">MORE</p><h1>More BibleQuest</h1><p>Only recovered and verified tools are exposed here. Later community, ministry and admin workflows remain intentionally unavailable.</p></section><section class="bq-panel" data-more-congregation><p class="bq-eyebrow">CONGREGATION</p><h2>Membership & role</h2><p>View your active congregation role or join with an existing invite code.</p><button type="button" class="bq-primary-button" data-open-congregation>Open congregation access</button></section><section class="bq-panel"><p class="bq-eyebrow">RECOVERY STATUS</p><h2>More tools are still being rebuilt</h2><p>Journey Groups, encouragements, teams, assignments, Ministry Hub, notifications and Admin remain unavailable until their own verification milestones pass.</p></section>`,
    mount(root){const button=root.querySelector('[data-open-congregation]');const open=()=>onCongregation?.();button?.addEventListener('click',open);return()=>button?.removeEventListener('click',open)}
  };
}
