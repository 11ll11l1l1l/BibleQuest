import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('Cloudflare Pages source config publishes dist-v6 from repository root', async () => {
  const wrangler = await readFile(new URL('../../wrangler.toml', import.meta.url), 'utf8');
  assert.match(wrangler, /^name\s*=\s*"mybiblequest"$/m);
  assert.match(wrangler, /^pages_build_output_dir\s*=\s*"\.\/dist-v6"$/m);
  assert.match(wrangler, /^compatibility_date\s*=\s*"2026-10-02"$/m);
});

test('Cloudflare-only postinstall builds V6 with the exact Pages commit SHA', async () => {
  const [pkgRaw, hook] = await Promise.all([
    readFile(new URL('../../package.json', import.meta.url), 'utf8'),
    readFile(new URL('../../scripts/v6-pages-build-hook.mjs', import.meta.url), 'utf8'),
  ]);
  const pkg = JSON.parse(pkgRaw);
  assert.equal(pkg.scripts.postinstall, 'node scripts/v6-pages-build-hook.mjs');
  assert.match(hook, /process\.env\.CF_PAGES !== '1'/);
  assert.match(hook, /CF_PAGES_COMMIT_SHA/);
  assert.match(hook, /\^\[0-9a-f\]\{40\}\$/);
  assert.match(hook, /BQ_BUILD_SHA: sourceSha/);
  assert.match(hook, /\['run', 'build:v6'\]/);
  assert.doesNotMatch(hook, /cpSync|copyFile|dist-v6', '\.'/);
});

test('Pages build hook is a no-op outside Cloudflare Pages', () => {
  const result = spawnSync(process.execPath, ['scripts/v6-pages-build-hook.mjs'], {
    cwd: new URL('../..', import.meta.url),
    env: { ...process.env, CF_PAGES: '', CF_PAGES_COMMIT_SHA: '' },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
});
