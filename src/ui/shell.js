const NAV = [
  {
    id: 'home',
    label: 'Home',
    icon: '<path d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5h-5.7v-6.4H9.2V21H3.5a.5.5 0 0 1-.5-.5z"/>'
  },
  {
    id: 'learn',
    label: 'Learn',
    icon: '<path d="M5 4.5h5.6c1.1 0 1.9.3 2.4.9.5-.6 1.3-.9 2.4-.9H21v14.3h-5.6c-1 0-1.7.2-2.4.8-.7-.6-1.4-.8-2.4-.8H5zm8 2.2v10.7m-6-10h3.4m-3.4 3h3.4m5.2-3H19m-3.4 3H19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'play',
    label: 'Play',
    icon: '<path d="M8.1 7.2h7.8c2.4 0 4 1.7 4.6 4.4l.7 3.4c.4 2.1-.5 3.5-2 3.5-1 0-1.7-.5-2.8-2.2l-.5-.8H8.1l-.5.8c-1.1 1.7-1.8 2.2-2.8 2.2-1.5 0-2.4-1.4-2-3.5l.7-3.4c.6-2.7 2.2-4.4 4.6-4.4Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7.2 10v4m-2-2h4m6.8-.8h.1m2.2 2.2h.1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'
  },
  {
    id: 'grow',
    label: 'Grow',
    icon: '<path d="M12 21V10.5m0 1.2c-1.4-3.7-4-5.8-7.8-5.9.1 3.9 2.5 6.2 7.8 6.5m0-4c1.4-3.2 3.8-5 7.5-5.1-.1 3.6-2.4 5.7-7.5 6.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    id: 'more',
    label: 'More',
    icon: '<circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>'
  }
];

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[char]));

