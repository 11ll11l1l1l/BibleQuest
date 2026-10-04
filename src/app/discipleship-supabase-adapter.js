import { createDiscipleshipService } from './discipleship.js';

// Authenticated queries remain subject to the integrated V7 RLS policies.
const PAIR_COLUMNS = 'id,congregation_id,mentor_id,mentee_id,state';
const ASSIGNMENT_COLUMNS = 'id,pair_id,lesson_revision_id,status';
const PROGRESS_COLUMNS = 'assignment_id,learner_id,lesson_revision_id,current_step_id,status,started_at,completed_at,updated_at';
function fail(code, message) { throw Object.assign(new Error(message), { code }); }
async function rows(request) {
  const { data, error } = await request;
  if (error) throw error;
  return data ?? [];
}
function required(value) {
  const id = String(value ?? '').trim();
  if (!id) fail('BQ_DISCIPLESHIP_IDENTIFIER_REQUIRED', 'A discipleship identifier is required.');
  return id;
}
function scope(pair, context, write = false) {
  if (!context?.userId || !context?.congregationId || pair?.congregationId !== context.congregationId
      || ![pair.mentorId, pair.menteeId].includes(context.userId) || pair.state !== 'active'
      || (write && pair.menteeId !== context.userId)) {
    fail('BQ_DISCIPLESHIP_SCOPE_DENIED', 'This operation is outside the active pair.');
  }
}
function node(row) {
  return { id: row.id, revisionId: row.revision_id, title: row.title, position: row.display_order };
}
export function createDiscipleshipSupabaseRepository(clientOrProvider, { assertContext = () => {} } = {}) {
  const provider = typeof clientOrProvider === 'function' ? clientOrProvider : async () => clientOrProvider;
  async function db(context) {
    assertContext(context);
    const client = await provider();
    assertContext(context);
    if (!client?.from) fail('BQ_DISCIPLESHIP_CLIENT_REQUIRED', 'An authenticated database client is required.');
    return client;
  }
  async function assignments(client, pair, revisionId) {
    let query = client.from('v7_pair_assignments').select(ASSIGNMENT_COLUMNS).eq('pair_id', pair.id).neq('status', 'cancelled');
    if (revisionId) query = query.eq('lesson_revision_id', required(revisionId));
    return rows(query);
  }
  async function assignment(client, pair, revisionId) {
    const found = await assignments(client, pair, revisionId);
    if (found.length !== 1) fail('BQ_DISCIPLESHIP_ASSIGNMENT_REQUIRED', 'Exactly one active assignment must identify this lesson revision.');
    return found[0];
  }
  async function hierarchy(client, revisionIds, context) {
    if (!revisionIds.length) return [];
    const revisions = await rows(client.from('v7_lesson_revisions').select('id,lesson_id,published_at').in('id', revisionIds).not('published_at', 'is', null));
    if (revisions.length !== new Set(revisionIds).size) fail('BQ_DISCIPLESHIP_LESSON_RESPONSE', 'An assigned published revision is unavailable.');
    const lessons = await rows(client.from('v7_lessons').select('id,module_id,title,revision_id,display_order').in('id', revisions.map(r => r.lesson_id)).eq('publication_state', 'published'));
    const modules = lessons.length ? await rows(client.from('v7_modules').select('id,track_id,title,revision_id,display_order').in('id', lessons.map(l => l.module_id)).eq('publication_state', 'published')) : [];
    const tracks = modules.length ? await rows(client.from('v7_tracks').select('id,congregation_id,title,revision_id,display_order').in('id', modules.map(m => m.track_id)).eq('publication_state', 'published')) : [];
    if (tracks.some(t => t.congregation_id && t.congregation_id !== context.congregationId)
        || lessons.length !== new Set(revisions.map(r => r.lesson_id)).size
        || modules.length !== new Set(lessons.map(l => l.module_id)).size
        || tracks.length !== new Set(modules.map(m => m.track_id)).size) {
      fail('BQ_DISCIPLESHIP_CURRICULUM_SCOPE', 'Assigned curriculum is unavailable in this congregation.');
    }
    // Multiple assigned revisions of one logical lesson require an explicit assignment UI.
    if (revisions.length !== lessons.length) fail('BQ_DISCIPLESHIP_ASSIGNMENT_REQUIRED', 'Choose an assignment before opening multiple revisions of the same lesson.');
    return tracks.map(t => ({ ...node(t), modules: modules.filter(m => m.track_id === t.id).map(m => ({
      ...node(m), lessons: lessons.filter(l => l.module_id === m.id).map(l => ({ ...node(l), revisionId: revisions.find(r => r.lesson_id === l.id).id })),
    })) }));
  }
  return Object.freeze({
    async listPairs(context) {
      const client = await db(context);
      // Filter both participant columns independently; never interpolate identity into a PostgREST expression.
      const results = await Promise.all(['mentor_id', 'mentee_id'].map(column => rows(client.from('v7_mentor_pairs').select(PAIR_COLUMNS).eq('congregation_id', required(context.congregationId)).eq(column, required(context.userId)))));
      return results.flat();
    },
    async getPair(id, context) {
      const client = await db(context);
      const found = await rows(client.from('v7_mentor_pairs').select(PAIR_COLUMNS).eq('id', required(id)).eq('congregation_id', required(context.congregationId)));
      return found[0] ?? null;
    },
    async loadCurriculum(pair, context) {
      scope(pair, context);
      const client = await db(context);
      const assigned = await assignments(client, pair);
      return hierarchy(client, [...new Set(assigned.map(a => a.lesson_revision_id))], context);
    },
    async loadLessonRevision(revisionId, pair, context) {
      scope(pair, context);
      const client = await db(context);
      await assignment(client, pair, revisionId);
      await hierarchy(client, [revisionId], context);
      const revision = (await rows(client.from('v7_lesson_revisions').select('id,lesson_id,locale,summary,published_at').eq('id', required(revisionId)).not('published_at', 'is', null)))[0];
      if (!revision) fail('BQ_DISCIPLESHIP_LESSON_RESPONSE', 'The published revision is unavailable.');
      const steps = await rows(client.from('v7_lesson_steps').select('id,position,step_type,content,scripture_refs,library_revision_id').eq('lesson_revision_id', revisionId).order('position'));
      return { id: revision.lesson_id, revisionId: revision.id, published: true, locale: revision.locale, summary: revision.summary,
        steps: steps.map(s => ({ id: s.id, type: s.step_type, content: s.content, scriptureRefs: s.scripture_refs, libraryRevisionId: s.library_revision_id })) };
    },
    async loadOperationalProgress(revisionId, pair, context) {
      scope(pair, context);
      const client = await db(context);
      const selected = await assignment(client, pair, revisionId);
      return rows(client.from('v7_learner_progress').select(PROGRESS_COLUMNS).eq('assignment_id', selected.id).eq('learner_id', pair.menteeId).eq('lesson_revision_id', revisionId));
    },
    async saveProgress(revisionId, progress, pair, context) {
      scope(pair, context, true);
      const client = await db(context);
      const selected = await assignment(client, pair, revisionId);
      const status = progress?.status;
      if (!['not_started', 'in_progress', 'completed'].includes(status) || (status === 'completed' && !progress.completedAt)) {
        fail('BQ_DISCIPLESHIP_PROGRESS_INVALID', 'Progress requires a valid status and completion timestamp.');
      }
      assertContext(context);
      return rows(client.from('v7_learner_progress').upsert({ assignment_id: selected.id, learner_id: context.userId,
        lesson_revision_id: required(revisionId), current_step_id: progress.currentStepId || null, status,
        started_at: progress.startedAt || null, completed_at: progress.completedAt || null,
      }, { onConflict: 'assignment_id,learner_id' }).select(PROGRESS_COLUMNS));
    },
    async savePrivateResponse({ lessonRevisionId, stepId, response, pair, context }) {
      scope(pair, context, true);
      const client = await db(context);
      const selected = await assignment(client, pair, lessonRevisionId);
      assertContext(context);
      const result = await rows(client.from('v7_lesson_responses').upsert({ assignment_id: selected.id, lesson_revision_id: required(lessonRevisionId),
        lesson_step_id: required(stepId), learner_id: context.userId, response,
      }, { onConflict: 'assignment_id,lesson_step_id,learner_id' }).select('id'));
      return result[0];
    },
    async setResponseShare({ lessonRevisionId, stepId, responseId, audienceUserIds, pair, context }) {
      scope(pair, context, true);
      if (audienceUserIds?.length !== 1 || audienceUserIds[0] !== pair.mentorId) fail('BQ_DISCIPLESHIP_SHARE_DENIED', 'Only the paired mentor can receive this response.');
      const client = await db(context);
      const selected = await assignment(client, pair, lessonRevisionId);
      const owned = await rows(client.from('v7_lesson_responses').select('id').eq('id', required(responseId)).eq('assignment_id', selected.id)
        .eq('lesson_revision_id', required(lessonRevisionId)).eq('lesson_step_id', required(stepId)).eq('learner_id', context.userId));
      if (owned.length !== 1) fail('BQ_DISCIPLESHIP_SHARE_DENIED', 'This response does not belong to the requested assignment and step.');
      assertContext(context);
      return rows(client.from('v7_response_shares').upsert({ response_id: responseId, recipient_id: pair.mentorId, share_state: 'shared', revoked_at: null }, { onConflict: 'response_id,recipient_id' }).select('id,share_state'));
    },
  });
}

// Route/bootstrap owners can compose this without adding a second session or tenant owner.
export function createSupabaseDiscipleshipService({ client, session, membership }) {
  const repository = createDiscipleshipSupabaseRepository(client, {
    assertContext(context) {
      const auth = session.getState();
      const active = membership.getActive();
      if (!auth?.authenticated || auth.user?.id !== context.userId || active?.congregationId !== context.congregationId
          || (active.userId && active.userId !== context.userId)) {
        fail('BQ_DISCIPLESHIP_CONTEXT_STALE', 'Your account or congregation changed. Reload ONE 2 ONE.');
      }
    },
  });
  return createDiscipleshipService({ repository, session, membership });
}
