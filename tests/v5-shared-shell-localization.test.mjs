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

const shellSource = await readFile(new URL('../src/ui/shell.js', import.meta.url), 'utf8');

const SHELL_KEYS = [
  'locale.label',
  'nav.home',
  'nav.learn',
  'nav.play',
  'nav.grow',
  'nav.more',
  'shell.brandHomeLabel',
  'shell.brandTagline',
  'shell.primaryNavigationLabel',
  'shell.progressLabel',
  'shell.accountOpenLabel',
  'shell.account',
  'shell.signingIn',
  'shell.starting',
  'shell.guest',
  'shell.streak.one',
  'shell.streak.other'
];

const REQUIRED_TAGALOG_DIFFERENCES = [
  'locale.label',
  'nav.learn',
  'nav.play',
  'nav.grow',
  'nav.more',
  'shell.brandTagline',
  'shell.primaryNavigationLabel',
  'shell.progressLabel',
  'shell.accountOpenLabel',
  'shell.signingIn',
  'shell.starting',
  'shell.guest',
  'shell.streak.one',
  'shell.streak.other'
];

test('shared shell keys remain in the canonical English inventory and Tagalog dictionary', () => {
  assert.deepEqual(Object.keys(en).sort(), [...LOCALE_KEY_INVENTORY]);
  assert.deepEqual(Object.keys(tl).sort(), [...LOCALE_KEY_INVENTORY]);
  for (const key of SHELL_KEYS) {
    assert.ok(LOCALE_KEY_INVENTORY.includes(key), `Missing canonical shell key: ${key}`);
    assert.ok(String(tl[key] ?? '').trim(), `Missing Tagalog shell value: ${key}`);
  }
});

test('representative shell chrome has reviewed Tagalog values instead of English leaks', () => {
  for (const key of REQUIRED_TAGALOG_DIFFERENCES) {
    assert.notEqual(tl[key], en[key], `Tagalog shell key still leaks English: ${key}`);
  }
  assert.equal(localization.t('nav.learn', { locale: 'tl' }), 'Matuto');
  assert.equal(localization.t('nav.play', { locale: 'tl' }), 'Maglaro');
  assert.equal(localization.t('nav.grow', { locale: 'tl' }), 'Lumago');
  assert.equal(localization.t('nav.more', { locale: 'tl' }), 'Higit pa');
  assert.equal(localization.t('shell.guest', { locale: 'tl' }), 'Bisita');
});

test('locale preference uses the integrated storage mechanism and remains deterministic', () => {
  store.clear();
  assert.equal(localization.getLocale(), 'en');
  assert.equal(localization.setLocale('tl-PH'), 'tl');
  assert.equal(localization.getLocale(), 'tl');
  assert.equal(localization.setLocale('unsupported'), 'en');
  assert.equal(localization.getLocale(), 'en');
});

test('shell source uses stable keys and the one integrated localization owner', () => {
  assert.match(shellSource, /import \{ localization \} from '\.\.\/app\/localization\.js';/);
  assert.match(shellSource, /data-locale-select/);
  assert.match(shellSource, /localization\.setLocale\(event\.currentTarget\.value\)/);
  for (const key of ['nav.home','nav.learn','nav.play','nav.grow','nav.more','shell.brandTagline','shell.primaryNavigationLabel','shell.guest']) {
    assert.ok(shellSource.includes(`'${key}'`), `Shell is not wired to localization key ${key}`);
  }
  for (const oldHardCodedNav of ["['learn','Learn'", "['play','Play'", "['grow','Grow'", "['more','More'"]) {
    assert.ok(!shellSource.includes(oldHardCodedNav), `Hard-coded shell navigation remains: ${oldHardCodedNav}`);
  }
});

test('Scripture content is not introduced into the shell localization dictionaries', () => {
  for (const dictionary of [en, tl]) {
    assert.equal(Object.keys(dictionary).some(key => /scripture|verse|chapter|book\./i.test(key)), false);
  }
});
