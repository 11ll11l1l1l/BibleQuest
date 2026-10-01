import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { CSP_ENFORCING_POLICY, CSP_REPORT_ONLY_POLICY, validateCspPolicy } from '../../scripts/v6-csp-policy.mjs';

const rootHtml = ['index.html','admin.html','admin-operations.html','content-review.html','transform.html','psychometrics.html','reset.html','classic.html','v5-push-device-field.html'];

test('report-only CSP candidate is least-broad for current V6 architecture', () => {
  assert.deepEqual(validateCspPolicy(), []);
  assert.doesNotMatch(CSP_REPORT_ONLY_POLICY, /script-src[^;]*'unsafe-inline'/);
  assert.doesNotMatch(CSP_REPORT_ONLY_POLICY, /script-src[^;]*'unsafe-eval'/);
  assert.doesNotMatch(CSP_REPORT_ONLY_POLICY, /https?:\/\/\*/);
  assert.match(CSP_REPORT_ONLY_POLICY, /https:\/\/openbible\.com/);
  assert.match(CSP_REPORT_ONLY_POLICY, /https:\/\/api\.pwnedpasswords\.com/);
  assert.match(CSP_REPORT_ONLY_POLICY, /https:\/\/www\.youtube\.com/);
  assert.match(CSP_REPORT_ONLY_POLICY, /https:\/\/cdn\.jsdelivr\.net/);
  assert.match(CSP_REPORT_ONLY_POLICY, /wss:\/\/zkfmgezvzugchcwppreq\.supabase\.co/);
});

test('all root HTML covered by Cloudflare global headers has no inline script blocks or event handlers', async () => {
  for (const path of rootHtml) {
    const source = await readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
    const inlineScripts = [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
      .filter(match => !/\bsrc\s*=/.test(match[1]) && match[2].trim());
    assert.equal(inlineScripts.length, 0, `${path}: inline script remains`);
    assert.doesNotMatch(source, /\son[a-z]+\s*=/i, `${path}: inline event handler remains`);
  }
});

test('report-only and enforcing CSP browser evidence are wired into exact-SHA Phase-1 after dist-v6 preview starts', async () => {
  const workflow = await readFile(new URL('../../.github/workflows/v6-phase1-build.yml', import.meta.url), 'utf8');
  assert.match(workflow, /Built artifact CSP report-only compatibility/);
  assert.match(workflow, /node tests\/v6\/csp-report-only-browser\.mjs/);
  assert.match(workflow, /Built artifact CSP enforcing compatibility/);
  assert.match(workflow, /node tests\/v6\/csp-enforcing-browser\.mjs/);
});

test('Cloudflare deployable header exactly matches the enforcing policy candidate', async () => {
  const headers = await readFile(new URL('../../_headers', import.meta.url), 'utf8');
  const line = headers.split(/\r?\n/).find(row => /^\s*Content-Security-Policy\s*:/.test(row));
  assert.ok(line, 'root _headers must contain an enforcing Content-Security-Policy');
  assert.equal(line.replace(/^\s*Content-Security-Policy\s*:\s*/, '').trim(), CSP_ENFORCING_POLICY);
});
