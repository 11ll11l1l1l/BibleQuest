import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  manifestShortcuts,
  notificationRoute,
  parseRouteHash,
  routeUrl,
  V6_APP_SHORTCUTS,
} from '../../src/v6/routing/deep-link.ts';

test('deep-link parser accepts only the bounded V6 route allowlist', () => {
  assert.equal(parseRouteHash('#/reader'), 'reader');
  assert.equal(parseRouteHash('#/assignments?from=push'), 'assignments');
  assert.equal(parseRouteHash('#/admin-operations'), null);
  assert.equal(parseRouteHash('#/reader/../../admin'), 'reader');
  assert.equal(notificationRoute({ route: 'calendar' }), 'calendar');
  assert.equal(notificationRoute({ route: 'javascript:alert(1)' }), null);
});

test('shortcut URLs stay deployment-relative and use real production hash routes', () => {
  const shortcuts = manifestShortcuts();
  assert.equal(shortcuts.length, 4);
  assert.deepEqual(
    shortcuts.map((item) => item.url),
    ['./#/my-journey', './#/reader', './#/assignments', './#/calendar'],
  );
  for (const shortcut of V6_APP_SHORTCUTS) assert.equal(routeUrl(shortcut.route), './#/' + shortcut.route);
});

test('manifest shortcuts remain synchronized with actual V5 route ownership', () => {
  const bootstrap = fs.readFileSync(new URL('../../src/app/bootstrap.js', import.meta.url), 'utf8');
  const manifest = JSON.parse(fs.readFileSync(new URL('../../manifest.webmanifest', import.meta.url), 'utf8'));

  for (const shortcut of V6_APP_SHORTCUTS) {
    const routeOwned = bootstrap.includes(shortcut.route + ':()=>') || bootstrap.includes("'" + shortcut.route + "':()=>");
    assert.equal(routeOwned, true, 'Production router must own shortcut route ' + shortcut.route);
    assert.equal(
      manifest.shortcuts?.some((entry: { url?: string }) => entry.url === routeUrl(shortcut.route)),
      true,
      'Manifest must expose shortcut route ' + shortcut.route,
    );
  }
});
