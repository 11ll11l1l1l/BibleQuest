import fs from 'node:fs';
import assert from 'node:assert/strict';

const account=fs.readFileSync(new URL('../account.js',import.meta.url),'utf8');
const enhancements=fs.readFileSync(new URL('../signup-enhancements.js',import.meta.url),'utf8');
const recovery=fs.readFileSync(new URL('../reset.js',import.meta.url),'utf8');
const tutorial=fs.readFileSync(new URL('../onboarding-tutorial.js',import.meta.url),'utf8');
const signupFn=fs.readFileSync(new URL('../supabase/functions/bq-signup/index.ts',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const uiTaglish=fs.readFileSync(new URL('../ui-taglish.js',import.meta.url),'utf8');

assert.doesNotMatch(account,/queueMicrotask\s*\(\s*async/, 'Auth-state callback must not queue async Supabase work');
assert.match(account,/onAuthStateChange\(\(event,next\)=>\{session=next;/, 'Auth-state callback should only synchronize local session state');
assert.doesNotMatch(account,/auth\.signUp\s*\(/, 'Client signup must not depend on Supabase confirmation-email signup');
assert.match(account,/functions\.invoke\('bq-signup'/, 'Account creation must use the hardened immediate-registration edge function');
assert.match(signupFn,/email_confirm:true/, 'Server signup must create an immediately usable confirmed auth record without sending confirmation email');
assert.match(account,/name="confirm_password"/, 'Registration must ask the user to confirm the password');
assert.match(account,/password!==confirm_password/, 'Registration must reject mismatched passwords before submission');
assert.match(account,/data-bq-english/, 'Welcome/account surfaces must be explicitly protected as English');
assert.match(account,/Creating account…/, 'Register submit must expose a busy state');
assert.match(account,/form\.dataset\.busy/, 'Register/login forms must guard duplicate submissions');
assert.doesNotMatch(enhancements,/auth\.signUp\s*\(/, 'Compatibility enhancements must not create a second signup path');
assert.doesNotMatch(recovery,/resetPasswordForEmail/, 'Password recovery must not depend on SMTP/email links');
assert.match(recovery,/bq-password-reset/, 'Password recovery must use the recovery-code edge function');
assert.match(recovery,/old recovery code is no longer valid/i, 'Successful recovery must tell the user that code rotation invalidated the old recovery code');
assert.match(tutorial,/Daily Journey/, 'Post-registration tutorial must explain the Daily Journey');
assert.match(tutorial,/recovery code/i, 'Post-registration tutorial must explain and require recovery-code handling');
assert.match(tutorial,/data-bq-english/, 'Tutorial must remain English even when the app UI is Taglish');
assert.match(index,/<script src="onboarding-tutorial\.js"><\/script>/, 'Production index must actually load the onboarding tutorial before a registration can dispatch its event');
assert.match(uiTaglish,/closest\('\[data-bq-english\]/, 'Global Taglish translation must skip explicitly English account/tutorial surfaces');
assert.doesNotMatch(account,/console\.(?:log|warn|error)\([^\n]*recoveryCode/i, 'Recovery codes must never be written to browser console logs');
assert.doesNotMatch(account,/track\([^\n]*recoveryCode/i, 'Recovery codes must never be sent through account analytics/tracking');
assert.doesNotMatch(tutorial,/console\.(?:log|warn|error)/, 'Onboarding tutorial must not log recovery-code-bearing state');

console.log('Immediate signup, rotating recovery-code, protected English onboarding, and recovery-code privacy static smoke passed');
