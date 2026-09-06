const EMPTY_USER = null;

function cleanUser(user) {
  if (!user?.id) return EMPTY_USER;
  return Object.freeze({
    id: String(user.id),
    email: String(user.email || ''),
    displayName: String(user.user_metadata?.preferred_name || user.user_metadata?.full_name || '').trim()
  });
}

function initialState(remoteAvailable = true) {
  return Object.freeze({
    status: 'booting',
    authenticated: false,
    remoteAvailable,
    user: EMPTY_USER,
    expiresAt: null,
    error: ''
  });
}

export function createSessionService({ auth, store, clock = () => Date.now() }) {
  if (!auth || !store) throw new Error('Session service requires auth and store.');
  let state = initialState(auth.enabled?.() !== false);
  let unsubscribeAuth = null;
  let bootPromise = null;

  const publish = patch => {
    state = Object.freeze({ ...state, ...patch });
    store.setState(current => ({ ...current, session: state }));
    return state;
  };

  const toGuest = (error = '') => publish({
    status: 'guest',
    authenticated: false,
    user: EMPTY_USER,
    expiresAt: null,
    error: error ? String(error) : ''
  });

  const toAuthenticated = (session, user = session?.user) => {
    const expiresAt = Number(session?.expires_at || 0) || null;
    if (!session || !cleanUser(user)) return toGuest();
    if (expiresAt && expiresAt * 1000 <= clock()) return toGuest('Your session expired. Please sign in again.');
    return publish({
      status: 'authenticated',
      authenticated: true,
      user: cleanUser(user),
      expiresAt,
      error: ''
    });
  };

  const handleAuthEvent = (event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      toGuest();
      return;
    }
    toAuthenticated(session, session.user);
  };

  async function boot() {
    if (bootPromise) return bootPromise;
    bootPromise = (async () => {
      publish({ status: 'booting', error: '' });
      if (auth.enabled?.() === false) return toGuest();
      try {
        unsubscribeAuth = await auth.subscribe(handleAuthEvent);
        const { session } = await auth.getSession();
        if (!session) return toGuest();
        if (Number(session.expires_at || 0) * 1000 <= clock()) {
          await auth.signOut().catch(() => {});
          return toGuest('Your session expired. Please sign in again.');
        }
        const { user } = await auth.getUser();
        if (!user) {
          await auth.signOut().catch(() => {});
          return toGuest('Your saved session is no longer valid.');
        }
        return toAuthenticated(session, user);
      } catch (error) {
        return toGuest(error?.message || 'Account service is unavailable.');
      }
    })();
    return bootPromise;
  }

  async function signIn(email, password) {
    const normalizedEmail = String(email || '').trim();
    const normalizedPassword = String(password || '');
    if (!normalizedEmail || !normalizedEmail.includes('@')) throw new Error('Enter a valid email address.');
    if (!normalizedPassword) throw new Error('Enter your password.');
    publish({ status: 'authenticating', error: '' });
    try {
      const { session } = await auth.signIn(normalizedEmail, normalizedPassword);
      if (!session) throw new Error('Sign-in did not return a valid session.');
      const { user } = await auth.getUser();
      if (!user) throw new Error('Signed-in user could not be verified.');
      return toAuthenticated(session, user);
    } catch (error) {
      toGuest(error?.message || 'Could not sign in.');
      throw error;
    }
  }

  async function changePassword(currentPassword, newPassword, confirmPassword) {
    if (!state.authenticated || !state.user?.email) throw new Error('Sign in before changing your password.');
    const current = String(currentPassword || '');
    const next = String(newPassword || '');
    const confirm = String(confirmPassword || '');
    if (!current) throw new Error('Enter your current password.');
    if (next.length < 8 || next.length > 128) throw new Error('New password must be 8 to 128 characters.');
    if (next !== confirm) throw new Error('New passwords do not match.');
    try {
      const verified = await auth.verifyPassword(state.user.email, current);
      if (!verified.session) throw new Error('Current password is incorrect.');
      const changed = await auth.updatePassword(next);
      const { session } = await auth.getSession();
      if (!session || !changed.user) throw new Error('Password changed, but the session could not be refreshed. Sign in again.');
      return toAuthenticated(session, changed.user);
    } catch (error) {
      publish({ status: 'authenticated', authenticated: true, error: error?.message || 'Could not change password.' });
      throw error;
    }
  }

  async function signOut() {
    try { await auth.signOut(); }
    finally { toGuest(); }
    return state;
  }

  function dispose() {
    unsubscribeAuth?.();
    unsubscribeAuth = null;
  }

  return Object.freeze({
    boot,
    signIn,
    changePassword,
    signOut,
    dispose,
    getState: () => state,
    isAuthenticated: () => state.authenticated === true
  });
}
