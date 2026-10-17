import test from 'node:test';
import assert from 'node:assert/strict';
import { homePage } from '../../src/features/home/index.js';

test('phone Home quest heading identifies the next chapter without repeating the plan title', () => {
  const view = homePage({
    bibleQuest: { snapshot: () => ({
      complete: false, next: { book: 'Genesis', chapter: 1 }, percent: 0,
      completedChapters: 0, totalChapters: 1189, completedBooks: 0, totalBooks: 66,
    }) },
  });
  const quest = view.html.match(/<section class="bq-hero bq-v6-hero bq-home-journey"[\s\S]*?<\/section>/)?.[0];
  assert.ok(quest, 'Main Bible Quest card is missing');
  assert.match(quest, /<h2>Next: Genesis 1<\/h2>/);
  assert.doesNotMatch(quest, /<h2>[^<]*<small>/);
  assert.match(quest, /Genesis → Revelation · 0% complete/);
  assert.match(quest, /data-open-bible-quest-continue/);
});

test('phone Home keeps the full weekly workflow available behind a compact disclosure and removes duplicate shortcut rail', () => {
  const view = homePage({ weeklyJourney: { snapshot: () => ({ completed: 2, total: 6, nextRoute: 'transform', done: {} }) } });
  assert.match(view.html, /<details class="bq-home-week-disclosure" data-home-week-disclosure>/);
  assert.match(view.html, /2\/6 complete/);
  for (const route of ['recordings', 'reader', 'transform', 'journey-groups', 'assignments', 'calendar']) {
    assert.match(view.html, new RegExp(`data-weekly-journey-route="${route}"`), `weekly destination ${route} must remain reachable`);
  }
  assert.doesNotMatch(view.html, /data-home-rail-track/);
  assert.match(view.html, /data-open-home-next-event/);
  assert.match(view.html, /data-open-congregation-assignments/);
});
