import { V4_ART, decorativeImg } from '../../ui/v4-art.js';

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
        <img src="${V4_ART.core.appIcon}" alt="" aria-hidden="true" decoding="async">
      </section>
      ${daily ? `<section class="bq-panel bq-home-daily" data-home-daily>${decorativeImg(V4_ART.homeLearn.dailyJourney,'bq-v4-home-art')}<p class="bq-eyebrow">TODAY · ${escapeHtml(daily.dateKey)}</p><h2>Continue My Journey — 4 min</h2><p><b>${escapeHtml(daily.passage.title)}</b> · ${escapeHtml(reference)}</p><p>Retrieve → Context → Learn → Apply → Reflect.</p><button type="button" class="bq-primary-button" data-open-daily>Open Daily Journey</button></section>` : ''}
      <section class="bq-panel" data-home-tutorial>
        ${decorativeImg(V4_ART.homeLearn.tutorial,'bq-v4-home-art')}
        <p class="bq-eyebrow">GUIDE</p>
        <button type="button" class="bq-secondary-button bq-home-tutorial" data-open-tutorial aria-label="Show BibleQuest tutorial">
          <span><b>Show tutorial</b><small>Learn where the main tools are and how to use them.</small></span>
          <span class="bq-home-tutorial-arrow" aria-hidden="true">›</span>
        </button>
      </section>
      <section class="bq-panel" data-home-recordings>${decorativeImg(V4_ART.homeLearn.recordings,'bq-v4-home-art')}<p class="bq-eyebrow">CONGREGATION</p><h2>Live Recordings</h2><p>Watch published worship and Bible-study livestream replays through one controlled player.</p><button type="button" class="bq-secondary-button" data-open-recordings>View recordings</button></section>
      <section class="bq-panel" data-home-media>${decorativeImg(V4_ART.homeLearn.mediaLibrary,'bq-v4-home-art')}<p class="bq-eyebrow">CONGREGATION</p><h2>Media Library</h2><p>Browse, filter, and open published congregation media without creating another player runtime.</p><button type="button" class="bq-secondary-button" data-open-media>Browse media</button></section>
      <section class="bq-panel" data-home-progress>
        ${decorativeImg(V4_ART.homeLearn.progress,'bq-v4-home-art')}
        <p class="bq-eyebrow">YOUR PROGRESS</p>
        <div class="bq-progress-stats">
          <div><b data-home-xp>${state.xp}</b><span>XP</span></div>
          <div><b data-home-streak>${state.streak}</b><span>Day streak</span></div>
          <div><b data-home-activities>${state.totalActivities}</b><span>Activities</span></div>
          <div><b data-home-badges>${state.badges.length}</b><span>Badges</span></div>
        </div>
      </section>`,
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
