(() => {
  const APP='biblequest_state_v4';
  const esc=(s='')=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let scheduled=false,last='';

  function identity(){
    let state={};
    try{state=JSON.parse(localStorage.getItem(APP)||'{}')}catch{}
    const profile=window.BQAccount?.profile?.()||{};
    return {
      name:(profile.preferred_name||state.profile?.name||'Kaibigan').trim(),
      avatar:profile.avatar||state.profile?.avatar||{}
    };
  }

  function render(){
    const home=document.querySelector('.modern-home');
    if(!home)return;
    const id=identity();
    const signature=`${id.name}|${JSON.stringify(id.avatar||{})}`;
    let hero=home.querySelector('.bq-pinoy-hero');
    if(hero&&signature===last)return;
    last=signature;
    if(!hero){
      hero=document.createElement('section');
      hero.className='bq-pinoy-hero';
      home.prepend(hero);
    }
    const avatar=window.BQAvatar?.render?.(id.avatar,'small')||'🙂';
    hero.innerHTML=`
      <div class="bq-pinoy-hero-art" role="img" aria-label="Cute Filipino in Japan BibleQuest characters with Mount Fuji, sakura, and a Shiba Inu wearing sheep wool"></div>
      <div class="bq-pinoy-hero-overlay">
        <div class="bq-pinoy-greeting">
          <div class="bq-pinoy-avatar">${avatar}</div>
          <div><small>🇵🇭 PINOY IN JAPAN · BIBLEQUEST</small><h1>Kumusta, ${esc(id.name)}!</h1><p>Different places. Same Jesus. One family.</p></div>
        </div>
        <div class="bq-pinoy-actions">
          <button data-pinoy-mission><span>🎯</span><b>My Mission</b><small>Continue your next step</small></button>
          <div class="bq-shiba-chip"><span>🐕</span><div><b>Shiba-Sheep</b><small>Your fluffy journey buddy</small></div></div>
        </div>
      </div>`;
    hero.querySelector('[data-pinoy-mission]').onclick=()=>window.BQMission?.open?.();
  }

  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;render()})}
  window.addEventListener('bq-modern-home-rendered',schedule);
  window.addEventListener('bq-account-profile',schedule);
  window.addEventListener('bq-avatar-style-change',schedule);
  document.addEventListener('DOMContentLoaded',()=>setTimeout(schedule,180));
  setTimeout(schedule,600);
  window.BQPinoyHero={render};
})();
