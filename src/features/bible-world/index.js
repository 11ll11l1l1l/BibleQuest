const esc=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function worldList(state){
  return `<div class="bq-world-head"><div><p class="bq-eyebrow">BIBLE WORLD</p><h1>Travel through the biblical story.</h1><p>Regions show learning evidence, not spiritual maturity. Scripture is never locked; ${state.threshold}% marks a region as explored and helps identify the next path marker.</p></div><button type="button" class="bq-secondary-button" data-world-learn>Back to Learn</button></div><section class="bq-world-map" aria-label="Bible World regions">${state.regions.map(region=>`<button type="button" class="bq-world-region${region.isNext?' is-next':''}${region.explored?' is-explored':''}" data-world-region="${esc(region.key)}"><span class="bq-world-icon" aria-hidden="true">${region.icon}</span><span class="bq-world-copy"><span class="bq-world-title">${esc(region.title)}</span><span class="bq-world-books">${esc(region.books.join(' · '))}</span><span class="bq-world-progress" role="progressbar" aria-label="${esc(region.title)} exploration" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${region.percent}"><i style="width:${region.percent}%"></i></span></span><span class="bq-world-status">${region.isNext&&!state.allExplored?'Next marker':region.explored?'Explored':'Explore'}<b>${region.percent}%</b></span></button>`).join('')}</section><section class="bq-panel bq-world-note"><h2>What the percentage means</h2><p>It reflects BibleQuest learning evidence from the existing Adaptive Learning profile. It does not lock books, judge faith, or create a second score.</p></section>`;
}

function regionDetail(region,state){
  return `<div class="bq-world-head"><div><p class="bq-eyebrow">BIBLE WORLD · ${esc(region.category.toUpperCase())}</p><h1>${region.icon} ${esc(region.title)}</h1><p>${region.percent}% explored. The ${state.threshold}% threshold is a journey marker only; every Scripture route stays available.</p></div><button type="button" class="bq-secondary-button" data-world-back>Back to World</button></div><section class="bq-panel bq-world-detail" data-world-detail="${esc(region.key)}"><h2>Explore this region</h2><p>${esc(region.books.join(' · '))}</p><div class="bq-world-actions"><button type="button" class="bq-primary-button" data-world-read>Read from this region<span>Open ${esc(region.ref.code)} ${region.ref.chapter} in the Reader</span></button><button type="button" class="bq-secondary-button" data-world-review>Review what you know<span>Open the existing Smart Review</span></button></div><p class="bq-world-boundary">Bible World does not award XP by itself. Reading and review keep their existing owners and reward rules.</p></section>`;
}

export function bibleWorldPage({world,onNavigate,onLearn}={}){
  return{title:'Bible World',html:'<section class="bq-bible-world" data-bible-world-view></section>',mount(root){
    const view=root.querySelector('[data-bible-world-view]');let selected='';
    const render=()=>{
      const state=world.snapshot();
      if(selected){let region;try{region=world.region(selected)}catch{selected=''}if(region)view.innerHTML=regionDetail(region,state);else view.innerHTML=worldList(state)}else view.innerHTML=worldList(state);
      bind();
    };
    const bind=()=>{
      view.querySelector('[data-world-learn]')?.addEventListener('click',()=>onLearn?.(),{once:true});
      view.querySelector('[data-world-back]')?.addEventListener('click',()=>{selected='';render()},{once:true});
      view.querySelectorAll('[data-world-region]').forEach(button=>button.addEventListener('click',()=>{selected=button.dataset.worldRegion||'';render()},{once:true}));
      view.querySelector('[data-world-read]')?.addEventListener('click',()=>onNavigate?.(world.openRead(selected).route),{once:true});
      view.querySelector('[data-world-review]')?.addEventListener('click',()=>onNavigate?.(world.openReview(selected).route),{once:true});
    };
    render();return()=>{selected=''};
  }};
}
