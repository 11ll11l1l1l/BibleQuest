import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiscipleshipSupabaseRepository, createSupabaseDiscipleshipService } from '../../src/app/discipleship-supabase-adapter.js';
const context = { userId: 'learner', congregationId: 'church' };
const pair = { id: 'pair', congregationId: 'church', mentorId: 'mentor', menteeId: 'learner', state: 'active' };
function fixture() {
  const writes = [];
  const tables = {
    v7_mentor_pairs: [{ id: 'pair', congregation_id: 'church', mentor_id: 'mentor', mentee_id: 'learner', state: 'active' }],
    v7_pair_assignments: [{ id: 'assignment', pair_id: 'pair', lesson_revision_id: 'pinned', status: 'assigned' }, { id: 'cancelled', pair_id: 'pair', lesson_revision_id: 'old', status: 'cancelled' }],
    v7_lesson_revisions: [{ id: 'pinned', lesson_id: 'lesson', published_at: 'today' }, { id: 'newest', lesson_id: 'lesson', published_at: 'today' }],
    v7_lessons: [{ id: 'lesson', module_id: 'module', title: 'Lesson', revision_id: 'logical', display_order: 0, publication_state: 'published' }],
    v7_modules: [{ id: 'module', track_id: 'track', title: 'Module', revision_id: 'module-r', display_order: 0, publication_state: 'published' }],
    v7_tracks: [{ id: 'track', congregation_id: 'church', title: 'Track', revision_id: 'track-r', display_order: 0, publication_state: 'published' }],
    v7_lesson_steps: ['scripture', 'understand', 'discuss', 'reflect', 'apply', 'pray', 'action'].map((step_type, position) => ({ id: `step-${position}`, lesson_revision_id: 'pinned', position, step_type })),
    v7_learner_progress: [{ assignment_id: 'assignment', learner_id: 'learner', lesson_revision_id: 'pinned', status: 'in_progress', response: 'secret' }],
    v7_lesson_responses: [{ id: 'response', assignment_id: 'assignment', learner_id: 'learner', lesson_revision_id: 'pinned', lesson_step_id: 'step-3' }],
    v7_response_shares: [],
  };
  const queries = [];
  const client = { from(table) {
    const filters = [];
    let columns = '*'; let mutation;
    const q = {
      select(value) { columns = value; return q; },
      eq(key, value) { filters.push(r => r[key] === value); return q; },
      neq(key, value) { filters.push(r => r[key] !== value); return q; },
      in(key, values) { filters.push(r => values.includes(r[key])); return q; },
      not(key, op, value) { assert.equal(op, 'is'); filters.push(r => r[key] !== value); return q; },
      order() { return q; },
      upsert(value, options) { mutation = { table, value, options }; return q; },
      async then(resolve, reject) {
        try {
          queries.push({ table, columns });
          if (mutation) writes.push(mutation);
          const data = (mutation ? [mutation.value] : tables[table].filter(r => filters.every(f => f(r))))
            .map(r => Object.fromEntries(columns.replace(/shares:[^(]+\([^)]*\)/g, 'shares').split(',').map(c => [c, r[c]])));
          return resolve({ data, error: null });
        } catch (e) { return reject(e); }
      },
    };
    return q;
  } };
  return { tables, queries, writes, client, repository: createDiscipleshipSupabaseRepository(client) };
}
test('curriculum uses assigned published revision rather than latest logical lesson revision', async () => {
  const f = fixture();
  const result = await f.repository.loadCurriculum(pair, context);
  assert.equal(result[0].modules[0].lessons[0].revisionId, 'pinned');
  const lesson = await f.repository.loadLessonRevision('pinned', pair, context);
  assert.equal(lesson.steps.length, 7);
  await assert.rejects(f.repository.loadLessonRevision('newest', pair, context), { code: 'BQ_DISCIPLESHIP_ASSIGNMENT_REQUIRED' });
});
test('progress selects only operational fields and writes only the resolved assignment', async () => {
  const f = fixture();
  const result = await f.repository.loadOperationalProgress('pinned', pair, context);
  assert.equal(Object.hasOwn(result[0], 'response'), false);
  await f.repository.saveProgress('pinned', { status: 'in_progress', currentStepId: 'step-0', reflection: 'never copied', learnerId: 'other' }, pair, context);
  assert.equal(f.writes[0].value.assignment_id, 'assignment');
  assert.equal(f.writes[0].value.learner_id, 'learner');
  assert.equal(Object.hasOwn(f.writes[0].value, 'reflection'), false);
  assert.equal(f.writes[0].options.onConflict, 'assignment_id,learner_id');
});
test('ambiguous assignments, mentor writes, cross-tenant curriculum and invalid completion fail closed', async () => {
  const f = fixture();
  await assert.rejects(f.repository.saveProgress('pinned', { status: 'completed' }, pair, context), { code: 'BQ_DISCIPLESHIP_PROGRESS_INVALID' });
  await assert.rejects(f.repository.saveProgress('pinned', { status: 'in_progress' }, pair, { ...context, userId: 'mentor' }), { code: 'BQ_DISCIPLESHIP_SCOPE_DENIED' });
  f.tables.v7_tracks[0].congregation_id = 'other';
  await assert.rejects(f.repository.loadCurriculum(pair, context), { code: 'BQ_DISCIPLESHIP_CURRICULUM_SCOPE' });
  f.tables.v7_pair_assignments.push({ id: 'duplicate', pair_id: 'pair', lesson_revision_id: 'pinned', status: 'assigned' });
  await assert.rejects(f.repository.saveProgress('pinned', { status: 'in_progress' }, pair, context), { code: 'BQ_DISCIPLESHIP_ASSIGNMENT_REQUIRED' });
  assert.equal(f.writes.length, 0);
});
test('private responses create no shares; sharing validates response assignment, step and named mentor', async () => {
  const f = fixture();
  const args = { lessonRevisionId: 'pinned', stepId: 'step-3', responseId: 'response', response: { text: 'private' }, pair, context };
  await f.repository.savePrivateResponse(args);
  assert.equal(f.writes[0].table, 'v7_lesson_responses');
  await assert.rejects(f.repository.setResponseShare({ ...args, stepId: 'wrong', audienceUserIds: ['mentor'] }), { code: 'BQ_DISCIPLESHIP_SHARE_DENIED' });
  await assert.rejects(f.repository.setResponseShare({ ...args, audienceUserIds: ['other'] }), { code: 'BQ_DISCIPLESHIP_SHARE_DENIED' });
  await f.repository.setResponseShare({ ...args, audienceUserIds: ['mentor'] });
  assert.equal(f.writes[1].value.recipient_id, 'mentor');
});
test('composed service stops a mutation if context changes during assignment lookup', async () => {
  const f = fixture();
  let active = { ...context };
  const original = f.client.from;
  f.client.from = table => {
    const q = original(table);
    if (table === 'v7_pair_assignments') {
      const then = q.then;
      q.then = (resolve, reject) => then(result => { active = { ...context, congregationId: 'other' }; resolve(result); }, reject);
    }
    return q;
  };
  const service = await createSupabaseDiscipleshipService({ client: f.client,
    session: { getState: () => ({ authenticated: true, user: { id: 'learner' } }) }, membership: { getActive: () => active } });
  await assert.rejects(service.saveProgress('pair', 'pinned', { status: 'in_progress' }), { code: 'BQ_DISCIPLESHIP_CONTEXT_STALE' });
  assert.equal(f.writes.length, 0);
});

