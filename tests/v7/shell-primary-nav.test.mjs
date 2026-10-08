import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { t } from '../../src/app/localization.js';

const shell = readFileSync(new URL('../../src/ui/shell.js', import.meta.url), 'utf8');
const icons = readFileSync(new URL('../../src/ui/icons.js', import.meta.url), 'utf8');

test('V7 shell exposes exactly five routed, content-first destinations', () => {
  const nav = shell.split('const NAV = [')[1]?.split('];')[0] || '';
  const destinations = [...nav.matchAll(/\['([^']+)', '([^']+)', '([^']+)'\]/g)]
    .map(([,route,key,icon]) => ({route,key,icon}));
  assert.deepEqual(destinations, [
    {route:'home',key:'nav.home',icon:'home'},
    {route:'reader',key:'nav.bible',icon:'bible'},
    {route:'library',key:'nav.library',icon:'library'},
    {route:'one-to-one',key:'nav.groups',icon:'groups'},
    {route:'more',key:'nav.you',icon:'user'}
  ]);
  for (const {icon} of destinations) assert.ok(icons.includes('  ' + icon + ': `'), icon + ' icon missing');
  assert.match(shell, /aria-current', 'page'/);
  assert.match(shell, /<small>\$\{escapeHtml\(text\(labelKey\)\)\}<\/small>/);
  assert.match(shell, /\['account', 'my-journey'/);
  for (const route of ['library-item','one-to-one-','bible-quest']) assert.ok(shell.includes(route), route+' nested route missing');
});

test('all selectable global locales label the five primary destinations', () => {
  for (const locale of ['en','tl','ceb']) {
    for (const key of ['nav.home','nav.bible','nav.library','nav.groups','nav.you']) {
      const label = t(key, {locale});
      assert.ok(label.trim() && label !== key, locale+': '+key+' untranslated');
    }
  }
  assert.equal(t('nav.library',{locale:'en'}),'Library');
  assert.equal(t('nav.groups',{locale:'en'}),'Groups');
  assert.equal(t('nav.you',{locale:'en'}),'You');
});
