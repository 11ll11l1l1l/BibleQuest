import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

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
    assert.ok(html.includes('data-jp-furigana-control'));
    assert.ok(html.includes('aria-label="Japanese furigana mode"'));
    assert.ok(html.includes('<option value="off" '));
    assert.ok(html.includes('<option value="support" '));
    assert.ok(html.includes('<option value="all" selected>'));
    assert.ok(!html.includes('data-reader-verse-text'));
  });

  it('describes furigana recovery as a non-destructive reading aid failure', () => {
    const fallback = japaneseFuriganaRecoveryStatus({ fallback: true });
    const retrying = japaneseFuriganaRecoveryStatus({ retrying: true });
    assert.ok(fallback.includes('role="status"'));
    assert.ok(fallback.includes('聖書本文は保持したまま'));
    assert.ok(fallback.includes('data-reader-furigana-retry'));
    assert.ok(retrying.includes('data-jp-furigana-retrying'));
    assert.equal(japaneseFuriganaRecoveryStatus(), '');
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
    assert.ok(html.includes('word &amp; term'));
    assert.ok(html.includes('&quot;reading&quot;'));
    assert.ok(html.includes('simple &lt; note'));
    assert.ok(html.includes('meaning &gt; gloss'));
    assert.ok(html.includes('english &amp; gloss'));
    assert.ok(html.includes('学習補助であり、聖書本文ではありません'));
  });

  it('keeps vocabulary opt-in state machine-readable and handles absent notes safely', () => {
    assert.ok(japaneseVocabularyControl({ enabled: false }).includes('aria-pressed="false"'));
    assert.ok(japaneseVocabularyControl({ enabled: true }).includes('aria-pressed="true"'));
    const empty = japaneseVocabularyBlock({ notes: null });
    assert.ok(empty.includes('bq-jp-vocab-empty'));
    assert.ok(empty.includes('本文をそのまま読み進めてください'));
  });
});
