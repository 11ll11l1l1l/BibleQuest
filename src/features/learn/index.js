import { getContentProvenance } from '../../core/content-provenance.js';
import { DOCTRINAL_SAFETY } from '../../core/doctrinal-safety.js';
import { sourceGuide } from '../../ui/source-labels.js';
import { iconSvg } from '../../ui/icons.js';
import { localization } from '../../app/localization.js';

// canonical English source-label contract: <h1>Learn</h1> (rendered through learn.title for localization)\nconst escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const LEARN_COPY=Object.freeze({
  en:Object.freeze({
    'learn.title':'Learn','learn.eyebrow':'LEARN',
    'learn.description':'Read Scripture directly, follow a guided study, examine a deep question, walk through a Bible story, practice difficult Scripture-informed judgment, explore the biblical story map, review weak areas with spaced retrieval, or keep notes locally or with your signed-in account.',
    'learn.reader':'Bible Reader','learn.reader.detail':'English BSB + Tagalog ULB · search · verse tools',
    'learn.studyGroup':'STUDY & REFLECT','learn.study':'Guided Study','learn.study.detail':'Passage · context · observation · reflection · application',
    'learn.deep':'Deep Questions','learn.deep.detail':'Question · Scripture · open reflection · private note',
    'learn.story':'Story Journey','learn.story.detail':'Five Bible scenes · Scripture checkpoint · replay',
    'learn.wisdom':'Wisdom Situations','learn.wisdom.detail':'Complex scenario · strongest judgment · rationale · Scripture',
    'learn.exploreGroup':'EXPLORE & REVIEW','learn.world':'Bible World','learn.world.detail':'Nine story regions · exploration evidence · Scripture routes',
    'learn.adaptive':'Adaptive Learning','learn.adaptive.detail':'Due multiple-choice questions · weak areas · spaced Smart Review',
    'learn.review':'Open Smart Review','learn.review.detail':'Answer from memory · reveal source answer · Got it / Review again',
    'learn.notesGroup':'NOTES','learn.privateNotes':'Private Notes','learn.privateNotes.detail':'Device-only · create · edit · delete · export',
    'learn.cloudNotes':'Cloud Notes','learn.cloudNotes.detail':'Account-based · Scripture-linked · cross-device',
    'learn.safetyEyebrow':'CONTENT SAFETY','learn.safetyHeading':'How scored Bible questions are handled',
    'learn.safety':'Binary-scored questions must stay tied to an explicit Scripture reference and pass doctrinal-safety review. A disputed or universal doctrine claim is quarantined instead of being guessed into a right/wrong answer. Passage-sensitive material stays contextual, while Deep Questions and Wisdom remain interpretive or applied exercises rather than spiritual-quality scores.'
  }),
  tl:Object.freeze({
    'learn.title':'Matuto','learn.eyebrow':'MATUTO',
    'learn.description':'Direktang magbasa ng Kasulatan, sumunod sa gabay na pag-aaral, suriin ang malalim na tanong, lakaran ang isang kuwento sa Biblia, magsanay sa mahihirap na pasyang ginagabayan ng Kasulatan, tuklasin ang mapa ng kuwento ng Biblia, balikan ang mahihinang bahagi, o magtago ng mga tala sa device o account.',
    'learn.reader':'Mambabasa ng Biblia','learn.reader.detail':'English BSB + Tagalog ULB · paghahanap · mga tool sa talata',
    'learn.studyGroup':'PAG-AARAL AT PAGNINILAY','learn.study':'Gabay na Pag-aaral','learn.study.detail':'Talata · konteksto · obserbasyon · pagninilay · pagsasabuhay',
    'learn.deep':'Malalalim na Tanong','learn.deep.detail':'Tanong · Kasulatan · bukas na pagninilay · pribadong tala',
    'learn.story':'Paglalakbay sa Kuwento','learn.story.detail':'Limang tagpo sa Biblia · checkpoint sa Kasulatan · ulitin',
    'learn.wisdom':'Mga Sitwasyon ng Karunungan','learn.wisdom.detail':'Mahirap na sitwasyon · pinakamainam na pasya · dahilan · Kasulatan',
    'learn.exploreGroup':'TUKLASIN AT BALIKAN','learn.world':'Mundo ng Biblia','learn.world.detail':'Siyam na rehiyon ng kuwento · ebidensya ng pagtuklas · mga ruta sa Kasulatan',
    'learn.adaptive':'Adaptive na Pagkatuto','learn.adaptive.detail':'Mga nakatakdang multiple-choice · mahihinang bahagi · may pagitan na Smart Review',
    'learn.review':'Buksan ang Smart Review','learn.review.detail':'Sumagot mula sa alaala · ipakita ang sagot · Nakuha ko / Balikan muli',
    'learn.notesGroup':'MGA TALA','learn.privateNotes':'Pribadong Mga Tala','learn.privateNotes.detail':'Sa device lamang · gumawa · mag-edit · mag-delete · mag-export',
    'learn.cloudNotes':'Cloud Notes','learn.cloudNotes.detail':'Nakabatay sa account · naka-link sa Kasulatan · iba’t ibang device',
    'learn.safetyEyebrow':'KALIGTASAN NG NILALAMAN','learn.safetyHeading':'Paano hinahawakan ang mga tanong sa Biblia na may puntos',
    'learn.safety':'Ang mga tanong na tama o mali ang pagmamarka ay kailangang nakatali sa malinaw na sanggunian sa Kasulatan at pumasa sa doctrinal-safety review. Ang pinagtatalunang o pangkalahatang doktrinal na pahayag ay inilalagay sa quarantine sa halip na hulaan ang tama o maling sagot. Ang sensitibo sa konteksto ay nananatiling may konteksto, at ang Malalalim na Tanong at Karunungan ay hindi ginagawang espirituwal na marka.'
  }),
  ceb:Object.freeze({
    'learn.title':'Pagtuon','learn.eyebrow':'PAGTUON',
    'learn.description':'Basaha direkta ang Kasulatan, sunda ang giya nga pagtuon, susiha ang lawom nga pangutana, agi sa usa ka sugilanon sa Bibliya, praktisa ang lisod nga paghukom nga gigiyahan sa Kasulatan, susiha ang mapa sa biblikal nga sugilanon, balika ang huyang nga bahin, o tipigi ang mga nota sa device o account.',
    'learn.reader':'Magbabasa sa Bibliya','learn.reader.detail':'English BSB + Tagalog ULB · pagpangita · mga himan sa bersikulo',
    'learn.studyGroup':'PAGTUON UG PAMALANDONG','learn.study':'Gigiyahang Pagtuon','learn.study.detail':'Teksto · konteksto · obserbasyon · pagpamalandong · pagpadapat',
    'learn.deep':'Lawom nga mga Pangutana','learn.deep.detail':'Pangutana · Kasulatan · bukas nga pagpamalandong · pribadong nota',
    'learn.story':'Panaw sa Sugilanon','learn.story.detail':'Lima ka eksena sa Bibliya · checkpoint sa Kasulatan · balik',
    'learn.wisdom':'Mga Sitwasyon sa Kaalam','learn.wisdom.detail':'Lisod nga sitwasyon · labing lig-on nga paghukom · rason · Kasulatan',
    'learn.exploreGroup':'SUSIHI UG BALIKA','learn.world':'Kalibutan sa Bibliya','learn.world.detail':'Siyam ka rehiyon sa sugilanon · ebidensya sa pagsusi · mga ruta sa Kasulatan',
    'learn.adaptive':'Adaptive nga Pagtuon','learn.adaptive.detail':'Takdang multiple-choice · huyang nga bahin · spaced Smart Review',
    'learn.review':'Ablihi ang Smart Review','learn.review.detail':'Tubag gikan sa panumduman · ipakita ang tubag · Nasabtan / Balika',
    'learn.notesGroup':'MGA NOTA','learn.privateNotes':'Pribadong mga Nota','learn.privateNotes.detail':'Sa device lamang · paghimo · pag-edit · pagtangtang · pag-export',
    'learn.cloudNotes':'Cloud Notes','learn.cloudNotes.detail':'Gibase sa account · konektado sa Kasulatan · lain-laing device',
    'learn.safetyEyebrow':'KALUWASAN SA SULOD','learn.safetyHeading':'Giunsa pagdumala ang mga pangutana sa Bibliya nga adunay puntos',
    'learn.safety':'Ang mga pangutana nga adunay husto o sayop nga score kinahanglan adunay klarong reperensya sa Kasulatan ug moagi sa doctrinal-safety review. Ang gilalisan o universal nga doktrinal nga pahayag i-quarantine imbes tagnaon ang husto o sayop nga tubag. Ang materyal nga sensitibo sa konteksto magpabiling adunay konteksto, ug ang Lawom nga mga Pangutana ug Kaalam dili himuong espirituwal nga grado.'
  })
});

