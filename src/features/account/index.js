import { localization } from '../../app/localization.js';
import { resolveRovingFocus } from '../../v6/ui/index.ts';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const ACCOUNT_ART = 'assets/account-feature-icons.svg';

function accountArt(id, small = false) {
  return `<span class="bq-account-art-wrap${small ? ' is-small' : ''}" aria-hidden="true"><svg class="bq-account-art" viewBox="0 0 24 24" focusable="false"><use href="${ACCOUNT_ART}#${escapeHtml(id)}"></use></svg></span>`;
}

function accountIntro(id, title, detail) {
  return `<div class="bq-account-intro">${accountArt(id)}<div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(detail)}</p></div></div>`;
}

function guestShell(state) {
  const remoteNote = state.remoteAvailable === false
    ? '<p class="bq-local-note">Cloud account actions are intentionally disabled on localhost. Production GitHub Pages uses the configured Supabase account service.</p>'
    : '';
  return `<section class="bq-panel bq-account-panel"><p class="bq-eyebrow">ACCOUNT</p><div class="bq-account-tabs" role="tablist" aria-label="Account access mode"><button id="bq-account-tab-login" type="button" role="tab" aria-controls="bq-account-mode-panel" aria-selected="false" tabindex="-1" data-account-mode="login">Sign in</button><button id="bq-account-tab-signup" type="button" role="tab" aria-controls="bq-account-mode-panel" aria-selected="false" tabindex="-1" data-account-mode="signup">Create account</button><button id="bq-account-tab-recovery" type="button" role="tab" aria-controls="bq-account-mode-panel" aria-selected="false" tabindex="-1" data-account-mode="recovery">Recover</button></div>${remoteNote}<div id="bq-account-mode-panel" role="tabpanel" data-account-body></div><button type="button" class="bq-secondary-button bq-guest-button" data-account-guest>Continue as guest</button></section>`;
}

function loginView(error = '') {
  return `${accountIntro('sign-in', 'Sign in', 'Use your existing BibleQuest email and password.')}<form class="bq-account-form" data-account-login novalidate><label>Email<input name="email" type="email" autocomplete="email" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button class="bq-primary-button" type="submit">Sign in</button></form><p class="bq-form-message" data-auth-message aria-live="polite">${escapeHtml(error)}</p>`;
}

function signupView() {
  return `${accountIntro('create-account', 'Create account', 'Create your BibleQuest account. New accounts are assigned to the configured ICAC congregation by the trusted signup service.')}<form class="bq-account-form" data-account-signup novalidate><label>Your name<input name="full_name" maxlength="120" autocomplete="name" required></label><label>What should BibleQuest call you?<input name="preferred_name" maxlength="40" required></label><label>Email<input name="email" type="email" autocomplete="email" required></label><label>Password<input name="password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><label>Confirm password<input name="confirm_password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><button class="bq-primary-button" type="submit">Create account</button></form><p class="bq-account-footnote">After registration, BibleQuest shows a private recovery code once. Save it outside the app.</p><p class="bq-form-message" data-auth-message aria-live="polite"></p>`;
}

function recoveryView() {
  return `${accountIntro('recovery', 'Recover account', 'Use your sign-in email and the recovery code you saved previously.')}<form class="bq-account-form" data-account-recovery novalidate><label>Email<input name="email" type="email" autocomplete="email" required></label><label>Recovery code<input name="recovery_code" autocomplete="off" required placeholder="BQ-XXXXX-XXXXX-XXXXX-XXXXX"></label><label>New password<input name="new_password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><label>Confirm new password<input name="confirm_password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><button class="bq-primary-button" type="submit">Reset password</button></form><p class="bq-account-footnote">A successful reset invalidates the old recovery code and gives you a new one.</p><p class="bq-form-message" data-auth-message aria-live="polite"></p>`;
}

