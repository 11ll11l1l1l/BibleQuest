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

function sessionContextError() {
  const error = new Error('The account session changed before this operation completed.');
  error.code = 'BQ_SESSION_CONTEXT_STALE';
  return error;
}

export function createSessionService({ auth, store, clock = () => Date.now() }) {
  if (!auth || !store) throw new Error('Session service requires auth and store.');
  let state = initialState(auth.enabled?.() !== false);
  let unsubscribeAuth = null;
  let bootPromise = null;
  let operationSequence = 0;
  let authEventVersion = 0;
  const beforeSignOutListeners = new Set();

  const publish = patch => {
    state = Object.freeze({ ...state, ...patch });
    store.setState(current => ({ ...current, session: state }));
    return state;
  };

  const currentUserId = () => state.authenticated && state.user?.id ? String(state.user.id) : '';
  const beginOperation = () => ++operationSequence;
  const isCurrentOperation = operation => operation === operationSequence;
  const assertOperation = operation => {
    if (!isCurrentOperation(operation)) throw sessionContextError();
  };
  const assertUserContext = (operation, userId) => {
    assertOperation(operation);
    if (!userId || currentUserId() !== String(userId)) throw sessionContextError();
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
    authEventVersion += 1;
    if (event === 'SIGNED_OUT' || !session) {
      toGuest();
      return;
    }
    toAuthenticated(session, session.user);
  };

  async function boot() {
    if (bootPromise) return bootPromise;
    const operation = beginOperation();
    bootPromise = (async () => {
      publish({ status: 'booting', error: '' });
      if (auth.enabled?.() === false) return toGuest();
      try {
        unsubscribeAuth = await auth.subscribe(handleAuthEvent);
        if (!isCurrentOperation(operation)) return state;
        const { session } = await auth.getSession();
        if (!isCurrentOperation(operation)) return state;
        if (!session) {
          if (state.authenticated) return state;
          return toGuest();
        }
        if (Number(session.expires_at || 0) * 1000 <= clock()) {
          await auth.signOut().catch(() => {});
          if (!isCurrentOperation(operation)) return state;
          return toGuest('Your session expired. Please sign in again.');
        }
        const expected = cleanUser(session.user);
        const beforeUserLookup = authEventVersion;
        const { user } = await auth.getUser();
        if (!isCurrentOperation(operation)) return state;
        const verified = cleanUser(user);
        if (!verified) {
          if (authEventVersion !== beforeUserLookup && state.authenticated) return state;
          await auth.signOut().catch(() => {});
          if (!isCurrentOperation(operation)) return state;
          return toGuest('Your saved session is no longer valid.');
        }
        if (expected && expected.id !== verified.id) {
          if (state.authenticated && currentUserId() === verified.id) return state;
          return toGuest('Your saved session changed. Please sign in again.');
        }
        if (authEventVersion !== beforeUserLookup && state.authenticated && currentUserId() !== verified.id) return state;
        return toAuthenticated(session, user);
      } catch (error) {
        if (!isCurrentOperation(operation)) return state;
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
    const operation = beginOperation();
    const startingAuthEventVersion = authEventVersion;
    publish({ status: 'authenticating', authenticated: false, user: EMPTY_USER, expiresAt: null, error: '' });
    try {
      const { session } = await auth.signIn(normalizedEmail, normalizedPassword);
      assertOperation(operation);
      if (!session) throw new Error('Sign-in did not return a valid session.');
      const expected = cleanUser(session.user);
      if (!expected) throw new Error('Sign-in did not return a valid user.');
      if (authEventVersion !== startingAuthEventVersion && state.authenticated && currentUserId() !== expected.id) throw sessionContextError();
      const beforeUserLookup = authEventVersion;
      const { user } = await auth.getUser();
      assertOperation(operation);
      const verified = cleanUser(user);
      if (!verified) throw new Error('Signed-in user could not be verified.');
      if (verified.id !== expected.id) throw sessionContextError();
      if (authEventVersion !== beforeUserLookup && state.authenticated && currentUserId() !== verified.id) throw sessionContextError();
      return toAuthenticated(session, user);
    } catch (error) {
      if (error?.code === 'BQ_SESSION_CONTEXT_STALE' || !isCurrentOperation(operation)) throw sessionContextError();
      if (!(authEventVersion !== startingAuthEventVersion && state.authenticated)) {
        toGuest(error?.message || 'Could not sign in.');
      }
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
    const userId = currentUserId();
    const email = state.user.email;
    const operation = beginOperation();
    try {
      const verified = await auth.verifyPassword(email, current);
      assertUserContext(operation, userId);
      if (!verified.session) throw new Error('Current password is incorrect.');
      const changed = await auth.updatePassword(next);
      assertUserContext(operation, userId);
      const changedUser = cleanUser(changed.user);
      if (!changedUser || changedUser.id !== userId) throw sessionContextError();
      const { session } = await auth.getSession();
      assertUserContext(operation, userId);
      const sessionUser = cleanUser(session?.user);
      if (!session || (sessionUser && sessionUser.id !== userId)) throw sessionContextError();
      return toAuthenticated(session, changed.user);
    } catch (error) {
      if (error?.code === 'BQ_SESSION_CONTEXT_STALE' || !isCurrentOperation(operation) || currentUserId() !== userId) throw sessionContextError();
      publish({ status: 'authenticated', authenticated: true, error: error?.message || 'Could not change password.' });
      throw error;
    }
  }

  function beforeSignOut(listener) {
    if (typeof listener !== 'function') throw new Error('Session sign-out cleanup must be a function.');
    beforeSignOutListeners.add(listener);
    return () => beforeSignOutListeners.delete(listener);
  }

  async function signOut() {
    const operation = beginOperation();
    const cleanups = [...beforeSignOutListeners].map(listener => Promise.resolve().then(listener));
    if (cleanups.length) await Promise.allSettled(cleanups);
    if (!isCurrentOperation(operation)) return state;
    try {
      await auth.signOut();
    } finally {
      if (isCurrentOperation(operation)) toGuest();
    }
    return state;
  }

  function dispose() {
    operationSequence += 1;
    unsubscribeAuth?.();
    unsubscribeAuth = null;
    beforeSignOutListeners.clear();
  }

  return Object.freeze({
    boot,
    signIn,
    changePassword,
    signOut,
    beforeSignOut,
    dispose,
    getState: () => state,
    isAuthenticated: () => state.authenticated === true
  });
}
