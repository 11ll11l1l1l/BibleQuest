// BibleQuest v3 Calendar engine (v1 scope: personal events + read-only
// Assignment due-date aggregation). Sole owner of date-grouping/agenda logic.
// Pure functions; no storage, DOM, or network.
//
// v1 scope decision (recorded, not silent): congregation-shared calendar
// entries, recurring events, and notification/reminder integration are
// explicit follow-up scope. Building them now would mean inventing
// authorization and notification-delivery behavior beyond what Calendar v1
// needs to be useful. This engine never writes to Assignments, Progress, or
// any other owner — it only groups items it is given.

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function normalizeEvent(raw) {
  const date = isoDate(raw?.eventDate ?? raw?.event_date ?? raw?.date);
  if (!date) return null;
  const title = String(raw?.title ?? '').trim().slice(0, 120);
  if (!title) return null;
  return Object.freeze({
    id: String(raw?.id ?? ''),
    source: raw?.source === 'assignment' ? 'assignment' : 'personal',
    date,
    title,
    notes: String(raw?.notes ?? '').trim().slice(0, 2000),
    allDay: raw?.allDay !== false
  });
}

export function fromAssignmentDue(assignment) {
  if (!assignment?.dueAt) return null;
  return normalizeEvent({
    id: `assignment:${assignment.id}`,
    source: 'assignment',
    eventDate: assignment.dueAt,
    title: `Due: ${assignment.title}`,
    notes: assignment.dueState === 'overdue' ? 'Overdue' : '',
    allDay: true
  });
}

export function buildAgenda(events, { today = new Date(), days = 30 } = {}) {
  const start = isoDate(today);
  if (!start) return Object.freeze([]);
  const startMs = new Date(start).getTime();
  const endMs = startMs + Math.max(1, Math.floor(days)) * DAY_MS;
  const byDate = new Map();
  for (const raw of Array.isArray(events) ? events : []) {
    const event = raw && raw.date ? raw : normalizeEvent(raw);
    if (!event) continue;
    const eventMs = new Date(event.date).getTime();
    if (Number.isNaN(eventMs) || eventMs < startMs || eventMs >= endMs) continue;
    if (!byDate.has(event.date)) byDate.set(event.date, []);
    byDate.get(event.date).push(event);
  }
  const dates = [...byDate.keys()].sort();
  return Object.freeze(dates.map(date => Object.freeze({
    date,
    events: Object.freeze(
      byDate.get(date).slice().sort((a, b) => (a.source === b.source ? a.title.localeCompare(b.title) : a.source === 'assignment' ? -1 : 1))
    )
  })));
}
