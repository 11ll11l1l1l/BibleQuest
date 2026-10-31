// Device-local, app-open reminders. No background timer, OS permission or push claim.
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
function zoneValid(zone) { try { new Intl.DateTimeFormat('en', { timeZone: zone }).format(); return typeof zone === 'string' && zone.length < 100; } catch { return false; } }
function atZone(date, zone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).map(row => [row.type, row.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}
export function createPracticeReminders({ storage, getOwner, settings = () => null, clock = () => new Date(), defaultZone = Intl.DateTimeFormat().resolvedOptions().timeZone }) {
  const fallbackZone = zoneValid(defaultZone) ? defaultZone : 'UTC';
  const key = () => `spiritual-practices.reminders.v1.${getOwner()}`;
  function config() {
    const raw = storage.read(key(), null);
    return { enabled: raw?.enabled === true, time: TIME.test(raw?.time) ? raw.time : '08:00', timeZone: zoneValid(raw?.timeZone) ? raw.timeZone : fallbackZone, dismissedDay: /^\d{4}-\d{2}-\d{2}$/.test(raw?.dismissedDay) ? raw.dismissedDay : '' };
  }
  function save({ enabled, time, timeZone }) {
    if (!TIME.test(time) || !zoneValid(timeZone)) throw new Error('Choose a valid time and IANA time zone, such as Asia/Tokyo.');
    const previous = config();
    const next = { enabled: enabled === true, time, timeZone, dismissedDay: previous.time === time && previous.timeZone === timeZone ? previous.dismissedDay : '' };
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
    return Object.freeze({ ...current, owner: getOwner(), due: current.enabled && allowed && !quietNow && local.time >= current.time && current.dismissedDay !== local.day, day: local.day, blockedBySettings: current.enabled && !allowed, quietNow: Boolean(quietNow) });
  }
  function dismiss(expectedOwner = getOwner()) {
    if (expectedOwner !== getOwner()) throw new Error('Account changed. Refresh the reminder before dismissing it.');
    const current = status();
    if (current.due) storage.write(key(), { enabled: current.enabled, time: current.time, timeZone: current.timeZone, dismissedDay: current.day });
  }
  return Object.freeze({ config, save, status, dismiss });
}
