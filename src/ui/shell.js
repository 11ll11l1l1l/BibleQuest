import { iconSvg } from './icons.js';
import { pressFeedback, pageTransition, cardReveal } from './motion.js';
import { localization } from '../app/localization.js';

// Routes remain canonical; old feature hub URLs stay routable via the owner map.
const NAV = [
  ['home', 'nav.home', 'home'],
  ['reader', 'nav.bible', 'bible'],
  ['library', 'nav.library', 'library'],
  ['one-to-one', 'nav.groups', 'groups'],
  ['more', 'nav.you', 'user']
];

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function mountShell(root, { onNavigate, onAccountOpen }) {
  if (!root) throw new Error('App root is required.');
  if (root.querySelector('[data-bq-shell="v3"]')) throw new Error('BibleQuest shell is already mounted.');

  const locale = localization.getLocale();
  const text = (key, values) => localization.t(key, { locale, values });
  const optionSelected = value => value === locale ? ' selected' : '';
  // Keep five stable destinations while marking the owning destination of
  // nested routes. Older V3/V4 routes remain navigable during V7 redesign.
  const primaryOwner = route => {
    if (NAV.some(([id]) => id === route)) return route;
    // A legacy detail route selects its V7 owning destination.
    if (['bible-quest', 'audio', 'offline-scripture'].includes(route)) return 'reader';
    if (['library-item', 'learn', 'study', 'deep-questions',
         'story-journey', 'wisdom-situations', 'bible-world',
         'explorer', 'adaptive-learning', 'open-review',
         'private-notes', 'cloud-notes'].includes(route)) return 'library';
    if (route === 'grow' || route.startsWith('one-to-one-')
        || ['community', 'journey-groups'].includes(route)) return 'one-to-one';
    if (['account', 'my-journey', 'transform', 'personality-profile',
         'psychometrics', 'avatar-vault', 'accessibility', 'backup',
         'help', 'content-review', 'congregation', 'leader-center',
         'ministry-hub', 'team-center', 'workspace', 'calendar'].includes(route)) return 'more';
    if (['play', 'games'].includes(route)) return 'home';
    return null;
  };

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
            <option value="en"${optionSelected('en')} aria-label="${escapeHtml(text('locale.english'))}">EN</option>
            <option value="tl"${optionSelected('tl')} aria-label="${escapeHtml(text('locale.tagalog'))}">TL</option>
            <option value="ceb"${optionSelected('ceb')} aria-label="${escapeHtml(text('locale.cebuano'))}">CEB</option>
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
      pressFeedback(link);
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
  let cleanupVisual = null;

  const releasePage = () => {
    cleanupVisual?.();
    cleanupVisual = null;
    const cleanup = cleanupPage;
    cleanupPage = null;
    cleanup?.();
  };

  return Object.freeze({
    render(route, page) {
      releasePage();
      const activePrimary = primaryOwner(route);
      root.querySelectorAll('.bq-nav [data-route-link]').forEach(link => {
        if (link.dataset.routeLink === activePrimary) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      view.innerHTML = page.html;
      document.title = page.title ? `${page.title} · BibleQuest` : 'BibleQuest';
      const cleanup = page.mount?.(view);
      if (typeof cleanup === 'function') cleanupPage = cleanup;
      view.focus({ preventScroll: true });
      const cancelPage = pageTransition(view);
      const cancelHero = route === 'home' ? cardReveal(view.querySelector('.bq-hero')) : () => {};
      cleanupVisual = () => { cancelPage(); cancelHero(); };
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
      view.innerHTML = `<section class="bq-panel bq-recovery-panel" data-recovery-id="${escapeHtml(failure?.id || '')}" data-recovery-route="${escapeHtml(failure?.route || 'feature')}"><div role="alert"><p class="bq-eyebrow">${escapeHtml(text('shell.recovery.eyebrow'))}</p><h1>${escapeHtml(failure?.title || text('shell.recovery.title'))}</h1><p>${escapeHtml(failure?.message || text('shell.recovery.message'))}</p><p class="bq-recovery-diagnostic" data-recovery-diagnostic aria-live="polite">${escapeHtml(text('shell.recovery.checking'))}</p><div class="bq-recovery-actions"><button type="button" class="bq-primary-button" data-recovery-retry>${escapeHtml(text('shell.recovery.retry'))}</button><button type="button" class="bq-secondary-button" data-recovery-home>${escapeHtml(text('shell.recovery.home'))}</button></div></div></section>`;
      document.title = `${text('shell.recovery.pageTitle')} · BibleQuest`;
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
      cleanupVisual = pageTransition(view);
    },
    updateRecoveryDiagnostic(id, diagnostic) {
      const panel=view.querySelector('[data-recovery-id]');
      if(!panel||panel.dataset.recoveryId!==id||!diagnostic?.code)return false;
      const host=panel.querySelector('[data-recovery-diagnostic]');
      if(!host)return false;
      const connection=diagnostic.serverReachable===true?text('shell.recovery.hostPassed'):diagnostic.serverReachable===false?text('shell.recovery.hostFailed'):text('shell.recovery.notTested');
      host.dataset.diagnosticReachable=String(diagnostic.serverReachable);
      host.innerHTML=`<strong data-diagnostic-code>${escapeHtml(diagnostic.code)} · ${escapeHtml(diagnostic.category)}</strong><span>${escapeHtml(diagnostic.message)}</span><small>${escapeHtml(connection)}</small>`;
      return true;
    }
  });
}
