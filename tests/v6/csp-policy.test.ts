import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { CSP_POLICY, validateCspPolicy } from '../../scripts/v6-csp-policy.mjs';

const rootHtml = ['index.html','admin.html','admin-operations.html','content-review.html','transform.html','psychometrics.html','reset.html','classic.html','v5-push-device-field.html'];

test('enforcing CSP is least-broad for current V6 architecture', async () => {
  assert.deepEqual(validateCspPolicy(), []);
  assert.doesNotMatch(CSP_POLICY, /script-src[^;]*'unsafe-inline'/);
  assert.doesNotMatch(CSP_POLICY, /script-src[^;]*'unsafe-eval'/);
  assert.doesNotMatch(CSP_POLICY, /https?:\/\/\*/);
  const rootHeaders = await readFile(new URL('../../_headers', import.meta.url), 'utf8');
  assert.ok(rootHeaders.includes(`Content-Security-Policy: ${CSP_POLICY}`));
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

test('exact-SHA build evidence and Chromium enforce the CSP candidate', async () => {
  const [ci, evidence] = await Promise.all([
    readFile(new URL('../../.github/workflows/v6-phase1-build.yml', import.meta.url), 'utf8'),
    readFile(new URL('../../scripts/v6-build-evidence.mjs', import.meta.url), 'utf8'),
  ]);
  assert.match(ci, /Built artifact CSP enforcement compatibility/);
  assert.match(ci, /node tests\/v6\/csp-enforcement-browser\.mjs/);
  assert.match(evidence, /built _headers CSP does not exactly match/);
  assert.match(evidence, /validateCspPolicy/);
});
