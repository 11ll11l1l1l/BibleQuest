import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Cloudflare Pages install builds and publishes exact dist-v6 output', async () => {
  const [pkgRaw, wrangler, hook] = await Promise.all([
    readFile(new URL('../../package.json', import.meta.url), 'utf8'),
    readFile(new URL('../../wrangler.toml', import.meta.url), 'utf8'),
    readFile(new URL('../../scripts/v6-pages-build-hook.mjs', import.meta.url), 'utf8'),
  ]);
  const pkg = JSON.parse(pkgRaw);

  assert.equal(pkg.scripts.postinstall, 'node scripts/v6-pages-build-hook.mjs');
  assert.match(wrangler, /^name\s*=\s*"mybiblequest"$/m);
  assert.match(wrangler, /^pages_build_output_dir\s*=\s*"\.\/dist-v6"$/m);
  assert.match(wrangler, /^compatibility_date\s*=\s*"\d{4}-\d{2}-\d{2}"$/m);

  assert.match(hook, /process\.env\.CF_PAGES === '1'/);
  assert.match(hook, /CF_PAGES_COMMIT_SHA/);
  assert.match(hook, /\^\[0-9a-f\]\{40\}\$/);
  assert.match(hook, /BQ_BUILD_SHA: sourceSha/);
  assert.match(hook, /\['run', 'build:v6'\]/);
});

test('Pages install hook is a no-op outside Cloudflare Pages', async () => {
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(process.execPath, ['scripts/v6-pages-build-hook.mjs'], {
    cwd: new URL('../..', import.meta.url),
    env: { ...process.env, CF_PAGES: '', CF_PAGES_COMMIT_SHA: '' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
});
