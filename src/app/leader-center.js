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
    const contextStillCurrent=()=>{
      const current=assignments.snapshot();
      if(current?.status!=='ready'||current.congregationId!==congregationId||String(current.role||'')!==role)return false;
      if(assignmentState.userId&&current.userId!==assignmentState.userId)return false;
      return true;
    };
    const staleResult=()=>Object.freeze({status:'unauthorized',authorized:false});
    if(!contextStillCurrent())return staleResult();
    let lifecycleStatus='unavailable',lifecycle=[];
    if(typeof assignments.loadLifecycle==='function'){
      try{lifecycle=await assignments.loadLifecycle();lifecycleStatus='ready'}catch{lifecycleStatus='unavailable'}
    }
    if(!contextStillCurrent())return staleResult();
    const lifecycleById=new Map(lifecycle.map(row=>[row.assignmentId,row]));
    const projected=rows.map(row=>Object.freeze({...row,lifecycle:lifecycleById.get(row.id)||null}));
    const scheduled=projected.filter(row=>row.lifecycle?.status==='scheduled');
    const completed=projected.filter(row=>row.lifecycle?.status==='completed');
    const published=projected.filter(row=>row.lifecycle?.status==='published');
    const unclassified=projected.filter(row=>!row.lifecycle);

    let activeCount = null;
    try {
      const presenceResult = await presence.activeCount(congregationId, 30);
      activeCount = presenceResult ? presenceResult.count : null;
    } catch { activeCount = null; }
    if(!contextStillCurrent())return staleResult();

    // Reuse the Assignments publishing directory because it is already scoped
    // to the active congregation and ministry-authorized. Only its public
    // id/label/role/type fields are projected into Leader Center; unrelated
    // sensitive domains are never read by this owner.
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
    if(!contextStillCurrent())return staleResult();

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
        published: Object.freeze(published),
        scheduled: Object.freeze(scheduled),
        completed: Object.freeze(completed),
        unclassified: Object.freeze(unclassified),
        lifecycleStatus,
        denominator:'current-active-target-recipients',
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
