# BibleQuest V6 Official Active Status

Updated: 2026-09-23 JST
Execution model: one serialized integration stream with bounded specialist tranches
Official V6 integration branch: `v6/architecture-upgrade`
V5.0 production ancestry baseline: `f6a0cff0e63ddf676b77b8470d84678958fe9d70`
Certified V5.0 runtime/source freeze: `c0772d458e9d17ab1728c47c568e99857c7d67a1`
Current production product parity baseline: `7420bbba789ce21e02ac667f98558681e71d2a28`
Historical pre-V5 V6 archive: `archive/v6-pre-v5-experiment-20260913` at `8a5c09b7e95c0bd2956dac957fa359cc9829b20e`
Pre-reconciliation V6 integration head: `684a2424c9451f555952d54434326a7baaa8084a`

## Authority

This file is the authoritative source for current BibleQuest V6 phase, scope, blockers and next work. Repository branch/commit/CI/live-backend evidence overrides stale chat context. Detailed execution is in `DEVELOPMENT_PLAN_V6.md`; acceptance inventory is in `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`; Phase-0 evidence is in `docs/v6/V6_PHASE0_BOOTSTRAP.md`.

## Current state

**Phase 0 — COMPLETE.**
**Phase 1 — BUILD/CLIENT ENGINE: ACTIVE.**
**Production parity reconciliation — ACTIVE / integration gate before additional V6 runtime merges.**

The active V6 line originally forked from V5.0 production `f6a0cff0...`. The product parity contract now includes all production behavior through `7420bbba...`; PR #515 merged that current `main` baseline into the existing V6 parity candidate while preserving the integrated V6 engine history. The obsolete pre-V5 V6 experiment remains archived and is not part of active V6 history.

ADR-0001 and ADR-0002 are ACCEPTED:

- `docs/v6/adr/ADR-0001-build-client-architecture.md`
- `docs/v6/adr/ADR-0002-database-ci.md`

Inherited static/governance gates reported green on the Phase-0 candidate for build/deployment, PWA/install, offline shell/Bible, assignment authorization, shell/Home/Assignments/Calendar, EN/TL localization, active-congregation, push lifecycle/persistence, glyph inventory and V5 state sweep.

Chromium-capable GitHub CI is now operational for V6 built artifacts. The integrated Phase-1 gate has proven all 45 canonical direct deep links plus not-found behavior, the 320/360/390/412/430px representative route matrix, service-worker registration, PWA manifest/icons/shortcuts, and an offline Home-shell reopen. This remains signed-out/browser evidence rather than authenticated role E2E or physical-device acceptance.

The route-page build has also moved from one ~915.21 kB JavaScript entry (~252.71 kB gzip) to a ~557.11 kB entry (~166.19 kB gzip) plus lazy feature chunks. CI now fails if the browser entry exceeds 700 KiB or if fewer than 40 feature route modules remain dynamic chunks. Phase-1 CI now also runs deterministic lint, format, typecheck, unit and build commands. Vite source maps are generated as hidden diagnostics, exclude embedded source text, are moved outside `dist-v6` into ignored exact-SHA private output, and CI proves the public artifact contains neither `.map` files nor `sourceMappingURL` references.

## Production parity reconciliation details

Before additional V6 runtime tranches are integrated, V6 must preserve the accepted production behavior added after the original V6 fork: Personal Challenges, Bible Explorer/Characters & Places, recursive offline module warming, Admin reachability, Daily Journey required-response validation, Ministry Hub Calendar routing, Quick Recall resume/duplicate-XP protection, independent account progress restoration, 72-case multilingual Wisdom Situations through level 8, Tagalog/Cebuano localization/icon corrections, context-correct Couples Scripture references, canonical translation-independent chapter-read progress, and the trusted Progress → leaderboard bridge with server-authoritative scoring and anti-farming/idempotency guarantees.

The reconciliation must preserve V6 lazy route loading, the live Accessibility feature-command seam, V6 database CI, Reader/offline contracts, notification/platform primitives, and all accepted ADRs. Existing open V6 PRs #491, #502 and #503 remain useful work but must be rebased/revalidated on the resulting integration head before merge.

