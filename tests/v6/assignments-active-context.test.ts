import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAssignmentsService } from '../../src/app/assignments.js';

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function assignmentRow(congregationId: string, id: string) {
  return {
    id,
    congregation_id: congregationId,
    created_by: 'leader-1',
    title: `Task ${id}`,
    instructions: '',
    assignment_type: 'reading',
    scripture_refs: [],
    target_scope: 'all',
    target_id: null,
    due_at: null,
    points: 5,
    active: true,
    created_at: '2026-09-25T00:00:00.000Z',
    updated_at: '2026-09-25T00:00:00.000Z',
    schedule_at: null,
    recurrence_rule: null,
    reminder_at: null,
    required_reflection: false,
    min_quiz_score: null,
    evidence_type: 'none',
  };
}

function harness() {
  const memberships = [
    { congregationId: 'cong-a', userId: 'user-1', role: 'member', roleKnown: true, roleLabel: 'Member', congregation: { id: 'cong-a', name: 'Alpha' } },
    { congregationId: 'cong-b', userId: 'user-1', role: 'member', roleKnown: true, roleLabel: 'Member', congregation: { id: 'cong-b', name: 'Beta' } },
  ];
  let activeId = 'cong-a';
  const loadAStarted = deferred<void>();
  const releaseA = deferred<any>();
  let holdA = false;
  let startCalls = 0;

  const session = { getState: () => ({ authenticated: true, remoteAvailable: true, user: { id: 'user-1' } }) };
  const congregation = {
    async load() { return memberships; },
    getActive() { return memberships.find(row => row.congregationId === activeId) || null; },
    setActive(id: string) { activeId = id; },
    assert(id: string) {
      if (!memberships.some(row => row.congregationId === id)) throw new Error('not a member');
      return true;
    },
  };
  const api = {
    async load(congregationId: string) {
      if (congregationId === 'cong-a' && holdA) {
        loadAStarted.resolve();
        return releaseA.promise;
      }
      return { assignments: [assignmentRow(congregationId, `task-${congregationId}`)], progress: [] };
    },
    async start(congregationId: string, assignmentId: string) {
      startCalls += 1;
      return { progress: { assignment_id: assignmentId, user_id: 'user-1', status: 'started' }, awarded: 0, alreadyCompleted: false, congregationId };
    },
    async complete(_congregationId: string, assignmentId: string) {
      return { progress: { assignment_id: assignmentId, user_id: 'user-1', status: 'completed' }, awarded: 5, alreadyCompleted: false };
    },
    async subscribe() { return () => {}; },
  };

  return {
    service: createAssignmentsService({ api, session, congregation }),
    setActive(id: string) { congregation.setActive(id); },
    holdA() { holdA = true; },
    loadAStarted,
    releaseA,
    startCalls: () => startCalls,
  };
}

describe('Assignments active-congregation context', () => {
  it('does not publish an implicit congregation A load after the active congregation switches to B', async () => {
    const h = harness();
    h.holdA();

    const pendingA = h.service.load();
    await h.loadAStarted.promise;
    h.setActive('cong-b');
    h.releaseA.resolve({ assignments: [assignmentRow('cong-a', 'task-cong-a')], progress: [] });

    const stale = await pendingA;
    assert.equal(stale.status, 'idle');
    assert.equal(stale.congregationId, '');
    assert.deepEqual(stale.assignments, []);

    const fresh = await h.service.load();
    assert.equal(fresh.status, 'ready');
    assert.equal(fresh.congregationId, 'cong-b');
    assert.deepEqual(fresh.assignments.map((row: any) => row.id), ['task-cong-b']);
  });

  it('hides implicitly bound congregation A state immediately after the active congregation switches', async () => {
    const h = harness();
    const loaded = await h.service.load();
    assert.equal(loaded.congregationId, 'cong-a');

    h.setActive('cong-b');
    const visible = h.service.snapshot();
    assert.equal(visible.status, 'idle');
    assert.equal(visible.congregationId, '');
    assert.deepEqual(visible.assignments, []);

    assert.throws(
      () => h.service.open('task-cong-a'),
      (error: any) => error?.code === 'BQ_ASSIGNMENT_CONTEXT_STALE',
    );
    assert.equal(h.startCalls(), 0);
  });

  it('preserves the inherited explicit-congregation contract without binding it to the global active selection', async () => {
    const h = harness();
    h.setActive('cong-b');

    const explicit = await h.service.load({ congregationId: 'cong-a' });
    assert.equal(explicit.status, 'ready');
    assert.equal(explicit.congregationId, 'cong-a');
    assert.deepEqual(explicit.assignments.map((row: any) => row.id), ['task-cong-a']);

    const opened = h.service.open('task-cong-a');
    assert.equal(opened.activeId, 'task-cong-a');
  });
});
