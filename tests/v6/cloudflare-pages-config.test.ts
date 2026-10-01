import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('deployment build hook builds V6 everywhere and stages only outside GitHub Actions', async () => {
  const buildScript = await readFile(new URL('../../build.sh', import.meta.url), 'utf8');

  const gateIndex = buildScript.indexOf('node scripts/deploy-gate.mjs');
  const installIndex = buildScript.indexOf('npm ci');
  const buildIndex = buildScript.indexOf('npm run build:v6');
  const githubGuardIndex = buildScript.indexOf('GITHUB_ACTIONS:-');
  const stageIndex = buildScript.indexOf('cp -a dist-v6/. .');

  assert.ok(gateIndex >= 0, 'deployment hook must retain the legacy safety gate');
  assert.ok(installIndex > gateIndex, 'deployment hook must install pinned dependencies after the safety gate');
  assert.ok(buildIndex > installIndex, 'deployment hook must build dist-v6 after deterministic install');
  assert.ok(githubGuardIndex > buildIndex, 'root staging must be isolated from GitHub regression worktrees');
  assert.ok(stageIndex > githubGuardIndex, 'Pages staging must remain inside the non-GitHub-Actions path');
  assert.doesNotMatch(buildScript, /CF_PAGES/, 'build output must not depend on Cloudflare environment detection');
  assert.match(buildScript, /test -f dist-v6\/bq-build\.json/);
  assert.match(buildScript, /test -f dist-v6\/bq-artifact-integrity\.json/);
  assert.match(buildScript, /test -f bq-build\.json/);
  assert.match(buildScript, /test -f bq-artifact-integrity\.json/);
});
