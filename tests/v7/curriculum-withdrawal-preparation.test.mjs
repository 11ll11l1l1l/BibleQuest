import test from 'node:test';
import assert from 'node:assert/strict';
import { createWithdrawalPreparationRepository } from '../../src/features/curriculum-authoring/withdrawal-preparation.js';

const ids = Object.freeze({
  user: '11111111-1111-4111-8111-111111111111',
  congregation: '22222222-2222-4222-8222-222222222222',
  track: '33333333-3333-4333-8333-333333333333',
  module: '44444444-4444-4444-8444-444444444444',
  lesson: '55555555-5555-4555-8555-555555555555',
  revision: '66666666-6666-4666-8666-666666666666',
  trackRevision: '77777777-7777-4777-8777-777777777777',
  moduleRevision: '88888888-8888-4888-8888-888888888888',
  lessonRevision: '99999999-9999-4999-8999-999999999999',
  other: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
});

const rows = overrides => [
  { data: { id: ids.track, congregation_id: ids.congregation, revision_id: ids.trackRevision, publication_state: 'published', ...(overrides?.track || {}) }, error: null },
  { data: { id: ids.module, track_id: ids.track, revision_id: ids.moduleRevision, publication_state: 'published', ...(overrides?.module || {}) }, error: null },
  { data: { id: ids.lesson, module_id: ids.module, revision_id: ids.lessonRevision, publication_state: 'published', ...(overrides?.lesson || {}) }, error: null },
  { data: [{ id: ids.revision, lesson_id: ids.lesson, published_at: '2026-10-05T00:00:00Z', ...(overrides?.revision || {}) }], error: null },
];

function fixture(responses) {
  let scope = { userId: ids.user, congregationId: ids.congregation, canAuthor: true };
  let index = 0;
  const calls = [];
  const client = {
    from(table) {
      const call = { table, filters: [] };
      calls.push(call);
      const query = {
        select(columns) { call.columns = columns; return this; },
        eq(key, value) { call.filters.push(['eq', key, value]); return this; },
        not(key, operator, value) { call.filters.push(['not', key, operator, value]); return this; },
        order(key, options) { call.order = [key, options]; return this; },
        limit(value) { call.limit = value; return this; },
        maybeSingle() { call.maybeSingle = true; return this; },
        then(resolve, reject) {
          const response = typeof responses === 'function' ? responses(call, index++) : responses[index++];
          return Promise.resolve(response).then(resolve, reject);
        },
      };
      return query;
    },
  };
  return {
    calls,
    setScope(value) { scope = value; },
    repository: createWithdrawalPreparationRepository({ client, getContext: () => scope }),
  };
}

test('reconstructs the exact immutable withdrawal request after reload', async () => {
  const f = fixture(rows());
  const request = await f.repository.prepare(ids.track, ids.module, ids.lesson);
  assert.deepEqual(request, {
    trackId: ids.track,
    moduleId: ids.module,
    lessonId: ids.lesson,
    lessonRevisionId: ids.revision,
    expectedTrackRevisionId: ids.trackRevision,
    expectedModuleRevisionId: ids.moduleRevision,
    expectedLessonRevisionId: ids.lessonRevision,
  });
  assert.ok(Object.isFrozen(request));
  assert.deepEqual(f.calls[0].filters, [['eq', 'id', ids.track], ['eq', 'congregation_id', ids.congregation]]);
  assert.deepEqual(f.calls[1].filters, [['eq', 'id', ids.module], ['eq', 'track_id', ids.track]]);
  assert.deepEqual(f.calls[2].filters, [['eq', 'id', ids.lesson], ['eq', 'module_id', ids.module]]);
  assert.deepEqual(f.calls[3].filters, [['eq', 'lesson_id', ids.lesson], ['not', 'published_at', 'is', null]]);
  assert.equal(f.calls[3].limit, 2);
});

test('already withdrawn lesson can reconstruct the same idempotent retry request', async () => {
  const f = fixture(rows({ lesson: { publication_state: 'withdrawn' } }));
  const request = await f.repository.prepare(ids.track, ids.module, ids.lesson);
  assert.equal(request.lessonRevisionId, ids.revision);
});

test('rejects draft or malformed hierarchy before producing a withdrawal request', async () => {
  for (const [override, expectedCalls] of [
    [{ track: { publication_state: 'draft' } }, 1],
    [{ module: { publication_state: 'draft' } }, 2],
    [{ lesson: { publication_state: 'draft' } }, 3],
  ]) {
    const f = fixture(rows(override));
    await assert.rejects(f.repository.prepare(ids.track, ids.module, ids.lesson), { code: 'BQ_AUTHORING_WITHDRAWAL_STATE' });
    assert.equal(f.calls.length, expectedCalls);
  }
});

test('requires exactly one published lesson revision and validates its identity', async () => {
  let f = fixture([...rows().slice(0, 3), { data: [], error: null }]);
  await assert.rejects(f.repository.prepare(ids.track, ids.module, ids.lesson), { code: 'BQ_AUTHORING_WITHDRAWAL_REVISION' });

  f = fixture([...rows().slice(0, 3), { data: [rows()[3].data[0], { ...rows()[3].data[0], id: ids.other }], error: null }]);
  await assert.rejects(f.repository.prepare(ids.track, ids.module, ids.lesson), { code: 'BQ_AUTHORING_WITHDRAWAL_REVISION' });

  f = fixture(rows({ revision: { lesson_id: ids.other } }));
  await assert.rejects(f.repository.prepare(ids.track, ids.module, ids.lesson), { code: 'BQ_AUTHORING_RESPONSE' });
});

test('context changes and backend denial fail closed', async () => {
  let f;
  f = fixture((call, index) => {
    if (index === 0) {
      f.setScope({ userId: ids.user, congregationId: ids.other, canAuthor: true });
      return rows()[0];
    }
    return { data: null, error: null };
  });
  await assert.rejects(f.repository.prepare(ids.track, ids.module, ids.lesson), { code: 'BQ_AUTHORING_CONTEXT_STALE' });
  assert.equal(f.calls.length, 1);

  const denial = new Error('permission denied');
  f = fixture([{ data: null, error: denial }]);
  await assert.rejects(f.repository.prepare(ids.track, ids.module, ids.lesson), error => error === denial);
});

test('capability denial and malformed IDs fail before database access', async () => {
  const f = fixture([]);
  f.setScope({ userId: ids.user, congregationId: ids.congregation, canAuthor: false });
  await assert.rejects(f.repository.prepare(ids.track, ids.module, ids.lesson), { code: 'BQ_AUTHORING_DENIED' });
  f.setScope({ userId: ids.user, congregationId: ids.congregation, canAuthor: true });
  await assert.rejects(f.repository.prepare('bad-id', ids.module, ids.lesson), { code: 'BQ_AUTHORING_ID' });
  assert.equal(f.calls.length, 0);
});
