import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const packageJson = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));
const viteConfig = await readFile(new URL('../../vite.config.mjs', import.meta.url), 'utf8');
const workflow = await readFile(new URL('../../.github/workflows/v6-phase1-build.yml', import.meta.url), 'utf8');
const buildEvidence = await readFile(new URL('../../scripts/v6-build-evidence.mjs', import.meta.url), 'utf8');
const gitignore = await readFile(new URL('../../.gitignore', import.meta.url), 'utf8');

test('Phase-1 CI exposes lint, format, typecheck, unit, and build commands', () => {
  assert.equal(packageJson.scripts.lint, 'node scripts/v6-lint.mjs');
  assert.equal(packageJson.scripts['format:check'], 'node scripts/v6-format-check.mjs');
  assert.match(packageJson.scripts.typecheck, /tsc/);
  assert.equal(packageJson.scripts.unit, 'npm run unit:v6');
  assert.equal(packageJson.scripts['build:v6'], 'vite build');

  for (const command of [
    'npm run lint',
    'npm run format:check',
    'npm run typecheck',
    'npm run unit',
    'npm run build:v6',
  ]) {
    assert.ok(workflow.includes(command), `Phase-1 workflow must execute ${command}`);
  }
});

test('V6 source maps are generated hidden, source-free, and removed from public artifact', () => {
  assert.match(viteConfig, /sourcemap:\s*'hidden'/);
  assert.match(viteConfig, /sourcemapExcludeSources:\s*true/);
  assert.match(viteConfig, /biblequest-v6-private-source-maps/);
  assert.match(viteConfig, /\.v6-source-maps/);
  assert.match(gitignore, /^\.v6-source-maps\/$/m);

  assert.match(buildEvidence, /public artifact contains/);
  assert.match(buildEvidence, /sourceMappingURL/);
  assert.match(buildEvidence, /sourcesContent/);
  assert.match(buildEvidence, /publicSourceMaps/);
});
