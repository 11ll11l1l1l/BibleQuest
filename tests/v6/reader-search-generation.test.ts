import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

function readerSubmitSource() {
  const source = fs.readFileSync('src/features/reader/index.js', 'utf8');
  const start = source.indexOf('const onSubmit = async event =>');
  const end = source.indexOf("host.addEventListener('change'", start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return source.slice(start, end);
}

describe('Reader search generation guard', () => {
  it('keeps asynchronous search completion behind the Reader operation generation', () => {
    const submit = readerSubmitSource();

    expect(submit).toContain('const id = ++operation');
    expect(submit).toContain('const results = await reader.search');
    expect(submit).toContain('const chapter = await reader.load()');
    expect(submit).toContain('const offlineStatus = await getOfflineStatus()');
    expect(submit.match(/if \(id !== operation\) return;/g)?.length).toBeGreaterThanOrEqual(4);
    expect(submit.indexOf('searchResults = results')).toBeGreaterThan(submit.indexOf('const offlineStatus = await getOfflineStatus()'));
  });

  it('does not publish stale success or failure UI after navigation invalidates a search', () => {
    const submit = readerSubmitSource();

    const publish = submit.indexOf('searchResults = results');
    const finalGuardBeforePublish = submit.lastIndexOf('if (id !== operation) return;', publish);
    expect(finalGuardBeforePublish).toBeGreaterThan(submit.indexOf('await getOfflineStatus()'));

    const failure = submit.indexOf('catch (error)');
    const failureGuard = submit.indexOf('if (id !== operation) return;', failure);
    const failureMessage = submit.indexOf("message(error?.message || 'Search failed.')", failure);
    expect(failureGuard).toBeGreaterThan(failure);
    expect(failureMessage).toBeGreaterThan(failureGuard);
  });
});
