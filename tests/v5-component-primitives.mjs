import assert from 'node:assert/strict';
import {
  actionButton,
  dialogFrame,
  emptyState,
  errorState,
  escapeHtml,
  loadingState,
  statusPanel,
  viewState,
} from '../src/v5/ui/primitives.mjs';

assert.equal(escapeHtml('<b>"x" & y</b>'), '&lt;b&gt;&quot;x&quot; &amp; y&lt;/b&gt;');

const button = actionButton({ label: 'Retry <now>', action: 'retry-reader', icon: '↻' });
assert.match(button, /data-bq-action="retry-reader"/);
assert.match(button, /Retry &lt;now&gt;/);
assert.match(button, /aria-hidden="true">↻/);
assert.throws(() => actionButton({ label: 'X', action: 'BAD ACTION' }), /Invalid component action/);

const loading = loadingState({ message: 'Chapter 3' });
assert.match(loading, /data-bq-view-state="loading"/);
assert.match(loading, /aria-live="polite"/);

const error = errorState({
  message: '<network>',
  retryAction: { label: 'Retry', action: 'retry-reader' },
});
assert.match(error, /role="alert"/);
assert.match(error, /&lt;network&gt;/);

const empty = emptyState({ title: 'No notes', message: 'Create one.' });
assert.match(empty, /data-bq-view-state="empty"/);
assert.doesNotMatch(empty, /data-bq-action=/);

const dialog = dialogFrame({
  id: 'verse-peek',
  title: 'Verse <Peek>',
  bodyHtml: '<p data-test>trusted composed body</p>',
});
assert.match(dialog, /aria-labelledby="verse-peek-title"/);
assert.match(dialog, /Verse &lt;Peek&gt;/);
assert.match(dialog, /trusted composed body/);

assert.deepEqual(viewState('offline'), { kind: 'offline' });
assert.throws(() => viewState('spinning'), /Unsupported view state/);
assert.throws(() => statusPanel({ state: 'bad', title: 'x' }), /Unsupported view state/);

console.log('v5 component primitive characterization: PASS');
