import { localization } from '../../app/localization.js';
import { iconSvg } from '../../ui/icons.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const HOME_WEEK_COPY = Object.freeze({
  en: Object.freeze({
    'home.week.eyebrow': 'THIS WEEK',
    'home.week.heading': 'Keep your week connected',
    'home.week.description': 'Review your current congregation task, then use Calendar to keep the next step visible.'
  }),
  tl: Object.freeze({
    'home.week.eyebrow': 'NGAYONG LINGGO',
    'home.week.heading': 'Panatilihing magkakaugnay ang linggo mo',
    'home.week.description': 'Tingnan ang kasalukuyan mong gawain sa congregation, pagkatapos ay gamitin ang Calendar para malinaw ang susunod na hakbang.'
  })
});

function localText(locale, key) {
  return localization.t(key, { locale, dictionaries: HOME_WEEK_COPY });
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
  </header>`;
}

export const HOME_WEEK_LOCALES = Object.freeze(Object.keys(HOME_WEEK_COPY));
