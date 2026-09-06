const DEFAULT_AVATAR = Object.freeze({ face: 'smile', outfit: 'traveler', background: 'olive', companion: 'sheep' });
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function deviceLabel(userAgent = navigator.userAgent || '') {
  if (/Android/i.test(userAgent)) return 'Android phone';
  if (/iPhone/i.test(userAgent)) return 'iPhone';
  if (/iPad/i.test(userAgent)) return 'iPad';
  if (/Windows/i.test(userAgent)) return 'Windows PC';
  if (/Macintosh/i.test(userAgent)) return 'Mac';
  if (/Linux/i.test(userAgent)) return 'Linux device';
  return 'Web browser';
}

function devicePlatform(userAgent = navigator.userAgent || '') {
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone|iPad/i.test(userAgent)) return 'iOS/iPadOS';
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Macintosh/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'Web';
}

export function createAccountService({ api, session, storage, uuid = () => crypto.randomUUID(), userAgent = () => navigator.userAgent || '' }) {
  if (!api?.account || !session || !storage) throw new Error('Account service requires API, session and storage boundaries.');

  const requireUser = () => {
    const state = session.getState();
    if (!state.authenticated || !state.user?.id) throw new Error('Sign in to use this account feature.');
    return state.user;
  };

  const currentDeviceKey = () => {
    const existing = storage.read('device-id', '');
    if (typeof existing === 'string' && UUID_RE.test(existing)) return existing;
    const created = String(uuid());
    if (!UUID_RE.test(created)) throw new Error('Could not create a valid device identity.');
    storage.write('device-id', created);
    return created;
  };

  async function ensureCurrentDevice() {
    const user = requireUser();
    const agent = userAgent();
    return api.account.upsertDevice({
      user_id: user.id,
      device_key: currentDeviceKey(),
      label: deviceLabel(agent),
      platform: devicePlatform(agent),
      app_version: 'web-v3',
      trusted: true,
      last_seen_at: new Date().toISOString()
    });
  }

  async function signIn(email, password) {
    const signed = await session.signIn(email, password);
    let deviceWarning = '';
    try { await ensureCurrentDevice(); }
    catch (error) { deviceWarning = error?.message || 'This device could not be remembered.'; }
    return { session: signed, deviceWarning };
  }

  async function signUp(input) {
    const fullName = String(input?.fullName || '').trim().replace(/\s+/g, ' ').slice(0, 120);
    const preferredName = String(input?.preferredName || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    const email = String(input?.email || '').trim().toLowerCase();
    const password = String(input?.password || '');
    const confirmPassword = String(input?.confirmPassword || '');
    if (fullName.length < 2 || preferredName.length < 2) throw new Error('Enter your name and the name BibleQuest should call you.');
    if (!validEmail(email)) throw new Error('Enter a valid email address.');
    if (password.length < 8 || password.length > 128) throw new Error('Password must be 8 to 128 characters.');
    if (password !== confirmPassword) throw new Error('Passwords do not match.');

    // Account creation and recovery-code issuance are one trusted server transaction.
    // Never discard a successfully issued recovery code just because the optional
    // convenience sign-in/device-registration step fails afterwards.
    const created = await api.account.createAccount({
      email,
      password,
      confirm_password: confirmPassword,
      full_name: fullName,
      preferred_name: preferredName,
      avatar: DEFAULT_AVATAR
    });

    let signedIn = false;
    let signInWarning = '';
    let deviceWarning = '';
    try {
      await session.signIn(email, password);
      signedIn = true;
      try { await ensureCurrentDevice(); }
      catch (error) { deviceWarning = error?.message || 'This device could not be remembered.'; }
    } catch (error) {
      signInWarning = error?.message || 'Your account was created, but automatic sign-in failed. Sign in manually after saving the recovery code.';
    }
    return { ...created, signedIn, signInWarning, deviceWarning };
  }

  async function resetPassword(input) {
    const email = String(input?.email || '').trim().toLowerCase();
    const recoveryCode = String(input?.recoveryCode || '').trim();
    const password = String(input?.newPassword || '');
    const confirmPassword = String(input?.confirmPassword || '');
    if (!validEmail(email) || !recoveryCode) throw new Error('Enter your email and recovery code.');
    if (password.length < 8 || password.length > 128) throw new Error('New password must be 8 to 128 characters.');
    if (password !== confirmPassword) throw new Error('New passwords do not match.');
    return api.account.resetPassword({ email, recovery_code: recoveryCode, new_password: password, confirm_password: confirmPassword });
  }

  async function issueRecoveryCode() {
    requireUser();
    return api.account.issueRecoveryCode();
  }

  async function changePassword(currentPassword, newPassword, confirmPassword) {
    requireUser();
    return session.changePassword(currentPassword, newPassword, confirmPassword);
  }

  async function listDevices() {
    const user = requireUser();
    const current = currentDeviceKey();
    const rows = await api.account.listDevices(user.id);
    return rows.map(row => Object.freeze({ ...row, current: String(row.device_key) === current }));
  }

  async function removeDevice(id) {
    const user = requireUser();
    const devices = await listDevices();
    const target = devices.find(device => String(device.id) === String(id));
    if (!target) throw new Error('Remembered device was not found.');
    if (target.current) throw new Error('You cannot remove the device you are currently using.');
    await api.account.removeDevice(user.id, target.id);
  }

  return Object.freeze({
    signIn,
    signUp,
    resetPassword,
    issueRecoveryCode,
    changePassword,
    ensureCurrentDevice,
    listDevices,
    removeDevice,
    currentDeviceKey
  });
}
