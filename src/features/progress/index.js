import { localization } from '../../app/localization.js';

const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const PROGRESS_ART='assets/progress-feature-icons.svg';

const PROGRESS_COPY=Object.freeze({
  en:Object.freeze({
    'progress.title':'Grow','progress.eyebrow':'GROW','progress.heading':'Your BibleQuest progress',
    'progress.description':'Track XP, streaks, meaningful activity, chapters read, and badges as you learn. Guest progress stays on this device.',
    'progress.xp':'XP','progress.streak':'Day streak','progress.activities':'Activities','progress.chapters':'Chapters read',
    'progress.reflectEyebrow':'REFLECT & GROW','progress.transform':'Transformation',
    'progress.transformDescription':'Use private faith/practice reflection plus the optional personality and thinking-pattern tools. These are not spiritual grades or diagnoses.',
    'progress.openTransform':'Open Transformation','progress.personality':'Personality Profile','progress.psychometrics':'Psychometrics Lab','progress.avatar':'Avatar Vault','progress.journey':'My Journey',
    'progress.achievements':'ACHIEVEMENTS','progress.badges':'Badges','progress.unlocked':'{earned}/{total} unlocked',
    'progress.ruleLead':'Progress rule:','progress.rule':'BibleQuest records each activity once, so repeating or reopening the same completed action does not award progress twice.',
    'progress.badge.first-step.label':'First Step','progress.badge.first-step.description':'Complete one meaningful BibleQuest activity.',
    'progress.badge.streak-3.label':'3-Day Streak','progress.badge.streak-3.description':'Be active on three consecutive local calendar days.',
    'progress.badge.streak-7.label':'7-Day Streak','progress.badge.streak-7.description':'Be active on seven consecutive local calendar days.',
    'progress.badge.bible-recall.label':'Bible Recall','progress.badge.bible-recall.description':'Answer at least 20 Bible recall questions correctly.',
    'progress.badge.reader.label':'Reader','progress.badge.reader.description':'Mark 10 Bible chapters read.',
    'progress.badge.reflection.label':'Reflection','progress.badge.reflection.description':'Complete and save one reflection.'
  }),
  tl:Object.freeze({
    'progress.title':'Lumago','progress.eyebrow':'LUMAGO','progress.heading':'Ang iyong pag-unlad sa BibleQuest',
    'progress.description':'Subaybayan ang XP, sunod-sunod na araw, makabuluhang aktibidad, mga kabanatang nabasa, at mga badge habang natututo. Ang progreso ng bisita ay nananatili sa device na ito.',
    'progress.xp':'XP','progress.streak':'Sunod-sunod na araw','progress.activities':'Mga aktibidad','progress.chapters':'Mga kabanatang nabasa',
    'progress.reflectEyebrow':'MAGNILAY AT LUMAGO','progress.transform':'Pagbabago',
    'progress.transformDescription':'Gamitin ang pribadong pagninilay sa pananampalataya at pagsasabuhay, kasama ang opsyonal na mga tool sa personalidad at paraan ng pag-iisip. Hindi ito espirituwal na marka o diagnosis.',
    'progress.openTransform':'Buksan ang Pagbabago','progress.personality':'Profile ng Personalidad','progress.psychometrics':'Psychometrics Lab','progress.avatar':'Avatar Vault','progress.journey':'Aking Paglalakbay',
    'progress.achievements':'MGA NAKAMIT','progress.badges':'Mga Badge','progress.unlocked':'{earned}/{total} nabuksan',
    'progress.ruleLead':'Panuntunan sa progreso:','progress.rule':'Isang beses lamang itinatala ng BibleQuest ang bawat aktibidad, kaya ang pag-uulit o muling pagbukas ng tapos nang gawain ay hindi muling nagbibigay ng progreso.',
    'progress.badge.first-step.label':'Unang Hakbang','progress.badge.first-step.description':'Kumpletuhin ang isang makabuluhang aktibidad sa BibleQuest.',
    'progress.badge.streak-3.label':'3-Araw na Sunod-sunod','progress.badge.streak-3.description':'Maging aktibo sa tatlong magkakasunod na araw.',
    'progress.badge.streak-7.label':'7-Araw na Sunod-sunod','progress.badge.streak-7.description':'Maging aktibo sa pitong magkakasunod na araw.',
    'progress.badge.bible-recall.label':'Pag-alala sa Biblia','progress.badge.bible-recall.description':'Masagot nang tama ang hindi bababa sa 20 tanong sa pag-alala sa Biblia.',
    'progress.badge.reader.label':'Mambabasa','progress.badge.reader.description':'Markahan bilang nabasa ang 10 kabanata ng Biblia.',
    'progress.badge.reflection.label':'Pagninilay','progress.badge.reflection.description':'Kumpletuhin at i-save ang isang pagninilay.'
  }),
  ceb:Object.freeze({
    'progress.title':'Pagtubo','progress.eyebrow':'PAGTUBO','progress.heading':'Imong pag-uswag sa BibleQuest',
    'progress.description':'Subaya ang XP, sunod-sunod nga adlaw, makahuluganon nga kalihokan, mga kapitulo nga nabasa, ug mga badge samtang nagtuon. Ang progreso sa bisita magpabilin niini nga device.',
    'progress.xp':'XP','progress.streak':'Sunod-sunod nga adlaw','progress.activities':'Mga kalihokan','progress.chapters':'Mga kapitulo nga nabasa',
    'progress.reflectEyebrow':'PAMALANDONG UG TUBO','progress.transform':'Pagbag-o',
    'progress.transformDescription':'Gamita ang pribadong pagpamalandong sa pagtuo ug pagbuhat, uban sa opsyonal nga mga himan sa personalidad ug paagi sa panghunahuna. Dili kini espirituwal nga grado o diagnosis.',
    'progress.openTransform':'Ablihi ang Pagbag-o','progress.personality':'Profile sa Personalidad','progress.psychometrics':'Psychometrics Lab','progress.avatar':'Avatar Vault','progress.journey':'Akong Panaw',
    'progress.achievements':'MGA NAKAB-OT','progress.badges':'Mga Badge','progress.unlocked':'{earned}/{total} naablihan',
    'progress.ruleLead':'Lagda sa progreso:','progress.rule':'Usa ra ka beses irekord sa BibleQuest ang matag kalihokan, busa ang pag-usab o pag-abli pag-usab sa nahuman na nga buluhaton dili makahatag og progreso pag-usab.',
    'progress.badge.first-step.label':'Unang Lakang','progress.badge.first-step.description':'Humanon ang usa ka makahuluganon nga kalihokan sa BibleQuest.',
    'progress.badge.streak-3.label':'3 ka Adlaw nga Sunod-sunod','progress.badge.streak-3.description':'Mag-aktibo sulod sa tulo ka sunod-sunod nga adlaw.',
    'progress.badge.streak-7.label':'7 ka Adlaw nga Sunod-sunod','progress.badge.streak-7.description':'Mag-aktibo sulod sa pito ka sunod-sunod nga adlaw.',
    'progress.badge.bible-recall.label':'Paghinumdom sa Bibliya','progress.badge.bible-recall.description':'Tubaga og husto ang labing menos 20 ka pangutana sa paghinumdom sa Bibliya.',
    'progress.badge.reader.label':'Magbabasa','progress.badge.reader.description':'Markahi nga nabasa ang 10 ka kapitulo sa Bibliya.',
    'progress.badge.reflection.label':'Pagpamalandong','progress.badge.reflection.description':'Humanon ug i-save ang usa ka pagpamalandong.'
  })
});

