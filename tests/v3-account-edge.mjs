import { createAccountService } from '../src/app/account.js';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const makeStorage = () => {
  const values = new Map();
  return {
    read(key, fallback = null) { return values.has(key) ? values.get(key) : fallback; },
    write(key, value) { values.set(key, value); return value; },
    remove(key) { values.delete(key); }
  };
};
const DEVICE_ID = '11111111-1111-4111-8111-111111111111';

// A successful trusted signup must never lose its one-time recovery code merely
// because the optional convenience sign-in fails afterwards.
{
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
  const account = createAccountService({ api, session, storage: makeStorage(), uuid: () => DEVICE_ID, userAgent: () => 'Test Browser' });
  const result = await account.signUp({ fullName: 'Recovery Test', preferredName: 'Recovery', email: 'recovery-test@example.com', password: 'password1', confirmPassword: 'password1' });
  assert(createCalls === 1, 'Signup backend must execute exactly once.');
  assert(result.recovery_code === 'BQ-SAFE1-SAFE2-SAFE3-SAFE4', 'Successful signup must preserve the issued recovery code when auto-sign-in fails.');
  assert(result.signedIn === false, 'Failed automatic sign-in must be reported explicitly.');
  assert(/sign-in|sign in/i.test(result.signInWarning), 'Failed automatic sign-in must return a warning without converting account creation into failure.');
  assert(deviceCalls === 0, 'Device registration must not run when automatic sign-in failed.');
}

// Duplicate-account errors must remain account-creation failures and must not
// continue into sign-in or device registration.
{
  let signInCalls = 0;
  let deviceCalls = 0;
  const api = {
    account: {
      async createAccount() { throw new Error('An account already exists for this email. Sign in instead.'); },
      async upsertDevice() { deviceCalls++; }
    }
  };
  const session = {
    getState() { return { authenticated: false, user: null }; },
    async signIn() { signInCalls++; },
    async changePassword() { throw new Error('not used'); }
  };
  const account = createAccountService({ api, session, storage: makeStorage(), uuid: () => DEVICE_ID, userAgent: () => 'Test Browser' });
  let duplicateError = '';
  try { await account.signUp({ fullName: 'Duplicate Test', preferredName: 'Duplicate', email: 'exists@example.com', password: 'password1', confirmPassword: 'password1' }); }
  catch (error) { duplicateError = error?.message || String(error); }
  assert(/already exists/i.test(duplicateError), 'Duplicate-account failure must be surfaced to the user.');
  assert(signInCalls === 0 && deviceCalls === 0, 'Duplicate signup must stop before sign-in or device mutation.');
}

// Password recovery must return the replacement code and leave a clean sign-in
// handoff using the newly established password.
{
  let activePassword = 'old-password';
  let authenticated = false;
  let signedPassword = '';
  let deviceCalls = 0;
  const user = { id: 'user-1', email: 'learner@example.com', displayName: 'Learner' };
  const api = {
    account: {
      async resetPassword(payload) {
        if (payload.recovery_code !== 'BQ-OLD11-OLD22-OLD33-OLD44') throw new Error('Email or recovery code is incorrect.');
        activePassword = payload.new_password;
        return { ok: true, recovery_code: 'BQ-NEW11-NEW22-NEW33-NEW44' };
      },
      async upsertDevice(row) { deviceCalls++; return { id: 'device-1', ...row }; }
    }
  };
  const session = {
    getState() { return authenticated ? { authenticated: true, user } : { authenticated: false, user: null }; },
    async signIn(email, password) {
      if (email !== user.email || password !== activePassword) throw new Error('Invalid login credentials');
      authenticated = true;
      signedPassword = password;
      return { status: 'authenticated', authenticated: true, user };
    },
    async changePassword() { throw new Error('not used'); }
  };
  const account = createAccountService({ api, session, storage: makeStorage(), uuid: () => DEVICE_ID, userAgent: () => 'Android Test' });
  const reset = await account.resetPassword({ email: user.email, recoveryCode: 'BQ-OLD11-OLD22-OLD33-OLD44', newPassword: 'new-password', confirmPassword: 'new-password' });
  assert(reset.recovery_code === 'BQ-NEW11-NEW22-NEW33-NEW44', 'Recovery must return the replacement recovery code.');
  await account.signIn(user.email, 'new-password');
  assert(authenticated && signedPassword === 'new-password', 'Recovered account must hand off to sign-in with the new password.');
  assert(deviceCalls === 1, 'Successful post-recovery sign-in must register the current device once.');
}

console.log('BibleQuest v3 account transaction-edge regression passed.');
