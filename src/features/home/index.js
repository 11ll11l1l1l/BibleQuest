import { requestNavigation } from '../../app/router.js';
import { iconSvg } from '../../ui/icons.js';
import { homeAssignmentItems, homeAssignmentPanelHtml } from './assignment-summary.js';

export { homeAssignmentItems, homeAssignmentPanelHtml } from './assignment-summary.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const HOME_SHORTCUTS = Object.freeze([
  Object.freeze({ id: 'daily', icon: 'home', label: 'Daily Journey', action: 'onMission' }),
  Object.freeze({ id: 'reader', icon: 'bible', label: 'Reader', action: 'onReader' }),
  Object.freeze({ id: 'assignments', icon: 'guide', label: 'Assignments', action: 'onAssignments' }),
  Object.freeze({ id: 'calendar', icon: 'calendar', label: 'Calendar', action: 'onCalendar' }),
  Object.freeze({ id: 'grow', icon: 'grow', label: 'Progress', action: 'onGrow' })
]);

function shortcutRailHtml() {
  return `<nav class="bq-home-rail" data-home-rail aria-label="Quick shortcuts"><ul class="bq-home-rail-track" data-home-rail-track>${HOME_SHORTCUTS.map(item => `<li><button type="button" class="bq-home-rail-item" data-home-rail-item="${item.id}" data-home-rail-action="${item.action}"><span class="bq-home-rail-icon" aria-hidden="true">${iconSvg(item.icon, { size: 22 })}</span><span class="bq-home-rail-label">${escapeHtml(item.label)}</span></button></li>`).join('')}</ul></nav>`;
}

export function homePage({ progress, dailyMission, assignments, onAssignments, onMission, onRecordings, onMedia, onTutorial, onReader, onCalendar, onGrow }) {
  const state = progress?.getState?.() || { xp: 0, streak: 0, totalActivities: 0, badges: [] };
  const daily = dailyMission?.today?.();
  const reference = daily ? `${daily.passage.book} ${daily.passage.chapter}:${daily.passage.from}–${daily.passage.to}` : '';
  return {
    title: 'Home',
    html: `
      <section class="bq-hero">
        <div>
          <p class="bq-eyebrow">Explore · Learn · Grow</p>
          <h1>BibleQuest</h1>
          <p>Read Scripture, build steady habits, learn through games and guided study, and keep your journey together in one place.</p>
        </div>
        <img src="assets/bq-pinoy-japan-hero.svg" alt="" aria-hidden="true">
      </section>
      ${daily ? `<section class="bq-panel bq-home-daily" data-home-daily><p class="bq-eyebrow">TODAY · ${escapeHtml(daily.dateKey)}</p><h2>Continue My Journey — 4 min</h2><p><b>${escapeHtml(daily.passage.title)}</b> · ${escapeHtml(reference)}</p><p>Retrieve → Context → Learn → Apply → Reflect.</p><button type="button" class="bq-primary-button" data-open-daily>Open Daily Journey</button></section>` : ''}
      <section class="bq-panel" data-home-progress>
        <p class="bq-eyebrow">YOUR PROGRESS</p>
        <div class="bq-progress-stats">
          <div><b data-home-xp>${state.xp}</b><span>XP</span></div>
          <div><b data-home-streak>${state.streak}</b><span>Day streak</span></div>
          <div><b data-home-activities>${state.totalActivities}</b><span>Activities</span></div>
          <div><b data-home-badges>${state.badges.length}</b><span>Badges</span></div>
        </div>
      </section>
      <section class="bq-panel bq-home-congregation" data-home-congregation-assignments>
        <span class="bq-home-congregation-icon" aria-hidden="true">${iconSvg('home', { size: 22 })}</span>
        <span class="bq-home-congregation-copy"><span class="bq-eyebrow">CONGREGATION</span><b>Congregation &amp; Assignments</b><small data-home-congregation-caption>Join or open your congregation.</small></span>
        <button type="button" class="bq-secondary-button" data-open-congregation-assignments aria-label="Open congregation and assignments">Open</button>
      </section>
      <section class="bq-panel bq-home-assignments" data-home-assignments aria-live="polite">${homeAssignmentPanelHtml({status:'loading'})}</section>
      ${shortcutRailHtml()}
      <div class="bq-home-secondary">
        <section class="bq-panel bq-home-tile" data-home-tutorial>
          <button type="button" class="bq-home-tile-button" data-open-tutorial aria-label="Show BibleQuest tutorial">
            <span class="bq-home-tile-icon" aria-hidden="true">${iconSvg('guide', { size: 20 })}</span>
            <span class="bq-home-tile-text"><b>Show tutorial</b><small>Learn where the main tools are.</small></span>
          </button>
        </section>
        <section class="bq-panel bq-home-tile" data-home-recordings>
          <button type="button" class="bq-home-tile-button" data-open-recordings aria-label="View live recordings">
            <span class="bq-home-tile-icon" aria-hidden="true">${iconSvg('video', { size: 20 })}</span>
            <span class="bq-home-tile-text"><b>Live Recordings</b><small>Worship and study replays.</small></span>
          </button>
        </section>
        <section class="bq-panel bq-home-tile" data-home-media>
          <button type="button" class="bq-home-tile-button" data-open-media aria-label="Browse media library">
            <span class="bq-home-tile-icon" aria-hidden="true">${iconSvg('library', { size: 20 })}</span>
            <span class="bq-home-tile-text"><b>Media Library</b><small>Browse congregation media.</small></span>
          </button>
        </section>
      </div>`,
    mount(root) {
      const dailyButton = root.querySelector('[data-open-daily]');
      const tutorialButton = root.querySelector('[data-open-tutorial]');
      const recordingsButton = root.querySelector('[data-open-recordings]');
      const mediaButton = root.querySelector('[data-open-media]');
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
        if (congregationCaption) congregationCaption.textContent = congregationRoute === 'assignments' ? 'Open current assignments and congregation tools.' : 'Join or open your congregation.';
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
      congregationButton?.addEventListener('click', openCongregationAssignments);
      railTrack?.addEventListener('click', onRailClick);
      railTrack?.addEventListener('keydown', onRailKeydown);
      bindAssignmentActions();
      void loadAssignments();
      return () => {
        disposed = true;
        dailyButton?.removeEventListener('click', openDaily);
        tutorialButton?.removeEventListener('click', openTutorial);
        recordingsButton?.removeEventListener('click', openRecordings);
        mediaButton?.removeEventListener('click', openMedia);
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
