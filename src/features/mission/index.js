const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const missionArt=id=>`<span class="bq-mission-art-wrap" data-mission-art="${id}" aria-hidden="true"><svg class="bq-mission-art" viewBox="0 0 24 24" focusable="false"><use href="assets/mission-feature-icons.svg#${id}"></use></svg></span>`;

export function missionPage({mission,onBack,onReview,onStudy}={}){
  return{title:'My Mission',html:'<section class="bq-panel" data-mission-page></section>',mount(root){
    const host=root.querySelector('[data-mission-page]');
    const rec=mission.recommend();
    const art=rec.action==='review'?'review':'study';
    host.innerHTML=`<div class="bq-mission-intro" data-mission-action="${art}"><div><p class="bq-eyebrow">PERSONAL · ABOUT 6 MINUTES</p><h1>${esc(rec.title)}</h1><p class="bq-mission-copy">${esc(rec.text)}</p></div>${missionArt(art)}</div><section class="bq-panel bq-progress-note bq-mission-progress"><p><b>1. Retrieve</b> &mdash; answer before revealing.<br><b>2. Read</b> &mdash; check the actual passage.<br><b>3. Connect</b> &mdash; make one practical connection.</p></section><div class="bq-mission-actions"><button type="button" class="bq-primary-button" data-mission-start>Start this mission</button><button type="button" class="bq-secondary-button" data-mission-back>Back to More</button></div>`;
    host.querySelector('[data-mission-start]')?.addEventListener('click',()=>{
      if(rec.action==='review')onReview?.();else onStudy?.();
    },{once:true});
    host.querySelector('[data-mission-back]')?.addEventListener('click',()=>onBack?.(),{once:true});
  }};
}
