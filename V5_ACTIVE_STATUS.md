# BibleQuest V5 Official Active Status

Updated: 2026-09-13 JST
Execution model: one serialized integration stream
Official V5 integration branch: `v5/architecture-upgrade`
Baseline cleaned `main`: `ef5d46485f9e7138b969777d34de585cfd9ecbd1`
Production safety baseline: BibleQuest V4 RC3

## Authority

This file is the single authoritative source for current BibleQuest V5 phase, scope, blockers, candidate identity, and next work. Repository branch/commit/CI/live-backend evidence overrides stale chat context. V3 and V4 authority files are historical release records and must not be reused as current V5 status.

Detailed execution lives in `DEVELOPMENT_PLAN_V5.md`; release acceptance inventory lives in `V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`.

## V5 product decision

V5 is a deliberate architecture-level upgrade with **no V4-era restriction against changing architecture, build tooling, module boundaries, state ownership, database test infrastructure, service-worker strategy, or feature internals**.

"Without limitation" does not mean unsafe big-bang replacement. V5 may replace architecture intentionally, but every replacement must preserve or deliberately supersede production behavior through explicit contracts, migrations, tests, and rollback evidence.

V4 remains the production fallback until a V5 candidate is explicitly accepted and promoted.

## Current state

**Phase 0 — V5 architecture program definition: ACTIVE.**

No V5 runtime feature implementation has started yet. The current V5 branch was created directly from the cleaned and verified V4 production line at `ef5d46485f9e7138b969777d34de585cfd9ecbd1`.

The first V5 deliverable is governance and architecture documentation only. Runtime changes begin only after this plan is accepted and the inherited baseline is green on the V5 branch.

## Mandatory V5 outcomes

V5 must address the following codebase-proven limits:

1. Real Supabase/Postgres database testing in CI, including migrations, RLS, grants/revokes and `SECURITY DEFINER` behavior.
2. A real Node/Vite build system with TypeScript-capable module boundaries, code splitting, CSS/assets processing and production build artifacts.
3. Reader and Games decomposition into testable modules/components with isolated state; Games gains a proper game engine and removes raw emoji UI where real assets exist.
4. A real media subsystem replacing the one-frame Audio singleton and raw YouTube command bridge while retaining controlled audible playback.
5. Real Web Push delivery for supported notifications, backed by explicit subscriptions/preferences and an in-app inbox fallback.
6. True offline Bible reading with versioned downloadable Scripture content and a deliberate service-worker/storage strategy.
7. A proper Leader Center using the assignment-review, membership and privacy-safe presence capabilities already established in V4.
8. Genuine multi-congregation architecture/tooling with deterministic two-congregation CI fixtures and explicit active-congregation context.

## Additional architecture outcomes adopted for V5

Because they directly support the required upgrades above, V5 also adopts:

- generated database types and typed domain/service contracts;
- deterministic local/CI seed topology covering two congregations and meaningful role/account combinations;
- a real test pyramid: unit/domain, database integration, component/browser, deployed E2E and physical-device acceptance where required;
- a centralized data/repository boundary instead of feature-specific ad-hoc remote calls;
- explicit app/session/tenant state ownership and migration away from fragile monolithic render/state flows;
- versioned offline mutation queues and conflict rules for safe user-owned writes;
- privacy-safe observability, release/build identity and production error diagnostics;
- formal architecture decision records (ADRs) for intentional V5 contract changes;
- version-neutral CI naming and reusable release gates rather than continuing permanent `v3-*` / `v4-*` workflow naming;
- a formal design-system/component layer and i18n/content boundaries as modules are migrated;
- removal of certified-but-dead owners such as the old Media Library path only after parity and regression proof;
- bundle, image and route performance budgets once Vite owns the build.

## Non-negotiable inherited safety contracts

Architecture may change; these outcomes may not silently regress:

- server-side authorization remains authoritative; UI visibility is never treated as permission;
- RLS/data-isolation behavior must be executable-tested, not weakened to make tests pass;
- secrets and privileged credentials never move into the client bundle;
- assignment, presence, congregation, admin and linked-activity privacy/isolation contracts remain protected unless an explicit V5 ADR intentionally replaces them with a stricter/equivalent model;
- copyrighted Bible translations remain external unless redistribution rights are verified;
- one serialized runtime integration stream is maintained;
- field evidence is never fabricated and a waiver is never represented as PASS;
- V3/V4 archive branches are recovery/history only and are never V5 integration branches.

## Phase state

- Phase 0 — Authority, architecture program, ADRs, baseline: **ACTIVE**.
- Phase 1 — Vite/TypeScript/build/test toolchain: NOT STARTED.
- Phase 2 — Real Supabase/Postgres CI + deterministic tenant fixtures: NOT STARTED.
- Phase 3 — Core client architecture/state/data boundary: NOT STARTED.
- Phase 4 — Reader architecture + true offline Bible: NOT STARTED.
- Phase 5 — Games engine + componentized Games UI: NOT STARTED.
- Phase 6 — Media subsystem modernization: NOT STARTED.
- Phase 7 — Push notifications + service-worker/background/offline-sync platform: NOT STARTED.
- Phase 8 — Leader Center: NOT STARTED.
- Phase 9 — Multi-congregation product/tooling: NOT STARTED.
- Phase 10 — Auth/admin/security hardening: NOT STARTED.
- Phase 11 — Design system, i18n, observability, performance consolidation: NOT STARTED.
- Phase 12 — Integrated V5 certification and production promotion: NOT STARTED.

## Immediate next gate

Before Phase 1 runtime work:

1. Merge/accept the V5 planning documents.
2. Re-run inherited V4 regression, security/privacy, responsive/PWA, protected-page and whole-app/browser baselines on the exact V5 planning head.
3. Record ADR-0001 for the build/client architecture decision and ADR-0002 for the real Supabase CI strategy.
4. Freeze a Phase 0 baseline SHA in this file.

## Release rule

There is no V5 release candidate yet. `main`/V4 production remains authoritative for users. A V5 RC may be frozen only after applicable phase acceptance items are closed and the integrated database/browser/security/offline/tenant test matrix is green on one exact candidate SHA.
