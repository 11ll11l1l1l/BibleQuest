import { createAccountService } from '../src/app/account.js';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const values = new Map();
const storage = {
  read(key, fallback = null) { return values.has(key) ? values.get(key) : fallback; },
  write(key, value) { values.set(key, value); return value; },
  remove(key) { values.delete(key); }
};
let createCalls = 0;
let deviceCalls = 0;
const api = {
  account: {
    async createAccount() {
      createCalls++;
      return { ok: true, recovery_code: 'BQ-SAFE1-SAFE2-SAFE3-SAFE4' };
    },
    async upsertDevice() { deviceCalls++; throw new Error('Device API must not run after failed sign-in.'); }
  }
};
const session = {
  getState() { return { authenticated: false, user: null }; },
  async signIn() { throw new Error('Temporary sign-in service failure.'); },
  async changePassword() { throw new Error('not used'); }
};
const account = createAccountService({
  api,
  session,
  storage,
  uuid: () => '11111111-1111-4111-8111-111111111111',
  userAgent: () => 'Test Browser'
});
const result = await account.signUp({
  fullName: 'Recovery Test',
  preferredName: 'Recovery',
  email: 'recovery-test@example.com',
  password: 'password1',
  confirmPassword: 'password1'
});
assert(createCalls === 1, 'Signup backend must execute exactly once.');
assert(result.recovery_code === 'BQ-SAFE1-SAFE2-SAFE3-SAFE4', 'Successful signup must preserve the issued recovery code when auto-sign-in fails.');
assert(result.signedIn === false, 'Failed automatic sign-in must be reported explicitly.');
assert(/sign-in|sign in/i.test(result.signInWarning), 'Failed automatic sign-in must return a warning without converting account creation into failure.');
assert(deviceCalls === 0, 'Device registration must not run when automatic sign-in failed.');
console.log('BibleQuest v3 signup transaction-edge regression passed.');
