// BibleQuest V5 Phase 1: Leader Center edge coverage. Verifies this is pure
// composition - it must never invent access beyond what assignments.js and
// presence.js already independently authorize.
import assert from 'node:assert/strict';
import { createLeaderCenterService } from '../src/app/leader-center.js';

function fakeAssignments(state) {
  return {
    async load() { return state; },
    snapshot() { return state; }
  };
}
function fakePresence(count) {
  const calls = [];
  return { calls, async activeCount(congregationId, windowMinutes) { calls.push({ congregationId, windowMinutes }); return count === null ? null : { count, windowMinutes }; } };
}

// --- Construction requires the real owners, not a lighter substitute ---
assert.throws(() => createLeaderCenterService({}), /requires the existing Assignments and Presence owners/);

// --- Signed-out caller: no access, no data read ---
{
  const assignments = fakeAssignments({ status: 'idle' });
  const presence = fakePresence(5);
  const service = createLeaderCenterService({ assignments, presence });
  const state = await service.load();
  assert.equal(state.status, 'signed-out');
  assert.equal(state.authorized, false);
  assert.equal(presence.calls.length, 0, 'Presence must never be queried for a signed-out caller.');
}

// --- Ordinary member: assignments.js says role=member, must be denied here too ---
{
  const assignments = fakeAssignments({ status: 'ready', role: 'member', congregationId: 'c1', congregationName: 'Test', assignments: [] });
  const presence = fakePresence(5);
  const service = createLeaderCenterService({ assignments, presence });
  const state = await service.load();
  assert.equal(state.status, 'unauthorized');
  assert.equal(state.authorized, false);
  assert.equal(presence.calls.length, 0, 'Presence must never be queried for an unauthorized role - this is not merely UI hiding.');
}

// --- Each ministry role must be allowed ---
for (const role of ['facilitator', 'leader', 'pastor', 'admin']) {
  const assignments = fakeAssignments({ status: 'ready', role, congregationId: 'c1', congregationName: 'Test Congregation', assignments: [] });
  const presence = fakePresence(3);
  const service = createLeaderCenterService({ assignments, presence });
  const state = await service.load();
  assert.equal(state.status, 'ready', `Role '${role}' must be authorized for the Leader Center.`);
  assert.equal(state.congregationName, 'Test Congregation');
  assert.equal(state.activeInLast30Min, 3);
  assert.equal(presence.calls[0].congregationId, 'c1', 'Leader Center must query presence for the caller\'s own active congregation, not a different one.');
}
assert.equal(createLeaderCenterService(({ assignments: fakeAssignments({}), presence: fakePresence(0) })).isMinistryRole('member'), false);
assert.equal(createLeaderCenterService(({ assignments: fakeAssignments({}), presence: fakePresence(0) })).isMinistryRole('leader'), true);

// --- Assignment categorization: scheduled vs open, using real fields only ---
{
  const now = Date.now();
  const rows = [
    { id: 'a1', scheduleAt: null, title: 'Open one' },
    { id: 'a2', scheduleAt: new Date(now + 86400000).toISOString(), title: 'Scheduled future' },
    { id: 'a3', scheduleAt: new Date(now - 86400000).toISOString(), title: 'Past schedule, now open' }
  ];
  const assignments = fakeAssignments({ status: 'ready', role: 'leader', congregationId: 'c1', congregationName: 'Test', assignments: rows });
  const presence = fakePresence(0);
  const service = createLeaderCenterService({ assignments, presence });
  const state = await service.load();
  assert.equal(state.assignments.total, 3);
  assert.equal(state.assignments.scheduled.length, 1);
  assert.equal(state.assignments.scheduled[0].id, 'a2');
  assert.equal(state.assignments.open.length, 2);
}

// --- Presence must never block the Overview if it fails ---
{
  const assignments = fakeAssignments({ status: 'ready', role: 'leader', congregationId: 'c1', congregationName: 'Test', assignments: [] });
  const presence = { async activeCount() { throw new Error('presence backend unavailable'); } };
  const service = createLeaderCenterService({ assignments, presence });
  const state = await service.load();
  assert.equal(state.status, 'ready', 'A presence failure must not take down the whole Leader Center Overview.');
  assert.equal(state.activeInLast30Min, null);
}

console.log('BibleQuest v5 Leader Center edge regression passed.');
