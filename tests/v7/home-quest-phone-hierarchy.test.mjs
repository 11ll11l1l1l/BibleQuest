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
