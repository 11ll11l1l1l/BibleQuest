// BibleQuest V5 Leader Center composes already-authorized owners. Assignment
// lifecycle truth is projected by assignments.js from the current resolved
// recipient set plus completion-presence records. Private response text stays
// inside the existing assignment review boundary.
const MINISTRY_ROLES = new Set(['facilitator', 'leader', 'pastor', 'admin']);

const safePerson = row => Object.freeze({ id: String(row?.id || ''), label: String(row?.label || ''), role: String(row?.role || '') });
const safeGroup = row => Object.freeze({ id: String(row?.id || ''), label: String(row?.label || '') });
const safeTeam = row => Object.freeze({ id: String(row?.id || ''), label: String(row?.label || ''), type: String(row?.type || '') });
const safeLifecycle = row => Object.freeze({
  assignmentId: String(row?.assignmentId || ''),
  status: ['published','scheduled','completed'].includes(String(row?.status)) ? String(row.status) : 'published',
  targetCount: Math.max(0, Number(row?.targetCount) || 0),
  completedCount: Math.max(0, Number(row?.completedCount) || 0),
  remainingCount: Math.max(0, Number(row?.remainingCount) || 0)
});

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

    let activeCount = null;
    try {
      const presenceResult = await presence.activeCount(congregationId, 30);
      activeCount = presenceResult ? presenceResult.count : null;
    } catch { activeCount = null; }

    let directoryStatus = 'unavailable';
    let lifecycleStatus = 'unavailable';
    let people = Object.freeze([]), groups = Object.freeze([]), teams = Object.freeze([]), lifecycleRows = Object.freeze([]);
    if (typeof assignments.loadLifecycleSummaries === 'function') {
      try {
        lifecycleRows = Object.freeze((await assignments.loadLifecycleSummaries()).map(safeLifecycle));
        lifecycleStatus = 'ready';
        const targetState = assignments.snapshot();
        const targets = targetState?.publishTargets || {};
        people = Object.freeze((targets.members || []).map(safePerson));
        groups = Object.freeze((targets.groups || []).map(safeGroup));
        teams = Object.freeze((targets.teams || []).map(safeTeam));
        directoryStatus = 'ready';
      } catch {
        lifecycleStatus = 'unavailable';
      }
    } else if (typeof assignments.loadPublishTargets === 'function') {
      try {
        const targetState = await assignments.loadPublishTargets();
        const targets = targetState?.publishTargets || {};
        people = Object.freeze((targets.members || []).map(safePerson));
        groups = Object.freeze((targets.groups || []).map(safeGroup));
        teams = Object.freeze((targets.teams || []).map(safeTeam));
        directoryStatus = 'ready';
      } catch { directoryStatus = 'unavailable'; }
    }

    const lifecycleById = new Map(lifecycleRows.map(item => [item.assignmentId, item]));
    const projected = Object.freeze(rows.map(row => Object.freeze({ ...row, lifecycle: lifecycleById.get(String(row.id)) || null })));
    const published = Object.freeze(projected.filter(row => row.lifecycle?.status === 'published'));
    const scheduled = Object.freeze(projected.filter(row => row.lifecycle?.status === 'scheduled'));
    const completed = Object.freeze(projected.filter(row => row.lifecycle?.status === 'completed'));
    const weeklyAnchor = projected
      .filter(row => row.lifecycle?.status !== 'scheduled' && Array.isArray(row.scriptureRefs) && row.scriptureRefs.length)
      .slice()
      .sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))[0] || null;

    return Object.freeze({
      status: 'ready',
      authorized: true,
      role,
      congregationId,
      congregationName: assignmentState.congregationName,
      activeInLast30Min: activeCount,
      memberCount: directoryStatus === 'ready' ? people.length : null,
      directoryStatus,
      lifecycleStatus,
      people,
      groups,
      teams,
      weeklyAnchor,
      assignments: Object.freeze({
        published,
        scheduled,
        completed,
        open: published,
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