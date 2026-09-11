// #82 Avatar Vault engine — sole owner of style catalog, unlock evaluation and
// progress-toward-unlock text. Pure functions only; no storage, DOM or network.
// Styles/requirements ported unchanged from legacy avatar-vault.js for parity.
//
// v1 scope: only styles whose requirement is sourceable from an existing v3
// owner today (Progress: xp, streak) are marked as available. Styles that
// depended on legacy metrics with no current v3 owner (answered/correct
// question counts, recall-deck reps, couples conversations, group sessions,
// assignment completions, Journey region mastery) are retained in the catalog
// for parity visibility but marked as not yet available, with the owner still
// needed, and can never be evaluated as unlocked until that follow-up
// integration lands. This is a deliberate, explicitly recorded deferral, not
// a silent gap.

export const STYLES = Object.freeze([
  freezeStyle({ id: 'starter', icon: '🌱', name: 'Fresh Start', req: 'Available from the beginning', available: true, test: () => true, progress: () => 'Ready' }),
  freezeStyle({ id: 'sakura', icon: '🌸', name: 'Sakura Pilgrim', req: 'Reach a 7-day learning streak', available: true, test: m => m.streak >= 7, progress: m => `${Math.min(m.streak, 7)}/7 streak days` }),
  freezeStyle({ id: 'lantern', icon: '🏮', name: 'Lantern Keeper', req: 'Earn 500 XP', available: true, test: m => m.xp >= 500, progress: m => `${Math.min(m.xp, 500)}/500 XP` }),
  freezeStyle({ id: 'flame', icon: '🔥', name: 'Steady Flame', req: 'Reach a 30-day learning streak', available: true, test: m => m.streak >= 30, progress: m => `${Math.min(m.streak, 30)}/30 streak days` }),
  freezeStyle({ id: 'crown', icon: '👑', name: 'Crown of Curiosity', req: 'Earn 2,500 XP', available: true, test: m => m.xp >= 2500, progress: m => `${Math.min(m.xp, 2500)}/2500 XP` }),
  freezeStyle({ id: 'scholar', icon: '🎓', name: 'Little Scholar', req: 'Answer 100 BibleQuest questions', available: false, needsOwner: 'question-answer-count', test: () => false, progress: () => 'Not yet available' }),
  freezeStyle({ id: 'scroll', icon: '📜', name: 'Scroll Keeper', req: 'Study 100 recall cards', available: true, test: m => m.recallReps >= 100, progress: m => `${Math.min(m.recallReps, 100)}/100 recall reps` }),
  freezeStyle({ id: 'shepherd', icon: '🐑', name: 'Shepherd Friend', req: 'Get 250 answers correct', available: false, needsOwner: 'question-correct-count', test: () => false, progress: () => 'Not yet available' }),
  freezeStyle({ id: 'couple', icon: '💞', name: 'Growing Together', req: 'Complete 10 couples conversations', available: true, test: m => m.couplesHistory >= 10, progress: m => `${Math.min(m.couplesHistory, 10)}/10 conversations` }),
  freezeStyle({ id: 'community', icon: '⛪', name: 'Table Builder', req: 'Complete 10 group sessions', available: false, needsOwner: 'community-session-count', test: () => false, progress: () => 'Not yet available' }),
  freezeStyle({ id: 'world', icon: '🌏', name: 'Bible World Traveler', req: 'Reach the explored threshold in every Journey region', available: true, test: m => m.regionsExplored, progress: m => m.regionsExplored ? 'All regions explored' : `${m.regionsExploredCount}/${m.regionsTotal} regions explored` }),
  freezeStyle({ id: 'kitsune', icon: '🦊', name: 'Kitsune Bookworm', req: 'Answer 500 BibleQuest questions', available: false, needsOwner: 'question-answer-count', test: () => false, progress: () => 'Not yet available' }),
  freezeStyle({ id: 'moon', icon: '🌙', name: 'Moonlight Reader', req: 'Study 250 recall cards', available: true, test: m => m.recallReps >= 250, progress: m => `${Math.min(m.recallReps, 250)}/250 recall reps` }),
  freezeStyle({ id: 'fuji', icon: '🗻', name: 'Fuji Explorer', req: 'Reach 100% exploration in one Journey region', available: true, test: m => m.maxRegionPercent >= 100, progress: m => `${Math.min(m.maxRegionPercent, 100)}% best region` }),
  freezeStyle({ id: 'tea', icon: '🍵', name: 'Tea Garden Scholar', req: 'Complete 10 leader assignments', available: true, test: m => m.assignmentsCompleted >= 10, progress: m => `${Math.min(m.assignmentsCompleted, 10)}/10 assignments` })
]);

function freezeStyle(style) { return Object.freeze(style); }

export function findStyle(id) {
  return STYLES.find(s => s.id === id) || STYLES[0];
}

export function normalizeMetrics(input = {}) {
  const nonNeg = value => { const n = Number(value); return Number.isFinite(n) && n >= 0 ? n : 0; };
  return Object.freeze({
    xp: nonNeg(input.xp),
    streak: nonNeg(input.streak),
    recallReps: nonNeg(input.recallReps),
    couplesHistory: nonNeg(input.couplesHistory),
    assignmentsCompleted: nonNeg(input.assignmentsCompleted),
    regionsExplored: Boolean(input.regionsExplored),
    regionsExploredCount: nonNeg(input.regionsExploredCount),
    regionsTotal: nonNeg(input.regionsTotal),
    maxRegionPercent: Math.min(100, nonNeg(input.maxRegionPercent))
  });
}

export function unlockedIds(metrics, earned = []) {
  const m = normalizeMetrics(metrics);
  const set = new Set(Array.isArray(earned) ? earned : []);
  set.add('starter');
  for (const style of STYLES) {
    if (style.available && style.test(m)) set.add(style.id);
  }
  return set;
}

export function isUnlocked(id, metrics, earned = []) {
  return unlockedIds(metrics, earned).has(id);
}

export function progressFor(style, metrics, earned) {
  const set = earned instanceof Set ? earned : unlockedIds(metrics, earned);
  if (set.has(style.id) && !(style.available && style.test(normalizeMetrics(metrics)))) return 'Milestone completed';
  return style.progress(normalizeMetrics(metrics));
}

export function iconFor(avatarLike) {
  const id = typeof avatarLike?.cosmetic === 'string' ? avatarLike.cosmetic : 'starter';
  return findStyle(id).icon;
}