test('shared composition preserves curriculum methods while using the hardened pair reader', async () => {
  const {client}=fixture();
  let reads=0;
  const service=createSupabaseDiscipleshipService({client,
    session:{getState:()=>({authenticated:true,user:{id:'learner'}})},
    membership:{getActive:()=>({userId:'learner',congregationId:'church'})},
    pairRepository:{listPairs:async()=>{reads++;return [pair]},getPair:async()=>pair},
  });
  assert.equal((await service.listPairs())[0].id,'pair');
  assert.equal(reads,1);
  const curriculum=await service.loadCurriculum('pair');
  assert.equal(curriculum[0].modules[0].lessons[0].revisionId,'pinned');
  assert.equal(typeof service.saveProgress,'function');
});

test('private resume queries only the resolved assignment, revision and learner without any share writes', async () => {
  const f = fixture();
  f.tables.v7_lesson_responses[0].response = { text: 'Synthetic reflection' };
  f.tables.v7_lesson_responses.push(
    { ...f.tables.v7_lesson_responses[0], id: 'other-owner', learner_id: 'mentor' },
    { ...f.tables.v7_lesson_responses[0], id: 'other-assignment', assignment_id: 'foreign' },
    { ...f.tables.v7_lesson_responses[0], id: 'other-revision', lesson_revision_id: 'old' });
  const service = createSupabaseDiscipleshipService({ client: f.client,
    session: { getState: () => ({ authenticated: true, user: { id: 'learner' } }) },
    membership: { getActive: () => context } });
  const result = await service.loadPrivateResponses('pair', 'pinned');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'response');
  assert.equal(result[0].response.text, 'Synthetic reflection');
  assert.equal(f.writes.length, 0);
  await assert.rejects(f.repository.loadPrivateResponses('pinned', pair, { ...context, userId: 'mentor' }),
    { code: 'BQ_DISCIPLESHIP_SCOPE_DENIED' });
});

test('private resume stops before the response query if scope changes during assignment lookup', async () => {
  const f = fixture();
  let active = { ...context };
  const original = f.client.from;
  f.client.from = table => {
    const q = original(table);
    if (table === 'v7_pair_assignments') {
      const then = q.then;
      q.then = (resolve, reject) => then(result => { active = { ...context, congregationId: 'other' }; resolve(result); }, reject);
    }
    return q;
  };
  const service = createSupabaseDiscipleshipService({ client: f.client,
    session: { getState: () => ({ authenticated: true, user: { id: 'learner' } }) },
    membership: { getActive: () => active } });
  await assert.rejects(service.loadPrivateResponses('pair', 'pinned'), { code: 'BQ_DISCIPLESHIP_CONTEXT_STALE' });
  assert.equal(f.queries.some(query => query.table === 'v7_lesson_responses'), false);
});

test('owner resume retains active named sharing and ignores revoked audiences', async () => {
  const f = fixture();
  f.tables.v7_lesson_responses[0].response = { text: 'Synthetic shared response' };
  f.tables.v7_lesson_responses[0].shares = [
    { recipient_id: 'mentor', share_state: 'shared' }, { recipient_id: 'previous-recipient', share_state: 'revoked' },
  ];
  const service = createSupabaseDiscipleshipService({ client: f.client,
    session: { getState: () => ({ authenticated: true, user: { id: 'learner' } }) }, membership: { getActive: () => context } });
  const [result] = await service.loadPrivateResponses('pair', 'pinned');
  assert.equal(result.visibility, 'shared');
  assert.deepEqual(result.audienceUserIds, ['mentor']);
  assert.match(f.queries.find(query => query.table === 'v7_lesson_responses').columns, /shares:v7_response_shares/);
  assert.equal(f.writes.length, 0);
});
