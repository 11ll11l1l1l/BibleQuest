import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('Reader search generation guard', () => {
  it('keeps asynchronous search completion behind the Reader operation generation', () => {
    const source = fs.readFileSync('src/features/reader/index.js', 'utf8');
    const submit = source.slice(source.indexOf('const onSubmit = async event =>'), source.indexOf("host.addEventListener('change'", source.indexOf('const onSubmit = async event =>')));
    expect(submit).toContain('const id = ++operation');
    expect(submit).toContain('const results = await reader.search');
    expect(submit.match(/if \(id !== operation\) return;/g)?.length).toBeGreaterThanOrEqual(3);
    expect(submit.indexOf('searchResults = results')).toBeGreaterThan(submit.indexOf('await getOfflineStatus()'));
  });
});
