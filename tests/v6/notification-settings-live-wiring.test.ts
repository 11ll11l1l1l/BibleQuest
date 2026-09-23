import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const bootstrap=await readFile(new URL('../../src/app/bootstrap.js',import.meta.url),'utf8');
const page=await readFile(new URL('../../src/features/notification-center/index.js',import.meta.url),'utf8');

test('bootstrap binds V6 notification preferences to the authenticated account lifecycle',()=>{
  assert.match(bootstrap,/createNotificationSettingsController/);
  assert.match(bootstrap,/createNotificationSettingsController\(authStorage\)/);
  assert.match(bootstrap,/notificationCenterPage\(\{notifications,notificationSettings,/);
  assert.match(bootstrap,/syncNotificationSettings/);
  assert.match(bootstrap,/notificationSettings\.activate\(userId\)/);
  assert.match(bootstrap,/notificationSettings\.switchAccount\(userId\)/);
  assert.match(bootstrap,/notificationSettings\.signOut\(\)/);
});

test('notification center renders and binds the V6 settings surface',()=>{
  assert.match(page,/data-v6-notification-settings/);
  assert.match(page,/data-notification-setting-master/);
  assert.match(page,/data-notification-setting-category/);
  assert.match(page,/data-notification-setting-quiet-enabled/);
  assert.match(page,/data-notification-setting-quiet-start/);
  assert.match(page,/data-notification-setting-quiet-end/);
  assert.match(page,/notificationSettings\.setMaster/);
  assert.match(page,/notificationSettings\.setCategory/);
  assert.match(page,/notificationSettings\.setQuietHours/);
});
