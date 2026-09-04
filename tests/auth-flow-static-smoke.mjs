import fs from 'node:fs';
import assert from 'node:assert/strict';

const account=fs.readFileSync(new URL('../account.js',import.meta.url),'utf8');
const enhancements=fs.readFileSync(new URL('../signup-enhancements.js',import.meta.url),'utf8');

assert.doesNotMatch(account,/queueMicrotask\s*\(\s*async/, 'Auth-state callback must not queue async Supabase work in a microtask');
assert.match(account,/onAuthStateChange\(\(event,next\)=>\{session=next;/, 'Auth-state callback should only synchronize local session state');
assert.doesNotMatch(enhancements,/auth\.signUp\s*\(/, 'There must be exactly one account-creation auth path');
assert.match(account,/emailRedirectTo=CFG\.redirectUrl/, 'Signup confirmation must explicitly return to the current BibleQuest app root');
assert.match(account,/church_group/, 'Signup metadata and profile persistence must keep the church/fellowship field');
assert.match(account,/Creating account…/, 'Register submit must expose a busy state and block duplicate taps');
assert.match(account,/form\.dataset\.submitting==='1'/, 'Register/login forms must guard duplicate submissions');

console.log('Auth flow static smoke passed');
