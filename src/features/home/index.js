const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[char]));

const stat = (value, label) => `
  <div class="bq-home-stat">
    <b>${escapeHtml(value)}</b>
    <span>${escapeHtml(label)}</span>
  </div>`;

export function homePage({ progress, dailyMission, onMission, onRecordings, onMedia, onTutorial }) {
  const state = progress?.getState?.() || { xp: 0, streak: 0, totalActivities: 0, badges: [] };
  const daily = dailyMission?.today?.();
  const reference = daily ? `${daily.passage.book} ${daily.passage.chapter}:${daily.passage.from}–${daily.passage.to}` : '';

  return {
    title: 'Home',
    html: `
      <div class="bq-home-page">
        <section class="bq-home-welcome" aria-labelledby="bq-home-title">
          <div class="bq-home-welcome-copy">
            <p class="bq-eyebrow">YOUR BIBLE JOURNEY</p>
            <h1 id="bq-home-title">A steady next step, every day.</h1>
            <p>Read Scripture, remember what matters, and keep growing at a pace you can sustain.</p>
          </div>
          <img src="assets/bq-pinoy-japan-hero.svg" alt="" aria-hidden="true">
        </section>

        <div class="bq-home-dashboard">
          ${daily ? `
            <section class="bq-home-journey" data-home-daily>
              <div class="bq-home-card-head">
                <div>
                  <p class="bq-eyebrow">TODAY'S JOURNEY</p>
                  <h2>Continue My Journey</h2>
                </div>
                <span class="bq-home-time" aria-label="About four minutes">~4 min</span>
              </div>
              <p class="bq-home-passage"><b>${escapeHtml(daily.passage.title)}</b><span>${escapeHtml(reference)}</span></p>
              <ol class="bq-home-steps" aria-label="Daily Journey steps">
                <li>Recall</li><li>Context</li><li>Learn</li><li>Apply</li><li>Reflect</li>
              </ol>
              <button type="button" class="bq-primary-button bq-home-primary-action" data-open-daily>Continue journey</button>
            </section>` : `
            <section class="bq-home-journey bq-home-journey-empty">
              <p class="bq-eyebrow">TODAY'S JOURNEY</p>
              <h2>Your next journey is being prepared.</h2>
              <p>Keep exploring BibleQuest while today's guided journey becomes available.</p>
            </section>`}

          <section class="bq-home-progress-card" data-home-progress aria-label="Your progress">
            <div class="bq-home-card-head">
              <div>
                <p class="bq-eyebrow">YOUR RHYTHM</p>
                <h2>Keep the habit visible</h2>
              </div>
            </div>
            <div class="bq-home-stats">
              ${stat(state.streak, 'Day streak')}
              ${stat(state.xp, 'XP')}
              ${stat(state.totalActivities, 'Activities')}
              ${stat(state.badges.length, 'Badges')}
            </div>
          </section>
        </div>

        <section class="bq-home-section" aria-labelledby="bq-home-explore-title">
          <div class="bq-home-section-head">
            <div>
              <p class="bq-eyebrow">KEEP EXPLORING</p>
              <h2 id="bq-home-explore-title">What would help next?</h2>
            </div>
            <button type="button" class="bq-home-guide-link" data-open-tutorial aria-label="Show BibleQuest tutorial">
              <span aria-hidden="true">?</span> Show tutorial
            </button>
          </div>
          <div class="bq-home-action-grid">
            <article class="bq-home-action-card" data-home-recordings>
              <span class="bq-home-action-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false"><path d="M5 5.5h14v13H5zM9 9l6 3-6 3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
              </span>
              <div>
                <p class="bq-eyebrow">CONGREGATION</p>
                <h3>Live Recordings</h3>
                <p>Return to published worship and Bible-study livestream replays.</p>
              </div>
              <button type="button" class="bq-secondary-button" data-open-recordings>View recordings</button>
            </article>
            <article class="bq-home-action-card" data-home-media>
              <span class="bq-home-action-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false"><path d="M4.5 6.5h15v11h-15zM8 4.5h8M9 10l5 2.5-5 2.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
              <div>
                <p class="bq-eyebrow">LIBRARY</p>
                <h3>Media Library</h3>
                <p>Browse published congregation media through the existing trusted player.</p>
              </div>
              <button type="button" class="bq-secondary-button" data-open-media>Browse media</button>
            </article>
          </div>
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
    html: `<section class="bq-panel"><p class="bq-eyebrow">Feature migration</p><h1>${name}</h1><p>This feature is intentionally not migrated yet. It will not be marked implemented until its clean workflow exists on the active BibleQuest architecture.</p></section>`
  };
}
