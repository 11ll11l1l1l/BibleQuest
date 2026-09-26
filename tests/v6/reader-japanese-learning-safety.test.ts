import { describe, expect, it } from 'vitest';

import {
  japaneseFuriganaControl,
  japaneseFuriganaRecoveryStatus,
} from '../../src/features/reader/furigana.js';
import {
  japaneseVocabularyBlock,
  japaneseVocabularyControl,
} from '../../src/features/reader/vocabulary.js';

describe('Reader Japanese learning presentation safety', () => {
  it('keeps furigana modes explicit and accessible without changing Scripture text', () => {
    const html = japaneseFuriganaControl({ mode: 'all' });
    expect(html).toContain('data-jp-furigana-control');
    expect(html).toContain('aria-label="Japanese furigana mode"');
    expect(html).toContain('<option value="off" ');
    expect(html).toContain('<option value="support" ');
    expect(html).toContain('<option value="all" selected>');
    expect(html).not.toContain('data-reader-verse-text');
  });

  it('describes furigana recovery as a non-destructive reading aid failure', () => {
    const fallback = japaneseFuriganaRecoveryStatus({ fallback: true });
    const retrying = japaneseFuriganaRecoveryStatus({ retrying: true });
    expect(fallback).toContain('role="status"');
    expect(fallback).toContain('聖書本文は保持したまま');
    expect(fallback).toContain('data-reader-furigana-retry');
    expect(retrying).toContain('data-jp-furigana-retrying');
    expect(japaneseFuriganaRecoveryStatus()).toBe('');
  });

  it('escapes vocabulary enrichment fields and labels the block as learning aid, not Scripture', () => {
    const html = japaneseVocabularyBlock({
      notes: [{
        term: 'word & term',
        reading: '"reading"',
        simple: 'simple < note',
        meaning: 'meaning > gloss',
        en: 'english & gloss',
      }],
    });
    expect(html).toContain('word &amp; term');
    expect(html).toContain('&quot;reading&quot;');
    expect(html).toContain('simple &lt; note');
    expect(html).toContain('meaning &gt; gloss');
    expect(html).toContain('english &amp; gloss');
    expect(html).toContain('学習補助であり、聖書本文ではありません');
  });

  it('keeps vocabulary opt-in state machine-readable and handles absent notes safely', () => {
    expect(japaneseVocabularyControl({ enabled: false })).toContain('aria-pressed="false"');
    expect(japaneseVocabularyControl({ enabled: true })).toContain('aria-pressed="true"');
    const empty = japaneseVocabularyBlock({ notes: null });
    expect(empty).toContain('bq-jp-vocab-empty');
    expect(empty).toContain('本文をそのまま読み進めてください');
  });
});
