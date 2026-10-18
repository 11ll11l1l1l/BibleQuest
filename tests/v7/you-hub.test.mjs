import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { morePage } from '../../src/features/more/index.js';

const source = readFileSync(new URL('../../src/features/more/index.js', import.meta.url), 'utf8');
const style = readFileSync(new URL('../../src/ui/more-v4.css', import.meta.url), 'utf8');

test('V7 You hub gives a primary personal link and accessible feature shortcuts', () => {
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
  assert.ok(page.html.includes('href="#/learn"'));
  assert.ok(page.html.includes('href="#/play"'));
  assert.ok(!page.html.includes('undefined'));
});

test('phone feature groups use native disclosures and retain each original destination hook', () => {
  const page = morePage({});
  assert.equal((page.html.match(/<details class="bq-more-disclosure">/g) || []).length, 5);
  assert.equal((page.html.match(/<summary class="bq-more-group-label">/g) || []).length, 5);
  for (const group of ['ministry', 'planning', 'together', 'workspace-inbox', 'device']) {
    assert.ok(page.html.includes(`data-more-group="${group}"`), `${group} group lost`);
  }
  for (const hook of [
    'data-open-ministry-hub', 'data-open-congregation', 'data-open-team-center',
    'data-open-content-review', 'data-open-community', 'data-open-calendar',
    'data-open-mission', 'data-open-challenges', 'data-open-couples-family',
    'data-open-couples-cloud', 'data-open-journey-groups', 'data-open-workspace',
    'data-open-notification-center', 'data-open-accessibility', 'data-open-backup',
    'data-open-help', 'data-install-app'
  ]) assert.ok(page.html.includes(hook), `${hook} lost from the feature groups`);
});
