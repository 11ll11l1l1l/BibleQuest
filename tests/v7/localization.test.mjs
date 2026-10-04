import assert from 'node:assert/strict';
import test from 'node:test';
import { getMissingLocaleKeys, localization, t } from '../../src/app/localization.js';

test('V7 UI strings use the existing English fallback and missing-key inventory', () => {
  assert.equal(t('v7.content.translation.sourceFallback', { locale: 'tl', values: { language: 'English' } }), 'Showing the source language: English.');
  assert.equal(localization.t('v7.content.source', { locale: 'en' }), 'Source');
  assert.ok(getMissingLocaleKeys('tl').includes('v7.content.source'));
  assert.deepEqual(getMissingLocaleKeys('en'), []);
});
