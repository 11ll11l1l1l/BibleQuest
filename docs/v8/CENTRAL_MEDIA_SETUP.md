# V8 central media — implementation and activation

Implementation branch: `v8/coding-speedtrack-20261031`, stacked on P1 #1555. This is implemented source, not a deployed or fully QA-certified feature.

## Ownership

- Browser: `src/features/media-files/`, lazy `#/media-files` route from Community. Uses shared API/session/congregation owners. JPEG/PNG/WebP photos are re-encoded to JPEG at max 2560 px before transfer; PDF is not transformed. Browser maximum source photo 25 MiB; server accepted bytes maximum 5 MiB. Server checks extension/MIME/signature; that is not malware scanning.
- Endpoint: `supabase/functions/bq-media/index.ts`. POST operations: list, multipart upload, download, attest, moderate, reconcile, cleanup_removed. Revalidates current session/membership; provider identity stays server-side. List uses bounded composite timestamp/ID pagination. Account/scope changes cancel UI work and invalidate stale results.
- Persistence: new additive migration `20261031102119_v8_central_media.sql`. Assets, provider-global quota, append-only audit. Service-only invoker RPC repeats transactional membership/role/lease/revision/quota checks. No browser table/RPC privileges. Existing YouTube library is unchanged.
- Provider: `_shared/media/`. Restricted central Google Drive folder; no public sharing mutation. Upload and delivery reject permission lists outside explicitly configured user emails. Downloads proxy through the authenticated endpoint with attachment, private/no-store, nosniff and sandbox headers. Direct Drive links/tokens do not enter client records.

## Required deployment configuration

Do not enable uploads merely because code builds. Apply the migration through the existing reviewed migration path and deploy `bq-media` only after backend QA. The migration starts with `enabled=false` and `capacity_bytes=0`.

Server environment names (values must never be committed):

- `BQ_MEDIA_DRIVE_CLIENT_ID`
- `BQ_MEDIA_DRIVE_CLIENT_SECRET`
- `BQ_MEDIA_DRIVE_REFRESH_TOKEN`
- `BQ_MEDIA_DRIVE_FOLDER_ID`
- `BQ_MEDIA_DRIVE_ALLOWED_EMAILS`: comma-separated exact users permitted on folder/objects. Group/domain/anyone permissions are rejected, including broader inheritance.

Use an OAuth credential for the dedicated central Drive account with sufficient file access; verify folder restriction and API/scopes with the real account. Existing shared Supabase server credential/auth helpers remain authoritative. No deployment credentials were requested, read or changed during implementation.

Set the singleton provider quota's `capacity_bytes` to an intentionally bounded allowance below verified remaining central-account storage, accounting for other Drive/Gmail usage. It is a local safety budget, not an assertion of the account's purchased capacity. Reserve stops at 90% of the configured budget. No billing/paid overflow/provider switching exists.

## Review and recovery

Upload creates Pending Review and does not publish. A different Leader/Pastor/Admin must attest rights and safety with a reason; this is a human review record, not an automated scan claim. Approval separately checks current revision, provider readiness and both attestations. Request Changes/Reject/Remove require reasons; only the owner can resubmit. UI visibility is not authority: the RPC repeats these checks.

Each prepared file retains its idempotency key across retries in the mounted page. Reservations bind tenant+owner+key to exact checksum/name/type/size. A lost transfer/finalization result retains reserved quota and object identity rather than deleting a possibly committed upload. Recovery requires a reviewer, a reservation older than ten minutes, exactly one matching Drive object, matching size/type and a server-computed SHA-256 of downloaded bytes. Ambiguous/missing/duplicate objects remain held for operator review; no automatic quota release or blind reupload.

Remove immediately denies delivery. Cleanup moves the exact recorded Drive object to trash and records provider removal separately. Trashed bytes remain counted because trash may still consume Drive storage. An operator must reconcile actual provider usage after a confirmed permanent purge before reducing used bytes. A repeated cleanup is idempotent at the metadata boundary.

## Deferred work and evidence

Local development checks: nine focused Node tests, application typecheck/build, Deno endpoint check with the pinned Supabase library, and disposable Postgres migration/transaction assertions. These are not authenticated deployed flow certification.

Full browser/phone/accessibility/localization QA, live OAuth/Drive transfer, inherited-permission cases, deployed Supabase tenant/RPC checks, upgrade/offline/PWA budgets, real image EXIF verification and release gates remain deferred. No production migration, upload, moderation, notification, deployment or release was executed. No full V8 completion claim: Ilocano Bible/UI, content/Couples expansion and integrated release remain open.