function codeView(title, code, detail) {
  return `<div class="bq-recovery-result"><p class="bq-eyebrow">SECURITY</p>${accountIntro('recovery', title, detail)}<div class="bq-recovery-code" data-recovery-code>${escapeHtml(code)}</div><button type="button" class="bq-secondary-button" data-copy-recovery>Copy recovery code</button><label class="bq-save-check"><input type="checkbox" data-code-saved> I saved this recovery code somewhere safe.</label><button type="button" class="bq-primary-button" data-code-done disabled>Continue</button><p class="bq-form-message" data-auth-message aria-live="polite"></p></div>`;
}

function signedInShell(state, tr) {
  const name = state.user?.displayName || state.user?.email || tr('account.settings.learnerFallback');
  return `<section class="bq-panel bq-account-panel"><p class="bq-eyebrow">${escapeHtml(tr('account.settings.eyebrow'))}</p><div class="bq-account-signed-hero">${accountArt('profile')}<div><h1>${escapeHtml(name)}</h1><p>${escapeHtml(state.user?.email || '')}</p></div></div><div data-account-body></div></section>`;
}

function centerView(tr) {
  return `<div class="bq-account-section"><div class="bq-account-section-heading">${accountArt('device', true)}<h2>${escapeHtml(tr('account.settings.devicesHeading'))}</h2></div><p class="bq-section-copy">${escapeHtml(tr('account.settings.devicesPrivacy'))}</p><div class="bq-device-list" data-device-list><p>${escapeHtml(tr('account.settings.devicesLoading'))}</p></div></div><div class="bq-account-section"><div class="bq-account-section-heading">${accountArt('security', true)}<h2>${escapeHtml(tr('account.settings.securityHeading'))}</h2></div><div class="bq-account-actions"><button type="button" class="bq-secondary-button" data-issue-recovery>${escapeHtml(tr('account.settings.generateRecovery'))}</button></div><form class="bq-account-form" data-account-password novalidate><label>${escapeHtml(tr('account.settings.currentPassword'))}<input name="current_password" type="password" autocomplete="current-password" required></label><label>${escapeHtml(tr('account.settings.newPassword'))}<input name="new_password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><label>${escapeHtml(tr('account.settings.confirmPassword'))}<input name="confirm_password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><button class="bq-secondary-button" type="submit">${escapeHtml(tr('account.settings.changePassword'))}</button></form><p class="bq-form-message" data-auth-message aria-live="polite"></p></div><div class="bq-account-actions"><button type="button" class="bq-primary-button" data-account-home>${escapeHtml(tr('account.settings.returnHome'))}</button><button type="button" class="bq-secondary-button" data-account-signout>${escapeHtml(tr('account.settings.signOut'))}</button></div>`;
}

function deviceRows(devices, tr) {
  if (!devices.length) return `<p>${escapeHtml(tr('account.settings.devicesEmpty'))}</p>`;
  return devices.map(device => `<div class="bq-device-row"><div><b>${escapeHtml(device.label || tr('account.settings.deviceBrowserFallback'))}</b><small>${escapeHtml(device.platform || tr('account.settings.devicePlatformFallback'))}${device.last_seen_at ? ` · ${escapeHtml(new Date(device.last_seen_at).toLocaleString())}` : ''}</small></div>${device.current ? `<span class="bq-current-device">${escapeHtml(tr('account.settings.currentDevice'))}</span>` : `<button type="button" class="bq-secondary-button" data-device-remove="${escapeHtml(device.id)}">${escapeHtml(tr('account.settings.removeDevice'))}</button>`}</div>`).join('');
}

