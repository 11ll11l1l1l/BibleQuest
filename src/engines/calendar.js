// BibleQuest v3 Calendar engine (v1: personal events + read-only Assignment
// due-date aggregation; v1.5: congregation-shared leader-authored events with
// simple weekly recurrence). Sole owner of date-grouping/agenda/recurrence
// logic. Pure functions; no storage, DOM, or network. Never writes to
// Assignments, Progress, Congregation Membership, or any other owner — it
// only groups items and dates it is given.
//
// Still out of scope: anything beyond weekly recurrence (custom RRULE-style
// patterns), and any notification *content* beyond the fixed message the
// database trigger sends on congregation-event creation (that trigger is
// the sole owner of notification delivery; this engine has no say in it).

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function addDays(iso, days) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDate(d);
}

export function normalizeEvent(raw) {
  const date = isoDate(raw?.eventDate ?? raw?.event_date ?? raw?.date);
  if (!date) return null;
  const title = String(raw?.title ?? '').trim().slice(0, 120);
  if (!title) return null;
  const source = ['assignment', 'congregation'].includes(raw?.source) ? raw.source : 'personal';
  const recurrenceWeeks = source === 'congregation'
    ? Math.max(0, Math.min(52, Math.floor(Number(raw?.recurrenceWeeks ?? raw?.recurrence_weeks) || 0)))
    : 0;
  return Object.freeze({
    id: String(raw?.id ?? ''),
    source,
    date,
    title,
    notes: String(raw?.notes ?? '').trim().slice(0, 2000),
    allDay: raw?.allDay !== false,
    recurrenceWeeks
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

// Expands a stored event's weekly recurrence into concrete occurrence
// events. The stored row is always occurrence 0; recurrenceWeeks additional
// weekly copies follow. Never mutates the input; never invents a recurrence
// pattern other than fixed-weekly.
export function expandRecurring(event) {
  if (!event || event.recurrenceWeeks <= 0) return Object.freeze([event].filter(Boolean));
  const out = [event];
  for (let week = 1; week <= event.recurrenceWeeks; week++) {
    const date = addDays(event.date, week * 7);
    if (!date) continue;
    out.push(Object.freeze({ ...event, id: `${event.id}:occurrence-${week}`, date, recurrenceWeeks: 0 }));
  }
  return Object.freeze(out);
}

const SOURCE_RANK = Object.freeze({ assignment: 0, congregation: 1, personal: 2 });

export function buildAgenda(events, { today = new Date(), days = 30 } = {}) {
  const start = isoDate(today);
  if (!start) return Object.freeze([]);
  const startMs = new Date(start).getTime();
  const endMs = startMs + Math.max(1, Math.floor(days)) * DAY_MS;
  const byDate = new Map();
  const expanded = (Array.isArray(events) ? events : []).flatMap(raw => {
    const event = raw && raw.date ? raw : normalizeEvent(raw);
    return event ? expandRecurring(event) : [];
  });
  for (const event of expanded) {
    const eventMs = new Date(event.date).getTime();
    if (Number.isNaN(eventMs) || eventMs < startMs || eventMs >= endMs) continue;
    if (!byDate.has(event.date)) byDate.set(event.date, []);
    byDate.get(event.date).push(event);
  }
  const dates = [...byDate.keys()].sort();
  return Object.freeze(dates.map(date => Object.freeze({
    date,
    events: Object.freeze(
      byDate.get(date).slice().sort((a, b) => (SOURCE_RANK[a.source] - SOURCE_RANK[b.source]) || a.title.localeCompare(b.title))
    )
  })));
}
