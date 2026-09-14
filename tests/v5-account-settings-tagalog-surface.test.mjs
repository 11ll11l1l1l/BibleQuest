import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { en } from '../src/content/locales/en.js';
import { tl } from '../src/content/locales/tl.js';

const source = await readFile(new URL('../src/features/account/index.js', import.meta.url), 'utf8');
const keys = Object.keys(en).filter(key => key.startsWith('account.settings.'));
const placeholders = value => [...String(value).matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort();

test('Account settings EN/TL dictionaries share every key and interpolation contract', () => {
  assert.ok(keys.length >= 27, `expected bounded Account settings inventory, found ${keys.length}`);
  for (const key of keys) {
    assert.equal(typeof tl[key], 'string', `Tagalog is missing ${key}`);
    assert.ok(tl[key].trim(), `Tagalog value is empty for ${key}`);
    assert.deepEqual(placeholders(tl[key]), placeholders(en[key]), `placeholder mismatch for ${key}`);
  }
});

test('signed-in Account center uses the integrated localization owner and preserves runtime identity/device data', () => {
  assert.match(source, /from '\.\.\/\.\.\/app\/localization\.js'/);
  assert.match(source, /localization\.getLocale\(\)/);
  assert.match(source, /localization\.t\(key, \{ locale, values \}\)/);
  assert.match(source, /escapeHtml\(state\.user\?\.email \|\| ''\)/, 'email must remain escaped runtime data');
  assert.match(source, /escapeHtml\(device\.label \|\| tr\('account\.settings\.deviceBrowserFallback'\)\)/, 'device label must remain escaped runtime data');
  assert.match(source, /escapeHtml\(device\.platform \|\| tr\('account\.settings\.devicePlatformFallback'\)\)/, 'device platform must remain escaped runtime data');
});

test('migrated signed-in Account center has no representative embedded English chrome literals', () => {
  for (const leak of ['Remembered devices','Security & recovery','Generate new recovery code','Current password','Change password','Return home','Sign out on this device','THIS DEVICE','Loading devices…','No remembered devices yet.']) {
    assert.equal(source.includes(leak), false, `Account settings source still embeds migrated English UI text: ${leak}`);
  }
});

test('Tagalog Account settings copy covers device, security and navigation actions', () => {
  assert.equal(tl['account.settings.devicesHeading'], 'Mga naaalalang device');
  assert.equal(tl['account.settings.securityHeading'], 'Seguridad at recovery');
  assert.equal(tl['account.settings.generateRecovery'], 'Gumawa ng bagong recovery code');
  assert.equal(tl['account.settings.changePassword'], 'Palitan ang password');
  assert.equal(tl['account.settings.signOut'], 'Mag-sign out sa device na ito');
});