const navIcon = icon => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icon}</svg>`;

export function mountShell(root, { onNavigate, onAccountOpen }) {
  if (!root) throw new Error('App root is required.');
  if (root.querySelector('[data-bq-shell]')) throw new Error('BibleQuest shell is already mounted.');

  root.innerHTML = `
    <div class="bq-shell" data-bq-shell="v4">
      <header class="bq-topbar">
        <a class="bq-brand" href="#/home" data-brand-home aria-label="BibleQuest home">
          <span class="bq-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" focusable="false">
              <path d="M8.2 6.7h6.1c1.1 0 1.9.3 2.5 1 .6-.7 1.4-1 2.5-1h4.5v18h-4.5c-1.1 0-1.9.2-2.5.8-.6-.6-1.4-.8-2.5-.8H8.2z" fill="none" stroke="currentColor" stroke-width="2"/>
              <path d="M16.8 8.6v15.7M11 11h3m-3 3.5h3m5-3.5h2.3m-2.3 3.5h2.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
            </svg>
          </span>
          <span class="bq-brand-copy"><strong>BibleQuest</strong><small>Read · Learn · Live</small></span>
        </a>
        <div class="bq-top-actions">
          <span class="bq-progress-chip" data-progress-chip aria-label="BibleQuest progress">
            <span class="bq-progress-item bq-progress-streak"><span aria-hidden="true">🔥</span><b data-progress-streak>0 day streak</b></span>
            <span class="bq-progress-item bq-progress-xp"><b data-progress-xp>0 XP</b></span>
          </span>
          <button type="button" class="bq-session-chip" data-session-open aria-label="Open account">
            <span data-session-dot aria-hidden="true"></span>
            <span data-session-label>Starting…</span>
          </button>
        </div>
      </header>
      <main class="bq-main" id="bq-view" tabindex="-1"></main>
      <nav class="bq-nav" aria-label="Primary navigation">
        <div class="bq-nav-inner">
          ${NAV.map(({ id, label, icon }) => `
            <a href="#/${id}" data-route-link="${id}">
              <span class="bq-nav-icon">${navIcon(icon)}</span>
              <small>${label}</small>
            </a>`).join('')}
        </div>
      </nav>
    </div>`;

  root.querySelectorAll('[data-route-link]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      onNavigate(link.dataset.routeLink);
    });
  });
  root.querySelector('[data-brand-home]')?.addEventListener('click', event => {
    event.preventDefault();
    onNavigate('home');
  });
  root.querySelector('[data-session-open]')?.addEventListener('click', onAccountOpen);

  const view = root.querySelector('#bq-view');
  const sessionLabel = root.querySelector('[data-session-label]');
  const sessionChip = root.querySelector('[data-session-open]');
  const progressXp = root.querySelector('[data-progress-xp]');
  const progressStreak = root.querySelector('[data-progress-streak]');
  let cleanupPage = null;

  const releasePage = () => {
    const cleanup = cleanupPage;
    cleanupPage = null;
    cleanup?.();
  };

  return Object.freeze({
    render(route, page) {
      releasePage();
      root.querySelectorAll('.bq-nav [data-route-link]').forEach(link => {
        if (link.dataset.routeLink === route) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      view.innerHTML = page.html;
      document.title = page.title ? `${page.title} · BibleQuest` : 'BibleQuest';
      const cleanup = page.mount?.(view);
      if (typeof cleanup === 'function') cleanupPage = cleanup;
      view.focus({ preventScroll: true });
    },
    updateSession(session) {
      if (!sessionLabel || !sessionChip) return;
      if (session?.status === 'authenticated') {
        sessionLabel.textContent = session.user?.displayName || session.user?.email || 'Account';
        sessionChip.dataset.sessionState = 'authenticated';
        return;
      }
      if (session?.status === 'authenticating' || session?.status === 'booting') {
        sessionLabel.textContent = session.status === 'authenticating' ? 'Signing in…' : 'Starting…';
        sessionChip.dataset.sessionState = 'busy';
        return;
      }
      sessionLabel.textContent = 'Guest';
      sessionChip.dataset.sessionState = 'guest';
    },
    updateProgress(progress) {
      if (!progressXp || !progressStreak) return;
      const xp = Number(progress?.xp || 0);
      const streak = Number(progress?.streak || 0);
      progressXp.textContent = `${xp} XP`;
      progressStreak.textContent = `${streak} day${streak === 1 ? '' : 's'} streak`;
    },
    renderRecovery(failure, { onRetry, onHome }) {
      try { releasePage(); } catch {}
      view.innerHTML = `<section class="bq-panel bq-recovery-panel" data-recovery-id="${escapeHtml(failure?.id || '')}" data-recovery-route="${escapeHtml(failure?.route || 'feature')}"><div role="alert"><p class="bq-eyebrow">RECOVERY</p><h1>${escapeHtml(failure?.title || 'Feature could not open')}</h1><p>${escapeHtml(failure?.message || 'The BibleQuest shell is still available.')}</p><p class="bq-recovery-diagnostic" data-recovery-diagnostic aria-live="polite">Checking whether this is an app or connection problem…</p><div class="bq-recovery-actions"><button type="button" class="bq-primary-button" data-recovery-retry>Try again</button><button type="button" class="bq-secondary-button" data-recovery-home>Go Home</button></div></div></section>`;
      document.title = 'Recovery · BibleQuest';
      const retryButton = view.querySelector('[data-recovery-retry]');
      const homeButton = view.querySelector('[data-recovery-home]');
      const retry = () => { void onRetry?.(); };
      const home = () => { void onHome?.(); };
      retryButton?.addEventListener('click', retry);
      homeButton?.addEventListener('click', home);
      cleanupPage = () => {
        retryButton?.removeEventListener('click', retry);
        homeButton?.removeEventListener('click', home);
      };
      view.focus({ preventScroll: true });
    },
    updateRecoveryDiagnostic(id, diagnostic) {
      const panel = view.querySelector('[data-recovery-id]');
      if (!panel || panel.dataset.recoveryId !== id || !diagnostic?.code) return false;
      const host = panel.querySelector('[data-recovery-diagnostic]');
      if (!host) return false;
      const connection = diagnostic.serverReachable === true
        ? 'BibleQuest host check passed.'
        : diagnostic.serverReachable === false
          ? 'BibleQuest host check failed.'
          : 'Connection was not tested.';
      host.dataset.diagnosticReachable = String(diagnostic.serverReachable);
      host.innerHTML = `<strong data-diagnostic-code>${escapeHtml(diagnostic.code)} · ${escapeHtml(diagnostic.category)}</strong><span>${escapeHtml(diagnostic.message)}</span><small>${escapeHtml(connection)}</small>`;
      return true;
    }
  });
}
