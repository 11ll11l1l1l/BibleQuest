// Server-only policy. Callers must load actor membership and asset rows from trusted storage.
export class MediaError extends Error {
  constructor(code) { super(code); this.name = 'MediaError'; this.code = code; }
}
/** @returns {never} */
export const deny = code => { throw new MediaError(code); };
const REVIEWERS = new Set(['leader', 'pastor', 'admin']);
const STATES = Object.freeze({
  approve: ['pending_review'],
  reject: ['pending_review'],
  request_changes: ['pending_review'],
  resubmit: ['changes_requested', 'rejected'],
  remove: ['published'],
});
const NEXT = Object.freeze({approve: 'published', reject: 'rejected', request_changes: 'changes_requested', resubmit: 'pending_review', remove: 'removed'});

export function authorizeScope(actor, congregationId) {
  if (!actor?.userId || !congregationId || actor.congregationId !== congregationId || actor.active !== true) deny('MEDIA_SCOPE_DENIED');
}

export function moderationChange(asset, actor, action, reason, now = new Date().toISOString()) {
  authorizeScope(actor, asset.congregationId);
  if (!Number.isSafeInteger(asset.revision) || asset.revision < 1) deny('MEDIA_REVISION_INVALID');
  if (!STATES[action]?.includes(asset.state)) deny('MEDIA_TRANSITION_DENIED');
  if (action === 'resubmit') {
    if (asset.ownerUserId !== actor.userId) deny('MEDIA_OWNER_REQUIRED');
    if (asset.providerStatus !== 'ready') deny('MEDIA_PROVIDER_NOT_READY');
  } else if (!REVIEWERS.has(actor.role)) deny('MEDIA_REVIEWER_REQUIRED');
  const note = String(reason ?? '').trim();
  if (note.length > 2000 || (['reject', 'request_changes', 'remove'].includes(action) && !note)) deny('MEDIA_REASON_REQUIRED');
  if (action === 'approve' && (asset.providerStatus !== 'ready' || asset.rightsVerified !== true || asset.safetyVerified !== true)) deny('MEDIA_REVIEW_INCOMPLETE');
  return Object.freeze({
    expectedRevision: asset.revision,
    patch: Object.freeze({state: NEXT[action], revision: asset.revision + 1, updatedAt: now}),
    audit: Object.freeze({assetId: asset.id, congregationId: asset.congregationId, actorUserId: actor.userId, action, from: asset.state, to: NEXT[action], reason: note, at: now}),
  });
}

export function uploadQuota({usedBytes, reservedBytes, capacityBytes, enabled}, incomingBytes) {
  if (enabled !== true) deny('MEDIA_UPLOADS_DISABLED');
  if (![usedBytes, reservedBytes, capacityBytes, incomingBytes].every(Number.isSafeInteger) || usedBytes < 0 || reservedBytes < 0 || capacityBytes <= 0 || incomingBytes <= 0) deny('MEDIA_QUOTA_UNKNOWN');
  const total = usedBytes + reservedBytes + incomingBytes;
  if (!Number.isSafeInteger(total) || total > Math.floor(capacityBytes * 0.9)) deny('MEDIA_QUOTA_EXHAUSTED');
  return Object.freeze({projectedBytes: total, warning: total >= capacityBytes * 0.85 ? 'high' : total >= capacityBytes * 0.7 ? 'near' : ''});
}

// Initial upload support deliberately excludes active formats and unverified HEIC/Office conversion.
export function inspectUpload({name, mimeType, bytes}, maxBytes = 5 * 1024 * 1024) {
  if (!(bytes instanceof Uint8Array) || !bytes.length || bytes.length > maxBytes) deny('MEDIA_FILE_SIZE');
  const filename = String(name ?? '').normalize('NFKC').replace(/[\x00-\x1f\x7f/\\]/g, '_').trim();
  if (!filename || filename.length > 160) deny('MEDIA_FILENAME_INVALID');
  const starts = signature => signature.every((value, i) => bytes[i] === value);
  const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  const extension = filename.split('.').pop().toLowerCase();
  let detected = '';
  if (starts([0xff, 0xd8, 0xff])) detected = 'image/jpeg';
  else if (starts([137, 80, 78, 71, 13, 10, 26, 10])) detected = 'image/png';
  else if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') detected = 'image/webp';
  else if (ascii(0, 5) === '%PDF-') detected = 'application/pdf';
  const extensions = {'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'], 'image/webp': ['webp'], 'application/pdf': ['pdf']};
  if (!detected || detected !== mimeType || !extensions[detected].includes(extension)) deny('MEDIA_FILE_TYPE');
  return Object.freeze({name: filename, mimeType: detected, byteSize: bytes.length});
}

// Pending/rejected content is visible only through an authenticated review/owner flow.
export function authorizeDelivery(asset, actor) {
  authorizeScope(actor, asset.congregationId);
  if (asset.providerStatus !== 'ready' || asset.state === 'removed') deny('MEDIA_UNAVAILABLE');
  if (asset.state !== 'published' && actor.userId !== asset.ownerUserId && !REVIEWERS.has(actor.role)) deny('MEDIA_NOT_PUBLISHED');
  return true;
}

// Filters narrow the existing tenant/visibility predicate; they never grant access.
export function normalizeMediaListFilters(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) deny('MEDIA_FILTER_INVALID');
  const {scope = 'all', state = '', query = ''} = input;
  if (!['all', 'mine'].includes(scope) || !['', 'pending_review', 'published', 'changes_requested', 'rejected', 'removed', 'uploading', 'upload_failed'].includes(state)
      || typeof query !== 'string' || query.length > 80 || /[\x00-\x1f\x7f*]/.test(query)) deny('MEDIA_FILTER_INVALID');
  const text = query.normalize('NFKC').trim().replace(/\s+/g, ' ');
  if (text.length > 80 || text.includes('*')) deny('MEDIA_FILTER_INVALID');
  return Object.freeze({scope, state, query: text});
}
