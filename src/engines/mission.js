// #83 Innovation suite (v1 scope: Personal Mission only). Sole owner of the
// mission recommendation rule. Pure function; no storage, DOM or network.
// Reuses Open Review's due-count/weakest-category signal instead of
// duplicating review-scheduling or mastery logic.
//
// v1 scope decision (recorded, not silent): legacy innovation-suite.js bundled
// five sub-workflows. Guided Study and Characters & Places are already owned
// elsewhere in v3 (src/app/study.js; Games' Character Detective mode) and are
// explicitly out of #83 scope. Bible World (region-mastery map) and Church
// Challenges (congregation-cloud challenges) need a v3 metrics owner and a new
// congregation-scoped schema respectively, comparable in size to #82's
// deferred styles and to #73 Assignments; they are deferred as their own
// follow-up sub-milestones, not silently dropped.

export function recommend({ due = 0, weakest = '' } = {}) {
  const dueCount = Number.isFinite(Number(due)) && Number(due) > 0 ? Math.floor(Number(due)) : 0;
  if (dueCount > 0) {
    return Object.freeze({
      icon: '🧠',
      title: `${dueCount} review${dueCount === 1 ? '' : 's'} due`,
      text: 'Start with retrieval practice before adding more new material.',
      action: 'review'
    });
  }
  const focus = String(weakest || '').trim();
  return Object.freeze({
    icon: '📘',
    title: focus ? `Strengthen ${focus}` : 'Continue your study',
    text: focus
      ? `Your evidence is lighter here. Read a passage, then retrieve what you remember.`
      : 'Read a passage, then retrieve what you remember.',
    action: 'study'
  });
}
