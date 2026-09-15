// BibleQuest V5: My Journey edge coverage. Pure composition, never a new
// event log, never a ranking/comparison field, and localization-key-driven
// output (the presentation layer resolves labels, not this service).
import assert from 'node:assert/strict';
import { createMyJourneyService } from '../src/app/my-journey.js';

function fakeProgress(state) { return { getState() { return state; } }; }

assert.throws(() => createMyJourneyService({}), /requires the existing Progress owner/);

// --- Non-meaningful events must never surface as a "moment" ---
{
  const progress = fakeProgress({
    streak: 3, badges: ['streak-3'],
    events: {
      real1: { type: 'reader.chapter.read', date: '2026-09-10', at: '2026-09-10T10:00:00Z', xp: 5, meaningful: true },
      housekeeping: { type: 'session.ping', date: '2026-09-10', at: '2026-09-10T11:00:00Z', xp: 0, meaningful: false }
    }
  });
  const result = await createMyJourneyService({ progress }).load();
  const allIds = result.days.flatMap(day => day.items.map(item => item.id));
  assert.ok(allIds.includes('real1'), 'A meaningful event must appear in the journey.');
  assert.ok(!allIds.includes('housekeeping'), 'A non-meaningful/housekeeping event must never appear as a personal moment.');
}

// --- Output carries a localization key, never a pre-rendered English string ---
{
  const progress = fakeProgress({ streak: 5, badges: ['streak-3', 'streak-7'], events: { e1: { type: 'transform.spiritual.complete', date: '2026-09-11', at: '2026-09-11T09:00:00Z', xp: 20, meaningful: true } } });
  const result = await createMyJourneyService({ progress }).load();
  assert.equal(result.days[0].items[0].labelKey, 'myjourney.type.transformBasic', 'My Journey must return a localization key, not a hardcoded English label - the presentation layer resolves it.');
  assert.equal(result.days[0].items[0].xp, 20);
  assert.equal(result.streakCurrent, 5);
  assert.equal(result.badgeCount, 2);
  assert.equal(result.totalMoments, 1);
}

// --- An unrecognized type must still produce a safe, generic key ---
{
  const progress = fakeProgress({ streak: 0, badges: [], events: { e1: { type: 'some.brand.new.owner.event', date: '2026-09-12', at: '2026-09-12T00:00:00Z', xp: 1, meaningful: true } } });
  const result = await createMyJourneyService({ progress }).load();
  assert.equal(result.days[0].items[0].labelKey, 'myjourney.type.generic');
}

// --- Sorting: newest first, across multiple days ---
{
  const progress = fakeProgress({
    streak: 0, badges: [],
    events: {
      old: { type: 'reader.chapter.read', date: '2026-09-01', at: '2026-09-01T08:00:00Z', xp: 5, meaningful: true },
      newer: { type: 'reader.chapter.read', date: '2026-09-05', at: '2026-09-05T08:00:00Z', xp: 5, meaningful: true }
    }
  });
  const result = await createMyJourneyService({ progress }).load();
  assert.equal(result.days[0].date, '2026-09-05', 'Newest day must appear first.');
  assert.equal(result.days[1].date, '2026-09-01');
}

// --- Assignment completions merge into the same timeline, with an interpolation-ready label ---
{
  const progress = fakeProgress({ streak: 0, badges: [], events: {} });
  const assignments = {
    snapshot() {
      return {
        assignments: [
          { id: 'a1', title: 'Read John 3', progress: { status: 'completed', completedAt: '2026-09-08T12:00:00Z' } },
          { id: 'a2', title: 'Unfinished task', progress: { status: 'assigned', completedAt: null } }
        ]
      };
    }
  };
  const result = await createMyJourneyService({ progress, assignments }).load();
  assert.equal(result.totalMoments, 1, 'Only completed assignments may appear; an unfinished assignment must never show as a moment.');
  assert.equal(result.days[0].items[0].labelKey, 'myjourney.type.assignment');
  assert.deepEqual(result.days[0].items[0].labelValues, { title: 'Read John 3' });
}

// --- Missing assignments owner must degrade gracefully, not crash ---
{
  const progress = fakeProgress({ streak: 0, badges: [], events: {} });
  const result = await createMyJourneyService({ progress }).load();
  assert.equal(result.status, 'ready');
  assert.equal(result.totalMoments, 0);
}

// --- No comparison/ranking field of any kind may ever appear in the output shape ---
{
  const progress = fakeProgress({ streak: 1, badges: [], events: { e1: { type: 'reader.chapter.read', date: '2026-09-13', at: '2026-09-13T00:00:00Z', xp: 5, meaningful: true } } });
  const result = await createMyJourneyService({ progress }).load();
  const serialized = JSON.stringify(result).toLowerCase();
  for (const forbidden of ['rank', 'leaderboard', 'percentile', 'compare']) {
    assert.ok(!serialized.includes(forbidden), `My Journey output must never contain a "${forbidden}" field - this is a private, non-competitive history.`);
  }
}

console.log('BibleQuest v5 My Journey edge regression passed.');
