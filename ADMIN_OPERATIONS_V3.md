# BibleQuest v3 Admin Operations contract

Capability #93 rebuilds the retained Ministry Operations surface and the Owner account-deletion control that was introduced with it. It does not absorb #92 Admin Console ownership and does not deploy or alter production backend/schema state.

## Recovered evidence

Retained `admin-operations.html` / `admin-operations.js` provide an Owner/Admin operational dashboard for system health, online presence, assignments, devotionals/announcements, persistent poll aggregates, curated media, and live rooms. Repository history introduced `bq-admin-ops` and Owner account deletion together, then linked both into the retained Admin surface. Existing `supabase/functions/bq-admin-ops/index.ts` is the server-authoritative contract.

## Ownership

- `src/core/api.js` remains the only browser Supabase/network implementation boundary. Its `adminOperations` facade owns `bq-admin-ops` invocation plus deployment-relative frontend-health reads.
- Session remains the only authenticated-user owner.
- `src/app/admin-operations.js` owns Admin Operations authorization projection, dashboard normalization, refresh/error state, and Owner-only delete orchestration.
- `src/features/admin-operations/index.js` owns the standalone operational dashboard rendering/filter interaction.
- #92 `src/app/admin-console.js` remains the only Admin Console data/mutation owner. The Admin Console UI may compose the #93 deletion service onto its already-owned user cards; it must not invoke `bq-admin-ops` directly.
- Existing `bq-admin-ops` remains final authority for Owner/Admin access and destructive account deletion.

## Access contract

Signed-out state performs no Admin Operations request. Signed-in accounts must first pass `bq-admin-ops` `status`; accepted roles are exactly platform `owner` and `admin`. Permission denial fails closed and is distinct from network/runtime failure. Dashboard data is loaded only after authorization succeeds.

The backend remains authoritative even after client verification. Client role checks are presentation/safety guards, not security authority.

## Dashboard parity

The clean dashboard retains:

- all-congregation or one-congregation filtering;
- current operational summary counts;
- online presence with the retained approximately two-minute presence window supplied by the backend;
- recent assignments with started/completed aggregate counts and advanced requirement labels returned by the backend;
- devotionals/announcements including pinned, scheduled, and media indicators;
- persistent poll metadata and aggregate totals only; individual voter identity is not rendered;
- curated YouTube media metadata;
- live-room host/status/participant aggregates;
- system health including backend ops version, selected table counts, recent client-error summaries, PWA cache identity, doctrinal pack/runtime version comparison, and build identity;
- explicit refresh and safe empty/error states;
- responsive mobile behavior at 390 px without horizontal overflow.

`calendar` and `recognitions` returned by the retained backend remain preserved in normalized state but are not invented into new visible product workflows because the retained dashboard did not render them.

## Owner account deletion parity

Account deletion is available only when #93 has independently verified platform `owner` access. `admin` cannot delete accounts. The signed-in Owner cannot delete itself. The user must type the exact confirmation phrase `DELETE <email-or-name>` before the destructive request is sent. After a successful deletion, the #92 Admin Console list refreshes.

The existing backend additionally refuses deletion of another active Owner, refuses deletion while congregation or active small-group ownership remains, ends active rooms created by the target, records an audit event, and finally deletes the Auth account. These server guards are retained as authority and are not duplicated as competing browser business logic.

## Privacy and safety

Client-error user/congregation identifiers returned by the privileged backend are not projected into the rendered v3 dashboard. Poll UI receives only backend-provided aggregate totals. No service-role/secret credential is introduced to browser code. No production function deployment, migration, data mutation outside an explicit Owner delete request, or Cloudflare/main change is part of this milestone.

## Explicitly out of scope

- #94 Reset/recovery page;
- password/recovery-code workflow;
- redesign of #92 Admin Console platform/congregation/group ownership;
- editing operational records from the dashboard;
- new moderation/content tools;
- production deployment or destructive test data.

## Verification

Targeted acceptance must prove signed-out no-call behavior, Owner/Admin authorization, denial/error separation, dashboard normalization/privacy, congregation filtering, responsive rendering, Owner-only typed deletion confirmation, self-delete refusal, backend facade ownership, and preservation of the dispatch-only accumulated workflow. Full accumulated architecture, edge/security, and browser/mobile suites remain mandatory before promotion.