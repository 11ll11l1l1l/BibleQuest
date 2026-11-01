import {activeMembership, adminClient, corsHeaders, json, requireUser} from '../_shared/bq.ts';
import {createMediaService, publicRecord} from '../_shared/media/service.mjs';
import {createSupabaseMediaRepository} from '../_shared/media/repository.mjs';
import {createDriveProvider} from '../_shared/media/drive-provider.mjs';
import {createDriveTokenOwner} from '../_shared/media/drive-token.mjs';
import {deny} from '../_shared/media/policy.mjs';

const uuid = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const reviewerRoles = new Set(['leader','pastor','admin']);
const MAX_BODY = 5 * 1024 * 1024 + 65536;
let drive: ReturnType<typeof createDriveProvider> | undefined;
function provider() {
  if (!drive) {
    const env = (key: string) => Deno.env.get(key) || '';
    const token = createDriveTokenOwner({clientId: env('BQ_MEDIA_DRIVE_CLIENT_ID'), clientSecret: env('BQ_MEDIA_DRIVE_CLIENT_SECRET'), refreshToken: env('BQ_MEDIA_DRIVE_REFRESH_TOKEN')});
    drive = createDriveProvider({folderId: env('BQ_MEDIA_DRIVE_FOLDER_ID'), allowedEmails: env('BQ_MEDIA_DRIVE_ALLOWED_EMAILS').split(',').map(value => value.trim()).filter(Boolean), getAccessToken: token});
  }
  return drive;
}
async function boundedBody(req: Request) {
  const reader = req.body?.getReader();
  if (!reader) deny('MEDIA_REQUEST_INVALID');
  const chunks: ArrayBuffer[] = [];
  let size = 0;
  while (true) {
    const part = await reader!.read();
    if (part.done) break;
    size += part.value.length;
    if (size > MAX_BODY) { await reader!.cancel(); deny('MEDIA_FILE_SIZE'); }
    chunks.push(new Uint8Array(part.value).buffer);
  }
  return new Blob(chunks);
}
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', {headers: corsHeaders});
  if (req.method !== 'POST') return json({error: 'Method not allowed'}, 405);
  try {
    const admin = adminClient();
    const user = await requireUser(req, admin);
    const bodyBlob = await boundedBody(req);
    let body: Record<string, unknown>;
    let file: File | undefined;
    if ((req.headers.get('Content-Type') || '').startsWith('multipart/form-data')) {
      const form = await new Response(bodyBlob, {headers: {'Content-Type': req.headers.get('Content-Type')!}}).formData();
      body = {action: form.get('action'), congregationId: form.get('congregationId'), idempotencyKey: form.get('idempotencyKey')};
      const entry = form.get('file');
      if (!(entry instanceof File)) deny('MEDIA_FILE_TYPE');
      file = entry as File;
    } else {
      try { body = JSON.parse(await bodyBlob.text()); } catch { deny('MEDIA_REQUEST_INVALID'); }
    }
    if (!body! || !uuid(body!.congregationId)) deny('MEDIA_SCOPE_DENIED');
    const congregationId = String(body!.congregationId);
    const authorize = async (request: Request, scope: string) => {
      const current = await requireUser(request, admin);
      if (current.id !== user.id) deny('MEDIA_SCOPE_DENIED');
      const membership = await activeMembership(admin, scope, current.id);
      if (!membership) deny('MEDIA_SCOPE_DENIED');
      return {userId: current.id, congregationId: scope, active: true, role: String(membership.role)};
    };
    const actor = await authorize(req, congregationId);
    const repository = createSupabaseMediaRepository({admin, actorUserId: user.id});
    const canReview = reviewerRoles.has(actor.role);
    const action = String(body!.action || '');
    if (action === 'list') {
      const listing = await createMediaService({authorize, repository, provider: {}}).list(req, {congregationId, filters: body!.filters ?? {}, cursor: (body!.cursor ?? null) as {createdAt:string,id:string,filters?:object}|null});
      return json(listing);
    }
    if (action !== 'upload' && !uuid(body!.assetId)) deny('MEDIA_ASSET_ID');
    if (action === 'reconcile' || action === 'cleanup_removed') {
      if (!canReview) deny('MEDIA_REVIEWER_REQUIRED');
      const asset = await repository.get(congregationId, String(body!.assetId));
      if (!asset) deny('MEDIA_NOT_FOUND');
      if (action === 'reconcile') {
        if (!['uploading','upload_failed'].includes(asset!.state)) deny('MEDIA_TRANSITION_DENIED');
        const object = await provider().recover(asset);
        await authorize(req, congregationId);
        const recovered = await repository.reconcile(congregationId, {assetId: asset!.id, object});
        return json({asset: publicRecord(recovered)});
      }
      if (asset!.state !== 'removed') deny('MEDIA_TRANSITION_DENIED');
      if (asset!.providerStatus !== 'deleted') await provider().trash(asset!.objectId, asset!.id);
      await authorize(req, congregationId);
      const removed = await repository.providerDeleted(congregationId, {assetId: asset!.id, objectId: asset!.objectId});
      return json({asset: publicRecord(removed)});
    }
    if (action === 'attest') {
      if (!canReview) deny('MEDIA_REVIEWER_REQUIRED');
      const asset = await repository.attest(congregationId, {assetId: body!.assetId, expectedRevision: body!.expectedRevision, reason: body!.reason, rightsVerified: body!.rightsVerified === true, safetyVerified: body!.safetyVerified === true});
      return json({asset: publicRecord(asset)});
    }
    // Moderation does not need provider credentials or a live Drive connection.
    const lazyProvider = {upload: (input: Parameters<ReturnType<typeof createDriveProvider>['upload']>[0]) => provider().upload(input), download: (id: string, assetId: string) => provider().download(id, assetId)};
    const service = createMediaService({authorize, repository, provider: lazyProvider});
    if (action === 'upload') {
      if (!file) deny('MEDIA_FILE_TYPE');
      const asset = await service.submit(req, {congregationId, idempotencyKey: body!.idempotencyKey, name: file!.name, mimeType: file!.type, bytes: new Uint8Array(await file!.arrayBuffer())});
      return json({asset});
    }
    if (action === 'download') {
      const response = await service.download(req, {congregationId, assetId: body!.assetId});
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Expose-Headers', 'Content-Disposition');
      return new Response(response.body, {status: response.status, headers});
    }
    if (action === 'moderate') {
      const asset = await service.moderate(req, {congregationId, assetId: body!.assetId, action: body!.decision, reason: body!.reason, expectedRevision: body!.expectedRevision});
      return json({asset});
    }
    return deny('MEDIA_ACTION_INVALID');
  } catch (error) {
    if (error instanceof Response) return error;
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'MEDIA_REQUEST_FAILED';
    const safe = /^MEDIA_[A-Z_]+$/.test(code) ? code : 'MEDIA_REQUEST_FAILED';
    const status = /SCOPE_DENIED|OWNER_REQUIRED|REVIEWER_REQUIRED|NOT_PUBLISHED/.test(safe) ? 403 : /REVISION_CONFLICT|IN_PROGRESS|RECONCILIATION/.test(safe) ? 409 : /PROVIDER|METADATA/.test(safe) ? 503 : 400;
    return json({error: safe}, status);
  }
});
