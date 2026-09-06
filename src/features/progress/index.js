const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function progressPage({ progress }) {
  const state = progress.getState();
  const unlocked = new Set(state.badges);
  return {
    title: 'Grow',
    html: `<section class="bq-panel bq-progress-head" data-progress-page>
      <p class="bq-eyebrow">GROW</p>
      <h1>Your BibleQuest progress</h1>
      <p>XP, streaks, meaningful activity, and badges now use one verified progress service. Guest progress stays in this browser until account/cloud progress is rebuilt.</p>
      <div class="bq-progress-stats">
        <div><b data-progress-page-xp>${state.xp}</b><span>XP</span></div>
        <div><b data-progress-page-streak>${state.streak}</b><span>Day streak</span></div>
        <div><b data-progress-page-activities>${state.totalActivities}</b><span>Activities</span></div>
        <div><b data-progress-page-chapters>${state.counters.chaptersRead}</b><span>Chapters read</span></div>
      </div>
    </section>
    <section class="bq-panel">
      <div class="bq-progress-title"><div><p class="bq-eyebrow">ACHIEVEMENTS</p><h2>Badges</h2></div><small>${state.badges.length}/${progress.badges.length} unlocked</small></div>
      <div class="bq-badge-grid">${progress.badges.map(badge => `<article class="bq-badge-card ${unlocked.has(badge.id) ? 'is-unlocked' : 'is-locked'}" data-progress-badge="${escapeHtml(badge.id)}"><span aria-hidden="true">${unlocked.has(badge.id) ? '✓' : '○'}</span><div><b>${escapeHtml(badge.label)}</b><p>${escapeHtml(badge.description)}</p></div></article>`).join('')}</div>
    </section>
    <section class="bq-panel bq-progress-note"><p><b>Progress rule:</b> a feature can request a stable progress event, but it cannot edit XP, streaks, counters, or badges itself. Repeating the same event ID never awards twice.</p></section>`
  };
}
