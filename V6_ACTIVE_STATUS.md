# BibleQuest V6 Official Active Status

Updated: 2026-09-18 JST
Execution model: one serialized integration stream with bounded specialist tranches
Official V6 integration branch: `v6/architecture-upgrade`
Released V5 production baseline: `f6a0cff0e63ddf676b77b8470d84678958fe9d70`
Certified V5 runtime/source freeze: `c0772d458e9d17ab1728c47c568e99857c7d67a1`
Historical pre-V5 V6 archive: `archive/v6-pre-v5-experiment-20260913` at `8a5c09b7e95c0bd2956dac957fa359cc9829b20e`

## Authority

This file is the authoritative source for current BibleQuest V6 phase, scope, blockers and next work. Repository branch/commit/CI/live-backend evidence overrides stale chat context. Detailed execution is in `DEVELOPMENT_PLAN_V6.md`; acceptance inventory is in `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`; Phase-0 evidence is in `docs/v6/V6_PHASE0_BOOTSTRAP.md`.

## Current state

**Phase 0 — COMPLETE.**
**Phase 1 — BUILD/CLIENT ENGINE: ACTIVE.**

The active V6 line starts from the exact released V5 production commit `f6a0cff0...`. The obsolete pre-V5 V6 experiment is preserved separately and is not part of active V6 history.

ADR-0001 and ADR-0002 are ACCEPTED:

- `docs/v6/adr/ADR-0001-build-client-architecture.md`
- `docs/v6/adr/ADR-0002-database-ci.md`

Inherited static/governance gates reported green on the Phase-0 candidate for build/deployment, PWA/install, offline shell/Bible, assignment authorization, shell/Home/Assignments/Calendar, EN/TL localization, active-congregation, push lifecycle/persistence, glyph inventory and V5 state sweep.

Browser automation was not runnable in the originating workspace because Chromium installation did not complete. This is an environment limitation, not a product failure. It does not block starting bounded V6 coding. Browser parity remains mandatory before a runtime tranche is certified/merged and before RC promotion. Never represent unexecuted browser evidence as PASS.

## V6 product decision

V6 strengthens the engine underneath the released V5 product. It may change build tooling, typed module boundaries, state/data ownership, database-test infrastructure, service-worker/storage architecture, media, notifications and internal implementation, but must preserve accepted V5 product/security behavior unless an explicit ADR deliberately supersedes it.

V6 does not reopen completed V5 feature scope merely to justify architecture work.

## Immediate coding authority

Terra/Sol development may start immediately on READY Phase-1 and other bounded V6 work that does not violate an unresolved architecture boundary.

Initial READY work includes:

1. Vite/package/toolchain bootstrap with V5 parity preserved.
2. Incremental TypeScript configuration and typed boundary scaffolding.
3. capability-detection utilities;
4. manifest/PWA asset validation;
5. install-state/install UI work;
6. online/offline state and fallback UI;
7. safe local-persistence wrappers;
8. route/deep-link inventory and validation;
9. notification UI/types/preferences;
10. badges, shortcuts and share helpers;
11. tests, localization, accessibility and responsive regression work.

High-risk changes to global auth, RLS strategy, destructive schema, global routing, service-worker architecture, offline conflict policy or production deployment require captain/ADR review.

## Non-negotiable inherited safety contracts

- server-side authorization remains authoritative;
- RLS/data isolation may not be weakened to make tests pass;
- privileged secrets never enter client bundles;
- tenant/assignment/presence/admin privacy boundaries remain protected;
- copyrighted Bible content remains subject to verified redistribution rights;
- one serialized integration stream is maintained for overlapping runtime owners;
- test/field evidence is never fabricated;
- archived branches are history/recovery only.

## Phase state

- Phase 0 — Authority, ADRs, released-V5 baseline: **COMPLETE**.
- Phase 1 — Vite/TypeScript/build/test toolchain: **ACTIVE**.
- Phase 2 — executable Supabase/Postgres CI + fixtures: READY after Phase-1 tooling primitives needed by CI.
- Phase 3 — application kernel/state/data/tenant: READY in bounded characterization/scaffolding tranches.
- Phase 4 — Reader/content/offline engine: NOT STARTED.
- Phase 5 — Games engine: NOT STARTED.
- Phase 6 — Media engine: NOT STARTED.
- Phase 7 — Notification/push/background-sync engine: READY for bounded UI/types/tests; high-risk SW/backend architecture remains ADR/captain-owned.
- Phase 8 — Ministry/admin migration: NOT STARTED.
- Phase 9 — tenant/multi-congregation engine: NOT STARTED.
- Phase 10 — auth/admin/security hardening: NOT STARTED.
- Phase 11 — design/runtime/observability/performance: NOT STARTED.
- Phase 12 — integrated certification/promotion: NOT STARTED.

## Release rule

There is no V6 release candidate yet. Production remains the released V5 line until one exact V6 candidate passes applicable automated, backend, browser/device, security, offline and tenant gates and is explicitly promoted.
