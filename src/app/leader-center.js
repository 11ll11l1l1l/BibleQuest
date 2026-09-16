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

const safePerson = row => Object.freeze({ id: String(row?.id || ''), label: String(row?.label || ''), role: String(row?.role || '') });
const safeGroup = row => Object.freeze({ id: String(row?.id || ''), label: String(row?.label || '') });
const safeTeam = row => Object.freeze({ id: String(row?.id || ''), label: String(row?.label || ''), type: String(row?.type || '') });

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
    // Do not invent an assignment-level completion lifecycle. The row carries
    // only the caller's own progress, not aggregate member completion truth.
    const now = Date.now();
    const scheduled = rows.filter(row => row.scheduleAt && new Date(row.scheduleAt).getTime() > now);
    const open = rows.filter(row => !(row.scheduleAt && new Date(row.scheduleAt).getTime() > now));

    let activeCount = null;
    try {
      const presenceResult = await presence.activeCount(congregationId, 30);
      activeCount = presenceResult ? presenceResult.count : null;
    } catch { activeCount = null; }

    // Reuse the Assignments publishing directory because it is already scoped
    // to the active congregation and ministry-authorized. Only its public
    // id/label/role/type fields are projected into Leader Center; private
    // notes, Transform answers, Couples data and psychometrics are never read.
    let directoryStatus = 'unavailable';
    let people = Object.freeze([]), groups = Object.freeze([]), teams = Object.freeze([]);
    if (typeof assignments.loadPublishTargets === 'function') {
      try {
        const targetState = await assignments.loadPublishTargets();
        const targets = targetState?.publishTargets || {};
        people = Object.freeze((targets.members || []).map(safePerson));
        groups = Object.freeze((targets.groups || []).map(safeGroup));
        teams = Object.freeze((targets.teams || []).map(safeTeam));
        directoryStatus = 'ready';
      } catch { directoryStatus = 'unavailable'; }
    }

    return Object.freeze({
      status: 'ready',
      authorized: true,
      role,
      congregationId,
      congregationName: assignmentState.congregationName,
      activeInLast30Min: activeCount,
      memberCount: directoryStatus === 'ready' ? people.length : null,
      directoryStatus,
      people,
      groups,
      teams,
      assignments: Object.freeze({
        open: Object.freeze(open),
        scheduled: Object.freeze(scheduled),
        total: rows.length
      })
    });
  }

  async function openReview(assignmentId) {
    const id = String(assignmentId || '');
    if (!id) throw new Error('Choose an assignment to review.');
    if (typeof assignments.open !== 'function' || typeof assignments.loadReview !== 'function') {
      throw new Error('Assignment review is not available yet.');
    }
    assignments.open(id);
    return assignments.loadReview(id);
  }

  return Object.freeze({ load, openReview, isMinistryRole: role => MINISTRY_ROLES.has(String(role || '')) });
}
