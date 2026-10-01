import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('deployment build hook always stages the generated V6 artifact', async () => {
  const buildScript = await readFile(new URL('../../build.sh', import.meta.url), 'utf8');

  const gateIndex = buildScript.indexOf('node scripts/deploy-gate.mjs');
  const installIndex = buildScript.indexOf('npm ci');
  const buildIndex = buildScript.indexOf('npm run build:v6');
  const stageIndex = buildScript.indexOf('cp -a dist-v6/. .');

  assert.ok(gateIndex >= 0, 'deployment hook must retain the legacy safety gate');
  assert.ok(installIndex > gateIndex, 'deployment hook must install pinned dependencies after the safety gate');
  assert.ok(buildIndex > installIndex, 'deployment hook must build dist-v6 after deterministic install');
  assert.ok(stageIndex > buildIndex, 'deployment hook must stage only after the certified V6 build exists');
  assert.doesNotMatch(buildScript, /CF_PAGES/, 'deployment output must not depend on provider environment detection');
  assert.match(buildScript, /test -f dist-v6\/bq-build\.json/);
  assert.match(buildScript, /test -f dist-v6\/bq-artifact-integrity\.json/);
  assert.match(buildScript, /test -f bq-build\.json/);
  assert.match(buildScript, /test -f bq-artifact-integrity\.json/);
});
