const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function guestShell(state) {
  const remoteNote = state.remoteAvailable === false
    ? '<p class="bq-local-note">Cloud account actions are intentionally disabled on localhost. Production GitHub Pages uses the configured Supabase account service.</p>'
    : '';
  return `<section class="bq-panel bq-account-panel"><p class="bq-eyebrow">ACCOUNT</p><div class="bq-account-tabs" role="tablist"><button type="button" data-account-mode="login">Sign in</button><button type="button" data-account-mode="signup">Create account</button><button type="button" data-account-mode="recovery">Recover</button></div>${remoteNote}<div data-account-body></div><button type="button" class="bq-secondary-button bq-guest-button" data-account-guest>Continue as guest</button></section>`;
}

function loginView(error = '') {
  return `<h1>Sign in</h1><p>Use your existing BibleQuest email and password.</p><form class="bq-account-form" data-account-login novalidate><label>Email<input name="email" type="email" autocomplete="email" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button class="bq-primary-button" type="submit">Sign in</button></form><p class="bq-form-message" data-auth-message aria-live="polite">${escapeHtml(error)}</p>`;
}

function signupView() {
  return `<h1>Create account</h1><p>Create your BibleQuest account. New accounts are assigned to the configured ICAC congregation by the trusted signup service.</p><form class="bq-account-form" data-account-signup novalidate><label>Your name<input name="full_name" maxlength="120" autocomplete="name" required></label><label>What should BibleQuest call you?<input name="preferred_name" maxlength="40" required></label><label>Email<input name="email" type="email" autocomplete="email" required></label><label>Password<input name="password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><label>Confirm password<input name="confirm_password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><button class="bq-primary-button" type="submit">Create account</button></form><p class="bq-account-footnote">After registration, BibleQuest shows a private recovery code once. Save it outside the app.</p><p class="bq-form-message" data-auth-message aria-live="polite"></p>`;
}

function recoveryView() {
  return `<h1>Recover account</h1><p>Use your sign-in email and the recovery code you saved previously.</p><form class="bq-account-form" data-account-recovery novalidate><label>Email<input name="email" type="email" autocomplete="email" required></label><label>Recovery code<input name="recovery_code" autocomplete="off" required placeholder="BQ-XXXXX-XXXXX-XXXXX-XXXXX"></label><label>New password<input name="new_password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><label>Confirm new password<input name="confirm_password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><button class="bq-primary-button" type="submit">Reset password</button></form><p class="bq-account-footnote">A successful reset invalidates the old recovery code and gives you a new one.</p><p class="bq-form-message" data-auth-message aria-live="polite"></p>`;
}

function codeView(title, code, detail) {
  return `<div class="bq-recovery-result"><p class="bq-eyebrow">SECURITY</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(detail)}</p><div class="bq-recovery-code" data-recovery-code>${escapeHtml(code)}</div><button type="button" class="bq-secondary-button" data-copy-recovery>Copy recovery code</button><label class="bq-save-check"><input type="checkbox" data-code-saved> I saved this recovery code somewhere safe.</label><button type="button" class="bq-primary-button" data-code-done disabled>Continue</button><p class="bq-form-message" data-auth-message aria-live="polite"></p></div>`;
}

function signedInShell(state) {
  const name = state.user?.displayName || state.user?.email || 'BibleQuest learner';
  return `<section class="bq-panel bq-account-panel"><p class="bq-eyebrow">YOUR ACCOUNT</p><h1>${escapeHtml(name)}</h1><p>${escapeHtml(state.user?.email || '')}</p><div data-account-body></div></section>`;
}

function centerView() {
  return `<div class="bq-account-section"><h2>Remembered devices</h2><p>Only your own device rows are accessible through database security policies.</p><div class="bq-device-list" data-device-list><p>Loading devices…</p></div></div><div class="bq-account-section"><h2>Security & recovery</h2><div class="bq-account-actions"><button type="button" class="bq-secondary-button" data-issue-recovery>Generate new recovery code</button></div><form class="bq-account-form" data-account-password novalidate><label>Current password<input name="current_password" type="password" autocomplete="current-password" required></label><label>New password<input name="new_password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><label>Confirm new password<input name="confirm_password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><button class="bq-secondary-button" type="submit">Change password</button></form><p class="bq-form-message" data-auth-message aria-live="polite"></p></div><div class="bq-account-actions"><button type="button" class="bq-primary-button" data-account-home>Return home</button><button type="button" class="bq-secondary-button" data-account-signout>Sign out on this device</button></div>`;
}

function deviceRows(devices) {
  if (!devices.length) return '<p>No remembered devices yet.</p>';
  return devices.map(device => `<div class="bq-device-row"><div><b>${escapeHtml(device.label || 'Web browser')}</b><small>${escapeHtml(device.platform || 'Web')}${device.last_seen_at ? ` · ${escapeHtml(new Date(device.last_seen_at).toLocaleString())}` : ''}</small></div>${device.current ? '<span class="bq-current-device">THIS DEVICE</span>' : `<button type="button" class="bq-secondary-button" data-device-remove="${escapeHtml(device.id)}">Remove</button>`}</div>`).join('');
}

