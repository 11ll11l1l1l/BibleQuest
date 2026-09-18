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
  Object.freeze({ id: 'assignments', icon: 'assignments', label: 'Assignments', labelKey: 'home.shortcut.assignments', action: 'onAssignments' }),
  Object.freeze({ id: 'calendar', icon: 'calendar', label: 'Calendar', labelKey: 'home.shortcut.calendar', action: 'onCalendar' }),
  Object.freeze({ id: 'grow', icon: 'grow', label: 'Progress', labelKey: 'home.shortcut.progress', action: 'onGrow' })
]);

const HOME_COMPOSITION_COPY = Object.freeze({
  en: Object.freeze({
    'home.composition.noUpcomingEvents': 'No upcoming events yet.',
    'home.composition.noContinueReading': 'Open the Bible to start or continue reading.',
    'home.composition.noLatestService': 'No confirmed latest service yet.'
  }),
  tl: Object.freeze({
    'home.composition.noUpcomingEvents': 'Wala pang paparating na event.',
    'home.composition.noContinueReading': 'Buksan ang Biblia para magsimula o magpatuloy sa pagbabasa.',
    'home.composition.noLatestService': 'Wala pang kumpirmadong pinakabagong recording ng service.'
  }),
  ceb: Object.freeze({
    'home.composition.noUpcomingEvents': 'Wala pay umaabot nga kalihokan.',
    'home.composition.noContinueReading': 'Ablihi ang Bibliya aron magsugod o mopadayon sa pagbasa.',
    'home.composition.noLatestService': 'Wala pay kumpirmadong pinakabag-ong recording sa service.'
  })
});

function shortcutRailHtml(locale) {
  const tx = (key, values) => localization.t(key, { locale, values });
  return `<nav class="bq-home-rail" data-home-rail aria-label="${escapeHtml(tx('home.shortcut.ariaLabel'))}"><ul class="bq-home-rail-track" data-home-rail-track>${HOME_SHORTCUTS.map(item => `<li><button type="button" class="bq-home-rail-item" data-home-rail-item="${item.id}" data-home-rail-action="${item.action}"><span class="bq-home-rail-icon" aria-hidden="true">${iconSvg(item.icon, { size: 22 })}</span><span class="bq-home-rail-label">${escapeHtml(tx(item.labelKey))}</span></button></li>`).join('')}</ul></nav>`;
}

const firstAgendaEvent = state => state?.agenda?.[0]?.events?.[0] || null;
const readerSummary = reader => {
  const state = reader?.getState?.();
  if (!state) return '';
  const book = reader?.books?.find?.(item => item.code === state.book);
  return `${book?.name || state.book || ''} ${state.chapter || ''}`.trim();
};
const eventSummary = event => event ? `${event.date || ''}${event.date && event.title ? ' · ' : ''}${event.title || ''}` : '';

