const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLUMNS = 'id,congregation_id,title,summary,locale,audience,revision_id,publication_state,display_order,created_by';
function fail(code, message) { throw Object.assign(new Error(message), {code}); }
function id(value) {
  if (typeof value !== 'string' || !UUID.test(value)) fail('BQ_AUTHORING_ID', 'A valid curriculum identifier is required.');
  return value.toLowerCase();
}
function text(value, max, required = false) {
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) {
    fail('BQ_AUTHORING_CONTENT', 'Curriculum text is missing or exceeds its limit.');
  }
  return value.trim();
}
export function normalizeTrackDraft(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)
      || Object.keys(input).some(key => !['title','summary','locale','audience','position'].includes(key))) {
    fail('BQ_AUTHORING_CONTENT', 'Only editable track fields are supported.');
  }
  let locale;
  try { if (typeof input.locale === 'string') locale = Intl.getCanonicalLocales(input.locale)[0]; } catch { /* handled below */ }
  if (!locale) fail('BQ_AUTHORING_CONTENT', 'A valid curriculum language is required.');
  if (!Number.isInteger(input.position ?? 0) || (input.position ?? 0) < 0) {
    fail('BQ_AUTHORING_CONTENT', 'Track order must be a non-negative integer.');
  }
  return Object.freeze({
    title:text(input.title,240,true), summary:text(input.summary ?? '',4000),
    locale, audience:text(input.audience ?? '',240), display_order:input.position ?? 0,
  });
}

// Context/capability comes from existing session/membership composition, never form data.
// These client checks improve recovery; the existing authenticated RLS remains authority.
export function createTrackAuthoringRepository({ client, getContext, newRevisionId = () => crypto.randomUUID() }) {
  if (typeof getContext !== 'function') throw new TypeError('Authoring requires the existing account/congregation owner.');
  const provider = typeof client === 'function' ? client : async () => client;
  function context() {
    const current = getContext();
    if (current?.canAuthor !== true) fail('BQ_AUTHORING_DENIED', 'Curriculum authoring is unavailable for this account.');
    return Object.freeze({userId:id(current.userId),congregationId:id(current.congregationId)});
  }
  function assertCurrent(expected) {
    const current = context();
    if (current.userId !== expected.userId || current.congregationId !== expected.congregationId) {
      fail('BQ_AUTHORING_CONTEXT_STALE', 'Account or congregation changed. Reload curriculum authoring.');
    }
  }
  async function database(expected) {
    const db = await provider();
    assertCurrent(expected);
    if (typeof db?.from !== 'function') fail('BQ_AUTHORING_CLIENT', 'An authenticated database client is required.');
    return db;
  }
  function record(row, expected) {
    if (!row || id(row.congregation_id) !== expected.congregationId
        || !['draft','published','withdrawn'].includes(row.publication_state)) {
      fail('BQ_AUTHORING_RESPONSE', 'Curriculum response is unavailable in the selected congregation.');
    }
    return Object.freeze({
      id:id(row.id), revisionId:id(row.revision_id), congregationId:expected.congregationId,
      title:row.title,summary:row.summary,locale:row.locale,audience:row.audience,
      position:row.display_order,publicationState:row.publication_state,
    });
  }
  async function result(request, expected) {
    const {data,error} = await request;
    assertCurrent(expected);
    if (error) throw error;
    return data;
  }
  return Object.freeze({
    async listTracks() {
      const expected=context(), db=await database(expected);
      const data=await result(db.from('v7_tracks').select(COLUMNS)
        .eq('congregation_id',expected.congregationId).order('display_order').order('id').limit(100),expected);
      if (!Array.isArray(data)) fail('BQ_AUTHORING_RESPONSE', 'Curriculum list response is invalid.');
      return Object.freeze(data.map(row=>record(row,expected)));
    },
    async createDraft(input) {
      const draft=normalizeTrackDraft(input), expected=context(), db=await database(expected);
      assertCurrent(expected);
      const data=await result(db.from('v7_tracks').insert({
        ...draft,congregation_id:expected.congregationId,created_by:expected.userId,publication_state:'draft',
      }).select(COLUMNS).single(),expected);
      const created=record(data,expected);
      if (created.publicationState !== 'draft' || data.created_by !== expected.userId) {
        fail('BQ_AUTHORING_RESPONSE', 'The created curriculum draft did not match this account.');
      }
      return created;
    },
    async updateDraft(trackId, expectedRevisionId, input) {
      const key=id(trackId), revision=id(expectedRevisionId), draft=normalizeTrackDraft(input);
      const expected=context(), db=await database(expected);
      const nextRevision=id(newRevisionId());
      if (nextRevision===revision) fail('BQ_AUTHORING_REVISION', 'Editing requires a new revision identifier.');
      assertCurrent(expected);
      const data=await result(db.from('v7_tracks').update({...draft,revision_id:nextRevision})
        .eq('id',key).eq('congregation_id',expected.congregationId)
        .eq('publication_state','draft').eq('revision_id',revision).select(COLUMNS).maybeSingle(),expected);
      if (!data) fail('BQ_AUTHORING_CONFLICT', 'The draft changed or is no longer editable. Reload before saving.');
      const updated=record(data,expected);
      if (updated.id!==key || updated.revisionId!==nextRevision || updated.publicationState!=='draft') {
        fail('BQ_AUTHORING_RESPONSE', 'The saved curriculum draft did not match this edit.');
      }
      return updated;
    },
  });
}
