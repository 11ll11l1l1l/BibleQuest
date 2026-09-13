import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { renderReaderError, renderReaderLoading } from '../src/v5/reader/async-view.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const readerSource = await readFile(resolve(here, '../src/features/reader/index.js'), 'utf8');

const count = (text, needle) => text.split(needle).length - 1;

// Preserve the accepted route-level interaction ownership while presentation is extracted.
assert.equal(count(readerSource, "host.addEventListener('change', onChange)"), 1, 'Reader must retain one change-listener owner');
assert.equal(count(readerSource, "host.addEventListener('click', onClick)"), 1, 'Reader must retain one click-listener owner');
assert.equal(count(readerSource, "host.addEventListener('submit', onSubmit)"), 1, 'Reader must retain one submit-listener owner');
assert.equal(count(readerSource, "host.removeEventListener('change', onChange)"), 1, 'Reader cleanup must remove change ownership');
assert.equal(count(readerSource, "host.removeEventListener('click', onClick)"), 1, 'Reader cleanup must remove click ownership');
assert.equal(count(readerSource, "host.removeEventListener('submit', onSubmit)"), 1, 'Reader cleanup must remove submit ownership');

// The shipped Reader now delegates only async presentation to the V5 component boundary.
assert.match(readerSource, /import \{ renderReaderError, renderReaderLoading \} from '\.\.\/\.\.\/v5\/reader\/async-view\.mjs';/, 'Reader must import the V5 async presentation boundary');
assert.match(readerSource, /const renderLoading = message => \{ host\.innerHTML = renderReaderLoading\(message\); \};/, 'Reader loading must delegate to the async component');
assert.match(readerSource, /const renderError = error => \{ host\.innerHTML = renderReaderError\(error, \{ japanese: reader\.getState\(\)\.translation === 'jko' \}\); \};/, 'Reader error rendering must preserve Japanese-state input while delegating presentation');

// Loading remains stale-request protected and delegates data work to the existing Reader service.
assert.match(readerSource, /const load = async \(message = 'Loading chapter…'\) => \{ const id = \+\+operation;[\s\S]*reader\.load\(\)[\s\S]*id === operation[\s\S]*renderChapter\(chapter\)[\s\S]*id === operation[\s\S]*renderError\(error\)/, 'Reader load must keep operation-token stale request protection');
assert.match(readerSource, /host\.addEventListener\('submit', onSubmit\); load\(\);/, 'Reader must still perform its initial chapter load');

// Recovery behavior is a user-facing contract: retry does not mutate translation; BSB is explicit.
assert.match(readerSource, /target\.closest\('\[data-reader-retry\]'\)\) return load\(\)/, 'Retry must invoke the same load path');
assert.match(readerSource, /target\.closest\('\[data-reader-use-bsb\]'\)\) \{ reader\.setTranslation\('bsb'\); searchResults = null; highlightVerse = null; return load\('Loading BSB…'\); \}/, 'Japanese recovery must require an explicit BSB action');

const loading = renderReaderLoading('Loading chapter…');
assert.match(loading, /data-bq-view-state="loading"/);
assert.match(loading, /role="status"/);
assert.match(loading, /aria-live="polite"/);
assert.match(loading, /Loading chapter…/);

const ordinaryError = renderReaderError(new Error('Network unavailable'));
assert.match(ordinaryError, /data-bq-view-state="error"/);
assert.match(ordinaryError, /role="alert"/);
assert.match(ordinaryError, /data-reader-retry/);
assert.doesNotMatch(ordinaryError, /data-reader-use-bsb/);
assert.doesNotMatch(ordinaryError, /data-jko-failure/);

const japaneseError = renderReaderError(new Error('Live Japanese source unavailable'), { japanese: true });
assert.match(japaneseError, /data-reader-retry/);
assert.match(japaneseError, /data-reader-use-bsb/);
assert.match(japaneseError, /data-jko-failure/);
assert.match(japaneseError, /本文を推測したり別の訳で置き換えたりしません/);

console.log('v5 Reader route async characterization: PASS');
