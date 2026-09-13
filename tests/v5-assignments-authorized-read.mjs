import assert from 'node:assert/strict';
import {
  AssignmentsResponseError,
  createAuthorizedAssignmentsRepository
} from '../src/v5/data/assignments/authorized-read.ts';

const fixedNow = () => new Date('2026-09-13T04:00:00.000Z');

function makePort({ assignments = [], progress = [] } = {}) {
  const calls = [];
  return {
    calls,
    port: {
      async selectActiveAssignments(input) {
        calls.push(['assignments', input]);
        return assignments;
      },
      async selectUserProgress(input) {
        calls.push(['progress', input]);
        return progress;
      }
    }
  };
}

{
  const fake = makePort({
    assignments: [
      {
        id: 'a-open', congregation_id: 'c1', title: 'Read John 1', assignment_type: 'reading',
        due_at: '2026-09-14T04:00:00Z', schedule_at: null, active: true
      },
      {
        id: 'a-overdue', congregation_id: 'c1', title: 'Reflection', assignment_type: 'reflection',
        due_at: '2026-09-12T04:00:00Z', schedule_at: null, active: true
      },
      {
        id: 'a-scheduled', congregation_id: 'c1', title: 'Future study', assignment_type: 'guided-study',
        due_at: null, schedule_at: '2026-09-15T04:00:00Z', active: true
      },
      {
        id: 'a-complete', congregation_id: 'c1', title: 'Finished mission', assignment_type: 'mission',
        due_at: '2026-09-12T04:00:00Z', schedule_at: null, active: true
      }
    ],
    progress: [
      { assignment_id: 'a-open', user_id: 'u1', status: 'started' },
      { assignment_id: 'a-complete', user_id: 'u1', status: 'completed' },
      { assignment_id: 'a-overdue', user_id: 'someone-else', status: 'completed' },
      { assignment_id: 'not-visible', user_id: 'u1', status: 'completed' }
    ]
  });
  const repository = createAuthorizedAssignmentsRepository({ port: fake.port, now: fixedNow });
  const rows = await repository.listVisible({ userId: 'u1', congregationId: 'c1' });

  assert.deepEqual(fake.calls[0], ['assignments', { congregationId: 'c1', limit: 200 }]);
  assert.deepEqual(fake.calls[1], ['progress', {
    userId: 'u1', assignmentIds: ['a-open', 'a-overdue', 'a-scheduled', 'a-complete']
  }]);
  assert.equal(rows[0].progressStatus, 'started');
  assert.equal(rows[0].dueState, 'open');
  assert.equal(rows[1].progressStatus, 'assigned');
  assert.equal(rows[1].dueState, 'overdue');
  assert.equal(rows[2].dueState, 'scheduled');
  assert.equal(rows[3].dueState, 'completed');
}

{
  const fake = makePort({
    assignments: [{
      id: 'foreign', congregation_id: 'c2', title: 'Wrong tenant', assignment_type: 'reading',
      due_at: null, schedule_at: null, active: true
    }]
  });
  const repository = createAuthorizedAssignmentsRepository({ port: fake.port, now: fixedNow });
  await assert.rejects(
    () => repository.listVisible({ userId: 'u1', congregationId: 'c1' }),
    (error) => error instanceof AssignmentsResponseError && /outside the active congregation/.test(error.message)
  );
  assert.equal(fake.calls.length, 1, 'foreign assignment response must stop before progress lookup');
}

{
  const fake = makePort({
    assignments: [{
      id: 'a1', congregation_id: 'c1', title: 'Valid task', assignment_type: 'reading',
      due_at: null, schedule_at: null, active: true
    }],
    progress: [{ assignment_id: 'a1', user_id: 'u1', status: 'privileged' }]
  });
  const repository = createAuthorizedAssignmentsRepository({ port: fake.port, now: fixedNow });
  await assert.rejects(
    () => repository.listVisible({ userId: 'u1', congregationId: 'c1' }),
    (error) => error instanceof AssignmentsResponseError && /status was unsupported/.test(error.message)
  );
}

{
  const fake = makePort();
  const repository = createAuthorizedAssignmentsRepository({ port: fake.port, now: fixedNow });
  await assert.rejects(() => repository.listVisible({ userId: '', congregationId: 'c1' }), AssignmentsResponseError);
  await assert.rejects(() => repository.listVisible({ userId: 'u1', congregationId: '' }), AssignmentsResponseError);
  assert.equal(fake.calls.length, 0, 'invalid caller scope must fail before transport access');
}

console.log('V5 authorized assignments read contracts: PASS');
