export function homePage({ progress }) {
  const state = progress?.getState?.() || { xp: 0, streak: 0, totalActivities: 0, badges: [] };
  return {
    title: 'Home',
    html: `
      <section class="bq-hero">
        <div>
          <p class="bq-eyebrow">Rebuild and verify</p>
          <h1>BibleQuest</h1>
          <p>The clean v3 core now has verified account, Bible reader, and progress foundations. Features are restored only when their complete workflow passes regression.</p>
        </div>
        <img src="assets/bq-pinoy-japan-hero.svg" alt="" aria-hidden="true">
      </section>
      <section class="bq-panel" data-home-progress>
        <p class="bq-eyebrow">YOUR PROGRESS</p>
        <div class="bq-progress-stats">
          <div><b data-home-xp>${state.xp}</b><span>XP</span></div>
          <div><b data-home-streak>${state.streak}</b><span>Day streak</span></div>
          <div><b data-home-activities>${state.totalActivities}</b><span>Activities</span></div>
          <div><b data-home-badges>${state.badges.length}</b><span>Badges</span></div>
        </div>
      </section>
      <section class="bq-panel">
        <h2>Continue learning</h2>
        <p>Open Learn to read Scripture. Marking a new chapter read is now one idempotent progress event: it awards once, protects streak consistency, and can never double-award on reload.</p>
      </section>`
  };
}

export function pendingPage(name) {
  return {
    title: name,
    html: `<section class="bq-panel"><p class="bq-eyebrow">Feature migration</p><h1>${name}</h1><p>This feature is intentionally not migrated yet. It will not be marked implemented until its clean workflow exists on the v3 architecture.</p></section>`
  };
}
