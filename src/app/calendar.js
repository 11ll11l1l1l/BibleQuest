// Calendar lifecycle/persistence owner (v1: personal events + read-only
// Assignment due-date aggregation; v1.5: congregation-shared leader-authored
// events with weekly recurrence). Reuses Session (owner identity),
// Assignments (dueAt/dueState, never written by Calendar), Congregation
// Membership (role check + active congregation, never duplicated), and the
// API boundary (all network access through src/core/api.js). Persists
// personal events locally through privateStorage; congregation events are
// never cached locally — they are always server-authoritative, matching
// their shared-visibility/notification contract.
import { normalizeEvent, fromAssignmentDue, buildAgenda } from '../engines/calendar.js';

const SCHEMA = 1;

function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
function makeId() { return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

export function createCalendarService({ session, privateStorage, api, assignments, congregation, clock = () => new Date() }) {
  if (!session?.getState || !privateStorage?.read || !privateStorage?.write || !api?.calendar) {
    throw new Error('Calendar requires Session, private storage and the API boundary.');
  }

  let congregationState = { congregationId: '', congregationName: '', canShare: false, events: [] };

  const owner = () => {
    const s = session.getState();
    return s?.authenticated && s?.user?.id ? `account:${s.user.id}` : 'guest';
  };
  const key = current => `calendar-events:${current}`;

  function readLocal(current) {
    const saved = privateStorage.read(key(current), null);
    if (!saved || typeof saved !== 'object' || Number(saved.schema) !== SCHEMA || saved.owner !== current || !Array.isArray(saved.events)) {
      return [];
    }
    return saved.events.map(normalizeEvent).filter(Boolean);
  }

  function writeLocal(current, events) {
    privateStorage.write(key(current), { schema: SCHEMA, owner: current, events });
  }

  function assignmentEvents() {
    const rows = assignments?.snapshot?.()?.assignments || [];
    return rows.map(fromAssignmentDue).filter(Boolean);
  }

  async function loadCongregation() {
    if (!congregation) { congregationState = { congregationId: '', congregationName: '', canShare: false, events: [] }; return; }
    try {
      const memberships = await congregation.load();
      const active = memberships[0];
      if (!active) { congregationState = { congregationId: '', congregationName: '', canShare: false, events: [] }; return; }
      const canShare = congregation.can(active.congregationId, 'ministry');
      const rows = await api.calendar.listCongregation(active.congregationId);
      const events = (Array.isArray(rows) ? rows : []).map(row => normalizeEvent({
        id: row.id, source: 'congregation', eventDate: row.event_date, title: row.title,
        notes: row.notes, allDay: row.all_day, recurrenceWeeks: row.recurrence_weeks
      })).filter(Boolean);
      congregationState = { congregationId: active.congregationId, congregationName: active.congregation?.name || '', canShare, events };
    } catch { congregationState = { congregationId: '', congregationName: '', canShare: false, events: [] }; }
  }

  function present() {
    const current = owner();
    const personal = readLocal(current);
    const events = [...personal, ...assignmentEvents(), ...congregationState.events];
    return Object.freeze({
      owner: current,
      scope: current.startsWith('account:') ? 'account-cloud' : 'guest-device',
      canShareWithCongregation: congregationState.canShare,
      congregationName: congregationState.congregationName,
      events: Object.freeze(personal),
      agenda: buildAgenda(events, { today: clock(), days: 30 })
    });
  }

  async function load() {
    const s = session.getState();
    const current = owner();
    if (s?.authenticated && s?.user?.id) {
      try {
        const remote = await api.calendar.list(s.user.id);
        const events = (Array.isArray(remote) ? remote : []).map(row => normalizeEvent({
          id: row.id, source: 'personal', eventDate: row.event_date, title: row.title, notes: row.notes, allDay: row.all_day
        })).filter(Boolean);
        writeLocal(current, events);
      } catch { /* device state remains authoritative until cloud reachable */ }
    }
    await loadCongregation();
    return present();
  }

  async function addEvent({ title, eventDate, notes = '', allDay = true, shareWithCongregation = false, recurrenceWeeks = 0 } = {}) {
    if (shareWithCongregation) {
      if (!congregationState.congregationId) fail('BQ_CALENDAR_NO_CONGREGATION', 'Join a congregation to share an event.');
      congregation.assert(congregationState.congregationId, 'ministry');
      const event = normalizeEvent({ id: makeId(), source: 'congregation', eventDate, title, notes, allDay, recurrenceWeeks });
      if (!event) fail('BQ_CALENDAR_INPUT', 'Enter a title and a valid date.');
      const s = session.getState();
      await api.calendar.createCongregation(s.user.id, congregationState.congregationId, event);
      await loadCongregation();
      return present();
    }
    const event = normalizeEvent({ id: makeId(), source: 'personal', eventDate, title, notes, allDay });
    if (!event) fail('BQ_CALENDAR_INPUT', 'Enter a title and a valid date.');
    const current = owner();
    const s = session.getState();
    let synced = true;
    if (s?.authenticated && s?.user?.id) {
      try {
        const saved = await api.calendar.create(s.user.id, event);
        const withId = normalizeEvent({ ...event, id: saved?.id || event.id });
        writeLocal(current, [...readLocal(current), withId]);
        return { ...present(), synced };
      } catch { synced = false; }
    }
    writeLocal(current, [...readLocal(current), event]);
    return { ...present(), synced };
  }

  async function removeEvent(id) {
    const current = owner();
    writeLocal(current, readLocal(current).filter(event => event.id !== id));
    const s = session.getState();
    let synced = true;
    if (s?.authenticated && s?.user?.id && !String(id).startsWith('local-')) {
      try { await api.calendar.remove(s.user.id, id); } catch { synced = false; }
    }
    return { ...present(), synced };
  }

  return Object.freeze({ load, addEvent, removeEvent, getState: present });
}
