import { spawnSync } from 'node:child_process';

const isPages = process.env.CF_PAGES === '1';
if (!isPages) {
  process.exit(0);
}

const sourceSha = String(process.env.CF_PAGES_COMMIT_SHA || '').trim().toLowerCase();
if (!/^[0-9a-f]{40}$/.test(sourceSha)) {
  throw new Error('Cloudflare Pages build requires an exact 40-character CF_PAGES_COMMIT_SHA.');
}

const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build:v6'], {
  stdio: 'inherit',
  env: { ...process.env, BQ_BUILD_SHA: sourceSha },
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
