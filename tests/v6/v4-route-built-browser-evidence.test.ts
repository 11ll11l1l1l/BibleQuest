import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

type ParityManifest = Readonly<{
  entries: readonly Readonly<{ v6Route: string }>[];
}>;

function parseBuiltBrowserCanonicalRoutes(source: string): string[] {
  const match = source.match(/const canonicalRoutes = \[([\s\S]*?)\];/);
  assert.ok(match, 'built-artifact canonical route inventory must remain readable');
  return [...match[1].matchAll(/'([^']+)'/g)].map(item => item[1]);
}

test('every V4 parity route is bound to built-artifact direct deep-link evidence', async () => {
  const [manifestSource, builtBrowserSource] = await Promise.all([
    readFile(new URL('../../docs/v6/V6_V4_ROUTE_FEATURE_PARITY.json', import.meta.url), 'utf8'),
    readFile(new URL('./built-artifact-browser.mjs', import.meta.url), 'utf8'),
  ]);
  const manifest = JSON.parse(manifestSource) as ParityManifest;
  const builtRoutes = parseBuiltBrowserCanonicalRoutes(builtBrowserSource);
  const builtRouteSet = new Set(builtRoutes);

  assert.equal(new Set(builtRoutes).size, builtRoutes.length, 'built-artifact canonical routes must be unique');
  for (const entry of manifest.entries) {
    assert.equal(
      builtRouteSet.has(entry.v6Route),
      true,
      '#/' + entry.v6Route + ' must have built-artifact direct deep-link evidence for V4 parity',
    );
  }
});