export function learnPage({ onReader, onStudy, onDeepQuestions, onStoryJourney, onWisdomSituations, onAdaptiveLearning, onOpenReview, onBibleWorld, onPrivateNotes, onCloudNotes, translations = [], recallSource = null }) {
  const locale=localization.getLocale();
  const t=(key,values)=>localization.t(key,{locale,values,dictionaries:LEARN_COPY});
  const guide = sourceGuide({
    translations,
    recall: recallSource,
    custom: [getContentProvenance('bq-study'), getContentProvenance('bq-retelling'), getContentProvenance('bq-wisdom'), getContentProvenance('bq-recall'), getContentProvenance('bq-game')]
  });
  const card=(attr,title,detail)=>`<button type="button" class="bq-learning-card" ${attr}><b>${escapeHtml(t(title))}</b><span>${escapeHtml(t(detail))}</span></button>`;
  return {
    title:t('learn.title'),
    html:`<section class="bq-panel"><p class="bq-eyebrow">${escapeHtml(t('learn.eyebrow'))}</p><h1>${escapeHtml(t('learn.title'))}</h1><p>${escapeHtml(t('learn.description'))}</p></section>` +
      `<section class="bq-panel bq-learn-primary" data-learn-primary><button type="button" class="bq-learn-primary-button" data-open-reader><span class="bq-learn-primary-icon" aria-hidden="true">${iconSvg('bible',{size:28})}</span><span class="bq-learn-primary-text"><b>${escapeHtml(t('learn.reader'))}</b><span>${escapeHtml(t('learn.reader.detail'))}</span></span></button></section>` +
      `<div class="bq-learn-group"><p class="bq-eyebrow">${escapeHtml(t('learn.studyGroup'))}</p><div class="bq-learning-grid">` +
        card('data-open-study','learn.study','learn.study.detail') +
        card('data-open-deep-questions','learn.deep','learn.deep.detail') +
        card('data-open-story-journey','learn.story','learn.story.detail') +
        card('data-open-wisdom-situations','learn.wisdom','learn.wisdom.detail') +
      `</div></div>` +
      `<div class="bq-learn-group"><p class="bq-eyebrow">${escapeHtml(t('learn.exploreGroup'))}</p><div class="bq-learning-grid">` +
        card('data-open-bible-world','learn.world','learn.world.detail') +
        card('data-open-adaptive-learning','learn.adaptive','learn.adaptive.detail') +
        card('data-open-open-review','learn.review','learn.review.detail') +
      `</div></div>` +
      `<div class="bq-learn-group"><p class="bq-eyebrow">${escapeHtml(t('learn.notesGroup'))}</p><div class="bq-learning-grid">` +
        card('data-open-private-notes','learn.privateNotes','learn.privateNotes.detail') +
        card('data-open-cloud-notes','learn.cloudNotes','learn.cloudNotes.detail') +
      `</div></div>` +
      `<section class="bq-panel" data-doctrinal-policy><p class="bq-eyebrow">${escapeHtml(t('learn.safetyEyebrow'))}</p><h2>${escapeHtml(t('learn.safetyHeading'))}</h2><p>${escapeHtml(t('learn.safety'))}</p><p><small>${escapeHtml(DOCTRINAL_SAFETY.authority)}</small></p></section>${guide}`,
    mount(root) {
      const reader=root.querySelector('[data-open-reader]'),study=root.querySelector('[data-open-study]'),deep=root.querySelector('[data-open-deep-questions]'),story=root.querySelector('[data-open-story-journey]'),wisdom=root.querySelector('[data-open-wisdom-situations]'),bibleWorld=root.querySelector('[data-open-bible-world]'),adaptive=root.querySelector('[data-open-adaptive-learning]'),openReview=root.querySelector('[data-open-open-review]'),privateNotes=root.querySelector('[data-open-private-notes]'),cloudNotes=root.querySelector('[data-open-cloud-notes]');
      const goReader=()=>onReader?.(),goStudy=()=>onStudy?.(),goDeep=()=>onDeepQuestions?.(),goStory=()=>onStoryJourney?.(),goWisdom=()=>onWisdomSituations?.(),goBibleWorld=()=>onBibleWorld?.(),goAdaptive=()=>onAdaptiveLearning?.(),goOpenReview=()=>onOpenReview?.(),goPrivateNotes=()=>onPrivateNotes?.(),goCloudNotes=()=>onCloudNotes?.();
      reader?.addEventListener('click',goReader);study?.addEventListener('click',goStudy);deep?.addEventListener('click',goDeep);story?.addEventListener('click',goStory);wisdom?.addEventListener('click',goWisdom);bibleWorld?.addEventListener('click',goBibleWorld);adaptive?.addEventListener('click',goAdaptive);openReview?.addEventListener('click',goOpenReview);privateNotes?.addEventListener('click',goPrivateNotes);cloudNotes?.addEventListener('click',goCloudNotes);
      return()=>{reader?.removeEventListener('click',goReader);study?.removeEventListener('click',goStudy);deep?.removeEventListener('click',goDeep);story?.removeEventListener('click',goStory);wisdom?.removeEventListener('click',goWisdom);bibleWorld?.removeEventListener('click',goBibleWorld);adaptive?.removeEventListener('click',goAdaptive);openReview?.removeEventListener('click',goOpenReview);privateNotes?.removeEventListener('click',goPrivateNotes);cloudNotes?.removeEventListener('click',goCloudNotes);};
    }
  };
}
