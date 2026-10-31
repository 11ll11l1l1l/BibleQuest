// Small canonical setup metadata; Home/reminders do not import stage guides or notes.
export const REMINDER_ROUTINES = Object.freeze([
  ['silencio-10', 'Silencio · 10 minutes'], ['morning-10', 'Morning surrender · 10 minutes'],
  ['morning-15', 'Morning surrender · 15 minutes'], ['morning-20', 'Morning surrender · 20 minutes'],
  ['presence-30', 'Daytime pause · 30 seconds'], ['evening-5', 'Evening reflection · 5 minutes'],
  ['meditation-10', 'Scripture meditation · 10 minutes'], ['silencio-5', 'Silencio · 5 minutes'],
  ['silencio-20', 'Silencio · 20 minutes'], ['silencio-30', 'Silencio · 30 minutes'], ['silencio-120', 'Silencio · 120 minutes'],
].map(([id, title]) => Object.freeze({id, title})));
export function isReminderRoutine(id) { return REMINDER_ROUTINES.some(row => row.id === id); }
export function practiceRoutineRoute(id) { return isReminderRoutine(id) ? `spiritual-practices?practice=${id}` : 'spiritual-practices'; }
export function formatPracticeTitle(locale, title) {
  const match = title.match(/^(.*?) · (\d+) (minutes|seconds)$/);
  if (!match || !['tl', 'ceb'].includes(locale)) return title;
  const name = { 'Morning surrender': ['Pagsuko sa Diyos sa umaga', 'Pagtugyan sa Diyos sa buntag'], 'Scripture meditation': ['Pagninilay sa Kasulatan', 'Pagpamalandong sa Kasulatan'], 'Daytime pause': ['Paghinto sa maghapon', 'Paghunong sa adlaw'], 'Evening reflection': ['Pagninilay sa gabi', 'Pagpamalandong sa gabii'], Silencio: ['Silencio', 'Silencio'] }[match[1]];
  return `${name?.[locale === 'tl' ? 0 : 1] || match[1]} · ${match[2]} ${match[3] === 'minutes' ? 'minuto' : 'segundo'}`;
}
export function reminderRoutineTitle(id, locale) {
  const row = REMINDER_ROUTINES.find(candidate => candidate.id === id);
  return row ? formatPracticeTitle(locale, row.title) : '';
}