function progressArt(id,className='bq-progress-art'){
  return `<svg class="${escapeHtml(className)}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="${PROGRESS_ART}#${escapeHtml(id)}"></use></svg>`;
}

function progressArtWrap(id,small=false){
  return `<span class="bq-progress-art-wrap${small?' is-small':''}" aria-hidden="true">${progressArt(id)}</span>`;
}

function progressStat(id,value,label,attribute){
  return `<div><span class="bq-progress-stat-art" aria-hidden="true">${progressArt(id)}</span><b ${attribute}>${value}</b><span>${escapeHtml(label)}</span></div>`;
}

function progressAction(id,label,attribute,primary=false){
  return `<button type="button" class="${primary?'bq-primary-button':'bq-secondary-button'}" ${attribute}>${progressArt(id,'bq-progress-action-art')}<span>${escapeHtml(label)}</span></button>`;
}

export function progressPage({progress,onTransform,onPersonalityProfile,onPsychometrics,onAvatarVault,onMyJourney}){
  const locale=localization.getLocale();
  const t=(key,values)=>localization.t(key,{locale,values,dictionaries:PROGRESS_COPY});
  const state=progress.getState(),unlocked=new Set(state.badges);
  return{title:t('progress.title'),html:`<section class="bq-panel bq-progress-head" data-progress-page><p class="bq-eyebrow">${escapeHtml(t('progress.eyebrow'))}</p><div class="bq-progress-hero">${progressArtWrap('progress')}<div class="bq-progress-hero-copy"><h1>${escapeHtml(t('progress.heading'))}</h1><p>${escapeHtml(t('progress.description'))}</p></div></div><div class="bq-progress-stats">${progressStat('xp',state.xp,t('progress.xp'),'data-progress-page-xp')}${progressStat('streak',state.streak,t('progress.streak'),'data-progress-page-streak')}${progressStat('activity',state.totalActivities,t('progress.activities'),'data-progress-page-activities')}${progressStat('chapter',state.counters.chaptersRead,t('progress.chapters'),'data-progress-page-chapters')}</div></section><section class="bq-panel"><p class="bq-eyebrow">${escapeHtml(t('progress.reflectEyebrow'))}</p><div class="bq-progress-section-heading">${progressArtWrap('growth',true)}<h2>${escapeHtml(t('progress.transform'))}</h2></div><p class="bq-section-copy">${escapeHtml(t('progress.transformDescription'))}</p><div class="bq-account-actions bq-progress-actions">${progressAction('growth',t('progress.openTransform'),'data-open-transform',true)}${progressAction('profile',t('progress.personality'),'data-open-personality-profile')}${progressAction('psychometrics',t('progress.psychometrics'),'data-open-psychometrics')}${progressAction('avatar',t('progress.avatar'),'data-open-avatar-vault')}${progressAction('activity',t('progress.journey'),'data-open-my-journey')}</div></section><section class="bq-panel"><div class="bq-progress-title"><div><p class="bq-eyebrow">${escapeHtml(t('progress.achievements'))}</p><div class="bq-progress-section-heading">${progressArtWrap('achievements',true)}<h2>${escapeHtml(t('progress.badges'))}</h2></div></div><small>${escapeHtml(t('progress.unlocked',{earned:state.badges.length,total:progress.badges.length}))}</small></div><div class="bq-badge-grid">${progress.badges.map(badge=>{const earned=unlocked.has(badge.id);return `<article class="bq-badge-card ${earned?'is-unlocked':'is-locked'}" data-progress-badge="${escapeHtml(badge.id)}"><span class="bq-progress-badge-art" aria-hidden="true" data-progress-badge-art="${earned?'unlocked':'locked'}">${progressArt(earned?'badge':'badge-locked')}</span><div><b>${escapeHtml(t(`progress.badge.${badge.id}.label`)||badge.label)}</b><p>${escapeHtml(t(`progress.badge.${badge.id}.description`)||badge.description)}</p></div></article>`}).join('')}</div></section><section class="bq-panel bq-progress-note"><p><b>${escapeHtml(t('progress.ruleLead'))}</b> ${escapeHtml(t('progress.rule'))}</p></section>`,mount(root){const transformButton=root.querySelector('[data-open-transform]'),profileButton=root.querySelector('[data-open-personality-profile]'),psychometricsButton=root.querySelector('[data-open-psychometrics]'),avatarButton=root.querySelector('[data-open-avatar-vault]'),myJourneyButton=root.querySelector('[data-open-my-journey]');const openTransform=()=>onTransform?.(),openProfile=()=>onPersonalityProfile?.(),openPsychometrics=()=>onPsychometrics?.(),openAvatarVault=()=>onAvatarVault?.(),openMyJourney=()=>onMyJourney?.();transformButton?.addEventListener('click',openTransform);profileButton?.addEventListener('click',openProfile);psychometricsButton?.addEventListener('click',openPsychometrics);avatarButton?.addEventListener('click',openAvatarVault);myJourneyButton?.addEventListener('click',openMyJourney);return()=>{transformButton?.removeEventListener('click',openTransform);profileButton?.removeEventListener('click',openProfile);psychometricsButton?.removeEventListener('click',openPsychometrics);avatarButton?.removeEventListener('click',openAvatarVault);myJourneyButton?.removeEventListener('click',openMyJourney)}}};
}
