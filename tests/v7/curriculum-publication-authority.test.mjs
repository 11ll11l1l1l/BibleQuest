import test from 'node:test';
import assert from 'node:assert/strict';
import { createCurriculumPublicationAuthority } from '../../src/features/curriculum-authoring/publication-authority.js';

const ids = Object.freeze({
  userId: '11111111-1111-4111-8111-111111111111',
  congregationId: '22222222-2222-4222-8222-222222222222',
  trackId: '33333333-3333-4333-8333-333333333333',
  moduleId: '44444444-4444-4444-8444-444444444444',
  lessonId: '55555555-5555-4555-8555-555555555555',
  lessonRevisionId: '66666666-6666-4666-8666-666666666666',
  trackRevisionId: '77777777-7777-4777-8777-777777777777',
  moduleRevisionId: '88888888-8888-4888-8888-888888888888',
  lessonHierarchyRevisionId: '99999999-9999-4999-8999-999999999999',
  libraryRevisionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
});

function prepared(overrides = {}) {
  return {
    trackId: ids.trackId,
    moduleId: ids.moduleId,
    lessonId: ids.lessonId,
    lessonRevisionId: ids.lessonRevisionId,
    expectedTrackRevisionId: ids.trackRevisionId,
    expectedModuleRevisionId: ids.moduleRevisionId,
    expectedLessonRevisionId: ids.lessonHierarchyRevisionId,
    libraryRevisionIds: [ids.libraryRevisionId],
    ...overrides,
  };
}

function row(lessonState = 'published', overrides = {}) {
  return {
    congregation_id: ids.congregationId,
    track_id: ids.trackId,
    module_id: ids.moduleId,
    lesson_id: ids.lessonId,
    lesson_revision_id: ids.lessonRevisionId,
    track_publication_state: 'published',
    module_publication_state: 'published',
    lesson_publication_state: lessonState,
    published_at: '2026-10-05T00:00:00Z',
    ...overrides,
  };
}

function context() {
  return { userId: ids.userId, congregationId: ids.congregationId, canAuthor: true };
}

test('publishes the exact prepared path through the schema-owned RPC and validates its receipt', async () => {
  const calls = [];
  const authority = createCurriculumPublicationAuthority({
    client: {
      async rpc(name, args) {
        calls.push({ name, args });
        return { data: [row()], error: null };
      },
    },
    getContext: context,
  });

  const receipt = await authority.publish(prepared({
    congregationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    libraryRevisionIds: [ids.libraryRevisionId, ids.libraryRevisionId],
  }));

  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'bible_v7_publish_curriculum_path');
  assert.deepEqual(calls[0].args, {
    p_congregation_id: ids.congregationId,
    p_track_id: ids.trackId,
    p_module_id: ids.moduleId,
    p_lesson_id: ids.lessonId,
    p_lesson_revision_id: ids.lessonRevisionId,
    p_expected_track_revision_id: ids.trackRevisionId,
    p_expected_module_revision_id: ids.moduleRevisionId,
    p_expected_lesson_revision_id: ids.lessonHierarchyRevisionId,
    p_library_revision_ids: [ids.libraryRevisionId],
  });
  assert.ok(Object.isFrozen(receipt));
  assert.equal(receipt.congregationId, ids.congregationId);
  assert.equal(receipt.lessonRevisionId, ids.lessonRevisionId);
  assert.equal(receipt.lessonPublicationState, 'published');
  assert.equal(receipt.publishedAt, '2026-10-05T00:00:00Z');
});

test('withdrawal uses the lesson-level authority and requires the exact immutable hierarchy identity', async () => {
  const calls = [];
  const authority = createCurriculumPublicationAuthority({
    client: async () => ({
      async rpc(name, args) {
        calls.push({ name, args });
        return { data: [row('withdrawn')], error: null };
      },
    }),
    getContext: context,
  });

  const receipt = await authority.withdraw(prepared());
  assert.equal(calls[0].name, 'bible_v7_withdraw_curriculum_lesson');
  assert.equal(calls[0].args.p_congregation_id, ids.congregationId);
  assert.equal(calls[0].args.p_expected_lesson_revision_id, ids.lessonHierarchyRevisionId);
  assert.equal(Object.hasOwn(calls[0].args, 'p_library_revision_ids'), false);
  assert.equal(receipt.trackPublicationState, 'published');
  assert.equal(receipt.modulePublicationState, 'published');
  assert.equal(receipt.lessonPublicationState, 'withdrawn');
});

test('fails closed when the backend acknowledges a different path or impossible publication state', async () => {
  for (const response of [
    row('published', { lesson_revision_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }),
    row('withdrawn'),
  ]) {
    const authority = createCurriculumPublicationAuthority({
      client: { async rpc() { return { data: [response], error: null }; } },
      getContext: context,
    });
    await assert.rejects(() => authority.publish(prepared()), error => error?.code === 'BQ_AUTHORING_PUBLICATION_RESPONSE');
  }
});

test('revalidates account and congregation after the RPC so late success cannot cross context', async () => {
  let current = context();
  const authority = createCurriculumPublicationAuthority({
    client: {
      async rpc() {
        current = { ...current, congregationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' };
        return { data: [row()], error: null };
      },
    },
    getContext: () => current,
  });
  await assert.rejects(() => authority.publish(prepared()), error => error?.code === 'BQ_AUTHORING_PUBLICATION_CONTEXT_STALE');
});

test('propagates backend denial and rejects malformed requests before making an RPC', async () => {
  let calls = 0;
  const denied = Object.assign(new Error('not authorized'), { code: '42501' });
  const authority = createCurriculumPublicationAuthority({
    client: {
      async rpc() {
        calls += 1;
        return { data: null, error: denied };
      },
    },
    getContext: context,
  });
  await assert.rejects(() => authority.publish(prepared()), error => error === denied);
  assert.equal(calls, 1);
  await assert.rejects(() => authority.publish(prepared({ trackId: 'not-a-uuid' })), error => error?.code === 'BQ_AUTHORING_PUBLICATION_REQUEST');
  assert.equal(calls, 1);
});
