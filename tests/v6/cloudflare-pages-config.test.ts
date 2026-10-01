import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Cloudflare Pages root build hook stages the generated V6 artifact', async () => {
  const buildScript = await readFile(new URL('../../build.sh', import.meta.url), 'utf8');

  assert.match(buildScript, /CF_PAGES_COMMIT_SHA:-/);

  const gateIndex = buildScript.indexOf('node scripts/deploy-gate.mjs');
  const installIndex = buildScript.indexOf('npm ci');
  const buildIndex = buildScript.indexOf('npm run build:v6');
  const stageIndex = buildScript.indexOf('cp -a dist-v6/. .');

  assert.ok(gateIndex >= 0, 'Pages build hook must retain the deployment gate');
  assert.ok(installIndex > gateIndex, 'Pages build hook must install pinned dependencies after the deployment gate');
  assert.ok(buildIndex > installIndex, 'Pages build hook must build dist-v6 after deterministic install');
  assert.ok(stageIndex > buildIndex, 'Pages build hook must stage only after the certified V6 build exists');
  assert.match(buildScript, /test -f dist-v6\/bq-build\.json/);
  assert.match(buildScript, /test -f dist-v6\/bq-artifact-integrity\.json/);
  assert.match(buildScript, /test -f bq-build\.json/);
  assert.match(buildScript, /test -f bq-artifact-integrity\.json/);
});
