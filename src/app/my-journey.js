// BibleQuest V5: My Journey / reflection history. Pure composition over the
// existing shared progress event log (already fed by many separate feature
// owners: reader, transform, study, daily-mission, story-journey,
// open-review, adaptive-learning, wisdom-situations, games, kids-memory)
// plus the existing Assignments owner's own completion state. No new event
// log, no new analytics engine, no new storage. This is a private,
// encouraging personal history - explicitly no ranking, no comparison
// between members, no competitive presentation of any kind.
const TYPE_KEYS = Object.freeze({
  'reader.chapter.read': 'myjourney.type.reader',
  'transform.spiritual.complete': 'myjourney.type.transformBasic',
  'transform.full.complete': 'myjourney.type.transformFull',
  'daily.mission.complete': 'myjourney.type.dailyJourney',
  'study.guided.complete': 'myjourney.type.study',
  'story.journey.complete': 'myjourney.type.storyJourney',
  'open.review.complete': 'myjourney.type.review',
  'adaptive.learning.complete': 'myjourney.type.adaptive',
  'wisdom.situations.complete': 'myjourney.type.wisdom',
  'games.round.complete': 'myjourney.type.game',
  'kids.memory.complete': 'myjourney.type.memoryGame',
  'bible.quest.chapter.complete': 'myjourney.type.reader'
});
const FALLBACK_TYPE_KEY = 'myjourney.type.generic';

function labelKeyFor(type) {
  return TYPE_KEYS[type] || FALLBACK_TYPE_KEY;
}

export function createMyJourneyService({ progress, assignments, bibleQuest = null } = {}) {
  if (!progress?.getState) throw new Error('My Journey requires the existing Progress owner.');

  function timeline({ limit = 60 } = {}) {
    const state = progress.getState();
    const events = Object.entries(state.events || {})
      .map(([id, row]) => Object.freeze({
        id,
        kind: 'progress',
        type: row.type,
        labelKey: labelKeyFor(row.type),
        date: row.date,
        at: row.at || row.date,
        xp: row.xp,
        meaningful: row.meaningful !== false
      }))
      .filter(row => row.meaningful); // never surface housekeeping/non-meaningful events as a "moment"

    events.sort((a, b) => String(b.at).localeCompare(String(a.at)));
    return Object.freeze(events.slice(0, limit));
  }

  async function assignmentMoments({ limit = 20 } = {}) {
    if (!assignments?.snapshot && !assignments?.load) return Object.freeze([]);
    const state = assignments.snapshot ? assignments.snapshot() : await assignments.load();
    const rows = (state?.assignments || [])
      .filter(row => row?.progress?.status === 'completed' && row?.progress?.completedAt)
      .map(row => Object.freeze({
        id: `assignment:${row.id}`,
        kind: 'assignment',
        type: 'assignment.completed',
        labelKey: 'myjourney.type.assignment',
        labelValues: Object.freeze({ title: row.title || '' }),
        date: String(row.progress.completedAt).slice(0, 10),
        at: row.progress.completedAt,
        xp: null,
        meaningful: true
      }));
    rows.sort((a, b) => String(b.at).localeCompare(String(a.at)));
    return Object.freeze(rows.slice(0, limit));
  }

  function groupByDay(entries) {
    const groups = new Map();
    for (const entry of entries) {
      const key = entry.date || String(entry.at).slice(0, 10);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(entry);
    }
    return Object.freeze(Array.from(groups.entries()).map(([date, items]) => Object.freeze({ date, items: Object.freeze(items) })));
  }

  async function load({ limit = 60 } = {}) {
    const progressEntries = timeline({ limit });
    const assignmentEntries = await assignmentMoments({ limit: 20 });
    const merged = [...progressEntries, ...assignmentEntries].sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, limit);
    const state = progress.getState();
    return Object.freeze({
      status: 'ready',
      days: groupByDay(merged),
      totalMoments: merged.length,
      streakCurrent: state.streak ?? 0,
      badgeCount: (state.badges || []).length,
      bibleQuest: bibleQuest?.snapshot?.() || null
    });
  }

  return Object.freeze({ load });
}
