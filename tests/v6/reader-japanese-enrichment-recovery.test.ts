import { describe, expect, it, vi } from 'vitest';
import { loadJapaneseEnrichment, type JapaneseEnrichmentProvider } from '../../src/v6/reader/index.ts';

const reference = { bookCode: 'JHN', chapter: 3, verse: 16 } as const;

describe('V6 Japanese Reader enrichment recovery seam', () => {
  it('preserves the exact Japanese Scripture reference and provenance-bearing vocabulary', async () => {
    const getVerseEnrichment = vi.fn(async () => ({
      translationId: 'jko' as const,
      reference,
      segments: [{ surface: '神', reading: 'かみ' }],
      vocabulary: [{ surface: '神', reading: 'かみ', gloss: 'God', source: 'fixture-provenance' }],
    }));
    const provider: JapaneseEnrichmentProvider = { getVerseEnrichment };
    const state = await loadJapaneseEnrichment(provider, { translationId: 'jko', ...reference });
    expect(state.status).toBe('ready');
    expect(getVerseEnrichment).toHaveBeenCalledWith(reference);
    if (state.status === 'ready') {
      expect(state.enrichment.reference).toEqual(reference);
      expect(state.enrichment.vocabulary[0]?.source).toBe('fixture-provenance');
    }
  });

  it('fails closed without provider I/O for non-Japanese translations', async () => {
    const getVerseEnrichment = vi.fn();
    const state = await loadJapaneseEnrichment({ getVerseEnrichment }, { translationId: 'bsb', ...reference });
    expect(state).toEqual({ status: 'failed', reason: 'unsupported-translation', retryable: false });
    expect(getVerseEnrichment).not.toHaveBeenCalled();
  });

  it('fails closed without provider I/O for an invalid reference', async () => {
    const getVerseEnrichment = vi.fn();
    const state = await loadJapaneseEnrichment({ getVerseEnrichment }, { translationId: 'jko', bookCode: 'JHN', chapter: 0, verse: 16 });
    expect(state).toEqual({ status: 'failed', reason: 'invalid-reference', retryable: false });
    expect(getVerseEnrichment).not.toHaveBeenCalled();
  });

  it('turns tokenizer/CDN/provider failure into a retryable state instead of losing Reader state', async () => {
    const getVerseEnrichment = vi.fn().mockRejectedValueOnce(new Error('tokenizer CDN unavailable')).mockResolvedValueOnce({
      translationId: 'jko', reference, segments: [{ surface: '神', reading: 'かみ' }], vocabulary: [],
    });
    const provider: JapaneseEnrichmentProvider = { getVerseEnrichment };
    const first = await loadJapaneseEnrichment(provider, { translationId: 'jko', ...reference });
    const retry = await loadJapaneseEnrichment(provider, { translationId: 'jko', ...reference });
    expect(first).toEqual({ status: 'failed', reason: 'unavailable', retryable: true });
    expect(retry.status).toBe('ready');
    expect(getVerseEnrichment).toHaveBeenCalledTimes(2);
  });

  it('rejects mismatched provider references as retryable unavailable content', async () => {
    const provider: JapaneseEnrichmentProvider = { getVerseEnrichment: async () => ({
      translationId: 'jko', reference: { bookCode: 'JHN', chapter: 3, verse: 17 }, segments: [], vocabulary: [],
    }) };
    await expect(loadJapaneseEnrichment(provider, { translationId: 'jko', ...reference })).resolves.toEqual({
      status: 'failed', reason: 'unavailable', retryable: true,
    });
  });
});
