import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizeDelivery, inspectUpload, moderationChange, uploadQuota} from '../../supabase/functions/_shared/media/policy.mjs';
import {createMediaService} from '../../supabase/functions/_shared/media/service.mjs';
import {createDriveProvider} from '../../supabase/functions/_shared/media/drive-provider.mjs';

const actor = {userId:'reviewer', congregationId:'church', active:true, role:'leader'};
const asset = {id:'asset', congregationId:'church', ownerUserId:'owner', name:'test.pdf', mimeType:'application/pdf', byteSize:8, state:'pending_review', revision:1, providerStatus:'ready', rightsVerified:true, safetyVerified:true, objectId:'object'};
test('approval requires same-tenant reviewer, current revision and verification', () => {
  assert.equal(moderationChange(asset,actor,'approve','').patch.state,'published');
  assert.throws(() => moderationChange(asset,{...actor,congregationId:'other'},'approve',''),{code:'MEDIA_SCOPE_DENIED'});
  assert.throws(() => moderationChange(asset,{...actor,role:'member'},'approve',''),{code:'MEDIA_REVIEWER_REQUIRED'});
  assert.throws(() => moderationChange({...asset,safetyVerified:false},actor,'approve',''),{code:'MEDIA_REVIEW_INCOMPLETE'});
  assert.throws(() => moderationChange({...asset,revision:0},actor,'approve',''),{code:'MEDIA_REVISION_INVALID'});
});
test('pending content and removed content are denied to unauthorized viewers', () => {
  assert.throws(() => authorizeDelivery(asset,{...actor,role:'member'}),{code:'MEDIA_NOT_PUBLISHED'});
  assert.throws(() => authorizeDelivery({...asset,state:'removed'},actor),{code:'MEDIA_UNAVAILABLE'});
  assert.equal(authorizeDelivery({...asset,state:'published'},{...actor,role:'member'}),true);
});
test('quota includes outstanding reservations and fails closed for unknown capacity', () => {
  assert.throws(() => uploadQuota({usedBytes:89,reservedBytes:1,capacityBytes:100,enabled:true},1),{code:'MEDIA_QUOTA_EXHAUSTED'});
  assert.throws(() => uploadQuota({usedBytes:0,reservedBytes:0,capacityBytes:0,enabled:true},1),{code:'MEDIA_QUOTA_UNKNOWN'});
});
test('file signature, extension and MIME must agree', () => {
  assert.throws(() => inspectUpload({name:'bad.jpg',mimeType:'image/jpeg',bytes:new TextEncoder().encode('<html>')}),{code:'MEDIA_FILE_TYPE'});
  assert.equal(inspectUpload({name:'test.pdf',mimeType:'application/pdf',bytes:new TextEncoder().encode('%PDF-1.7')}).byteSize,8);
});
test('download never releases bytes after account changes during provider request', async () => {
  let user = actor;
  const service = createMediaService({authorize:async()=>user, repository:{get:async()=>asset}, provider:{download:async()=>{user={...actor,userId:'other'};return new Response('private');}}});
  await assert.rejects(service.download({}, {congregationId:'church',assetId:'asset'}),{code:'MEDIA_SCOPE_DENIED'});
});
test('download rechecks asset state after provider IO', async () => {
  let row = asset;
  const service = createMediaService({authorize:async()=>actor, repository:{get:async()=>row}, provider:{download:async()=>{row={...asset,state:'removed',revision:2};return new Response('private');}}});
  await assert.rejects(service.download({}, {congregationId:'church',assetId:'asset'}),{code:'MEDIA_UNAVAILABLE'});
});
test('upload finalization failure retains provider identity and original error', async () => {
  let failed;
  const service = createMediaService({authorize:async()=>({...actor,userId:'owner'}),repository:{
    reserveUpload:async input=>({asset:{...asset,checksum:input.checksum},acquired:true,leaseId:'lease'}),
    finalizeUpload:async()=>{throw Object.assign(new Error('metadata'),{code:'MEDIA_METADATA_UNAVAILABLE'});},
    markUploadFailed:async input=>{failed=input;throw new Error('offline');},
  },provider:{upload:async()=>({provider:'google_drive',objectId:'object'})}});
  await assert.rejects(service.submit({}, {congregationId:'church',idempotencyKey:'upload_key_123456',name:'test.pdf',mimeType:'application/pdf',bytes:new TextEncoder().encode('%PDF-1.7')}),{code:'MEDIA_METADATA_UNAVAILABLE'});
  assert.equal(failed.object.objectId,'object');
});
test('provider refuses broad folder permissions before uploading', async () => {
  let calls=0;
  const provider=createDriveProvider({folderId:'folder',allowedEmails:['private@example.com'],getAccessToken:async()=>'secret',fetchImpl:async()=>{calls++;return Response.json({permissions:[{type:'anyone',role:'reader'}]});}});
  await assert.rejects(provider.upload({assetId:'asset',name:'test.pdf',mimeType:'application/pdf',bytes:new TextEncoder().encode('%PDF-1.7')}),{code:'MEDIA_PROVIDER_SHARING'});
  assert.equal(calls,1);
});
test('moderation rejects stale expected revisions without writing', async () => {
  let writes=0;
  const service=createMediaService({authorize:async()=>actor,repository:{get:async()=>asset,compareAndAudit:async()=>{writes++;}},provider:{}});
  await assert.rejects(service.moderate({}, {congregationId:'church',assetId:'asset',action:'approve',reason:'',expectedRevision:0}),{code:'MEDIA_REVISION_CONFLICT'});
  assert.equal(writes,0);
});
