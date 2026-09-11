import { iconSvg } from '../../ui/icons.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function homePage({ progress, dailyMission, onMission, onRecordings, onMedia, onTutorial }) {
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
      const openDaily = () => onMission?.();
      const openTutorial = () => onTutorial?.();
      const openRecordings = () => onRecordings?.();
      const openMedia = () => onMedia?.();
      dailyButton?.addEventListener('click', openDaily);
      tutorialButton?.addEventListener('click', openTutorial);
      recordingsButton?.addEventListener('click', openRecordings);
      mediaButton?.addEventListener('click', openMedia);
      return () => {
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
