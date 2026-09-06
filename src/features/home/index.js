const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function homePage({ progress, dailyMission, onMission }) {
  const state = progress?.getState?.() || { xp: 0, streak: 0, totalActivities: 0, badges: [] };
  const daily = dailyMission?.today?.();
  const reference = daily ? `${daily.passage.book} ${daily.passage.chapter}:${daily.passage.from}–${daily.passage.to}` : '';
  return {
    title: 'Home',
    html: `
      <section class="bq-hero">
        <div>
          <p class="bq-eyebrow">Rebuild and verify</p>
          <h1>BibleQuest</h1>
          <p>The clean v3 rebuild restores each old workflow on one stable architecture and keeps every completed milestone under regression.</p>
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
      </section>`,
    mount(root) {
      const button = root.querySelector('[data-open-daily]');
      if (!button) return undefined;
      const open = () => onMission();
      button.addEventListener('click', open);
      return () => button.removeEventListener('click', open);
    }
  };
}

export function pendingPage(name) {
  return {
    title: name,
    html: `<section class="bq-panel"><p class="bq-eyebrow">Feature migration</p><h1>${name}</h1><p>This feature is intentionally not migrated yet. It will not be marked implemented until its clean workflow exists on the v3 architecture.</p></section>`
  };
}
