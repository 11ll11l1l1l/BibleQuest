import {deny, normalizeMediaListFilters} from './policy.mjs';

export function mediaRecord(row) {
  if (!row) return null;
  return {id: row.id, congregationId: row.congregation_id, ownerUserId: row.owner_user_id,
    name: row.name, mimeType: row.mime_type, byteSize: Number(row.byte_size), checksum: row.checksum,
    state: row.state, revision: row.revision, providerStatus: row.provider_status,
    objectId: row.object_id, rightsVerified: row.rights_verified, safetyVerified: row.safety_verified,
    createdAt: row.created_at};
}
const unwrap = result => {
  if (result.error) {
    const code = String(result.error.message || '').match(/\bMEDIA_[A-Z_]+\b/)?.[0];
    deny(code || 'MEDIA_METADATA_UNAVAILABLE');
  }
  return result.data;
};

export function createSupabaseMediaRepository({admin, actorUserId}) {
  if (!admin?.from || !admin?.rpc || !actorUserId) deny('MEDIA_REPOSITORY_CONFIG');
  const command = async (action, congregationId, payload) => unwrap(await admin.rpc('bq_v8_media_command', {
    p_action: action, p_actor: actorUserId, p_congregation: congregationId, p_payload: payload,
  }));
  return Object.freeze({
    async get(congregationId, assetId) {
      return mediaRecord(unwrap(await admin.from('bible_v8_media_assets').select('*').eq('congregation_id', congregationId).eq('id', assetId).maybeSingle()));
    },
    async list(congregationId, {reviewer = false, cursor = /** @type {{createdAt:string,id:string}|null} */ (null), limit = 30, filters = {}} = {}) {
      const selected = normalizeMediaListFilters(filters);
      let query = admin.from('bible_v8_media_assets').select('*').eq('congregation_id', congregationId);
      if (selected.scope === 'mine') query = query.eq('owner_user_id', actorUserId);
      if (selected.state) query = query.eq('state', selected.state);
      // Escape SQL LIKE wildcards; the user text stays a filter value, never an OR expression.
      if (selected.query) query = query.ilike('name', `%${selected.query.replace(/[\\%_]/g, '\\$&')}%`);
      const predicates = [];
      if (!reviewer) predicates.push(`or(state.eq.published,owner_user_id.eq.${actorUserId})`);
      if (cursor) {
        if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+]00:00)$/.test(cursor.createdAt || '') || !/^[a-f0-9-]{36}$/i.test(cursor.id || '')) deny('MEDIA_REQUEST_INVALID');
        predicates.push(`or(created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id}))`);
      }
      if (predicates.length) query = query.or(`and(${predicates.join(',')})`);
      return (unwrap(await query.order('created_at', {ascending: false}).order('id', {ascending: false}).limit(Math.min(50, Math.max(1, limit)))) || []).map(mediaRecord);
    },
    async quota() {
      const q = unwrap(await admin.from('bible_v8_media_quota').select('*').eq('provider', 'google_drive').single());
      return {usedBytes: Number(q.used_bytes), reservedBytes: Number(q.reserved_bytes), capacityBytes: Number(q.capacity_bytes), enabled: q.enabled};
    },
    async reserveUpload(input) {
      const result = await command('reserve', input.congregationId, input);
      return {...result, asset: mediaRecord(result.asset)};
    },
    async finalizeUpload(input) { return mediaRecord(await command('finalize', input.congregationId, input)); },
    async markUploadFailed(input) { return mediaRecord(await command('fail', input.congregationId, input)); },
    async compareAndAudit({congregationId, assetId, expectedRevision, audit}) {
      return mediaRecord(await command('moderate', congregationId, {assetId, expectedRevision, action: audit.action, reason: audit.reason}));
    },
    async reconcile(congregationId, input) { return mediaRecord(await command('reconcile', congregationId, input)); },
    async providerDeleted(congregationId, input) { return mediaRecord(await command('provider_deleted', congregationId, input)); },
    async attest(congregationId, input) { return mediaRecord(await command('attest', congregationId, input)); },
  });
}
