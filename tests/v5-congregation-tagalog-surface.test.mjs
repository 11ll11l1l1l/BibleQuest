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

const [{ en, LOCALE_KEY_INVENTORY }, { tl }, { localization }, { congregationPage }] = await Promise.all([
  import('../src/content/locales/en.js'),
  import('../src/content/locales/tl.js'),
  import('../src/app/localization.js'),
  import('../src/features/congregation/index.js')
]);
const source = await readFile(new URL('../src/features/congregation/index.js', import.meta.url), 'utf8');
const executableSource = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

const KEYS = [
  'congregation.title','congregation.eyebrow','congregation.heading','congregation.description','congregation.empty',
  'congregation.active','congregation.use','congregation.cardEyebrow','congregation.role','congregation.timezone',
  'congregation.unknownRole','congregation.ministryAccess','congregation.memberAccess','congregation.loading',
  'congregation.joinHeading','congregation.joinDescription','congregation.inviteCode','congregation.join',
  'congregation.signInPrompt','congregation.openAccount','congregation.backMore','congregation.loadError',
  'congregation.switched','congregation.switchError','congregation.joining','congregation.updated','congregation.joinError'
];

const SHARED_TERMS = new Set(['congregation.role','congregation.timezone']);

test('Congregation keys remain canonical with complete Tagalog values', () => {
  assert.deepEqual(Object.keys(en).sort(), [...LOCALE_KEY_INVENTORY]);
  assert.deepEqual(Object.keys(tl).sort(), [...LOCALE_KEY_INVENTORY]);
  for (const key of KEYS) {
    assert.ok(LOCALE_KEY_INVENTORY.includes(key), `Missing canonical Congregation key: ${key}`);
    assert.ok(String(tl[key] ?? '').trim(), `Missing Tagalog Congregation value: ${key}`);
    if (!SHARED_TERMS.has(key)) assert.notEqual(tl[key], en[key], `Tagalog Congregation key still falls back to English: ${key}`);
  }
});

test('Congregation interpolation and English fallback remain deterministic', () => {
  assert.equal(localization.t('congregation.use', { locale: 'tl', values: { name: 'ICAC' } }), 'Gamitin ang ICAC');
  assert.equal(localization.t('congregation.switched', { locale: 'tl', values: { name: 'ICAC' } }), 'Pinalitan ang aktibong kongregasyon sa ICAC.');
  assert.equal(localization.t('missing.congregation.key', { locale: 'tl' }), 'missing.congregation.key');
});

test('Congregation page uses only the integrated localization owner for bounded chrome', () => {
  assert.match(source, /import \{ localization \} from '\.\.\/\.\.\/app\/localization\.js';/);
  assert.match(source, /const locale=localization\.getLocale\(\)/);
  for (const key of ['congregation.heading','congregation.empty','congregation.active','congregation.joinHeading','congregation.signInPrompt','congregation.switched']) {
    assert.ok(executableSource.includes(`'${key}'`), `Congregation page is not wired to ${key}`);
  }
  for (const leak of ['Your congregation','Active congregation','Join with invite code','Sign in to view or join a congregation.','Back to More','Joining…']) {
    assert.equal(executableSource.includes(leak), false, `Congregation executable source still hard-codes localized English UI: ${leak}`);
  }
});

test('guest Congregation HTML renders reviewed Tagalog without changing auth behavior', () => {
  store.set('biblequest.v3.locale', JSON.stringify('tl'));
  const page = congregationPage({
    membership: { isAuthenticated: () => false },
    onAccount() {},
    onBack() {}
  });
  assert.equal(page.title, 'Kongregasyon');
  assert.match(page.html, /Iyong kongregasyon/);
  assert.match(page.html, /Mag-sign in para makita o salihan ang isang kongregasyon\./);
  assert.match(page.html, /Buksan ang account/);
  assert.match(page.html, /Bumalik sa Higit pa/);
  assert.match(page.html, /data-congregation-auth/);
  assert.equal(page.html.includes('data-congregation-list'), false);
});

test('localization does not change congregation permission, membership, or persistence ownership', () => {
  assert.match(executableSource, /membership\.isAuthenticated\(\)/);
  assert.match(executableSource, /membership\.getActive\(\)/);
  assert.match(executableSource, /membership\.setActive\(/);
  assert.match(executableSource, /membership\.join\(/);
  assert.equal(executableSource.includes('localStorage'), false);
  assert.equal(executableSource.includes('sessionStorage'), false);
  assert.equal(executableSource.includes('supabase'), false);
  assert.equal(executableSource.includes('createClient'), false);
});
