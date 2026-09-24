# BibleQuest V6 agent operating rules

These instructions apply to every automated agent working in this repository until V6 is released and the Phase-12 closeout is merged.

## Mission

Finish V6 against `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` without weakening released V5 behavior, security, privacy, localization, accessibility, Scripture licensing, or evidence standards. Production remains V5 until one exact V6 release-candidate SHA passes every applicable gate and is explicitly promoted.

Use `docs/v6/V6_SPEEDTRACK_OPERATING_SYSTEM.md` as the delivery protocol. `V6_ACTIVE_STATUS.md`, `DEVELOPMENT_PLAN_V6.md`, and `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` remain the product and acceptance authorities.

## Required behavior for every run

1. Fetch and inspect the current `v6/architecture-upgrade` head, open V6 PRs, current CI, and the speedtrack board before choosing work.
2. Continue the assigned lane's highest-priority READY item. Do not stop after reporting status when safe implementation, verification, integration repair, or evidence reconciliation remains.
3. Work on one short-lived branch and at most one open implementation PR. Rebase or recreate on the exact current integration head before requesting merge.
4. Before editing, compare the intended paths with every open V6 PR. Stop on overlapping ownership unless the Integration Steward explicitly serializes the work.
5. Keep changes bounded. Do not opportunistically rewrite auth, routing, RLS, service workers, offline conflict policy, or another lane's runtime owner.
6. Run focused tests during implementation, then the lane gate and inherited regression appropriate to the changed paths. BibleQuest tests are not deferred until the end.
7. Never mark an acceptance item complete from code presence alone. Record the exact commit and qualifying automated, database, browser, or device evidence.
8. End every run with: exact head, changed paths, tests and run IDs, checklist impact, remaining risk, and the next executable task. Then continue that next task when it is safe and within the same lane.

## Exactly five lanes

- **S1 Platform/CI/PWA:** package and lockfiles, Vite/TypeScript/build, route loading, global CSS/assets, manifest/root PWA assets, service-worker architecture, CI workflows, diagnostics, performance and artifact integrity.
- **S2 Data/Security/Tenant:** Supabase migrations/functions/tests/types, RLS/grants, database fixtures, privileged operations, auth/admin security, tenant isolation and database evidence.
- **S3 App Features:** typed client-kernel consumers, Games, Leader/Ministry/Admin, assignments, calendar, community, feature UI, feature localization and account/tenant client isolation outside Reader.
- **S4 Reader/Content/Delivery:** Reader, Scripture repositories, offline Bible/search/download UI, Japanese/furigana, licensing, Media adapters, notification client surfaces, push client lifecycle and permitted offline delivery contracts.
- **S5 Integration/Reporter:** collision scan, merge order, exact-head gates, regression repair, authoritative status/checklist updates, progress reporting, release-candidate assembly and promotion evidence. S5 does not take broad feature ownership.

Do not create a sixth active lane. When a lane finishes its current queue, it takes the highest-priority unclaimed checklist item compatible with its ownership. Cross-lane work must be split into explicit producer/consumer tranches and serialized at the shared contract.

## Stop conditions

Stop and report only for an actual permission/credential blocker, an overlapping active owner, a required product decision, destructive or production action, missing licensed content rights, missing physical-device evidence, or an architecture change requiring an ADR. A failing test is work to diagnose and fix, not a reason to stop.

