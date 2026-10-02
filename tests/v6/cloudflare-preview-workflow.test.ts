import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowUrl = new URL('../../.github/workflows/v6-cloudflare-preview-verify.yml', import.meta.url);

test('V6 Cloudflare preview gate is exact-SHA, immutable-preview and byte-verification bound', async () => {
  const workflow = await readFile(workflowUrl, 'utf8');

  assert.match(workflow, /pull_request:\n\s+branches:\n\s+- v6\/architecture-upgrade/);
  assert.match(workflow, /BQ_EXPECTED_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(workflow, /test "\$\(git rev-parse HEAD\)" = "\$\{BQ_EXPECTED_SHA\}"/);
  assert.match(workflow, /BQ_BUILD_SHA: \$\{\{ env\.BQ_EXPECTED_SHA \}\}/);
  assert.match(workflow, /BQ_EXPECTED_ARTIFACT_SHA256/);
  assert.match(workflow, /BQ_EXPECTED_INTEGRITY_SHA256/);
  assert.match(workflow, /checks: read/);
  assert.doesNotMatch(workflow, /issues: read|pull-requests: read/);
  assert.match(workflow, /github\.paginate\(github\.rest\.checks\.listForRef/);
  assert.match(workflow, /ref: exactSha/);
  assert.match(workflow, /check\.name === 'Cloudflare Pages: mybiblequest'/);
  assert.match(workflow, /String\(check\.head_sha \|\| ''\)\.toLowerCase\(\) === exactSha/);
  assert.match(workflow, /<strong>Preview URL:<\\\/strong>/);
  assert.match(workflow, /<strong>Branch Preview URL:<\\\/strong>/);
  assert.match(workflow, /previewUrl === branchUrl/);
  assert.match(workflow, /node scripts\/v6-deployment-verify\.mjs > v6-cloudflare-preview-evidence\.json/);
  assert.match(workflow, /v6-cloudflare-preview-\$\{\{ env\.BQ_EXPECTED_SHA \}\}/);
  assert.ok(
    workflow.includes("if [ \"$status\" -ne 0 ]; then\n          node --input-type=module <<'NODE'")
      && workflow.includes("\n          NODE\n          cat v6-cloudflare-preview-error.log >&2"),
    'failure diagnostic heredoc delimiter must be flush with its shell command after YAML indentation is stripped',
  );
  assert.doesNotMatch(workflow, /RC_CANDIDATE|v6-rc-exact-sha-gate/,
    'preview verification must stay independent from RC-marker certification logic');
});
