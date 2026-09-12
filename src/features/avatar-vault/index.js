const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const ART_IDS=new Set(['starter','sakura','lantern','flame','crown','scholar','scroll','shepherd','couple','community','world','kitsune','moon','fuji','tea']);
const avatarArt=(id,{locked=false,hero=false}={})=>{
  const art=locked?'lock':(ART_IDS.has(id)?id:'starter');
  return `<span class="bq-avatar-art-wrap${hero?' is-hero':''}" data-avatar-art="${art}" aria-hidden="true"><svg class="bq-avatar-art" viewBox="0 0 24 24" focusable="false"><use href="assets/avatar-vault-icons.svg#${art}"></use></svg></span>`;
};

function grid(state){
  return `<div class="bq-badge-grid">${state.styles.map(style=>`<article class="bq-badge-card ${style.unlocked?'is-unlocked':'is-locked'} ${style.active?'is-active':''}" data-avatar-style="${esc(style.id)}">${avatarArt(style.id,{locked:!style.unlocked})}<div><b>${esc(style.name)}</b><p>${style.unlocked?(style.active?'Equipped':esc(style.progressLabel)):esc(style.req)}</p>${!style.available?'<small>Coming soon &mdash; not yet trackable in v3</small>':''}${style.unlocked&&!style.active?`<button type="button" class="bq-secondary-button" data-avatar-select="${esc(style.id)}">Equip</button>`:''}</div></article>`).join('')}</div>`;
}

export function avatarVaultPage({vault,onBack,onAccount}={}){
  return{title:'Avatar Vault',html:'<section class="bq-panel" data-avatar-vault-page></section>',mount(root){
    const host=root.querySelector('[data-avatar-vault-page]');let message='',disposed=false;
    const render=state=>{
      if(disposed)return;
      host.innerHTML=`<div class="bq-vault-hero"><div><p class="bq-eyebrow">AVATAR VAULT</p><h1>Equipped: ${esc(state.selected.name)}</h1><p class="bq-vault-copy">Special avatar styles unlock through real BibleQuest milestones and stay earned afterward. Cosmetic only &mdash; they never change scores, ranking, or spiritual standing.</p></div>${avatarArt(state.selected.id,{hero:true})}</div>${message?`<p class="bq-form-message" role="status">${esc(message)}</p>`:''}<p class="bq-vault-scope"><small>${state.scope==='account-cloud'?'Signed-in: your equipped style also appears next to your name on congregation leaderboards.':'Guest: your equipped style stays on this device only.'}</small></p>${grid(state)}<section class="bq-panel bq-progress-note bq-vault-note"><p><b>Fair-play note:</b> avatar styles are cosmetic only. Locked cards always show exactly how to unlock them.</p></section><button type="button" class="bq-secondary-button bq-vault-back" data-avatar-back>Back to Grow</button>`;
      bind();
    };
    const bind=()=>{
      host.querySelector('[data-avatar-back]')?.addEventListener('click',()=>onBack?.(),{once:true});
      host.querySelectorAll('[data-avatar-select]').forEach(button=>button.addEventListener('click',async()=>{
        const id=button.dataset.avatarSelect;
        try{const next=await vault.select(id);message=next.synced?'Avatar style equipped!':'Equipped on this device. Cloud sync will retry next time you open the Vault.';render(next)}
        catch(error){message=error?.message||'That style is not unlocked yet.';render(vault.getState())}
      },{once:true}));
    };
    vault.load().then(render).catch(()=>render(vault.getState()));
    return()=>{disposed=true};
  }};
}
