const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function missionPage({mission,onBack,onReview,onStudy}={}){
  return{title:'My Mission',html:'<section class="bq-panel" data-mission-page></section>',mount(root){
    const host=root.querySelector('[data-mission-page]');
    const rec=mission.recommend();
    host.innerHTML=`<p class="bq-eyebrow">PERSONAL · ABOUT 6 MINUTES</p><h1>${rec.icon} ${esc(rec.title)}</h1><p>${esc(rec.text)}</p><section class="bq-panel bq-progress-note"><p><b>1. Retrieve</b> &mdash; answer before revealing.<br><b>2. Read</b> &mdash; check the actual passage.<br><b>3. Connect</b> &mdash; make one practical connection.</p></section><button type="button" class="bq-primary-button" data-mission-start>Start this mission</button><button type="button" class="bq-secondary-button" data-mission-back>Back to More</button>`;
    host.querySelector('[data-mission-start]')?.addEventListener('click',()=>{
      if(rec.action==='review')onReview?.();else onStudy?.();
    },{once:true});
    host.querySelector('[data-mission-back]')?.addEventListener('click',()=>onBack?.(),{once:true});
  }};
}
