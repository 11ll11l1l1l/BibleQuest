import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const memory = new Map();
globalThis.localStorage = {
  get length(){ return memory.size; },
  key(index){ return [...memory.keys()][index] ?? null; },
  getItem(key){ return memory.has(key) ? memory.get(key) : null; },
  setItem(key,value){ memory.set(key,String(value)); },
  removeItem(key){ memory.delete(key); }
};

const { congregationPage, CONGREGATION_COPY } = await import('../src/features/congregation/index.js');
const source = await readFile(new URL('../src/features/congregation/index.js', import.meta.url), 'utf8');

const EXPECTED_KEYS = [
  'congregation.title','congregation.eyebrow','congregation.heading','congregation.description','congregation.empty',
  'congregation.active','congregation.use','congregation.cardEyebrow','congregation.role','congregation.timezone',
  'congregation.unknownRole','congregation.ministryAccess','congregation.memberAccess','congregation.loading',
  'congregation.joinHeading','congregation.joinDescription','congregation.inviteCode','congregation.join',
  'congregation.signInPrompt','congregation.openAccount','congregation.backMore','congregation.loadError',
  'congregation.switched','congregation.switchError','congregation.joining','congregation.updated','congregation.joinError'
].sort();

test('Congregation feature dictionary has exact EN/TL key parity', () => {
  assert.deepEqual(Object.keys(CONGREGATION_COPY.en).sort(), EXPECTED_KEYS);
  assert.deepEqual(Object.keys(CONGREGATION_COPY.tl).sort(), EXPECTED_KEYS);
  for (const key of EXPECTED_KEYS) {
    assert.ok(String(CONGREGATION_COPY.en[key] ?? '').trim(), `Missing English copy: ${key}`);
    assert.ok(String(CONGREGATION_COPY.tl[key] ?? '').trim(), `Missing Tagalog copy: ${key}`);
  }
});

test('guest Congregation page renders reviewed Tagalog through the existing localization owner', () => {
  memory.set('biblequest.v3.locale', JSON.stringify('tl'));
  const page = congregationPage({ membership: { isAuthenticated: () => false }, onAccount(){}, onBack(){} });
  assert.equal(page.title, 'Kongregasyon');
  assert.match(page.html, /Iyong kongregasyon/);
  assert.match(page.html, /Mag-sign in para makita o salihan ang isang kongregasyon\./);
  assert.match(page.html, /Buksan ang account/);
  assert.match(page.html, /Bumalik sa Higit pa/);
  assert.doesNotMatch(page.html, />Your congregation</);
  assert.doesNotMatch(page.html, />Open account</);
  assert.doesNotMatch(page.html, />Back to More</);
});

test('English remains the deterministic fallback surface', () => {
  memory.set('biblequest.v3.locale', JSON.stringify('en'));
  const page = congregationPage({ membership: { isAuthenticated: () => false }, onAccount(){}, onBack(){} });
  assert.equal(page.title, 'Congregation');
  assert.match(page.html, /Your congregation/);
  assert.match(page.html, /Sign in to view or join a congregation\./);
});

test('localization preserves congregation membership and permission ownership', () => {
  assert.match(source, /import \{ localization \} from '\.\.\/\.\.\/app\/localization\.js';/);
  assert.match(source, /membership\.isAuthenticated\(\)/);
  assert.match(source, /membership\.getActive\(\)/);
  assert.match(source, /membership\.setActive\(/);
  assert.match(source, /membership\.join\(/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|createClient|@supabase/i);
});

test('dynamic congregation names stay escaped runtime data and are never translated', () => {
  assert.match(source, /escapeHtml\(row\.congregation\.name\)/);
  assert.match(source, /congregation\.use',\{name:row\.congregation\.name\}/);
  assert.match(source, /congregation\.switched',\{name:active\.congregation\.name\}/);
});
