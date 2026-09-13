# BibleQuest V6 Official Active Status

Updated: 2026-09-13 JST
Execution model: one serialized integration stream
Official V6 integration branch: `v6/architecture-upgrade`
Baseline cleaned `main`: `ef5d46485f9e7138b969777d34de585cfd9ecbd1`
Production safety baseline: BibleQuest V4 RC3

## Authority

This file is the single authoritative source for current BibleQuest V6 phase, scope, blockers, candidate identity, and next work. Repository branch/commit/CI/live-backend evidence overrides stale chat context. V3 and V4 authority files are historical release records and must not be reused as current V6 status.

Detailed execution lives in `DEVELOPMENT_PLAN_V6.md`; release acceptance inventory lives in `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`.

## V6 product decision

V6 is a deliberate architecture-level upgrade with **no V4-era restriction against changing architecture, build tooling, module boundaries, state ownership, database test infrastructure, service-worker strategy, or feature internals**.

"Without limitation" does not mean unsafe big-bang replacement. V6 may replace architecture intentionally, but every replacement must preserve or deliberately supersede production behavior through explicit contracts, migrations, tests, and rollback evidence.

V4 remains the production fallback until a V6 candidate is explicitly accepted and promoted.

## Current state

**Phase 0 — V6 architecture program definition: ACTIVE.**

No V6 runtime feature implementation has started yet. The current V6 branch was created directly from the cleaned and verified V4 production line at `ef5d46485f9e7138b969777d34de585cfd9ecbd1`.

The first V6 deliverable is governance and architecture documentation only. Runtime changes begin only after this plan is accepted and the inherited baseline is green on the V6 branch.

## Mandatory V6 outcomes

V6 must address the following codebase-proven limits:

1. Real Supabase/Postgres database testing in CI, including migrations, RLS, grants/revokes and `SECURITY DEFINER` behavior.
2. A real Node/Vite build system with TypeScript-capable module boundaries, code splitting, CSS/assets processing and production build artifacts.
3. Reader and Games decomposition into testable modules/components with isolated state; Games gains a proper game engine and removes raw emoji UI where real assets exist.
4. A real media subsystem replacing the one-frame Audio singleton and raw YouTube command bridge while retaining controlled audible playback.
5. Real Web Push delivery for supported notifications, backed by explicit subscriptions/preferences and an in-app inbox fallback.
6. True offline Bible reading with versioned downloadable Scripture content and a deliberate service-worker/storage strategy.
7. A proper Leader Center using the assignment-review, membership and privacy-safe presence capabilities already established in V4.
8. Genuine multi-congregation architecture/tooling with deterministic two-congregation CI fixtures and explicit active-congregation context.
9. A real Motion and Sound System (see Phase 11 of `DEVELOPMENT_PLAN_V6.md`) as a first-class app-level owner - design tokens, an animation/sound preset registry, gesture-unlock handling, and a persisted user preference - proven end-to-end on 2-3 reference surfaces. Full-app rollout of this system is explicitly out of V6 scope; see `DEVELOPMENT_PLAN_V7.md`.

## V6 is already scoped, not yet active

`DEVELOPMENT_PLAN_V6.md` sketches the next major version: full-coverage, family-by-family application of the V6 Motion and Sound System across every page, plus the cross-page cohesion pass a partial rollout cannot achieve ("fully polished, integrated app feel"). V6 does not begin until V6 Phase 12 (certification/promotion) is complete. V6 must not re-architect anything - if V6 work exposes a real gap in the Motion/Sound System itself, that gap is fixed in V6, not worked around in V6.

## Additional architecture outcomes adopted for V6

Because they directly support the required upgrades above, V6 also adopts:

- generated database types and typed domain/service contracts;
- deterministic local/CI seed topology covering two congregations and meaningful role/account combinations;
- a real test pyramid: unit/domain, database integration, component/browser, deployed E2E and physical-device acceptance where required;
- a centralized data/repository boundary instead of feature-specific ad-hoc remote calls;
- explicit app/session/tenant state ownership and migration away from fragile monolithic render/state flows;
- versioned offline mutation queues and conflict rules for safe user-owned writes;
- privacy-safe observability, release/build identity and production error diagnostics;
- formal architecture decision records (ADRs) for intentional V6 contract changes;
- version-neutral CI naming and reusable release gates rather than continuing permanent `v3-*` / `v4-*` workflow naming;
- a formal design-system/component layer and i18n/content boundaries as modules are migrated;
- removal of certified-but-dead owners such as the old Media Library path only after parity and regression proof;
- bundle, image and route performance budgets once Vite owns the build.

## Non-negotiable inherited safety contracts

Architecture may change; these outcomes may not silently regress:

- server-side authorization remains authoritative; UI visibility is never treated as permission;
- RLS/data-isolation behavior must be executable-tested, not weakened to make tests pass;
- secrets and privileged credentials never move into the client bundle;
- assignment, presence, congregation, admin and linked-activity privacy/isolation contracts remain protected unless an explicit V6 ADR intentionally replaces them with a stricter/equivalent model;
- copyrighted Bible translations remain external unless redistribution rights are verified;
- one serialized runtime integration stream is maintained;
- field evidence is never fabricated and a waiver is never represented as PASS;
- V3/V4 archive branches are recovery/history only and are never V6 integration branches.

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
- Phase 12 — Integrated V6 certification and production promotion: NOT STARTED.

## Immediate next gate

Before Phase 1 runtime work:

1. Merge/accept the V6 planning documents.
2. Re-run inherited V4 regression, security/privacy, responsive/PWA, protected-page and whole-app/browser baselines on the exact V6 planning head.
3. Record ADR-0001 for the build/client architecture decision and ADR-0002 for the real Supabase CI strategy.
4. Freeze a Phase 0 baseline SHA in this file.

## Release rule

There is no V6 release candidate yet. `main`/V4 production remains authoritative for users. A V6 RC may be frozen only after applicable phase acceptance items are closed and the integrated database/browser/security/offline/tenant test matrix is green on one exact candidate SHA.
