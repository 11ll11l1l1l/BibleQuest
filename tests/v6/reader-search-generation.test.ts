import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

function readerSubmitSource() {
  const source = fs.readFileSync('src/features/reader/index.js', 'utf8');
  const start = source.indexOf('const onSubmit = async event =>');
  const end = source.indexOf("host.addEventListener('change'", start);
  assert.ok(start >= 0, 'Reader submit handler must exist');
  assert.ok(end > start, 'Reader submit handler must have a bounded source region');
  return source.slice(start, end);
}

test('Reader search completion stays behind the Reader operation generation', () => {
  const submit = readerSubmitSource();

  assert.match(submit, /const id = \+\+operation/);
  assert.match(submit, /const results = await reader\.search/);
  assert.match(submit, /const chapter = await reader\.load\(\)/);
  assert.match(submit, /const offlineStatus = await getOfflineStatus\(\)/);
  assert.ok((submit.match(/if \(id !== operation\) return;/g) ?? []).length >= 4);
  assert.ok(
    submit.indexOf('searchResults = results') > submit.indexOf('const offlineStatus = await getOfflineStatus()'),
    'Search results must not publish before offline status resolves for the current generation',
  );
});

test('Reader search suppresses stale success and failure UI after navigation invalidates it', () => {
  const submit = readerSubmitSource();

  const publish = submit.indexOf('searchResults = results');
  const finalGuardBeforePublish = submit.lastIndexOf('if (id !== operation) return;', publish);
  assert.ok(finalGuardBeforePublish > submit.indexOf('await getOfflineStatus()'));

  const failure = submit.indexOf('catch (error)');
  const failureGuard = submit.indexOf('if (id !== operation) return;', failure);
  const failureMessage = submit.indexOf("message(error?.message || 'Search failed.')", failure);
  assert.ok(failureGuard > failure);
  assert.ok(failureMessage > failureGuard);
});