export function accountPage({ account, session, onHome, onTutorial }) {
  const state = session.getState();
  const locale = localization.getLocale();
  const tr = (key, values) => localization.t(key, { locale, values });
  return {
    title: state.authenticated ? tr('account.settings.pageTitle') : 'Account',
    html: state.authenticated ? signedInShell(state, tr) : guestShell(state),
    mount(root) {
      const body = root.querySelector('[data-account-body]');
      let mode = state.authenticated ? 'center' : 'login';
      let codeNext = 'login';
      let codeAfterSave = null;

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
        try { list.innerHTML = deviceRows(await account.listDevices(), tr); }
        catch (error) { list.innerHTML = `<p class="bq-form-message">${escapeHtml(error?.message || tr('account.settings.devicesLoadError'))}</p>`; }
      };
      const render = nextMode => {
        mode = nextMode;
        if (!body) return;
        if (mode === 'login') body.innerHTML = loginView();
        else if (mode === 'signup') body.innerHTML = signupView();
        else if (mode === 'recovery') body.innerHTML = recoveryView();
        else if (mode === 'center') { body.innerHTML = centerView(tr); renderDevices(); }
        root.querySelectorAll('[data-account-mode]').forEach(button => {
          const selected = button.dataset.accountMode === mode;
          button.classList.toggle('active', selected);
          button.setAttribute('aria-selected', selected ? 'true' : 'false');
          button.tabIndex = selected ? 0 : -1;
        });
        const activeTab = root.querySelector(`[data-account-mode="${CSS.escape(mode)}"]`);
        body.setAttribute('aria-labelledby', activeTab?.id || '');
      };
      const showCode = (title, code, detail, nextMode, afterSave = null) => {
        codeNext = nextMode;
        codeAfterSave = typeof afterSave === 'function' ? afterSave : null;
        if (body) body.innerHTML = codeView(title, code, detail);
      };

      const onClick = async event => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        const tab = target.closest('[data-account-mode]');
        if (tab) return render(tab.dataset.accountMode);
        if (target.closest('[data-account-guest]') || target.closest('[data-account-home]')) return onHome();
        if (target.closest('[data-account-signout]')) {
          setMessage(tr('account.settings.signingOut'));
          try { await session.signOut(); render('login'); }
          catch (error) { setMessage(error?.message || tr('account.settings.signOutError')); }
          return;
        }
        if (target.closest('[data-issue-recovery]')) {
          setMessage(tr('account.settings.creatingRecovery'));
          try {
            const result = await account.issueRecoveryCode();
            showCode('Save your new recovery code', result.recovery_code, 'This replaces every older recovery code for your account.', 'center');
          } catch (error) { setMessage(error?.message || tr('account.settings.createRecoveryError')); }
          return;
        }
        const remove = target.closest('[data-device-remove]');
        if (remove) {
          remove.disabled = true;
          try { await account.removeDevice(remove.dataset.deviceRemove); await renderDevices(); }
          catch (error) { setMessage(error?.message || tr('account.settings.removeDeviceError')); remove.disabled = false; }
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
        if (target.closest('[data-code-done]')) {
          const afterSave = codeAfterSave;
          codeAfterSave = null;
          render(codeNext);
          afterSave?.();
          return;
        }
      };

      const onKeyDown = event => {
        const tab = event.target instanceof Element ? event.target.closest('[data-account-mode]') : null;
        if (!tab || !root.querySelector('.bq-account-tabs')?.contains(tab)) return;
        const tabs = [...root.querySelectorAll('[data-account-mode]')];
        const result = resolveRovingFocus({
          key: event.key,
          currentIndex: tabs.indexOf(tab),
          itemCount: tabs.length,
          orientation: 'horizontal',
          direction: getComputedStyle(tab.parentElement).direction === 'rtl' ? 'rtl' : 'ltr'
        });
        if (!result.handled) return;
        const next = tabs[result.index];
        if (!next) return;
        event.preventDefault();
        next.focus({ preventScroll: true });
        render(next.dataset.accountMode);
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
            showCode('Save your recovery code', result.recovery_code, detail, result.signedIn ? 'center' : 'login', () => onTutorial?.());
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
          busy(form, true, tr('account.settings.changingPassword'));
          try { await account.changePassword(data.get('current_password'), data.get('new_password'), data.get('confirm_password')); form.reset(); setMessage(tr('account.settings.passwordUpdated')); }
          catch (error) { setMessage(error?.message || tr('account.settings.changePasswordError')); }
          finally { busy(form, false); }
        }
      };

      root.addEventListener('click', onClick);
      root.addEventListener('keydown', onKeyDown);
      root.addEventListener('submit', onSubmit);
      render(mode);
      return () => {
        root.removeEventListener('click', onClick);
        root.removeEventListener('keydown', onKeyDown);
        root.removeEventListener('submit', onSubmit);
      };
    }
  };
}