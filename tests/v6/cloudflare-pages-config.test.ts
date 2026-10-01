import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Cloudflare Pages publishes the generated V6 artifact directory', async () => {
  const [wrangler, buildScript] = await Promise.all([
    readFile(new URL('../../wrangler.toml', import.meta.url), 'utf8'),
    readFile(new URL('../../build.sh', import.meta.url), 'utf8'),
  ]);

  assert.match(wrangler, /^name\s*=\s*"mybiblequest"$/m);
  assert.match(wrangler, /^pages_build_output_dir\s*=\s*"\.\/dist-v6"$/m);
  assert.match(wrangler, /^compatibility_date\s*=\s*"\d{4}-\d{2}-\d{2}"$/m);
  assert.match(buildScript, /CF_PAGES:-/);

  const gateIndex = buildScript.indexOf('node scripts/deploy-gate.mjs');
  const installIndex = buildScript.indexOf('npm ci');
  const buildIndex = buildScript.indexOf('npm run build:v6');
  assert.ok(gateIndex >= 0, 'Pages build hook must retain the deployment gate');
  assert.ok(installIndex > gateIndex, 'Pages build hook must install pinned dependencies after the deployment gate');
  assert.ok(buildIndex > installIndex, 'Pages build hook must build dist-v6 after deterministic install');
  assert.match(buildScript, /test -f dist-v6\/bq-build\.json/);
  assert.match(buildScript, /test -f dist-v6\/bq-artifact-integrity\.json/);
});
