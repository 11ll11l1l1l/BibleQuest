import {authorizeScope, authorizeDelivery, deny, inspectUpload, moderationChange, uploadQuota} from './policy.mjs';

/**
 * Server composition boundary. No browser-supplied actor or provider object is trusted.
 * authorize(request, congregationId) must revalidate the session/current membership.
 * repository methods are tenant-scoped; writes atomically append audit and compare revision.
 * reserveUpload atomically checks quota including all concurrent reservations, binds the
 * idempotency key to owner+tenant+file hash, and returns {asset, acquired, leaseId}.
 * finalizeUpload compares leaseId and persists provider identity + pending_review + audit.
 * markUploadFailed retains provider identity for reconciliation and never retries blindly.
 */
export function createMediaService({authorize, repository, provider, now = () => new Date().toISOString()}) {
  if (typeof authorize !== 'function' || !repository || !provider) deny('MEDIA_SERVICE_CONFIG');
  const scopeActor = async (request, congregationId) => {
    const actor = await authorize(request, congregationId);
    authorizeScope(actor, congregationId);
    return actor;
  };
  const load = async (congregationId, assetId) => {
    const asset = await repository.get(congregationId, assetId);
    if (!asset || asset.congregationId !== congregationId || asset.id !== assetId) deny('MEDIA_NOT_FOUND');
    return asset;
  };
  async function submit(request, {congregationId, idempotencyKey, name, mimeType, bytes}) {
    const actor = await scopeActor(request, congregationId);
    if (typeof idempotencyKey !== 'string' || !/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey)) deny('MEDIA_IDEMPOTENCY_REQUIRED');
    const file = inspectUpload({name, mimeType, bytes});
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const checksum = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    // Fast feedback only; reserveUpload MUST repeat this check inside its transaction.
    uploadQuota(await repository.quota(congregationId), file.byteSize);
    const reservation = await repository.reserveUpload({congregationId, ownerUserId: actor.userId, idempotencyKey, checksum, ...file, state: 'uploading', at: now()});
    if (!reservation?.asset || reservation.asset.congregationId !== congregationId || reservation.asset.ownerUserId !== actor.userId || reservation.asset.checksum !== checksum) deny('MEDIA_RESERVATION_INVALID');
    if (!reservation.acquired) {
      if (reservation.asset.state === 'uploading') deny('MEDIA_UPLOAD_IN_PROGRESS');
      return publicRecord(reservation.asset);
    }
    let object;
    try {
      await scopeActor(request, congregationId);
      object = await provider.upload({assetId: reservation.asset.id, name: file.name, mimeType, bytes});
      const current = await scopeActor(request, congregationId);
      if (current.userId !== actor.userId) deny('MEDIA_SCOPE_DENIED');
      const asset = await repository.finalizeUpload({congregationId, assetId: reservation.asset.id, leaseId: reservation.leaseId, object, state: 'pending_review', actorUserId: actor.userId, at: now()});
      return publicRecord(asset);
    } catch (error) {
      // Never trash automatically: finalize may have committed before a transport failure.
      // Preserve object identity and reservation for an explicit reconciliation operation.
      await repository.markUploadFailed({congregationId, assetId: reservation.asset.id, leaseId: reservation.leaseId, object: object ?? null, code: error?.code ?? 'MEDIA_UPLOAD_FAILED', at: now()});
      throw error;
    }
  }
  async function moderate(request, {congregationId, assetId, action, reason, expectedRevision}) {
    const actor = await scopeActor(request, congregationId);
    const asset = await load(congregationId, assetId);
    if (expectedRevision !== asset.revision) deny('MEDIA_REVISION_CONFLICT');
    const change = moderationChange(asset, actor, action, reason, now());
    // compareAndAudit must commit both row and audit or neither; no generic update fallback.
    const updated = await repository.compareAndAudit({congregationId, assetId, ...change});
    if (!updated) deny('MEDIA_REVISION_CONFLICT');
    return publicRecord(updated);
  }
  async function download(request, {congregationId, assetId}) {
    const actor = await scopeActor(request, congregationId);
    const asset = await load(congregationId, assetId);
    authorizeDelivery(asset, actor);
    const response = await provider.download(asset.objectId, asset.id);
    // Recheck publication/account after provider IO, before releasing any bytes.
    const current = await scopeActor(request, congregationId);
    if (current.userId !== actor.userId) deny('MEDIA_SCOPE_DENIED');
    const latest = await load(congregationId, assetId);
    authorizeDelivery(latest, current);
    if (latest.revision !== asset.revision || latest.objectId !== asset.objectId) deny('MEDIA_REVISION_CONFLICT');
    return new Response(response.body, {headers: {
      'Content-Type': asset.mimeType,
      'Content-Disposition': `attachment; filename="download"; filename*=UTF-8''${encodeURIComponent(asset.name).replaceAll("'", '%27')}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    }});
  }
  return Object.freeze({submit, moderate, download});
}

function publicRecord(asset) {
  // Never serialize tokens, internal provider IDs, paths or moderation audit notes.
  return Object.freeze({id: asset.id, congregationId: asset.congregationId, name: asset.name, mimeType: asset.mimeType, byteSize: asset.byteSize, state: asset.state, revision: asset.revision});
}
