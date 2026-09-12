import { iconSvg } from '../../ui/icons.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const MINISTRY_ROLES = new Set(['facilitator','leader','pastor','admin']);
const DUE_SOON_MS = 48 * 60 * 60 * 1000;
const ASSIGNMENT_TYPE_LABELS = Object.freeze({
  reading:'Reading','guided-study':'Guided Study',mission:'Mission',quiz:'Quiz',reflection:'Reflection',couples:'Couples',group:'Group activity',custom:'Custom'
});

const formatAssignmentDue = value => {
  if (!value) return 'No deadline';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No deadline';
  try { return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric'}).format(date); }
  catch { return String(value); }
};

export function homeAssignmentItems(state,{now=Date.now(),limit=3}={}) {
  if (state?.status !== 'ready' || !Array.isArray(state.assignments)) return [];
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  const safeNow = Number.isFinite(nowMs) ? nowMs : Date.now();
  return state.assignments
    .filter(row => row?.progress?.status !== 'completed' && row?.dueState !== 'completed' && row?.dueState !== 'scheduled')
    .map(row => {
      const dueMs = row?.dueAt ? Date.parse(row.dueAt) : Number.NaN;
      const dueSoon = row?.dueState === 'open' && Number.isFinite(dueMs) && dueMs >= safeNow && dueMs - safeNow <= DUE_SOON_MS;
      const started = row?.progress?.status === 'started';
      const status = row?.dueState === 'overdue'
        ? Object.freeze({key:'overdue',label:'Overdue',priority:0})
        : dueSoon
          ? Object.freeze({key:'due-soon',label:'Due soon',priority:1})
          : started
            ? Object.freeze({key:'in-progress',label:'In progress',priority:2})
            : Object.freeze({key:'pending',label:'Pending',priority:3});
      return Object.freeze({
        id:String(row?.id||''),
        title:String(row?.title||'Assignment'),
        typeLabel:ASSIGNMENT_TYPE_LABELS[row?.type]||String(row?.type||'Assignment'),
        dueAt:row?.dueAt||null,
        dueText:formatAssignmentDue(row?.dueAt),
        status,
        progressLabel:started?'Started':'Assigned'
      });
    })
    .filter(row => row.id)
    .sort((a,b) => a.status.priority-b.status.priority || (Date.parse(a.dueAt)||Number.MAX_SAFE_INTEGER)-(Date.parse(b.dueAt)||Number.MAX_SAFE_INTEGER) || a.title.localeCompare(b.title))
    .slice(0,Math.max(1,Number(limit)||3));
}

function assignmentPanelHtml(state) {
  const items = homeAssignmentItems(state);
  if (!items.length) return '';
  const ministry = MINISTRY_ROLES.has(state.role);
  const totalActive = state.assignments.filter(row => row?.progress?.status !== 'completed' && row?.dueState !== 'completed' && row?.dueState !== 'scheduled').length;
  return `<div class="bq-home-assignment-head"><div><p class="bq-eyebrow">ASSIGNMENTS${totalActive?` · ${totalActive}`:''}</p><h2>${ministry?'Congregation assignments':'Your assignments'}</h2><p>${ministry?'Review current congregation tasks from the existing ministry workflow.':'Keep current congregation tasks visible without leaving Home.'}</p></div><button type="button" class="bq-secondary-button" data-home-assignments-all>See all</button></div><div class="bq-home-assignment-list">${items.map(item=>`<button type="button" class="bq-home-assignment-row" data-home-assignment-open="${escapeHtml(item.id)}" aria-label="Open assignment ${escapeHtml(item.title)}"><span class="bq-home-assignment-status is-${escapeHtml(item.status.key)}" data-home-assignment-status="${escapeHtml(item.status.key)}">${escapeHtml(item.status.label)}</span><span class="bq-home-assignment-copy"><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.typeLabel)} · ${escapeHtml(item.progressLabel)}${item.dueAt?` · Due ${escapeHtml(item.dueText)}`:''}</small></span><span class="bq-home-assignment-open" aria-hidden="true">Open</span></button>`).join('')}</div>`;
}

export function homePage({ progress, dailyMission, assignments, onAssignments, onMission, onRecordings, onMedia, onTutorial }) {
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
      <section class="bq-panel bq-home-assignments" data-home-assignments aria-live="polite" hidden></section>
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
      const assignmentHost = root.querySelector('[data-home-assignments]');
      let disposed = false;
      const openDaily = () => onMission?.();
      const openTutorial = () => onTutorial?.();
      const openRecordings = () => onRecordings?.();
      const openMedia = () => onMedia?.();
      const openAllAssignments = () => onAssignments?.();
      const hideAssignments = () => { if (assignmentHost) { assignmentHost.hidden = true; assignmentHost.innerHTML = ''; } };
      const renderAssignments = assignmentState => {
        if (disposed || !assignmentHost) return;
        const html = assignmentPanelHtml(assignmentState);
        if (!html) { hideAssignments(); return; }
        assignmentHost.innerHTML = html;
        assignmentHost.hidden = false;
        assignmentHost.querySelector('[data-home-assignments-all]')?.addEventListener('click',openAllAssignments,{once:true});
        assignmentHost.querySelectorAll('[data-home-assignment-open]').forEach(button=>button.addEventListener('click',()=>{
          try { assignments?.open?.(button.dataset.homeAssignmentOpen); } catch { /* stale state falls back to the Assignments list */ }
          onAssignments?.();
        },{once:true}));
      };
      const loadAssignments = async () => {
        if (!assignments?.load) return;
        try { const next = await assignments.load(); if (!disposed) renderAssignments(next); }
        catch { if (!disposed) hideAssignments(); }
      };
      dailyButton?.addEventListener('click', openDaily);
      tutorialButton?.addEventListener('click', openTutorial);
      recordingsButton?.addEventListener('click', openRecordings);
      mediaButton?.addEventListener('click', openMedia);
      void loadAssignments();
      return () => {
        disposed = true;
        dailyButton?.removeEventListener('click', openDaily);
        tutorialButton?.removeEventListener('click', openTutorial);
        recordingsButton?.removeEventListener('click', openRecordings);
        mediaButton?.removeEventListener('click', openMedia);
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
