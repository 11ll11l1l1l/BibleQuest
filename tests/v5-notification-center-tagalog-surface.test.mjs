import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { en } from '../src/content/locales/en.js';
import { tl } from '../src/content/locales/tl.js';

const source = await readFile(new URL('../src/features/notification-center/index.js', import.meta.url), 'utf8');
const keys = Object.keys(en).filter(key => key.startsWith('notificationCenter.'));
const placeholders = value => [...String(value).matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort();

test('Notification Center EN/TL dictionaries share every key and interpolation contract', () => {
  assert.ok(keys.length >= 20, `expected bounded Notification Center inventory, found ${keys.length}`);
  for (const key of keys) {
    assert.equal(typeof tl[key], 'string', `Tagalog is missing ${key}`);
    assert.ok(tl[key].trim(), `Tagalog value is empty for ${key}`);
    assert.deepEqual(placeholders(tl[key]), placeholders(en[key]), `placeholder mismatch for ${key}`);
  }
});

test('Notification Center uses the integrated localization owner and preserves notification payload data', () => {
  assert.match(source, /from '\.\.\/\.\.\/app\/localization\.js'/);
  assert.match(source, /localization\.getLocale\(\)/);
  assert.match(source, /localization\.t\(key,\{locale,values\}\)/);
  assert.match(source, /escapeHtml\(item\.title\)/, 'notification title must remain runtime/source data');
  assert.match(source, /escapeHtml\(item\.body\)/, 'notification body must remain runtime/source data');
  assert.match(source, /escapeHtml\(item\.type\)/, 'notification type must remain runtime/source data');
});

test('migrated Notification Center owner has no representative rendered English chrome literals', () => {
  for (const leak of ['Notification Center','Mark all read','Mark unread','Mark read','No notifications yet','Loading your inbox…','Open Account','Inbox unavailable']) {
    assert.equal(source.includes(leak), false, `Notification Center source still embeds migrated English UI text: ${leak}`);
  }
});

test('Tagalog Notification Center copy covers inbox status and actions', () => {
  assert.equal(tl['notificationCenter.heading'], 'Sentro ng mga Abiso');
  assert.equal(tl['notificationCenter.open'], 'Buksan');
  assert.equal(tl['notificationCenter.unread'], 'Hindi pa nababasa');
  assert.equal(tl['notificationCenter.markRead'], 'Markahan bilang nabasa');
  assert.equal(tl['notificationCenter.markAllRead'], 'Markahan lahat bilang nabasa');
  assert.equal(tl['notificationCenter.refresh'], 'I-refresh');
});
