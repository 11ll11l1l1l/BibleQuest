import assert from 'node:assert/strict';
import { renderReaderError, renderReaderLoading } from '../src/v5/reader/async-view.mjs';

const loading = renderReaderLoading('Opening search result…');
assert.match(loading, /data-bq-view-state="loading"/);
assert.match(loading, /role="status"/);
assert.match(loading, /aria-live="polite"/);
assert.match(loading, /Opening search result…/);

const escaped = renderReaderError(new Error('<script>alert(1)</script>'));
assert.match(escaped, /data-bq-view-state="error"/);
assert.match(escaped, /role="alert"/);
assert.match(escaped, /aria-live="assertive"/);
assert.doesNotMatch(escaped, /<script>/);
assert.match(escaped, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.match(escaped, /data-reader-retry/);
assert.doesNotMatch(escaped, /data-reader-use-bsb/);

const japanese = renderReaderError(new Error('network'), { japanese: true });
assert.match(japanese, /data-jko-failure/);
assert.match(japanese, /data-reader-use-bsb/);
assert.match(japanese, /data-reader-retry/);
assert.doesNotMatch(japanese, /onclick=/);

console.log('v5 reader async view: PASS');
