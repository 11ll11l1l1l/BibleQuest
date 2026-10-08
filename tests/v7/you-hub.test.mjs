import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { morePage } from '../../src/features/more/index.js';

const source = readFileSync(new URL('../../src/features/more/index.js', import.meta.url), 'utf8');
const style = readFileSync(new URL('../../src/ui/more-v4.css', import.meta.url), 'utf8');

test('V7 You hub gives one primary and two secondary full-card native deep links', () => {
  assert.match(source, /href="#\/\$\{route\}"/);
  assert.match(source, /shortcut\('my-journey',you\.journey,you\.journeyHint,'grow',true\)/);
  assert.match(source, /shortcut\('account',you\.account,you\.accountHint,'user'\)/);
  assert.match(source, /shortcut\('accessibility',you\.settings,you\.settingsHint,'guide'\)/);
  assert.match(source, /data-v7-you-hub/);
  assert.match(source, /html:personalEntry \+ localizeMore/);
  assert.match(style, /\.bq-you-shortcut--featured/);
  assert.match(style, /focus-visible/);
  assert.match(style, /prefers-reduced-motion:reduce/);
});

test('legacy More tool actions are preserved under the personal entry', () => {
  for (const token of ['data-open-accessibility','data-open-content-review','data-open-community',
    'data-open-congregation','data-open-help','data-open-backup','data-open-workspace']) {
    assert.ok(source.includes(token), token + ' lost in personal-hub UI');
  }
  const page = morePage({});
  assert.equal(typeof page.mount, 'function');
  assert.ok(page.html.includes('data-v7-you-hub'));
  assert.ok(page.html.includes('href="#/my-journey"'));
  assert.ok(page.html.includes('href="#/account"'));
  assert.ok(page.html.includes('href="#/accessibility"'));
});
