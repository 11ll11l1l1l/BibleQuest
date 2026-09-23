import assert from 'node:assert/strict';
import test from 'node:test';

import { loadJapaneseEnrichment, type JapaneseEnrichmentProvider } from '../../src/v6/reader/index.ts';

const reference = { bookCode: 'JHN', chapter: 3, verse: 16 } as const;

test('preserves the exact Japanese Scripture reference and provenance-bearing vocabulary', async () => {
  const calls: unknown[] = [];
  const getVerseEnrichment = async (requested: typeof reference) => {
    calls.push(requested);
    return {
      translationId: 'jko' as const,
      reference,
      segments: [{ surface: '神', reading: 'かみ' }],
      vocabulary: [{ surface: '神', reading: 'かみ', gloss: 'God', source: 'fixture-provenance' }],
    };
  };
  const provider: JapaneseEnrichmentProvider = { getVerseEnrichment };
  const state = await loadJapaneseEnrichment(provider, { translationId: 'jko', ...reference });
  assert.equal(state.status, 'ready');
  assert.deepEqual(calls, [reference]);
  if (state.status === 'ready') {
    assert.deepEqual(state.enrichment.reference, reference);
    assert.equal(state.enrichment.vocabulary[0]?.source, 'fixture-provenance');
  }
});

test('fails closed without provider I/O for non-Japanese translations', async () => {
  let calls = 0;
  const getVerseEnrichment = async () => {
    calls += 1;
    throw new Error('provider must not be called');
  };
  const state = await loadJapaneseEnrichment({ getVerseEnrichment }, { translationId: 'bsb', ...reference });
  assert.deepEqual(state, { status: 'failed', reason: 'unsupported-translation', retryable: false });
  assert.equal(calls, 0);
});

test('fails closed without provider I/O for an invalid reference', async () => {
  let calls = 0;
  const getVerseEnrichment = async () => {
    calls += 1;
    throw new Error('provider must not be called');
  };
  const state = await loadJapaneseEnrichment(
    { getVerseEnrichment },
    { translationId: 'jko', bookCode: 'JHN', chapter: 0, verse: 16 },
  );
  assert.deepEqual(state, { status: 'failed', reason: 'invalid-reference', retryable: false });
  assert.equal(calls, 0);
});

test('turns tokenizer/CDN/provider failure into a retryable state instead of losing Reader state', async () => {
  let calls = 0;
  const getVerseEnrichment = async () => {
    calls += 1;
    if (calls === 1) throw new Error('tokenizer CDN unavailable');
    return {
      translationId: 'jko' as const,
      reference,
      segments: [{ surface: '神', reading: 'かみ' }],
      vocabulary: [],
    };
  };
  const provider: JapaneseEnrichmentProvider = { getVerseEnrichment };
  const first = await loadJapaneseEnrichment(provider, { translationId: 'jko', ...reference });
  const retry = await loadJapaneseEnrichment(provider, { translationId: 'jko', ...reference });
  assert.deepEqual(first, { status: 'failed', reason: 'unavailable', retryable: true });
  assert.equal(retry.status, 'ready');
  assert.equal(calls, 2);
});

test('rejects mismatched provider references as retryable unavailable content', async () => {
  const provider: JapaneseEnrichmentProvider = {
    getVerseEnrichment: async () => ({
      translationId: 'jko',
      reference: { bookCode: 'JHN', chapter: 3, verse: 17 },
      segments: [],
      vocabulary: [],
    }),
  };
  const state = await loadJapaneseEnrichment(provider, { translationId: 'jko', ...reference });
  assert.deepEqual(state, { status: 'failed', reason: 'unavailable', retryable: true });
});
