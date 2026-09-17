import { iconSvg } from './icons.js';
import { localization } from '../app/localization.js';

const NAV = [
  ['home','nav.home','home'],
  ['learn','nav.learn','learn'],
  ['play','nav.play','play'],
  ['grow','nav.grow','grow'],
  ['more','nav.more','more']
];

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function mountShell(root, { onNavigate, onAccountOpen }) {
  if (!root) throw new Error('App root is required.');
  if (root.querySelector('[data-bq-shell="v3"]')) throw new Error('BibleQuest shell is already mounted.');

  const locale = localization.getLocale();
  const text = (key, values) => localization.t(key, { locale, values });
  const optionSelected = value => value === locale ? ' selected' : '';

  root.innerHTML = `
    <div class="bq-shell" data-bq-shell="v3" data-ui-version="4" data-locale="${escapeHtml(locale)}">
      <header class="bq-topbar">
        <a class="bq-brand" href="#/home" data-brand-home aria-label="${escapeHtml(text('shell.brandHomeLabel'))}">
          <span class="bq-brand-mark" aria-hidden="true">${iconSvg('bible', { size: 24 })}</span>
          <span><strong>${escapeHtml(text('app.name'))}</strong><small>${escapeHtml(text('shell.brandTagline'))}</small></span>
        </a>
        <div class="bq-top-actions">
          <span class="bq-progress-chip" data-progress-chip aria-label="${escapeHtml(text('shell.progressLabel'))}"><b data-progress-xp>0 XP</b><small data-progress-streak>${escapeHtml(text('shell.streak.other', { count: 0 }))}</small></span>
          <select class="bq-session-chip bq-locale-select" data-locale-select aria-label="${escapeHtml(text('locale.label'))}">
            <option value="en"${optionSelected('en')}>${escapeHtml(text('locale.english'))}</option>
            <option value="tl"${optionSelected('tl')}>${escapeHtml(text('locale.tagalog'))}</option>
            <option value="ceb"${optionSelected('ceb')}>${escapeHtml(text('locale.cebuano'))}</option>
          </select>
          <button type="button" class="bq-session-chip" data-session-open aria-label="${escapeHtml(text('shell.accountOpenLabel'))}">
            <span data-session-dot aria-hidden="true"></span>
            <span data-session-label>${escapeHtml(text('shell.starting'))}</span>
          </button>
        </div>
      </header>
      <main class="bq-main" id="bq-view" tabindex="-1"></main>
      <nav class="bq-nav" aria-label="${escapeHtml(text('shell.primaryNavigationLabel'))}">
        ${NAV.map(([id,labelKey,icon]) => `<a href="#/${id}" data-route-link="${id}"><span class="bq-nav-icon" aria-hidden="true">${iconSvg(icon)}</span><small>${escapeHtml(text(labelKey))}</small></a>`).join('')}
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

  const localeSelect = root.querySelector('[data-locale-select]');
  localeSelect?.addEventListener('change', event => {
    const nextLocale = localization.setLocale(event.currentTarget.value);
    if (nextLocale !== locale) window.location.reload();
  });

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
        sessionLabel.textContent = session.user?.displayName || session.user?.email || text('shell.account');
        sessionChip.dataset.sessionState = 'authenticated';
        return;
      }
      if (session?.status === 'authenticating' || session?.status === 'booting') {
        sessionLabel.textContent = session.status === 'authenticating' ? text('shell.signingIn') : text('shell.starting');
        sessionChip.dataset.sessionState = 'busy';
        return;
      }
      sessionLabel.textContent = text('shell.guest');
      sessionChip.dataset.sessionState = 'guest';
    },
    updateProgress(progress) {
      if (!progressXp || !progressStreak) return;
      const xp = Number(progress?.xp || 0);
      const streak = Number(progress?.streak || 0);
      progressXp.textContent = `${xp} XP`;
      progressStreak.textContent = text(streak === 1 ? 'shell.streak.one' : 'shell.streak.other', { count: streak });
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
      const panel=view.querySelector('[data-recovery-id]');
      if(!panel||panel.dataset.recoveryId!==id||!diagnostic?.code)return false;
      const host=panel.querySelector('[data-recovery-diagnostic]');
      if(!host)return false;
      const connection=diagnostic.serverReachable===true?'BibleQuest host check passed.':diagnostic.serverReachable===false?'BibleQuest host check failed.':'Connection was not tested.';
      host.dataset.diagnosticReachable=String(diagnostic.serverReachable);
      host.innerHTML=`<strong data-diagnostic-code>${escapeHtml(diagnostic.code)} · ${escapeHtml(diagnostic.category)}</strong><span>${escapeHtml(diagnostic.message)}</span><small>${escapeHtml(connection)}</small>`;
      return true;
    }
  });
}
