const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const order=['O','C','E','A','S'];
const label=value=>String(value||'').replaceAll('-',' ');
const when=value=>{try{return new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(value))}catch{return String(value||'')}};

function profileView(state){
  if(!state.profile)return `<section class="bq-panel"><p class="bq-eyebrow">PERSONALITY PROFILE</p><h1>No saved profile for this ${state.scope==='account-device'?'account on this device':'guest session'}.</h1><p>Complete or retake the 20-item Personality section in Full Transform to create a private profile for the current owner.</p><p class="bq-form-message">Existing unowned Transform data is not automatically claimed by a different account.</p><button type="button" class="bq-primary-button" data-personality-transform>Open Full Transform</button></section>`;
  const profile=state.profile,result=profile.result,p=profile.presentation;
  return `<section class="bq-panel"><p class="bq-eyebrow">PERSONALITY PROFILE</p><h1>Your saved personality snapshot</h1><p>${esc(profile.source)} · 20-item IPIP-based Big Five self-reflection.</p><p><b>Completed:</b> ${esc(when(result.date))}<br><b>Saved:</b> ${esc(when(profile.savedAt))}</p></section><section class="bq-panel"><h2>Five tendencies</h2><div class="bq-transform-focus">${order.map(key=>{const row=result.scores[key];return `<article data-personality-factor="${key}"><b>${esc(row.name)}</b><p>${esc(row.band)} · ${esc(row.mean)}/5</p></article>`}).join('')}</div></section><section class="bq-panel" data-personality-presentation><p class="bq-eyebrow">PRESENTATION PREFERENCES</p><h2>Optional presentation-only hints</h2><p>These are simple display preferences inferred from the saved profile. They never change doctrine, Scripture, scores, permissions, or completion rules.</p><div class="bq-transform-focus"><article><b>Depth</b><p>${esc(label(p.depth))}</p></article><article><b>Structure</b><p>${esc(label(p.structure))}</p></article><article><b>Interaction</b><p>${esc(label(p.interaction))}</p></article><article><b>Challenge style</b><p>${esc(label(p.challengeStyle))}</p></article><article><b>Pacing</b><p>${esc(label(p.pacing))}</p></article></div></section><section class="bq-panel bq-transform-actions"><div><b>Manage this profile</b><p>Retaking Personality replaces only the current owner’s saved snapshot.</p></div><div><button type="button" class="bq-secondary-button" data-personality-clear>Clear saved profile</button><button type="button" class="bq-primary-button" data-personality-transform>Retake in Full Transform</button></div></section>`;
}

export function personalityProfilePage({profile,onBack,onTransform}={}){
  return{title:'Personality Profile',html:'<section data-personality-profile-page></section>',mount(root){
    const host=root.querySelector('[data-personality-profile-page]');let message='';
    const render=()=>{const state=profile.load();host.innerHTML=`${message?`<p class="bq-form-message" role="status">${esc(message)}</p>`:''}${profileView(state)}<section class="bq-panel"><p class="bq-eyebrow">PRIVACY BOUNDARY</p><h2>Private to this owner on this device</h2><p>This profile is stored in BibleQuest private device storage and is excluded from normal portable backup. It is not shared with congregations, leaders, assignments, Couples, Cloud Notes, or other signed-in accounts.</p><p>This 20-item reflection is not a diagnosis, employment assessment, faith score, spiritual-maturity score, or the separate #81 Psychometrics Lab.</p><button type="button" class="bq-secondary-button" data-personality-back>Back to Grow</button></section>`;bind()};
    const bind=()=>{
      host.querySelectorAll('[data-personality-transform]').forEach(button=>button.addEventListener('click',()=>onTransform?.(),{once:true}));
      host.querySelector('[data-personality-back]')?.addEventListener('click',()=>onBack?.(),{once:true});
      host.querySelector('[data-personality-clear]')?.addEventListener('click',()=>{if(!window.confirm('Clear the saved Personality Profile for the current owner on this device?'))return;profile.clear();message='Saved personality profile cleared for this owner.';render()},{once:true});
    };
    render();
  }};
}
