// BibleQuest V5 Phase 1: Leader Center. Pure composition over existing,
// already-authorized owners - assignments.js already resolves the caller's
// active congregation/role and enforces server-side authorization for
// publish/review; presence.js's activeCount() already verifies congregation
// membership server-side before returning an aggregate. This service adds
// no new data access, no new RLS, and no new state ownership - it only
// arranges existing capabilities into one leader-facing view. Hiding this
// route from non-ministry roles is a UX convenience, never the real
// authorization boundary; every call below independently re-verifies via
// its own owner's existing server-side check.
const MINISTRY_ROLES = new Set(['facilitator', 'leader', 'pastor', 'admin']);

export function createLeaderCenterService({ assignments, presence } = {}) {
  if (!assignments?.load || !assignments?.snapshot || !presence?.activeCount) {
    throw new Error('Leader Center requires the existing Assignments and Presence owners.');
  }

  async function load() {
    const assignmentState = await assignments.load();
    if (assignmentState.status !== 'ready') {
      return Object.freeze({ status: assignmentState.status === 'idle' ? 'signed-out' : assignmentState.status, authorized: false });
    }
    const role = String(assignmentState.role || '');
    if (!MINISTRY_ROLES.has(role)) {
      return Object.freeze({ status: 'unauthorized', authorized: false, role });
    }
    const congregationId = assignmentState.congregationId;
    const rows = assignmentState.assignments || [];
    // Categorize using the same scheduleAt/dueAt fields the existing
    // dueState() computation already relies on, rather than inventing a
    // publish-state field that does not exist on the merged row - the row
    // only carries the caller's own progress.status (assigned/started/
    // completed), not a per-assignment publish lifecycle or aggregate
    // completion count. A real "how many members completed this" number
    // requires assignments.loadReview(id) per assignment (already built,
    // already server-authorized) - deferred here as an explicit follow-up
    // rather than fabricated from data that does not carry it.
    const now = Date.now();
    const scheduled = rows.filter(row => row.scheduleAt && new Date(row.scheduleAt).getTime() > now);
    const open = rows.filter(row => !(row.scheduleAt && new Date(row.scheduleAt).getTime() > now));

    let activeCount = null;
    try {
      const presenceResult = await presence.activeCount(congregationId, 30);
      activeCount = presenceResult ? presenceResult.count : null;
    } catch { activeCount = null; } // presence is a secondary enhancement, never blocks the Overview

    return Object.freeze({
      status: 'ready',
      authorized: true,
      role,
      congregationId,
      congregationName: assignmentState.congregationName,
      activeInLast30Min: activeCount,
      assignments: Object.freeze({
        open: Object.freeze(open),
        scheduled: Object.freeze(scheduled),
        total: rows.length
      })
    });
  }

  return Object.freeze({ load, isMinistryRole: role => MINISTRY_ROLES.has(String(role || '')) });
}
