import { requestNavigation } from '../../app/router.js';
import { localization } from '../../app/localization.js';
import { iconSvg } from '../../ui/icons.js';
import { homeAssignmentItems, homeAssignmentPanelHtml } from './assignment-summary.js';
import { homeThisWeekIntroHtml } from './today-this-week.js';

export { homeAssignmentItems, homeAssignmentPanelHtml } from './assignment-summary.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const HOME_SHORTCUTS = Object.freeze([
  Object.freeze({ id: 'daily', icon: 'home', label: 'Daily Journey', labelKey: 'home.shortcut.daily', action: 'onMission' }),
  Object.freeze({ id: 'reader', icon: 'bible', label: 'Reader', labelKey: 'home.shortcut.reader', action: 'onReader' }),
  Object.freeze({ id: 'assignments', icon: 'guide', label: 'Assignments', labelKey: 'home.shortcut.assignments', action: 'onAssignments' }),
  Object.freeze({ id: 'calendar', icon: 'calendar', label: 'Calendar', labelKey: 'home.shortcut.calendar', action: 'onCalendar' }),
  Object.freeze({ id: 'grow', icon: 'grow', label: 'Progress', labelKey: 'home.shortcut.progress', action: 'onGrow' })
]);

function shortcutRailHtml(locale) {
  const tx = (key, values) => localization.t(key, { locale, values });
  return `<nav class="bq-home-rail" data-home-rail aria-label="${escapeHtml(tx('home.shortcut.ariaLabel'))}"><ul class="bq-home-rail-track" data-home-rail-track>${HOME_SHORTCUTS.map(item => `<li><button type="button" class="bq-home-rail-item" data-home-rail-item="${item.id}" data-home-rail-action="${item.action}"><span class="bq-home-rail-icon" aria-hidden="true">${iconSvg(item.icon, { size: 22 })}</span><span class="bq-home-rail-label">${escapeHtml(tx(item.labelKey))}</span></button></li>`).join('')}</ul></nav>`;
}