export function homePage({ progress, dailyMission, assignments, presence, calendar, reader, recordings, transform, notifications, onAssignments, onMission, onRecordings, onMedia, onTutorial, onReader, onCalendar, onGrow, onTransformation, onNotifications }) {
  const locale = localization.getLocale();
  const tx = (key, values) => localization.t(key, { locale, values });
  const homeTx = (key, values) => localization.t(key, { locale, values, dictionaries: HOME_COMPOSITION_COPY });
  const state = progress?.getState?.() || { xp: 0, streak: 0, totalActivities: 0, badges: [] };
  const daily = dailyMission?.today?.();
  const reference = daily ? `${daily.passage.book} ${daily.passage.chapter}:${daily.passage.from}–${daily.passage.to}` : '';
  const nextEvent = firstAgendaEvent(calendar?.getState?.());
  const continueReading = readerSummary(reader);
  const latestService = recordings?.getLatestService?.();
  const transformationState = transform?.getState?.();
  const notificationState = notifications?.snapshot?.();
  const leaderAnchor=(assignments?.snapshot?.()?.assignments||[]).find(row=>row?.progress?.status!=='completed'&&row?.dueState!=='scheduled')||null;
  const transformationDetail = transformationState?.spiritual?.result ? tx('transform.basic.viewReflection') : tx('transform.mode.prompt');
  const nextEventDetail = eventSummary(nextEvent) || homeTx('home.composition.noUpcomingEvents');
  const continueReadingDetail = continueReading || homeTx('home.composition.noContinueReading');
  const latestServiceDetail = latestService?.title || homeTx('home.composition.noLatestService');
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
        ${homeThisWeekIntroHtml(locale,{leaderAnchor})}
        <section class="bq-panel bq-home-congregation" data-home-congregation-assignments>
          <span class="bq-home-congregation-icon" aria-hidden="true">${iconSvg('home', { size: 22 })}</span>
          <span class="bq-home-congregation-copy"><span class="bq-eyebrow">${escapeHtml(tx('home.congregation.eyebrow'))}</span><b>${escapeHtml(tx('home.congregation.heading'))}</b><small data-home-congregation-caption>${escapeHtml(tx('home.congregation.joinCaption'))}</small><small data-home-active-count></small></span>
          <button type="button" class="bq-secondary-button" data-open-congregation-assignments aria-label="${escapeHtml(tx('home.congregation.openAria'))}">${escapeHtml(tx('home.congregation.open'))}</button>
        </section>
        <section class="bq-panel bq-home-assignments" data-home-assignments aria-live="polite">${homeAssignmentPanelHtml({status:'loading'})}</section>
      </section>
      <div class="bq-home-secondary" data-home-today-composition>
        <section class="bq-panel bq-home-tile" data-home-next-event>
          <button type="button" class="bq-home-tile-button" data-open-home-next-event aria-label="${escapeHtml(tx('nav.calendar'))}">
            <span class="bq-home-tile-icon" aria-hidden="true">${iconSvg('calendar', { size: 20 })}</span>
            <span class="bq-home-tile-text"><b>${escapeHtml(tx('nav.calendar'))}</b><small data-home-next-event-detail aria-live="polite">${escapeHtml(nextEventDetail)}</small></span>
          </button>
        </section>
        <section class="bq-panel bq-home-tile" data-home-continue-reading>
          <button type="button" class="bq-home-tile-button" data-open-home-continue-reading aria-label="${escapeHtml(tx('nav.bible'))}">
            <span class="bq-home-tile-icon" aria-hidden="true">${iconSvg('bible', { size: 20 })}</span>
            <span class="bq-home-tile-text"><b>${escapeHtml(tx('nav.bible'))}</b><small data-home-continue-reading-detail aria-live="polite">${escapeHtml(continueReadingDetail)}</small></span>
          </button>
        </section>
        <section class="bq-panel bq-home-tile" data-home-latest-service>
          <button type="button" class="bq-home-tile-button" data-open-recordings aria-label="${escapeHtml(tx('home.recordings.ariaLabel'))}">
            <span class="bq-home-tile-icon" aria-hidden="true">${iconSvg('video', { size: 20 })}</span>
            <span class="bq-home-tile-text"><b>${escapeHtml(tx('home.recordings.title'))}</b><small data-home-latest-service-detail aria-live="polite">${escapeHtml(latestServiceDetail)}</small></span>
          </button>
        </section>
        <section class="bq-panel bq-home-tile" data-home-transformation-prompt>
          <button type="button" class="bq-home-tile-button" data-open-home-transformation aria-label="${escapeHtml(tx('nav.transformation'))}">
            <span class="bq-home-tile-icon" aria-hidden="true">${iconSvg('transform', { size: 20 })}</span>
            <span class="bq-home-tile-text"><b>${escapeHtml(tx('nav.transformation'))}</b><small>${escapeHtml(transformationDetail)}</small></span>
          </button>
        </section>
        <section class="bq-panel bq-home-tile" data-home-unread-notifications>
          <button type="button" class="bq-home-tile-button" data-open-home-notifications aria-label="${escapeHtml(tx('nav.notifications'))}">
            <span class="bq-home-tile-icon" aria-hidden="true">${iconSvg('notifications', { size: 20 })}</span>
            <span class="bq-home-tile-text"><b>${escapeHtml(tx('nav.notifications'))}</b><small data-home-unread-notifications-count aria-live="polite">${Number(notificationState?.unread || 0)}</small></span>
          </button>
        </section>
      </div>
      ${shortcutRailHtml(locale)}
      <div class="bq-home-secondary">
        <section class="bq-panel bq-home-tile" data-home-tutorial>
          <button type="button" class="bq-home-tile-button" data-open-tutorial aria-label="${escapeHtml(tx('home.tutorial.ariaLabel'))}">
            <span class="bq-home-tile-icon" aria-hidden="true">${iconSvg('tutorial', { size: 20 })}</span>
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
      const recordingsButtons = root.querySelectorAll('[data-open-recordings]');
      const mediaButton = root.querySelector('[data-open-media]');
      const weekCalendarButton = root.querySelector('[data-open-this-week-calendar]');
      const nextEventButton = root.querySelector('[data-open-home-next-event]');
      const continueReadingButton = root.querySelector('[data-open-home-continue-reading]');
      const transformationButton = root.querySelector('[data-open-home-transformation]');
      const notificationsButton = root.querySelector('[data-open-home-notifications]');
      const congregationButton = root.querySelector('[data-open-congregation-assignments]');
      const railTrack = root.querySelector('[data-home-rail-track]');
      const congregationCaption = root.querySelector('[data-home-congregation-caption]');
      const assignmentHost = root.querySelector('[data-home-assignments]');
      const nextEventHost = root.querySelector('[data-home-next-event-detail]');
      const latestServiceHost = root.querySelector('[data-home-latest-service-detail]');
      const unreadHost = root.querySelector('[data-home-unread-notifications-count]');
      let disposed = false;
      let congregationRoute = 'congregation';
      const openDaily = () => onMission?.();
      const openTutorial = () => onTutorial?.();
      const openRecordings = () => onRecordings?.();
      const openMedia = () => onMedia?.();
      const openWeekCalendar = () => onCalendar?.();
      const openNextEvent = () => onCalendar?.();
      const openContinueReading = () => onReader?.();
      const openTransformation = () => onTransformation?.();
      const openNotifications = () => onNotifications?.();
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
      const refreshHomeComposition = async () => {
        if (calendar?.load) {
          try {
            const calendarState = await calendar.load();
            if (!disposed && nextEventHost) nextEventHost.textContent = eventSummary(firstAgendaEvent(calendarState)) || homeTx('home.composition.noUpcomingEvents');
          } catch { /* retain the current safe calendar summary */ }
        }
        if (recordings?.load) {
          try {
            const recordingState = await recordings.load();
            if (!disposed && latestServiceHost) latestServiceHost.textContent = recordingState?.latestService?.title || homeTx('home.composition.noLatestService');
          } catch { /* retain the current recordings fallback */ }
        }
        if (notifications?.load) {
          try {
            const inbox = await notifications.load();
            if (!disposed && unreadHost) unreadHost.textContent = String(Number(inbox?.unread || 0));
          } catch { /* retain the current safe unread count */ }
        }
      };
      dailyButton?.addEventListener('click', openDaily);
      tutorialButton?.addEventListener('click', openTutorial);
      recordingsButtons.forEach(button => button.addEventListener('click', openRecordings));
      mediaButton?.addEventListener('click', openMedia);
      weekCalendarButton?.addEventListener('click', openWeekCalendar);
      nextEventButton?.addEventListener('click', openNextEvent);
      continueReadingButton?.addEventListener('click', openContinueReading);
      transformationButton?.addEventListener('click', openTransformation);
      notificationsButton?.addEventListener('click', openNotifications);
      congregationButton?.addEventListener('click', openCongregationAssignments);
      railTrack?.addEventListener('click', onRailClick);
      railTrack?.addEventListener('keydown', onRailKeydown);
      bindAssignmentActions();
      void loadAssignments();
      void refreshHomeComposition();
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
        recordingsButtons.forEach(button => button.removeEventListener('click', openRecordings));
        mediaButton?.removeEventListener('click', openMedia);
        weekCalendarButton?.removeEventListener('click', openWeekCalendar);
        nextEventButton?.removeEventListener('click', openNextEvent);
        continueReadingButton?.removeEventListener('click', openContinueReading);
        transformationButton?.removeEventListener('click', openTransformation);
        notificationsButton?.removeEventListener('click', openNotifications);
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
