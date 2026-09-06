const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function signedInView(state) {
  const name = state.user?.displayName || state.user?.email || 'BibleQuest learner';
  return `
    <section class="bq-panel bq-account-panel">
      <p class="bq-eyebrow">ACCOUNT</p>
      <h1>${escapeHtml(name)}</h1>
      <p>You are signed in on this device. Session state is owned by the v3 session service.</p>
      <div class="bq-account-actions">
        <button type="button" class="bq-primary-button" data-account-home>Return home</button>
        <button type="button" class="bq-secondary-button" data-account-signout>Sign out on this device</button>
      </div>
      <p class="bq-form-message" data-auth-message aria-live="polite"></p>
    </section>`;
}

function guestView(state) {
  const remoteNote = state.remoteAvailable === false
    ? '<p class="bq-local-note">Cloud sign-in is intentionally disabled on localhost. The production GitHub Pages build uses the configured Supabase account service.</p>'
    : '';
  return `
    <section class="bq-panel bq-account-panel">
      <p class="bq-eyebrow">ACCOUNT</p>
      <h1>Sign in</h1>
      <p>Use your existing BibleQuest email and password, or continue as a guest.</p>
      ${remoteNote}
      <form class="bq-account-form" data-account-login novalidate>
        <label>Email<input name="email" type="email" autocomplete="email" required></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
        <button class="bq-primary-button" type="submit">Sign in</button>
      </form>
      <button type="button" class="bq-secondary-button" data-account-guest>Continue as guest</button>
      <p class="bq-form-message" data-auth-message aria-live="polite">${escapeHtml(state.error || '')}</p>
      <p class="bq-account-footnote">Signup, recovery codes and remembered-device management are separate parity milestones and are not being mixed into the session owner.</p>
    </section>`;
}

export function accountPage({ session, onHome }) {
  const state = session.getState();
  return {
    title: 'Account',
    html: state.authenticated ? signedInView(state) : guestView(state),
    mount(root) {
      const message = root.querySelector('[data-auth-message]');
      const form = root.querySelector('[data-account-login]');
      const guest = root.querySelector('[data-account-guest]');
      const signout = root.querySelector('[data-account-signout]');
      const home = root.querySelector('[data-account-home]');

      const setBusy = busy => {
        const button = form?.querySelector('button[type="submit"]');
        if (!button) return;
        button.disabled = busy;
        button.textContent = busy ? 'Signing in…' : 'Sign in';
      };

      const submit = async event => {
        event.preventDefault();
        const data = new FormData(form);
        setBusy(true);
        if (message) message.textContent = '';
        try {
          await session.signIn(data.get('email'), data.get('password'));
          onHome();
        } catch (error) {
          if (message) message.textContent = error?.message || 'Could not sign in.';
        } finally {
          setBusy(false);
        }
      };

      const leaveGuest = () => onHome();
      const leaveHome = () => onHome();
      const doSignOut = async () => {
        if (message) message.textContent = 'Signing out…';
        try {
          await session.signOut();
          onHome();
        } catch (error) {
          if (message) message.textContent = error?.message || 'Could not sign out.';
        }
      };

      form?.addEventListener('submit', submit);
      guest?.addEventListener('click', leaveGuest);
      home?.addEventListener('click', leaveHome);
      signout?.addEventListener('click', doSignOut);

      return () => {
        form?.removeEventListener('submit', submit);
        guest?.removeEventListener('click', leaveGuest);
        home?.removeEventListener('click', leaveHome);
        signout?.removeEventListener('click', doSignOut);
      };
    }
  };
}