## V6 product decision

V6 strengthens the engine underneath the released V5 product. It may change build tooling, typed module boundaries, state/data ownership, database-test infrastructure, service-worker/storage architecture, media, notifications and internal implementation, but must preserve accepted V5 product/security behavior unless an explicit ADR deliberately supersedes it.

V6 does not reopen completed V5 feature scope merely to justify architecture work.

## Immediate coding authority

Terra/Sol development may start immediately on READY Phase-1 and other bounded V6 work that does not violate an unresolved architecture boundary.

Immediate remaining READY work includes:

1. finish the remaining Phase-1 build-owned legacy asset/CSS migration and exact-SHA deployment-path evidence;
2. expand the already-green disposable Supabase/Postgres gate to additional sensitive domains and drift checks;
3. expand live V6 kernel migration from the proven Accessibility-preferences cutover into bounded Reader/data surfaces without broad rewrites, preserving canonical chapter-read identity and the trusted Progress → leaderboard boundary;
4. connect the Reader offline package engine to user-facing download/storage controls and prove network-disabled reopen/navigation;
5. continue Phase-7 notification/push integration from the preserved V5 production onboarding/lifecycle baseline while keeping backend/security changes serialized;
6. add authenticated role/browser evidence for Member, Leader, Pastor and Admin without treating signed-out route smoke as protected-route proof;
7. continue tests, localization, accessibility and responsive regression work.

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
- Phase 1 — Vite/TypeScript/build/test toolchain: **ACTIVE, MAJOR FOUNDATION GREEN**. Deterministic build/install, lint/format/typecheck/unit/build CI, exact-SHA identity, privacy-safe private source maps, route splitting, bundle budgets and built Chromium/PWA acceptance are integrated; fuller build ownership and deployment-path evidence remain.
- Phase 2 — executable Supabase/Postgres CI + fixtures: **ACTIVE, FOUNDATION GREEN**. Disposable local Supabase, released-V5→V6 replay, two-congregation fixtures, executable RLS/privilege checks, DB lint and deterministic local type generation are integrated; domain coverage/drift expansion remains.
- Phase 3 — application kernel/state/data/tenant: **ACTIVE, FIRST LIVE CUTOVER GREEN**. Typed tenant/repository/async/request boundaries, feature command/event seam and session→tenant coordination are integrated. Accessibility preferences now run live through the V6 feature-command boundary while retaining V5 local persistence/UI behavior; exact-head Chromium proves mutation, runtime application and persistence after reload.
- Phase 4 — Reader/content/offline engine: **ACTIVE IN BOUNDED TRANCHES**. Content manifests/licensing policy, navigation/progress/Japanese seams and offline package lifecycle exist; UI integration and true offline acceptance remain.
- Phase 5 — Games engine: **NOT STARTED**.
- Phase 6 — Media engine: **NOT STARTED**.
- Phase 7 — Notification/push/background-sync engine: **ACTIVE IN BOUNDED TRANCHES**. V6 now also carries the released V5 installed-app notification onboarding, account-safe browser subscription lifecycle and push/notification-click service-worker behavior, with the V5 lifecycle/persistence contracts running inside the V6 build gate. V6 preferences, client cleanup, presentation/status and safe deep-link/shortcut primitives remain in parallel; high-risk backend delivery/deduplication/rate controls and V6 physical-device certification remain separately gated.
- Phase 8 — Ministry/admin migration: **NOT STARTED**.
- Phase 9 — tenant/multi-congregation engine: **FOUNDATION ONLY** through Phase-2/3 tenant/RLS work; broader domain migration remains.
- Phase 10 — auth/admin/security hardening: **NOT STARTED** beyond inherited V5 protections and current CI guards.
- Phase 11 — design/runtime/observability/performance: **EARLY FOUNDATION** through route splitting, build budgets and accessible status/PWA checks.
- Phase 12 — integrated certification/promotion: **NOT STARTED**.

## Release rule

There is no V6 release candidate yet. Production remains the released V5 line until one exact V6 candidate passes applicable automated, backend, browser/device, security, offline and tenant gates and is explicitly promoted.