export function accountPage({ account, session, onHome }) {
  const state = session.getState();
  return {
    title: 'Account',
    html: state.authenticated ? signedInShell(state) : guestShell(state),
    mount(root) {
      const body = root.querySelector('[data-account-body]');
      let mode = state.authenticated ? 'center' : 'login';
      let codeNext = 'login';

      const setMessage = message => {
        const node = root.querySelector('[data-auth-message]');
        if (node) node.textContent = message || '';
      };
      const busy = (form, active, label) => {
        const button = form?.querySelector('button[type="submit"]');
        if (!button) return;
        if (!button.dataset.idle) button.dataset.idle = button.textContent;
        button.disabled = active;
        button.textContent = active ? label : button.dataset.idle;
      };
      const renderDevices = async () => {
        const list = root.querySelector('[data-device-list]');
        if (!list) return;
        try { list.innerHTML = deviceRows(await account.listDevices()); }
        catch (error) { list.innerHTML = `<p class="bq-form-message">${escapeHtml(error?.message || 'Could not load devices.')}</p>`; }
      };
      const render = nextMode => {
        mode = nextMode;
        if (!body) return;
        if (mode === 'login') body.innerHTML = loginView();
        else if (mode === 'signup') body.innerHTML = signupView();
        else if (mode === 'recovery') body.innerHTML = recoveryView();
        else if (mode === 'center') { body.innerHTML = centerView(); renderDevices(); }
        root.querySelectorAll('[data-account-mode]').forEach(button => button.classList.toggle('active', button.dataset.accountMode === mode));
      };
      const showCode = (title, code, detail, nextMode) => {
        codeNext = nextMode;
        if (body) body.innerHTML = codeView(title, code, detail);
      };

      const onClick = async event => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        const tab = target.closest('[data-account-mode]');
        if (tab) return render(tab.dataset.accountMode);
        if (target.closest('[data-account-guest]') || target.closest('[data-account-home]')) return onHome();
        if (target.closest('[data-account-signout]')) {
          setMessage('Signing out…');
          try { await session.signOut(); render('login'); }
          catch (error) { setMessage(error?.message || 'Could not sign out.'); }
          return;
        }
        if (target.closest('[data-issue-recovery]')) {
          setMessage('Creating a new code…');
          try {
            const result = await account.issueRecoveryCode();
            showCode('Save your new recovery code', result.recovery_code, 'This replaces every older recovery code for your account.', 'center');
          } catch (error) { setMessage(error?.message || 'Could not create a recovery code.'); }
          return;
        }
        const remove = target.closest('[data-device-remove]');
        if (remove) {
          remove.disabled = true;
          try { await account.removeDevice(remove.dataset.deviceRemove); await renderDevices(); }
          catch (error) { setMessage(error?.message || 'Could not remove device.'); remove.disabled = false; }
          return;
        }
        if (target.closest('[data-copy-recovery]')) {
          const code = root.querySelector('[data-recovery-code]')?.textContent || '';
          try { await navigator.clipboard.writeText(code); target.closest('[data-copy-recovery]').textContent = 'Copied'; }
          catch { setMessage('Copy the recovery code manually.'); }
          return;
        }
        if (target.matches('[data-code-saved]')) {
          const done = root.querySelector('[data-code-done]');
          if (done) done.disabled = !target.checked;
          return;
        }
        if (target.closest('[data-code-done]')) return render(codeNext);
      };

      const onSubmit = async event => {
        const form = event.target instanceof HTMLFormElement ? event.target : null;
        if (!form) return;
        event.preventDefault();
        const data = new FormData(form);
        setMessage('');
        if (form.matches('[data-account-login]')) {
          busy(form, true, 'Signing in…');
          try {
            const result = await account.signIn(data.get('email'), data.get('password'));
            if (result.deviceWarning) console.warn(result.deviceWarning);
            onHome();
          } catch (error) { setMessage(error?.message || 'Could not sign in.'); }
          finally { busy(form, false); }
        } else if (form.matches('[data-account-signup]')) {
          busy(form, true, 'Creating account…');
          try {
            const result = await account.signUp({ fullName: data.get('full_name'), preferredName: data.get('preferred_name'), email: data.get('email'), password: data.get('password'), confirmPassword: data.get('confirm_password') });
            const detail = result.signInWarning
              ? `Your account was created, but automatic sign-in did not finish: ${result.signInWarning} Save this recovery code before signing in manually.`
              : 'Your account is created and signed in. This recovery code is shown once.';
            if (result.deviceWarning) console.warn(result.deviceWarning);
            showCode('Save your recovery code', result.recovery_code, detail, result.signedIn ? 'center' : 'login');
          } catch (error) { setMessage(error?.message || 'Could not create account.'); }
          finally { busy(form, false); }
        } else if (form.matches('[data-account-recovery]')) {
          busy(form, true, 'Resetting password…');
          try {
            const result = await account.resetPassword({ email: data.get('email'), recoveryCode: data.get('recovery_code'), newPassword: data.get('new_password'), confirmPassword: data.get('confirm_password') });
            showCode('Password updated', result.recovery_code, 'Your old recovery code is no longer valid. Save this replacement before signing in.', 'login');
          } catch (error) { setMessage(error?.message || 'Recovery failed.'); }
          finally { busy(form, false); }
        } else if (form.matches('[data-account-password]')) {
          busy(form, true, 'Changing password…');
          try { await account.changePassword(data.get('current_password'), data.get('new_password'), data.get('confirm_password')); form.reset(); setMessage('Password updated.'); }
          catch (error) { setMessage(error?.message || 'Could not change password.'); }
          finally { busy(form, false); }
        }
      };

      root.addEventListener('click', onClick);
      root.addEventListener('submit', onSubmit);
      render(mode);
      return () => { root.removeEventListener('click', onClick); root.removeEventListener('submit', onSubmit); };
    }
  };
}
