import { localization } from '../../app/localization.js';
import { iconSvg } from '../../ui/icons.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const HOME_WEEK_COPY = Object.freeze({
  en: Object.freeze({
    'home.week.eyebrow': 'THIS WEEK',
    'home.week.heading': 'Keep your week connected',
    'home.week.description': 'Move through the same BibleQuest owners in one simple rhythm. Nothing here creates a second record of your service, Scripture, reflection, group, assignment, or calendar data.',
    'home.week.journeyLabel': 'This week spiritual journey',
    'home.week.dinner.label': 'ASK AT DINNER · OPTIONAL',
    'home.week.dinner.prompt': 'What did God show us this week, and how can we live it out together?',
    'home.week.service.title': '1 · Service',
    'home.week.service.description': 'Start from the latest confirmed service or sermon recording.',
    'home.week.service.action': 'Open service',
    'home.week.scripture.title': '2 · Scripture',
    'home.week.scripture.description': 'Open the Bible to read the passage or context connected to what you heard.',
    'home.week.scripture.action': 'Read Scripture',
    'home.week.reflect.title': '3 · Reflect',
    'home.week.reflect.description': 'Use Transformation to understand, reflect, and apply what stood out.',
    'home.week.reflect.action': 'Open reflection',
    'home.week.discuss.title': '4 · Discuss & pray',
    'home.week.discuss.description': 'Optionally continue the conversation or prayer with your existing Journey Group.',
    'home.week.discuss.action': 'Open Journey Group',
    'home.week.act.title': '5 · Act',
    'home.week.act.description': 'Open your current congregation assignment or action step.',
    'home.week.act.action': 'Open assignments',
    'home.week.plan.title': '6 · Plan',
    'home.week.plan.description': 'Use Calendar to keep the next gathering, deadline, or follow-up visible.',
    'home.week.plan.action': 'Open Calendar',
    'home.week.markDone': 'Mark done',
    'home.week.markUndone': 'Undo',
    'home.week.next': 'Continue here',
    'home.week.progressSuffix': 'complete'
  }),
  tl: Object.freeze({
    'home.week.eyebrow': 'NGAYONG LINGGO',
    'home.week.heading': 'Panatilihing magkakaugnay ang linggo mo',
    'home.week.description': 'Sundan ang iisang simpleng daloy gamit ang kasalukuyang BibleQuest tools. Walang panibagong kopya ng service, Kasulatan, reflection, group, assignment, o calendar data.',
    'home.week.journeyLabel': 'Espirituwal na paglalakbay ngayong linggo',
    'home.week.dinner.label': 'PAG-USAPAN SA HAPUNAN · OPSYONAL',
    'home.week.dinner.prompt': 'Ano ang ipinakita sa atin ng Diyos ngayong linggo, at paano natin ito maisasabuhay nang magkakasama?',
    'home.week.service.title': '1 · Service',
    'home.week.service.description': 'Magsimula sa pinakabagong kumpirmadong recording ng service o sermon.',
    'home.week.service.action': 'Buksan ang service',
    'home.week.scripture.title': '2 · Kasulatan',
    'home.week.scripture.description': 'Buksan ang Biblia para basahin ang talata o kontekstong kaugnay ng iyong narinig.',
    'home.week.scripture.action': 'Basahin ang Kasulatan',
    'home.week.reflect.title': '3 · Magnilay',
    'home.week.reflect.description': 'Gamitin ang Transformation para unawain, pagnilayan, at isabuhay ang tumatak sa iyo.',
    'home.week.reflect.action': 'Buksan ang reflection',
    'home.week.discuss.title': '4 · Mag-usap at manalangin',
    'home.week.discuss.description': 'Kung nais, ipagpatuloy ang usapan o panalangin sa kasalukuyan mong Journey Group.',
    'home.week.discuss.action': 'Buksan ang Journey Group',
    'home.week.act.title': '5 · Isabuhay',
    'home.week.act.description': 'Buksan ang kasalukuyang assignment o action step ng kongregasyon.',
    'home.week.act.action': 'Buksan ang mga gawain',
    'home.week.plan.title': '6 · Magplano',
    'home.week.plan.description': 'Gamitin ang Kalendaryo para manatiling malinaw ang susunod na pagtitipon, deadline, o follow-up.',
    'home.week.plan.action': 'Buksan ang Kalendaryo',
    'home.week.markDone': 'Markahang tapos',
    'home.week.markUndone': 'I-undo',
    'home.week.next': 'Magpatuloy dito',
    'home.week.progressSuffix': 'tapos'
  }),
  ceb: Object.freeze({
    'home.week.eyebrow':'KARONG SEMANA','home.week.heading':'Hupti nga magkonektado ang imong semana','home.week.description':'Sunda ang usa ka yano nga ritmo gamit ang kasamtangang BibleQuest tools.','home.week.journeyLabel':'Espirituhanong panaw karong semana','home.week.dinner.label':'HISGOTAN SA PANIHAPON · OPSYONAL','home.week.dinner.prompt':'Unsay gipakita sa Dios kanato karong semanaha, ug unsaon nato kini pagkinabuhi nga magkuyog?','home.week.service.title':'1 · Service','home.week.service.description':'Sugdi sa pinakabag-ong kumpirmadong recording sa service o sermon.','home.week.service.action':'Ablihi ang service','home.week.scripture.title':'2 · Kasulatan','home.week.scripture.description':'Ablihi ang Bibliya ug basaha ang teksto ug konteksto.','home.week.scripture.action':'Basaha ang Kasulatan','home.week.reflect.title':'3 · Pamalandong','home.week.reflect.description':'Gamita ang Transformation aron masabtan, pamalandongan, i-apply, ug iampo ang nakat-onan.','home.week.reflect.action':'Ablihi ang pamalandong','home.week.discuss.title':'4 · Hisgot ug ampo','home.week.discuss.description':'Ipadayon ang panag-istorya o pag-ampo sa imong Journey Group.','home.week.discuss.action':'Ablihi ang Journey Group','home.week.act.title':'5 · Buhata','home.week.act.description':'Ablihi ang kasamtangang buluhaton o lakang sa kongregasyon.','home.week.act.action':'Ablihi ang mga buluhaton','home.week.plan.title':'6 · Pagplano','home.week.plan.description':'Gamita ang Kalendaryo alang sa sunod nga panagtigom o deadline.','home.week.plan.action':'Ablihi ang Kalendaryo','home.week.markDone':'Markahi nga nahuman','home.week.markUndone':'I-undo','home.week.next':'Padayon dinhi','home.week.progressSuffix':'nahuman'
  })
});

