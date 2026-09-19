import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canUseJapaneseEnrichment,
  normalizeJapaneseEnrichment,
} from '../../src/v6/reader/japanese-enrichment.ts';

test('Japanese enrichment is available only for the Japanese translation', () => {
  assert.equal(canUseJapaneseEnrichment('jko'), true);
  assert.equal(canUseJapaneseEnrichment('bsb'), false);
  assert.equal(canUseJapaneseEnrichment('tl'), false);
});

test('Japanese furigana and vocabulary remain optional enrichment over the exact verse reference', () => {
  const result = normalizeJapaneseEnrichment({
    translationId: 'jko',
    reference: { bookCode: 'JHN', chapter: 3, verse: 16 },
    segments: [
      { surface: '神', reading: 'かみ' },
      { surface: 'は' },
    ],
    vocabulary: [
      { surface: '神', reading: 'かみ', gloss: 'God', source: 'reviewed-vocabulary' },
    ],
  });

  assert.deepEqual(result.reference, { bookCode: 'JHN', chapter: 3, verse: 16 });
  assert.deepEqual(result.segments[0], { surface: '神', reading: 'かみ' });
  assert.deepEqual(result.vocabulary[0], {
    surface: '神', reading: 'かみ', gloss: 'God', source: 'reviewed-vocabulary',
  });
});

test('Japanese enrichment fails closed on invalid references and incomplete vocabulary provenance', () => {
  assert.throws(() => normalizeJapaneseEnrichment({
    translationId: 'jko',
    reference: { bookCode: 'JHN', chapter: 0 },
    segments: [],
    vocabulary: [],
  }));

  const result = normalizeJapaneseEnrichment({
    translationId: 'jko',
    reference: { bookCode: 'JHN', chapter: 1 },
    segments: [{ surface: '  神  ', reading: '  かみ  ' }],
    vocabulary: [{ surface: '神', gloss: '', source: 'x' }],
  });
  assert.deepEqual(result.segments[0], { surface: '神', reading: 'かみ' });
  assert.equal(result.vocabulary.length, 0);
});
