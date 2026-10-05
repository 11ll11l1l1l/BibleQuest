import assert from 'node:assert/strict';
import test from 'node:test';
import { getMissingLocaleKeys, localization, t } from '../../src/app/localization.js';
import { createLibraryPage } from '../../src/features/library/page.js';
import { renderAssignmentPreparation } from '../../src/features/curriculum-authoring/assignment-page.js';
import { renderPublicationHandoff } from '../../src/features/curriculum-authoring/publication-handoff.js';
import { v7PairingLocales } from '../../src/content/locales/v7-pairing.js';
import { v7UiTl, v7UiCeb } from '../../src/content/locales/v7-ui-translations.js';

const placeholders = message => [...message.matchAll(/\{([a-z0-9_.-]+)\}/gi)].map(match => match[1]).sort();

test('V7 UI translations cover the complete registered inventory and preserve interpolation contracts', () => {
  const keys = localization.keyInventory.filter(key => key.startsWith('v7.'));
  for (const [locale, dictionary] of Object.entries({ tl: {...v7UiTl,...v7PairingLocales.tl}, ceb: {...v7UiCeb,...v7PairingLocales.ceb} })) {
    assert.deepEqual(Object.keys(dictionary).sort(), keys, `${locale} must cover exactly the registered V7 keys`);
    assert.equal(getMissingLocaleKeys(locale).filter(key => key.startsWith('v7.')).length, 0);
    for (const key of keys) {
      assert.deepEqual(placeholders(dictionary[key]), placeholders(t(key, { locale: 'en' })), `${locale}: ${key}`);
      const values = Object.fromEntries(placeholders(dictionary[key]).map(name => [name, `VALUE_${name}`]));
      const rendered = t(key, { locale, values });
      assert.doesNotMatch(rendered, /\{[a-z0-9_.-]+\}/i);
      for (const value of Object.values(values)) assert.ok(rendered.includes(value));
    }
  }
  assert.deepEqual(getMissingLocaleKeys('en'), []);
});

test('Library source language remains explicit in translated UI without translating the source itself', () => {
  assert.equal(t('v7.content.translation.sourceFallback', { locale: 'tl', values: { language: 'English' } }), 'Ipinapakita ang orihinal na wika: English.');
  assert.equal(t('v7.content.translation.sourceFallback', { locale: 'ceb', values: { language: 'English' } }), 'Gipakita ang orihinal nga pinulongan: English.');
  assert.equal(localization.t('v7.content.source', { locale: 'en' }), 'Source');
  assert.equal(localization.t('v7.library.title', { locale: 'tl-PH' }), 'Aklatan');
  assert.equal(localization.t('v7.library.title', { locale: 'ceb_PH' }), 'Librarya');
});

test('missing translations still use the approved English fallback and are inventoried', () => {
  const dictionaries = { en: { 'v7.library.count': '{count} Library items shown' }, tl: {}, ceb: {} };
  for (const locale of ['tl', 'ceb']) {
    assert.ok(getMissingLocaleKeys(locale, dictionaries).includes('v7.library.count'));
    assert.equal(t('v7.library.count', { locale, dictionaries, values: { count: 3 } }), '3 Library items shown');
  }
  assert.equal(t('v7.library.title', { locale: 'unsupported-locale' }), 'Library');
});

test('blank translations use the same fallback as the missing-key inventory', () => {
  const key = 'v7.library.count';
  for (const blank of ['', ' ', '\t\n', null, undefined]) {
    const dictionaries = { en: { [key]: '{count} Library items shown' }, tl: { [key]: blank } };
    assert.ok(getMissingLocaleKeys('tl', dictionaries).includes(key));
    assert.equal(t(key, { locale: 'tl', dictionaries, values: { count: 3 } }), '3 Library items shown');
  }
  assert.equal(t(key, { locale: 'tl', dictionaries: { en: { [key]: ' \n' }, tl: { [key]: '\t' } } }), key);
  assert.equal(t(key, { locale: 'tl', dictionaries: { en: {}, tl: { [key]: '  {count} mga item  ' } }, values: { count: 3 } }), '  3 mga item  ');
});


test('locale switching reaches rendered Library, assignment, and publication controls through the existing owner', () => {
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map();
  globalThis.localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  const service = { list() {}, getState() { return {}; }, subscribe() { return () => {}; } };
  try {
    for (const locale of ['en', 'tl', 'ceb', 'en']) {
      localization.setLocale(locale);
      const library = createLibraryPage({ service, navigate() {} });
      assert.equal(library.title, t('v7.library.title', { locale }));
      assert.ok(library.html.includes(t('v7.library.searchLabel', { locale })));
      assert.ok(library.html.includes(t('v7.library.retry', { locale })));
      const assignment = renderAssignmentPreparation({ status: 'error', error: 'unavailable', pairs: [] });
      assert.ok(assignment.includes(t('v7.assignment.title', { locale })));
      assert.ok(assignment.includes(t('v7.assignment.error', { locale })));
      const publication = renderPublicationHandoff({ ready: true, request: {} }, { canPublish: true, busy: true });
      assert.ok(publication.includes(t('v7.publicationHandoff.publish', { locale })));
      assert.ok(publication.includes(t('v7.publicationHandoff.publishing', { locale })));
      assert.doesNotMatch(library.html + assignment + publication, /v7\.(library|assignment|publicationHandoff)\./);
    }
  } finally {
    if (saved) Object.defineProperty(globalThis, 'localStorage', saved);
    else delete globalThis.localStorage;
  }
});