const WEEKLY_JOURNEY_STEPS = Object.freeze([
  Object.freeze({ id: 'service', route: 'recordings', icon: 'video' }),
  Object.freeze({ id: 'scripture', route: 'reader', icon: 'bible' }),
  Object.freeze({ id: 'reflect', route: 'transform', icon: 'grow' }),
  Object.freeze({ id: 'discuss', route: 'journey-groups', icon: 'home' }),
  Object.freeze({ id: 'act', route: 'assignments', icon: 'guide' }),
  Object.freeze({ id: 'plan', route: 'calendar', icon: 'calendar' })
]);

function localText(locale, key) {
  return localization.t(key, { locale, dictionaries: HOME_WEEK_COPY });
}

function weeklyJourneyHtml(locale, weeklyState = null) {
  const progress = weeklyState ? `<p class="bq-eyebrow" data-weekly-journey-progress>${weeklyState.completed}/${weeklyState.total} ${escapeHtml(localText(locale, 'home.week.progressSuffix'))}</p>` : '';
  return `<nav class="bq-panel bq-home-weekly-journey" data-home-weekly-journey aria-label="${escapeHtml(localText(locale, 'home.week.journeyLabel'))}">
    ${progress}
    <div class="bq-home-assignment-list" role="list">
      ${WEEKLY_JOURNEY_STEPS.map(step => {
        const done = weeklyState?.done?.[step.route] === true;
        const next = !done && weeklyState?.nextRoute === step.route;
        return `<div role="listitem" data-weekly-journey-step="${step.id}" data-weekly-journey-status="${done ? 'done' : next ? 'next' : 'pending'}">
        <a class="bq-home-assignment-row" style="text-decoration:none" href="#/${step.route}" data-weekly-journey-route="${step.route}">
          <span class="bq-home-assignment-status"><span aria-hidden="true">${iconSvg(step.icon, { size: 16 })}</span> ${escapeHtml(localText(locale, `home.week.${step.id}.title`))}</span>
          <span class="bq-home-assignment-copy"><b>${escapeHtml(localText(locale, `home.week.${step.id}.title`))}</b><small>${escapeHtml(localText(locale, `home.week.${step.id}.description`))}</small>${next ? `<small data-weekly-journey-next>${escapeHtml(localText(locale, 'home.week.next'))}</small>` : ''}</span>
          <span class="bq-home-assignment-open">${escapeHtml(localText(locale, `home.week.${step.id}.action`))}</span>
        </a>
        ${weeklyState ? `<button type="button" class="bq-secondary-button" data-weekly-journey-toggle="${step.route}" aria-pressed="${done ? 'true' : 'false'}">${escapeHtml(localText(locale, done ? 'home.week.markUndone' : 'home.week.markDone'))}</button>` : ''}
      </div>`;
      }).join('')}
    </div>
    <aside class="bq-panel bq-progress-note" data-weekly-dinner-prompt aria-labelledby="weekly-dinner-prompt-label">
      <p class="bq-eyebrow" id="weekly-dinner-prompt-label">${escapeHtml(localText(locale, 'home.week.dinner.label'))}</p>
      <p>${escapeHtml(localText(locale, 'home.week.dinner.prompt'))}</p>
    </aside>
  </nav>`;
}

export function homeThisWeekIntroHtml(locale,{leaderAnchor=null,weeklyState=null}={}) {
  const calendarLabel = localization.t('home.shortcut.calendar', { locale });
  return `<header class="bq-home-week-heading" data-home-week-heading>
    <div>
      <p class="bq-eyebrow">${escapeHtml(localText(locale, 'home.week.eyebrow'))}</p>
      <h2>${escapeHtml(localText(locale, 'home.week.heading'))}</h2>
      <p>${escapeHtml(localText(locale, 'home.week.description'))}</p>
    </div>
    <button type="button" class="bq-secondary-button" data-open-this-week-calendar aria-label="${escapeHtml(calendarLabel)}">
      <span aria-hidden="true">${iconSvg('calendar', { size: 18 })}</span>
      <span>${escapeHtml(calendarLabel)}</span>
    </button>
  </header>${leaderAnchor?`<aside class="bq-panel bq-progress-note" data-home-weekly-leader-anchor><p class="bq-eyebrow">WEEKLY MINISTRY ANCHOR</p><h3>${escapeHtml(leaderAnchor.title)}</h3>${leaderAnchor.instructions?`<p>${escapeHtml(leaderAnchor.instructions)}</p>`:''}<a href="#/assignments" data-weekly-journey-route="assignments">Open leader assignment</a></aside>`:''}${weeklyJourneyHtml(locale,weeklyState)}`;
}

export const HOME_WEEK_LOCALES = Object.freeze(Object.keys(HOME_WEEK_COPY));
export const HOME_WEEKLY_JOURNEY_ROUTES = Object.freeze(WEEKLY_JOURNEY_STEPS.map(step => step.route));
