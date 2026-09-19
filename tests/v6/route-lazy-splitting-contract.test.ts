import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const bootstrapPath = fileURLToPath(new URL('../../src/app/bootstrap.js', import.meta.url));

test('V6 route pages are discovered lazily instead of statically bundled into bootstrap', async () => {
  const source = await readFile(bootstrapPath, 'utf8');

  assert.equal(source.includes("import.meta.glob('../features/*/index.js')"), true);
  assert.equal(source.includes("createLazyPage"), true);

  const staticFeatureImports = source
    .split('\n')
    .filter(line => line.startsWith("import { ") && line.includes(" from '../features/") && line.endsWith("/index.js';"));

  assert.deepEqual(staticFeatureImports, [
    "import { mountTutorialOverlay } from '../features/tutorial/index.js';",
  ]);

  const lazyProxyLines = source
    .split('\n')
    .filter(line => line.startsWith('const ') && line.includes(" = args => lazyFeaturePage('"));

  assert.equal(lazyProxyLines.length, 44);
  for (const line of lazyProxyLines) {
    const name = line.slice('const '.length, line.indexOf(' = args'));
    assert.equal(line.includes(`, '${name}', args);`), true);
  }
});
