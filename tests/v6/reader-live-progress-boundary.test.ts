import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  canonicalReaderChapterReadEventId,
  canonicalReadingScoreEventId,
  createReaderChapterReadBoundary,
  findReaderChapterReadEvent,
} from '../../src/v6/reader/live-progress.ts';
import { claimForProgressEvent } from '../../src/app/progress-leaderboard-bridge.js';

function progressHarness(seed: Record<string, any> = {}) {
  const events: Record<string, any> = structuredClone(seed);
  let recordCalls = 0;
  return {
    events,
    owner: {
      getState() { return { events }; },
      record(input: any) {
        recordCalls += 1;
        const existing = events[input.id];
        if (existing) {
          return Object.freeze({
            applied: false,
            duplicate: true,
            date: existing.date,
            awardedXp: 0,
          });
        }
        events[input.id] = {
          type: input.type,
          date: '2026-09-26',
          at: '2026-09-25T22:00:00.000Z',
          xp: input.xp,
          meaningful: input.meaningful,
          metrics: input.metrics,
          rewards: {},
        };
        return Object.freeze({
          applied: true,
          duplicate: false,
          date: '2026-09-26',
          awardedXp: input.xp,
        });
      },
    },
    calls: () => recordCalls,
  };
}

test('Reader chapter identity is translation-independent and canonical', () => {
  assert.equal(canonicalReaderChapterReadEventId('gen', 1), 'reader.read:GEN:1');
  assert.equal(canonicalReaderChapterReadEventId('GEN', 1), 'reader.read:GEN:1');
  assert.equal(canonicalReadingScoreEventId('gen', 1), 'reading.chapter:GEN:1');
  assert.throws(() => canonicalReaderChapterReadEventId('bad-book', 1), /canonical Bible book code/i);
  assert.throws(() => canonicalReaderChapterReadEventId('GEN', 0), /valid chapter number/i);
});

test('live Reader boundary records one canonical event regardless of translation choice', () => {
  const h = progressHarness();
  const boundary = createReaderChapterReadBoundary(h.owner);

  const first = boundary.record('JHN', 3);
  assert.equal(first.applied, true);
  assert.equal(first.awardedXp, 10);
  assert.equal(h.calls(), 1);

  const found = boundary.find('jhn', 3);
  assert.equal(found?.id, 'reader.read:JHN:3');

  const second = boundary.record('JHN', 3);
  assert.equal(second.duplicate, true);
  assert.equal(second.awardedXp, 0);
  assert.equal(h.calls(), 2, 'duplicate identity is delegated to the authoritative Progress owner');
  assert.equal(Object.keys(h.events).length, 1);
});

test('legacy translation-prefixed Reader events remain migration-compatible', () => {
  const legacy = {
    'reader.read:tl:GEN:2': {
      type: 'reader.chapter.read',
      date: '2026-09-20',
      xp: 10,
    },
  };
  const found = findReaderChapterReadEvent(legacy, 'GEN', 2);
  assert.equal(found?.id, 'reader.read:tl:GEN:2');

  const wrongType = {
    'reader.read:jko:GEN:2': { type: 'other.event', date: '2026-09-20' },
  };
  assert.equal(findReaderChapterReadEvent(wrongType, 'GEN', 2), null);
});

test('Reader and Main Quest map to one trusted Reading leaderboard source identity', () => {
  const progressState = { events: {} };
  const readerRow = {
    type: 'reader.chapter.read',
    date: '2026-09-26',
    xp: 10,
    metrics: { chaptersRead: 1 },
  };
  const questRow = {
    type: 'bible.quest.chapter.complete',
    date: '2026-09-26',
    xp: 10,
    metrics: { chaptersRead: 1 },
  };

  const readerClaim = claimForProgressEvent('reader.read:GEN:1', readerRow, progressState);
  const questClaim = claimForProgressEvent('bible-quest:GEN:1', questRow, progressState);

  assert.equal(readerClaim?.sourceEventId, 'reading.chapter:GEN:1');
  assert.equal(questClaim?.sourceEventId, 'reading.chapter:GEN:1');
  assert.equal(readerClaim?.sourceEventId, canonicalReadingScoreEventId('GEN', 1));
  assert.equal(questClaim?.sourceEventId, canonicalReadingScoreEventId('GEN', 1));
  assert.equal(readerClaim?.category, 'reading');
  assert.equal(questClaim?.category, 'reading');
});

test('live Reader delegates chapter progress construction to V6 boundary', async () => {
  const readerSource = await readFile(new URL('../../src/app/reader.js', import.meta.url), 'utf8');
  assert.match(readerSource, /createReaderChapterReadBoundary/);
  assert.match(readerSource, /chapterProgress\.find\(code,chapter\)/);
  assert.match(readerSource, /chapterProgress\.record\(state\.book,state\.chapter\)/);
  assert.doesNotMatch(readerSource, /progress\.record\(\{ id:eventId, type: 'reader\.chapter\.read'/);
});
