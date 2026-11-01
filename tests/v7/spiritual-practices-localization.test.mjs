import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRACTICE_TRANSLATIONS, localizePractice, practiceLocale, practiceText, practiceTitle } from '../../src/features/spiritual-practices/copy.js';
import { practiceEntry } from '../../src/features/spiritual-practices/entry-copy.js';
import { PRACTICES, SILENCIO_PRESETS, MORNING_PRESETS, DISCIPLINE_GUIDES, customSilencio } from '../../src/features/spiritual-practices/content.js';
test('every timed stage and daily-life guide has aligned TL/CEB copy without changing allocations', () => {
  for (const locale of ['tl', 'ceb']) {
    for (const original of [...PRACTICES, ...SILENCIO_PRESETS, ...MORNING_PRESETS, customSilencio(17)]) {
      const translated = localizePractice(original, locale);
      assert.equal(translated.id, original.id);
      assert.equal(translated.version, original.version);
      assert.deepEqual(translated.stages.map(row => row.seconds), original.stages.map(row => row.seconds));
      for (const row of original.stages) for (const text of [row.title, row.guide]) assert.ok(PRACTICE_TRANSLATIONS[locale][text]?.trim(), `${locale}: ${text}`);
      assert.match(translated.title, /minuto|segundo/);
    }
    for (const guide of DISCIPLINE_GUIDES) for (const text of [guide.title, ...guide.steps]) assert.ok(PRACTICE_TRANSLATIONS[locale][text]?.trim(), `${locale}: ${text}`);
  }
});
test('rendered labels and service errors have translations; unknown provider detail remains unmodified', () => {
  const keys = new Set();
  const page = readFileSync(new URL('../../src/features/spiritual-practices/index.js', import.meta.url), 'utf8');
  for (const match of page.matchAll(/\b(?:h|t)\('([^']+)'\)/g)) keys.add(match[1]);
  for (const file of ['passage', 'reminders', 'cue', 'wake-lock', 'offline']) {
    const source = readFileSync(new URL(`../../src/features/spiritual-practices/${file}.js`, import.meta.url), 'utf8');
    for (const match of source.matchAll(/new Error\('([^']+)'\)/g)) keys.add(match[1]);
  }
  for (const locale of ['tl', 'ceb']) for (const key of keys) assert.ok(PRACTICE_TRANSLATIONS[locale][key]?.trim(), `${locale}: ${key}`);
  assert.equal(practiceText('tl', 'Unknown provider detail'), 'Unknown provider detail');
  assert.equal(practiceLocale('ilo'), 'en');
  assert.equal(practiceTitle('en', 'Silencio · 17 minutes'), 'Silencio · 17 minutes');
});
test('all entry surfaces use compact localized copy and clearly flag unsupported languages', () => {
  for (const locale of ['en', 'tl', 'ceb']) {
    const copy = practiceEntry(locale);
    for (const field of ['title', 'hint', 'meditate', 'history', 'due', 'dismiss', 'unavailable', 'dismissError']) assert.ok(copy[field]?.trim());
    assert.equal(copy.fallback, false);
  }
  assert.equal(practiceEntry('ilo').fallback, true);
  assert.equal(practiceEntry('ilo').locale, 'en');
});

test('actual Home and Library launchers render TL/CEB copy through the app locale owner', async () => {
  const { localization } = await import('../../src/app/localization.js');
  const { homePage } = await import('../../src/features/home/index.js');
  const { createLibraryPage } = await import('../../src/features/library/page.js');
  const previous = globalThis.localStorage, values = new Map();
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  try {
    for (const locale of ['tl', 'ceb']) {
      localization.setLocale(locale);
      const title = practiceEntry(locale).title;
      const home = homePage({ onPractices() {} });
      assert.ok(home.html.includes(title));
      const library = createLibraryPage({ service: { list() {}, getState() {}, subscribe() {} }, navigate() {}, onPractices() {} });
      assert.ok(library.html.includes(title));
      assert.match(library.html, new RegExp(`data-library-practices lang="${locale}"`));
      assert.doesNotMatch(library.html, /Spiritual Practices · English guides/);
    }
  } finally { globalThis.localStorage = previous; }
});