export function homePage({ progress, dailyMission, assignments, presence, onAssignments, onMission, onRecordings, onMedia, onTutorial, onReader, onCalendar, onGrow }) {
  const locale = localization.getLocale();
  const tx = (key, values) => localization.t(key, { locale, values });
  const state = progress?.getState?.() || { xp: 0, streak: 0, totalActivities: 0, badges: [] };
  const daily = dailyMission?.today?.();
  const reference = daily ? `${daily.passage.book} ${daily.passage.chapter}:${daily.passage.from}–${daily.passage.to}` : '';
  return {
    title: tx('nav.home'),
    html: `
      <section class="bq-hero">
        <div>
          <p class="bq-eyebrow">${escapeHtml(tx('home.hero.eyebrow'))}</p>
          <h1>BibleQuest</h1>
          <p>${escapeHtml(tx('home.hero.description'))}</p>
        </div>
        <img src="assets/bq-pinoy-japan-hero.svg" alt="" aria-hidden="true">
      </section>
      ${daily ? `<section class="bq-panel bq-home-daily" data-home-daily><p class="bq-eyebrow">${escapeHtml(tx('home.today.eyebrow', { date: daily.dateKey }))}</p><h2>${escapeHtml(tx('home.today.heading'))}</h2><p><b>${escapeHtml(daily.passage.title)}</b> · ${escapeHtml(reference)}</p><p>${escapeHtml(tx('home.today.steps'))}</p><button type="button" class="bq-primary-button" data-open-daily>${escapeHtml(tx('home.today.open'))}</button></section>` : ''}
      <section class="bq-panel" data-home-progress>
        <p class="bq-eyebrow">${escapeHtml(tx('home.progress.eyebrow'))}</p>
        <div class="bq-progress-stats">
          <div><b data-home-xp>${state.xp}</b><span>${escapeHtml(tx('home.progress.xp'))}</span></div>
          <div><b data-home-streak>${state.streak}</b><span>${escapeHtml(tx('home.progress.streak'))}</span></div>
          <div><b data-home-activities>${state.totalActivities}</b><span>${escapeHtml(tx('home.progress.activities'))}</span></div>
          <div><b data-home-badges>${state.badges.length}</b><span>${escapeHtml(tx('home.progress.badges'))}</span></div>
        </div>
      </section>
      <section class="bq-home-week" data-home-this-week>
        ${homeThisWeekIntroHtml(locale)}
        <section class="bq-panel bq-home-congregation" data-home-congregation-assignments>
          <span class="bq-home-congregation-icon" aria-hidden="true">${iconSvg('home', { size: 22 })}</span>
          <span class="bq-home-congregation-copy"><span class="bq-eyebrow">${escapeHtml(tx('home.congregation.eyebrow'))}</span><b>${escapeHtml(tx('home.congregation.heading'))}</b><small data-home-congregation-caption>${escapeHtml(tx('home.congregation.joinCaption'))}</small><small data-home-active-count></small></span>
          <button type="button" class="bq-secondary-button" data-open-congregation-assignments aria-label="${escapeHtml(tx('home.congregation.openAria'))}">${escapeHtml(tx('home.congregation.open'))}</button>
        </section>
        <section class="bq-panel bq-home-assignments" data-home-assignments aria-live="polite">${homeAssignmentPanelHtml({status:'loading'})}</section>
      </section>
      ${shortcutRailHtml(locale)}
      <div class="bq-home-secondary">
        <section class="bq-panel bq-home-tile" data-home-tutorial>
          <button type="button" class="bq-home-tile-button" data-open-tutorial aria-label="${escapeHtml(tx('home.tutorial.ariaLabel'))}">
            <span class="bq-home-tile-icon" aria-hidden="true">${iconSvg('guide', { size: 20 })}</span>
            <span class="bq-home-tile-text"><b>${escapeHtml(tx('home.tutorial.title'))}</b><small>${escapeHtml(tx('home.tutorial.description'))}</small></span>
          </button>
        </section>
        <section class="bq-panel bq-home-tile" data-home-recordings>
          <button type="button" class="bq-home-tile-button" data-open-recordings aria-label="${escapeHtml(tx('home.recordings.ariaLabel'))}">
            <span class="bq-home-tile-icon" aria-hidden="true">${iconSvg('video', { size: 20 })}</span>
            <span class="bq-home-tile-text"><b>${escapeHtml(tx('home.recordings.title'))}</b><small>${escapeHtml(tx('home.recordings.description'))}</small></span>
          </button>
        </section>
      </div>`,
    mount(root) {
      const dailyButton = root.querySelector('[data-open-daily]');
      const tutorialButton = root.querySelector('[data-open-tutorial]');
      const recordingsButton = root.querySelector('[data-open-recordings]');
      const mediaButton = root.querySelector('[data-open-media]');
      const weekCalendarButton = root.querySelector('[data-open-this-week-calendar]');
      const congregationButton = root.querySelector('[data-open-congregation-assignments]');
      const railTrack = root.querySelector('[data-home-rail-track]');
      const congregationCaption = root.querySelector('[data-home-congregation-caption]');
      const assignmentHost = root.querySelector('[data-home-assignments]');
      let disposed = false;
      let congregationRoute = 'congregation';
      const openDaily = () => onMission?.();
      const openTutorial = () => onTutorial?.();
      const openRecordings = () => onRecordings?.();
      const openMedia = () => onMedia?.();
      const openWeekCalendar = () => onCalendar?.();
      const openCongregationAssignments = () => congregationRoute === 'assignments' ? onAssignments?.() : requestNavigation('congregation');
      const railActions = { onMission: () => onMission?.(), onReader: () => onReader?.(), onAssignments: () => onAssignments?.(), onCalendar: () => onCalendar?.(), onGrow: () => onGrow?.() };
      const onRailClick = event => {
        const button = event.target.closest('[data-home-rail-item]');
        if (!button || !railTrack?.contains(button)) return;
        railActions[button.dataset.homeRailAction]?.();
      };
      const onRailKeydown = event => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        const items = Array.from(railTrack?.querySelectorAll('[data-home-rail-item]') || []);
        const index = items.indexOf(document.activeElement);
        if (index === -1) return;
        event.preventDefault();
        const nextIndex = event.key === 'ArrowRight' ? Math.min(items.length - 1, index + 1) : Math.max(0, index - 1);
        items[nextIndex]?.focus();
        items[nextIndex]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
      };
      const openAllAssignments = () => onAssignments?.();
      const bindAssignmentActions = () => {
        assignmentHost?.querySelector('[data-home-assignments-all]')?.addEventListener('click', openAllAssignments, {once:true});
        assignmentHost?.querySelector('[data-home-assignments-retry]')?.addEventListener('click', loadAssignments, {once:true});
        assignmentHost?.querySelectorAll('[data-home-assignment-open]').forEach(button=>button.addEventListener('click',()=>{
          try { assignments?.open?.(button.dataset.homeAssignmentOpen); } catch { /* stale state falls back to the Assignments list */ }
          onAssignments?.();
        },{once:true}));
      };
      const renderAssignments = assignmentState => {
        if (disposed || !assignmentHost) return;
        congregationRoute = assignmentState?.status === 'ready' ? 'assignments' : 'congregation';
        if (congregationCaption) congregationCaption.textContent = tx(congregationRoute === 'assignments' ? 'home.congregation.readyCaption' : 'home.congregation.joinCaption');
        assignmentHost.innerHTML = homeAssignmentPanelHtml(assignmentState);
        bindAssignmentActions();
      };
      async function loadAssignments() {
        if (disposed) return;
        if (!assignments?.load) { renderAssignments({status:'error'}); return; }
        renderAssignments({status:'loading'});
        try { const next = await assignments.load(); if (!disposed) renderAssignments(next); }
        catch { if (!disposed) renderAssignments({status:'error'}); }
      }
      dailyButton?.addEventListener('click', openDaily);
      tutorialButton?.addEventListener('click', openTutorial);
      recordingsButton?.addEventListener('click', openRecordings);
      mediaButton?.addEventListener('click', openMedia);
      weekCalendarButton?.addEventListener('click', openWeekCalendar);
      congregationButton?.addEventListener('click', openCongregationAssignments);
      railTrack?.addEventListener('click', onRailClick);
      railTrack?.addEventListener('keydown', onRailKeydown);
      bindAssignmentActions();
      void loadAssignments();
      const activeCountHost = root.querySelector('[data-home-active-count]');
      const renderActiveCount = text => { if (!disposed && activeCountHost) activeCountHost.textContent = text; };
      if (presence?.activeCount) {
        renderActiveCount(tx('home.presence.checking'));
        const congregationId = (presence.getState?.()?.congregationIds || [])[0];
        if (!congregationId) {
          renderActiveCount('');
        } else {
          presence.activeCount(congregationId, 30).then(result => {
            if (!result) { renderActiveCount(''); return; }
            const { count } = result;
            renderActiveCount(count === 0 ? tx('home.presence.none') : count === 1 ? tx('home.presence.one') : tx('home.presence.many', { count }));
          }).catch(() => renderActiveCount(tx('home.presence.offline')));
        }
      }
      return () => {
        disposed = true;
        dailyButton?.removeEventListener('click', openDaily);
        tutorialButton?.removeEventListener('click', openTutorial);
        recordingsButton?.removeEventListener('click', openRecordings);
        mediaButton?.removeEventListener('click', openMedia);
        weekCalendarButton?.removeEventListener('click', openWeekCalendar);
        congregationButton?.removeEventListener('click', openCongregationAssignments);
        railTrack?.removeEventListener('click', onRailClick);
        railTrack?.removeEventListener('keydown', onRailKeydown);
      };
    }
  };
}

export function pendingPage(name) {
  return {
    title: name,
    html: `<section class="bq-panel"><p class="bq-eyebrow">Feature migration</p><h1>${name}</h1><p>This feature is intentionally not migrated yet. It will not be marked implemented until its clean workflow exists on the v3 architecture.</p></section>`
  };
}
