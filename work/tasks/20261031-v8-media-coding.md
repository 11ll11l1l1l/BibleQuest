# V8 media coding continuation — 2026-10-31

Branch: `v8/coding-speedtrack-20261031`; parent: P1 PR #1555 head `17286b500b166b09483426e45dd85ab5a1a6edd0` (includes cleanup #1554). Stack remains unmerged and undeployed. Owner explicitly authorized publishing this branch and continuing coding; full QA/certification is deferred.

## Implemented

- Full bounded congregation Files path: Community → Files → photo/PDF preparation → pending-review upload → separate rights/safety attestation → approve/reject/request changes → authenticated private download → logical removal/provider trash. Owner resubmission and reviewer upload recovery are coded.
- Durable Supabase repository and additive migration: provider-global serialized quota reservations, owner/tenant/file-bound idempotency, lease-aware finalization, optimistic moderation and atomic append-only audit. No browser access to raw metadata, credentials or RPC.
- Shared server media modules moved from `server/v8/media/` into `supabase/functions/_shared/media/` so the Edge Function owns deployable imports. Drive OAuth refresh remains server-side; permissions fail closed for broad inheritance. Reconciliation checks exact object bytes against server SHA-256. Trash does not imply freed storage.
- EN/TL/CEB Files UI, explicit English fallback, error/retry/loading states, latest-file pagination and account/congregation invalidation. Browser-side photo re-encoding strips source metadata; deployed pixel/EXIF behavior still needs QA.
- Nine focused regressions under `npm run unit:v8`, included by aggregate `npm run unit`.

[Architecture/configuration/recovery details](../../docs/v8/CENTRAL_MEDIA_SETUP.md).

## Verification and limitations

Application typecheck/build, V6 lint/format policy, syntax and whitespace checks passed locally on Node 24.22.1 (not pinned release-toolchain certification). V6 lint/format cover their existing V6 paths, not all new V8 modules. Nine new focused Node regressions passed. Deno endpoint check passed using a source copy with the exact pinned Supabase dependency after direct Deno registry resolution was blocked. Disposable PGlite Postgres executed the migration and focused transaction/role/lease/revision/quota assertions. No production DB/provider writes occurred.

Full QA is intentionally deferred. Still required: real backend/Drive and browser/phone journey, provider account configuration, deployment migration/release gates, PWA/update/offline and security certification. No source-only PASS is promoted into release evidence.

## Remaining V8 coding

P2 still needs broader file-management UX (filters/search/previews, provider-health administration and missing/duplicate-orphan operator handling), additional scope types beyond congregation, resumable/large files and any accepted further formats. Central-account credentials and capacity require real configuration before activation. Existing source/rights constraints continue to block unlicensed bulk content and unverified Ilocano sources; P3/P4 scope remains in `DEVELOPMENT_PLAN_V8.md`. P5 release is open.
