import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Cloudflare Pages install builds exact V6 and stages it into the existing published root', async () => {
  const [pkgRaw, hook] = await Promise.all([
    readFile(new URL('../../package.json', import.meta.url), 'utf8'),
    readFile(new URL('../../scripts/v6-pages-build-hook.mjs', import.meta.url), 'utf8'),
  ]);
  const pkg = JSON.parse(pkgRaw);

  assert.equal(pkg.scripts.postinstall, 'node scripts/v6-pages-build-hook.mjs');
  assert.match(hook, /process\.env\.CF_PAGES === '1'/);
  assert.match(hook, /CF_PAGES_COMMIT_SHA/);
  assert.match(hook, /\^\[0-9a-f\]\{40\}\$/);
  assert.match(hook, /BQ_BUILD_SHA: sourceSha/);
  assert.match(hook, /\['run', 'build:v6'\]/);
  assert.match(hook, /cpSync\('dist-v6', '\.', \{ recursive: true, force: true \}\)/);
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
