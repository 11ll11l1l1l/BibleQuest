import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  V6_DESIGN_TOKENS,
  V6_PRIMARY_NAVIGATION,
  V6_UI_FOUNDATION,
  V6_UI_PRIMITIVES,
} from '../../src/v6/ui/index.ts';

const ROOT = new URL('../../', import.meta.url);

async function text(path: string) {
  return readFile(new URL(path, ROOT), 'utf8');
}

test('V6 Phase 1 keeps the five user-facing primary destinations stable', () => {
  assert.deepEqual([...V6_PRIMARY_NAVIGATION], ['home', 'learn', 'play', 'grow', 'more']);
  assert.equal(V6_UI_FOUNDATION.minimumTouchTargetPx, 44);
  assert.equal(V6_UI_FOUNDATION.progressiveDisclosure, true);
  assert.equal(V6_UI_FOUNDATION.backendBehaviorChanged, false);
});

test('V6 design system exposes semantic tokens and reusable primitives', () => {
  assert.ok(V6_DESIGN_TOKENS.surface.includes('--bq-surface'));
  assert.ok(V6_DESIGN_TOKENS.text.includes('--bq-text-secondary'));
  assert.ok(V6_DESIGN_TOKENS.spacing.includes('--bq-space-12'));
  assert.equal(V6_UI_PRIMITIVES.hero, 'bq-v6-hero');
  assert.equal(V6_UI_PRIMITIVES.navigationRow, 'bq-v6-nav-row');
  assert.equal(V6_UI_PRIMITIVES.segmented, 'bq-v6-segmented');
  assert.equal(V6_UI_PRIMITIVES.inlineNotice, 'bq-v6-inline-notice');
});

test('modern foundation is loaded last and preserves accessibility contracts', async () => {
  const [html, css, shell] = await Promise.all([
    text('index.html'),
    text('src/ui/v6-modern-foundation.css'),
    text('src/ui/shell.js'),
  ]);

  const modernIndex = html.indexOf('src/ui/v6-modern-foundation.css');
  const legacyIndex = html.indexOf('src/ui/section-h-release-gates-v4.css');
  assert.ok(legacyIndex >= 0 && modernIndex > legacyIndex, 'V6 foundation must load after inherited presentation');

  for (const token of [
    '--bq-bg',
    '--bq-surface',
    '--bq-brand',
    '--bq-space-4',
    '--bq-radius-control',
    '--bq-motion-base',
    '--bq-tap-target',
  ]) {
    assert.match(css, new RegExp(`${token.replaceAll('-', '\\-')}\\s*:`));
  }

  assert.match(css, /--bq-tap-target:\s*44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /html\[data-bq-theme="dark"\]/);

  for (const route of V6_PRIMARY_NAVIGATION) {
    assert.match(shell, new RegExp(`\\['${route}'`));
  }
});
