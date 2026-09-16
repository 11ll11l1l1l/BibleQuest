import { localization } from '../../app/localization.js';
import { iconSvg } from '../../ui/icons.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const HOME_WEEK_COPY = Object.freeze({
  en: Object.freeze({
    'home.week.eyebrow': 'THIS WEEK',
    'home.week.heading': 'Keep your week connected',
    'home.week.description': 'Move through the same BibleQuest owners in one simple rhythm. Nothing here creates a second record of your service, Scripture, reflection, group, assignment, or calendar data.',
    'home.week.journeyLabel': 'This week spiritual journey',
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
    'home.week.plan.action': 'Open Calendar'
  }),
  tl: Object.freeze({
    'home.week.eyebrow': 'NGAYONG LINGGO',
    'home.week.heading': 'Panatilihing magkakaugnay ang linggo mo',
    'home.week.description': 'Sundan ang iisang simpleng daloy gamit ang kasalukuyang BibleQuest tools. Walang panibagong kopya ng service, Kasulatan, reflection, group, assignment, o calendar data.',
    'home.week.journeyLabel': 'Espirituwal na paglalakbay ngayong linggo',
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
    'home.week.plan.action': 'Buksan ang Kalendaryo'
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

function weeklyJourneyHtml(locale) {
  return `<nav class="bq-panel bq-home-weekly-journey" data-home-weekly-journey aria-label="${escapeHtml(localText(locale, 'home.week.journeyLabel'))}">
    <ol class="bq-home-weekly-journey-list">
      ${WEEKLY_JOURNEY_STEPS.map(step => `<li data-weekly-journey-step="${step.id}">
        <a class="bq-home-weekly-journey-link" href="#/${step.route}" data-weekly-journey-route="${step.route}">
          <span class="bq-home-weekly-journey-icon" aria-hidden="true">${iconSvg(step.icon, { size: 20 })}</span>
          <span class="bq-home-weekly-journey-copy">
            <b>${escapeHtml(localText(locale, `home.week.${step.id}.title`))}</b>
            <small>${escapeHtml(localText(locale, `home.week.${step.id}.description`))}</small>
          </span>
          <span class="bq-home-weekly-journey-action">${escapeHtml(localText(locale, `home.week.${step.id}.action`))}</span>
        </a>
      </li>`).join('')}
    </ol>
  </nav>`;
}

export function homeThisWeekIntroHtml(locale) {
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
  </header>${weeklyJourneyHtml(locale)}`;
}

export const HOME_WEEK_LOCALES = Object.freeze(Object.keys(HOME_WEEK_COPY));
export const HOME_WEEKLY_JOURNEY_ROUTES = Object.freeze(WEEKLY_JOURNEY_STEPS.map(step => step.route));
