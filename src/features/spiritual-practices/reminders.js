import { isReminderRoutine } from './routine-catalog.js';
// Device-local, app-open reminders. No background timer, OS permission or push claim.
const ALL_DAYS = Object.freeze([0, 1, 2, 3, 4, 5, 6]);
const validDays = days => Array.isArray(days) && days.length > 0 && days.length <= 7 && days.every(day => Number.isInteger(day) && day >= 0 && day <= 6) && new Set(days).size === days.length;
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
function zoneValid(zone) { try { new Intl.DateTimeFormat('en', { timeZone: zone }).format(); return typeof zone === 'string' && zone.length < 100; } catch { return false; } }
function atZone(date, zone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).map(row => [row.type, row.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}`, weekday: new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day))).getUTCDay() };
}
export function createPracticeReminders({ storage, getOwner, settings = () => null, clock = () => new Date(), defaultZone = Intl.DateTimeFormat().resolvedOptions().timeZone }) {
  const fallbackZone = zoneValid(defaultZone) ? defaultZone : 'UTC';
  const key = () => `spiritual-practices.reminders.v1.${getOwner()}`;
  function config() {
    const raw = storage.read(key(), null);
    const daysValid = raw?.days === undefined || validDays(raw.days), routineValid = raw?.practiceId === undefined || isReminderRoutine(raw.practiceId);
    return { days: validDays(raw?.days) ? [...raw.days].sort() : [...ALL_DAYS], practiceId: routineValid && raw?.practiceId ? raw.practiceId : 'silencio-10', enabled: raw?.enabled === true && daysValid && routineValid, time: TIME.test(raw?.time) ? raw.time : '08:00', timeZone: zoneValid(raw?.timeZone) ? raw.timeZone : fallbackZone, dismissedDay: /^\d{4}-\d{2}-\d{2}$/.test(raw?.dismissedDay) ? raw.dismissedDay : '' };
  }
  function save({ enabled, time, timeZone, days = [...ALL_DAYS], practiceId = 'silencio-10' }) {
    const previous = config();
    if (enabled !== true && Array.isArray(days) && days.length === 0) days = previous.days;
    if (!validDays(days) || !isReminderRoutine(practiceId)) throw new Error('Choose at least one weekday and a listed practice.');
    const selectedDays = [...days].sort();
    if (!TIME.test(time) || !zoneValid(timeZone)) throw new Error('Choose a valid time and IANA time zone, such as Asia/Tokyo.');
    const next = { enabled: enabled === true, time, timeZone, days: selectedDays, practiceId, dismissedDay: previous.time === time && previous.timeZone === timeZone && previous.practiceId === practiceId && JSON.stringify(previous.days) === JSON.stringify(selectedDays) ? previous.dismissedDay : '' };
    storage.write(key(), next);
    return next;
  }
  function status() {
    const current = config(), local = atZone(clock(), current.timeZone), controls = settings();
    const allowed = !controls || (controls.master?.checked === true && controls.categories?.find(row => row.id === 'notification-category-reading')?.checked === true);
    const quiet = controls?.quietHours;
    // Quiet hours follow the current device zone, consistent with the shared settings.
    const deviceTime = atZone(clock(), fallbackZone).time;
    const quietNow = quiet?.enabled && TIME.test(quiet.start) && TIME.test(quiet.end) && (quiet.start === quiet.end || (quiet.start < quiet.end ? deviceTime >= quiet.start && deviceTime < quiet.end : deviceTime >= quiet.start || deviceTime < quiet.end));
    return Object.freeze({ ...current, owner: getOwner(), due: current.enabled && current.days.includes(local.weekday) && allowed && !quietNow && local.time >= current.time && current.dismissedDay !== local.day, day: local.day, blockedBySettings: current.enabled && !allowed, quietNow: Boolean(quietNow) });
  }
  function dismiss(expectedOwner = getOwner()) {
    if (expectedOwner !== getOwner()) throw new Error('Account changed. Refresh the reminder before dismissing it.');
    const current = status();
    if (current.due) storage.write(key(), { enabled: current.enabled, time: current.time, timeZone: current.timeZone, days: current.days, practiceId: current.practiceId, dismissedDay: current.day });
  }
  return Object.freeze({ config, save, status, dismiss });
}
