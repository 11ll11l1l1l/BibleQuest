# V8 media coding continuation — 2026-10-31

Branch: `v8/coding-speedtrack-20261031`; parent: P1 PR #1555 head `17286b500b166b09483426e45dd85ab5a1a6edd0` (includes cleanup #1554). Stack remains unmerged and undeployed.

Owner instruction: prioritize coding requirements; defer full QA/certification.

## Implemented

- `server/v8/media/policy.mjs`: explicit tenant/membership gate, pending-review moderation state machine, required reviewer reasons, owner resubmission, rights/safety gates before publish, revision checks, strict quota threshold and file extension/MIME/signature validation.
- `server/v8/media/drive-provider.mjs`: server-only central-folder Drive multipart upload, object/asset/folder verification, private download stream and trash operations, request timeout/error classification. No permissions/public-sharing writes or automatic paid overflow.
- `server/v8/media/service.mjs`: upload reservation/finalization orchestration, server-computed checksum, pending-review default, failure reconciliation identity retention, atomic compare-and-audit contract, authorized private download with account/revision rechecks and safe attachment headers. Provider identifiers/tokens excluded from returned records.

## Integration still required — not a completed media feature

The service is server implementation code, **not yet imported by a deployed endpoint or browser UI**. No database migration/provider writes have been performed. Existing YouTube recordings remain separate and unchanged.

Next coding work:

1. Implement durable Supabase repository methods with atomic quota reservations/idempotency leases and append-only moderation audit. No in-memory repository in production. Reserve must bind owner/tenant/file hash, validate active membership and quota transactionally; finalize/failure must compare the active lease and must not overwrite a successfully finalized record.
2. Add authenticated endpoint using shared session/congregation owners; trusted authorization adapter must revalidate membership and asset scope. Service actor fields must never come from request JSON.
3. Configure restricted central Drive folder, server credential refresh and deployment secrets. Confirm inherited folder permissions before enabling ingestion. Private download must proxy through the authorized endpoint.
4. Wire upload/review/file UI with EN/TL/CEB labels and bounded error/retry states. Reconcile uploads with ambiguous provider/finalization outcomes before retrying; never automatically delete an object after a possibly committed finalization.
5. Implement photo re-encoding/EXIF removal and scanning. File signature validation alone is not a safety scan; do not set safetyVerified or rightsVerified from uploader claims. Initially supported formats: JPEG/PNG/WebP/PDF, max 5 MiB.
6. Add configured quota and provider health/status retrieval, orphan reconciliation, and moderation removal cleanup. Removed state immediately denies delivery; physical provider trash is a separate reconciled action.

## Verification

`node --check` passed for all three new modules; seven focused policy assertions passed (approval, cross-tenant denial, member denial, safety gate, pending visibility, concurrent-reservation quota, MIME/signature mismatch). `git diff --check` passed. No full QA, browser journey, real Drive transfer, durable DB transaction, backend/tenant certification, production build or deployment claimed.

Google Drive implementation references: https://developers.google.com/workspace/drive/api/guides/manage-uploads and https://developers.google.com/workspace/drive/api/reference/rest/v3/files/create (read 2026-10-31). Uses multipart for the bounded <=5 MiB first implementation. Large/resumable uploads remain future work.
