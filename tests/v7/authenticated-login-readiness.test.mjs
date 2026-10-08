import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('authenticated release journey waits for successful sign-in redirect, not transient form detachment', () => {
  const browser=readFileSync(new URL('./authenticated-built-artifact-browser.mjs',import.meta.url),'utf8');
  const login=browser.split('async function login(page, actorRecord) {')[1]?.split('\nasync function signOut(page) {')[0] || '';
  assert.ok(login.includes("await page.waitForURL(url => url.hash === '#/home'"));
  assert.doesNotMatch(login,/data-account-login.*state: 'detached'/);
  assert.match(login,/openRoute\(page, 'account', '\[data-account-signout\]'\)/);
  assert.match(login,/\.bq-account-signed-hero/);
  assert.match(login,/activateCongregation\(page, actorRecord\.congregationId\)/);
  const account=readFileSync(new URL('../../src/features/account/index.js',import.meta.url),'utf8');
  assert.match(account,/const result = await account\.signIn\([\s\S]*?onHome\(\);/);
});
