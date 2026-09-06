const NAV = [
  ['home','Home','⌂'],
  ['learn','Learn','▤'],
  ['play','Play','◆'],
  ['grow','Grow','◌'],
  ['more','More','⋯']
];

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function mountShell(root, { onNavigate, onAccountOpen }) {
  if (!root) throw new Error('App root is required.');
  if (root.querySelector('[data-bq-shell="v3"]')) throw new Error('BibleQuest shell is already mounted.');

  root.innerHTML = `
    <div class="bq-shell" data-bq-shell="v3">
      <header class="bq-topbar">
        <a class="bq-brand" href="#/home" data-brand-home aria-label="BibleQuest home">
          <span class="bq-brand-mark">BQ</span>
          <span><strong>BibleQuest</strong><small>Rebuild v3</small></span>
        </a>
        <div class="bq-top-actions">
          <span class="bq-progress-chip" data-progress-chip aria-label="BibleQuest progress"><b data-progress-xp>0 XP</b><small data-progress-streak>0 day streak</small></span>
          <button type="button" class="bq-session-chip" data-session-open aria-label="Open account">
            <span data-session-dot aria-hidden="true"></span>
            <span data-session-label>Starting…</span>
          </button>
        </div>
      </header>
      <main class="bq-main" id="bq-view" tabindex="-1"></main>
      <nav class="bq-nav" aria-label="Primary navigation">
        ${NAV.map(([id,label,icon]) => `<a href="#/${id}" data-route-link="${id}"><span aria-hidden="true">${icon}</span><small>${label}</small></a>`).join('')}
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

  return Object.freeze({
    render(route, page) {
      cleanupPage?.();
      cleanupPage = null;
      root.querySelectorAll('.bq-nav [data-route-link]').forEach(link => link.toggleAttribute('aria-current', link.dataset.routeLink === route));
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
    renderError(message) {
      cleanupPage?.();
      cleanupPage = null;
      view.innerHTML = `<section class="bq-panel"><h1>Something went wrong</h1><p>${escapeHtml(message)}</p></section>`;
    }
  });
}
