import test from 'node:test';
import assert from 'node:assert/strict';
import { createV7AssignmentAuthority } from '../../src/app/v7-assignment-authority.js';

const request = Object.freeze({
  pairId: 'pair-1',
  trackId: 'track-1',
  moduleId: 'module-1',
  lessonId: 'lesson-1',
  lessonRevisionId: 'revision-1',
});

function fixture({ result = [{ assignment_id: 'assignment-1', assignment_status: 'assigned' }], error = null } = {}) {
  let active = { userId: 'mentor-1', congregationId: 'church-1' };
  const calls = [];
  const client = {
    async rpc(name, args) {
      calls.push({ name, args: { ...args } });
      return { data: result, error };
    },
  };
  const authority = createV7AssignmentAuthority({
    client,
    session: { getState: () => ({ authenticated: true, user: { id: active.userId } }) },
    membership: { getActive: () => active },
  });
  return { authority, calls, setActive(value) { active = value; } };
}

test('forwards only the frozen prepared hierarchy to the server-owned assignment RPC', async () => {
  const f = fixture();
  const result = await f.authority.createAssignment(request);
  assert.deepEqual(f.calls, [{
    name: 'bible_v7_create_pair_assignment',
    args: {
      p_pair_id: 'pair-1',
      p_track_id: 'track-1',
      p_module_id: 'module-1',
      p_lesson_id: 'lesson-1',
      p_lesson_revision_id: 'revision-1',
    },
  }]);
  assert.deepEqual(result, { id: 'assignment-1', status: 'assigned', ...request });
  assert.ok(Object.isFrozen(result));
  assert.equal(Object.hasOwn(f.calls[0].args, 'actor_id'), false);
  assert.equal(Object.hasOwn(f.calls[0].args, 'congregation_id'), false);
});

test('accepts stable non-cancelled retry states returned by the backend', async () => {
  for (const status of ['assigned', 'started', 'completed']) {
    const f = fixture({ result: [{ assignment_id: 'stable-assignment', assignment_status: status }] });
    assert.equal((await f.authority.createAssignment(request)).status, status);
  }
});

test('fails closed on missing or malformed assignment acknowledgement', async () => {
  await assert.rejects(fixture({ result: [] }).authority.createAssignment(request), { code: 'BQ_ASSIGNMENT_ACK_INVALID' });
  await assert.rejects(fixture({ result: [{ assignment_id: '', assignment_status: 'assigned' }] }).authority.createAssignment(request), { code: 'BQ_ASSIGNMENT_ACK_INVALID' });
  await assert.rejects(fixture({ result: [{ assignment_id: 'assignment-1', assignment_status: 'cancelled' }] }).authority.createAssignment(request), { code: 'BQ_ASSIGNMENT_ACK_INVALID' });
});

test('propagates backend authorization failures without retrying the mutation', async () => {
  const denied = Object.assign(new Error('denied'), { code: '42501' });
  const f = fixture({ error: denied, result: null });
  await assert.rejects(f.authority.createAssignment(request), denied);
  assert.equal(f.calls.length, 1);
});

test('account or congregation changes invalidate an in-flight assignment result', async () => {
  let resolve;
  const rpc = new Promise(r => { resolve = r; });
  let active = { userId: 'mentor-1', congregationId: 'church-1' };
  let calls = 0;
  const authority = createV7AssignmentAuthority({
    client: { async rpc() { calls += 1; return rpc; } },
    session: { getState: () => ({ authenticated: true, user: { id: active.userId } }) },
    membership: { getActive: () => active },
  });
  const pending = authority.createAssignment(request);
  active = { userId: 'mentor-1', congregationId: 'church-2' };
  resolve({ data: [{ assignment_id: 'assignment-1', assignment_status: 'assigned' }], error: null });
  await assert.rejects(pending, { code: 'BQ_ASSIGNMENT_CONTEXT_STALE' });
  assert.equal(calls, 1);
});

test('requires every immutable hierarchy identifier before opening the RPC', async () => {
  const f = fixture();
  await assert.rejects(f.authority.createAssignment({ ...request, lessonRevisionId: '' }), { code: 'BQ_ASSIGNMENT_IDENTIFIER_REQUIRED' });
  assert.equal(f.calls.length, 0);
});
