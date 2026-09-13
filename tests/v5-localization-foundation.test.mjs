import assert from 'node:assert/strict';
import test from 'node:test';

const store = new Map();
globalThis.localStorage = {
  get length() { return store.size; },
  key(index) { return [...store.keys()][index] ?? null; },
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); }
};

const { en, LOCALE_KEY_INVENTORY } = await import('../src/content/locales/en.js');
const { tl } = await import('../src/content/locales/tl.js');
const { localization, getLocale, setLocale, t, getMissingLocaleKeys } = await import('../src/app/localization.js');

test('English is the canonical stable-key inventory and Tagalog matches it', () => {
  assert.deepEqual(Object.keys(en).sort(), LOCALE_KEY_INVENTORY);
  assert.deepEqual(Object.keys(tl).sort(), LOCALE_KEY_INVENTORY);
  assert.equal(getMissingLocaleKeys('tl').length, 0);
});

test('Tagalog lookup uses the shared key inventory', () => {
  assert.equal(t('nav.calendar', { locale: 'tl' }), 'Kalendaryo');
  assert.equal(t('common.retry', { locale: 'tl' }), 'Subukan muli');
});

test('missing localized values fall back deterministically to English and remain detectable', () => {
  const custom = { en, tl: { ...tl, 'nav.calendar': '' } };
  assert.equal(t('nav.calendar', { locale: 'tl', dictionaries: custom }), 'Calendar');
  assert.deepEqual(getMissingLocaleKeys('tl', custom), ['nav.calendar']);
});

test('unknown keys fail visibly without inventing translated content', () => {
  assert.equal(t('missing.example', { locale: 'tl' }), 'missing.example');
});

test('locale preference reuses current portable storage and normalizes language tags', () => {
  store.clear();
  assert.equal(getLocale(), 'en');
  assert.equal(setLocale('tl-PH'), 'tl');
  assert.equal(getLocale(), 'tl');
  assert.equal(JSON.parse(store.get('biblequest.v3.locale')), 'tl');
  assert.equal(setLocale('unsupported'), 'en');
  assert.equal(getLocale(), 'en');
});

test('foundation exposes only reviewed locales; Cebuano can reuse the same inventory later', () => {
  assert.deepEqual(localization.supportedLocales, ['en', 'tl']);
  assert.equal(localization.keyInventory, LOCALE_KEY_INVENTORY);
});
