import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const store = new Map();
globalThis.localStorage = {
  get length() { return store.size; },
  key(index) { return [...store.keys()][index] ?? null; },
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); }
};

const [{ en, LOCALE_KEY_INVENTORY }, { tl }, { localization }] = await Promise.all([
  import('../src/content/locales/en.js'),
  import('../src/content/locales/tl.js'),
  import('../src/app/localization.js')
]);
const source = await readFile(new URL('../src/features/transform/index.js', import.meta.url), 'utf8');
const basicStart = source.indexOf('const renderBasic=state=>{');
const basicEnd = source.indexOf('const personalityResultHtml=');
assert.ok(basicStart >= 0 && basicEnd > basicStart, 'Could not isolate the Basic Transformation renderer.');
const basicRendererSource = source.slice(basicStart, basicEnd);

const TRANSFORM_BASIC_KEYS = [
  'transform.opening','transform.mode.label','transform.mode.prompt','transform.mode.description',
  'transform.mode.basic','transform.mode.full','transform.basic.eyebrow','transform.basic.heading',
  'transform.basic.disclaimerLead','transform.basic.disclaimer','transform.basic.scale',
  'transform.basic.ratingLabel','transform.basic.answered','transform.basic.backGrow','transform.basic.reset',
  'transform.basic.viewReflection','transform.basic.reflectionSaved','transform.basic.privateReflection',
  'transform.basic.yourReflection','transform.basic.resultDisclaimer','transform.basic.nextFocus',
  'transform.basic.recovered','transform.basic.savedXp','transform.basic.confirmReset','transform.basic.cleared',
  'transform.unavailable','transform.unavailableMessage'
];

const MUST_DIFFER = [
  'transform.opening','transform.mode.label','transform.mode.prompt','transform.mode.description',
  'transform.basic.heading','transform.basic.disclaimerLead','transform.basic.disclaimer','transform.basic.scale',
  'transform.basic.ratingLabel','transform.basic.answered','transform.basic.backGrow','transform.basic.reset',
  'transform.basic.viewReflection','transform.basic.reflectionSaved','transform.basic.privateReflection',
  'transform.basic.yourReflection','transform.basic.resultDisclaimer','transform.basic.nextFocus',
  'transform.basic.recovered','transform.basic.savedXp','transform.basic.confirmReset','transform.basic.cleared',
  'transform.unavailable','transform.unavailableMessage'
];

test('Transformation basic keys remain canonical with complete Tagalog values', () => {
  assert.deepEqual(Object.keys(en).sort(), [...LOCALE_KEY_INVENTORY]);
  assert.deepEqual(Object.keys(tl).sort(), [...LOCALE_KEY_INVENTORY]);
  for (const key of TRANSFORM_BASIC_KEYS) {
    assert.ok(LOCALE_KEY_INVENTORY.includes(key), `Missing canonical Transformation key: ${key}`);
    assert.ok(String(tl[key] ?? '').trim(), `Missing Tagalog Transformation value: ${key}`);
  }
});

test('reviewed Transformation chrome does not fall back to English in Tagalog', () => {
  for (const key of MUST_DIFFER) assert.notEqual(tl[key], en[key], `Tagalog Transformation key still leaks English: ${key}`);
  assert.equal(localization.t('transform.basic.heading', { locale: 'tl' }), 'Pagninilay sa pananampalataya at pagsasabuhay');
  assert.equal(localization.t('transform.basic.answered', { locale: 'tl', values: { answered: 3, total: 12 } }), '3/12 nasagutan');
  assert.equal(localization.t('transform.basic.ratingLabel', { locale: 'tl', values: { dimension: 'Panalangin' } }), 'Rating para sa Panalangin');
});

test('Transformation page uses the one integrated localization owner without touching assessment definitions', () => {
  assert.match(source, /import \{ localization \} from '\.\.\/\.\.\/app\/localization\.js';/);
  assert.match(source, /const locale=localization\.getLocale\(\)/);
  for (const key of ['transform.mode.prompt','transform.basic.heading','transform.basic.answered','transform.basic.confirmReset','transform.unavailable']) {
    assert.ok(source.includes(`'${key}'`), `Transformation page is not wired to ${key}`);
  }
  for (const hardCoded of ['Faith & practice reflection','Back to Grow','View reflection']) {
    assert.ok(!basicRendererSource.includes(hardCoded), `Basic Transformation still hard-codes localized UI text: ${hardCoded}`);
  }
  assert.ok(!source.includes("window.confirm('Clear all 12 Transformation answers and the current result?')"), 'Basic reset confirmation must use localization rather than a hard-coded English dialog.');
  assert.match(source, /transform\.definitions\.spiritual/);
  assert.match(source, /escapeHtml\(item\.text\)/);
  assert.match(source, /escapeHtml\(row\.guide\)/);
});

test('Transformation localization inventory never introduces Scripture translation keys', () => {
  for (const key of TRANSFORM_BASIC_KEYS) assert.equal(/scripture|verse|chapter|book\./i.test(key), false);
});