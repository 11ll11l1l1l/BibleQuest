import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('bootstrap connects A1 emotion discovery to the tenant-safe Library service query', () => {
  const bootstrap = readFileSync(new URL('../../src/app/bootstrap.js', import.meta.url), 'utf8');
  const page = readFileSync(new URL('../../src/features/library/page.js', import.meta.url), 'utf8');

  assert.match(
    bootstrap,
    /library:\(\)=>libraryPage\(\{service:library,navigate:navigateLibrary,discoverySearch:request=>library\.list\(request\),/,
  );
  assert.match(page, /discoverySearch\(withDiscovery\(request\)\)/);
  assert.match(page, /\.\.\.toLibraryDiscoveryRequest\(discoveryQuery,\s*localization\.getLocale\(\)\)/);
});
