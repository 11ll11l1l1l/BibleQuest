import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const store = new Map();
globalThis.localStorage = {
  get length() { return store.size; },
  key(index) { return [...store.keys()][index] ?? null; },
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); }
};

const [{ en, LOCALE_KEY_INVENTORY }, { tl }, { localization }] = await Promise.all([
  import('../src/content/locales/en.js'),
  import('../src/content/locales/tl.js'),
  import('../src/app/localization.js')
]);
const source = await readFile(new URL('../src/features/home/index.js', import.meta.url), 'utf8');
const assignmentSource = await readFile(new URL('../src/features/home/assignment-summary.js', import.meta.url), 'utf8');

const HOME_KEYS = [
  'home.hero.eyebrow','home.hero.description','home.today.eyebrow','home.today.heading','home.today.steps','home.today.open',
  'home.progress.eyebrow','home.progress.xp','home.progress.streak','home.progress.activities','home.progress.badges',
  'home.congregation.eyebrow','home.congregation.heading','home.congregation.joinCaption','home.congregation.readyCaption',
  'home.congregation.openAria','home.congregation.open','home.shortcut.ariaLabel','home.shortcut.daily','home.shortcut.reader',
  'home.shortcut.assignments','home.shortcut.calendar','home.shortcut.progress','home.tutorial.ariaLabel','home.tutorial.title',
  'home.tutorial.description','home.recordings.ariaLabel','home.recordings.title','home.recordings.description',
  'home.presence.checking','home.presence.none','home.presence.one','home.presence.many','home.presence.offline'
];

const MUST_DIFFER = HOME_KEYS.filter(key => !['home.progress.xp'].includes(key));

test('Home keys remain canonical with complete reviewed Tagalog values', () => {
  assert.deepEqual(Object.keys(en).sort(), [...LOCALE_KEY_INVENTORY]);
  assert.deepEqual(Object.keys(tl).sort(), [...LOCALE_KEY_INVENTORY]);
  for (const key of HOME_KEYS) {
    assert.ok(LOCALE_KEY_INVENTORY.includes(key), `Missing canonical Home key: ${key}`);
    assert.ok(String(tl[key] ?? '').trim(), `Missing Tagalog Home value: ${key}`);
  }
});

test('reviewed Home chrome does not fall back to English in Tagalog', () => {
  for (const key of MUST_DIFFER) assert.notEqual(tl[key], en[key], `Tagalog Home key still leaks English: ${key}`);
  assert.equal(localization.t('home.today.eyebrow', { locale: 'tl', values: { date: '2026-09-14' } }), 'NGAYON · 2026-09-14');
  assert.equal(localization.t('home.presence.many', { locale: 'tl', values: { count: 3 } }), '● 3 aktibo sa nakaraang 30 min');
});

test('Home uses the single integrated localization owner for bounded UI chrome', () => {
  assert.match(source, /import \{ localization \} from '\.\.\/\.\.\/app\/localization\.js';/);
  assert.match(source, /const locale = localization\.getLocale\(\)/);
  for (const key of ['home.hero.eyebrow','home.today.heading','home.progress.eyebrow','home.congregation.heading','home.shortcut.ariaLabel','home.tutorial.title','home.recordings.title','home.presence.checking']) {
    assert.ok(source.includes(`'${key}'`), `Home page is not wired to ${key}`);
  }
  for (const hardCoded of ['Explore · Learn · Grow','Continue My Journey — 4 min','YOUR PROGRESS','Congregation & Assignments','Quick shortcuts','Show tutorial','Checking recent activity…']) {
    assert.equal(source.includes(hardCoded), false, `Home still hard-codes localized UI text: ${hardCoded}`);
  }
});

test('Home localization preserves source-owned passage and assignment-summary content', () => {
  assert.match(source, /daily\.passage\.title/);
  assert.match(source, /daily\.passage\.book/);
  assert.match(source, /homeAssignmentPanelHtml\(assignmentState\)/);
  assert.ok(assignmentSource.includes('ASSIGNMENTS'), 'Assignment summary remains a separate existing owner for its own localization tranche.');
  for (const key of HOME_KEYS) assert.equal(/scripture\.text|verse\.text|passage\.title|passage\.book/i.test(key), false, `Home locale inventory must not translate Scripture content: ${key}`);
});

test('Home localization does not introduce backend or routing ownership', () => {
  assert.equal(source.includes('supabase'), false);
  assert.equal(source.includes('fetch('), false);
  assert.equal(source.includes('createClient'), false);
  assert.match(source, /requestNavigation\('congregation'\)/);
});