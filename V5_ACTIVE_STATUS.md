# BibleQuest V5 Official Active Status

Updated: 2026-09-13 JST
Execution model: controlled five-agent autonomous coding pool with serialized integration
Official V5 integration branch: `v5/architecture-upgrade`
Baseline cleaned `main`: `ef5d46485f9e7138b969777d34de585cfd9ecbd1`
Accepted V5 planning merge: `1f504dec812f11453f82e30af61cdf3d6c547060`
Production safety baseline: BibleQuest V4 RC3
Autonomous protocol: `V5_AUTONOMOUS_AGENT_PROTOCOL.md`
Program tracker: Issue #185

## Authority

This file is the single authoritative source for current BibleQuest V5 phase, scope, blockers, candidate identity, and next work. Repository branch/commit/CI/live-backend evidence overrides stale chat context. V3 and V4 authority files are historical release records and must not be reused as current V5 status.

Detailed execution lives in `DEVELOPMENT_PLAN_V5.md`; release acceptance inventory lives in `V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`; scheduled autonomous execution is governed by `V5_AUTONOMOUS_AGENT_PROTOCOL.md`.

## V5 product decision

V5 is a deliberate architecture-level upgrade with **no V4-era restriction against changing architecture, build tooling, module boundaries, state ownership, database test infrastructure, service-worker strategy, or feature internals**.

"Without limitation" does not mean unsafe big-bang replacement. V5 may replace architecture intentionally, but every replacement must preserve or deliberately supersede production behavior through explicit contracts, migrations, tests, and rollback evidence.

V4 remains the production fallback until a V5 candidate is explicitly accepted and promoted.

## Autonomous coding decision

V5 uses five scheduled autonomous agents working together on **one shared V5 program**.

The model is **controlled parallel development, serialized integration**:

- A1-A4 implement independent non-overlapping tranches on short-lived worker branches and PRs;
- A5 is the integration/dispatch captain and is the only scheduled agent allowed to merge worker PRs into `v5/architecture-upgrade`;
- task ownership is protected by short-lived Issue #185 leases;
- agents have primary specialties but may safely work-steal unclaimed current-phase tasks when blocked;
- workers never write runtime/database/workflow changes directly to `main` or the integration branch;
- scheduled agents never promote V5 to `main`, deploy production, or mutate production Supabase data/configuration;
- red integration/security/database evidence stops new merges until root cause is understood and repaired;
- production/main remains manual-controlled unless a later explicit authority change says otherwise.

The temporary independent-lab experiment is ended. Its five `lab/v5-*` branches are preserved only as read-only experimental evidence and idea sources. They are not active development routes and must not continue as competing V5 products. Useful work from them may be selectively re-implemented or ported only after review into a fresh worker branch based on the latest `v5/architecture-upgrade`.

## Current state

**Phase 0 — V5 architecture program definition and autonomous execution bootstrap: ACTIVE / NEAR EXIT.**

The V5 architecture program was accepted through PR #184 and merged at `1f504dec812f11453f82e30af61cdf3d6c547060` after all inherited automated gates passed on the exact planning head `9ccca11dcd2f10ef5e853a820a317c1999d36b77`.

The coordinated five-agent autonomous coding protocol is active again. Runtime implementation must proceed only through that shared integration route. ADR-0001 and ADR-0002 remain proposed architecture decisions and must be accepted/refined by evidence before their respective irreversible implementation choices are treated as frozen.

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
- integration into `v5/architecture-upgrade` is serialized even when isolated implementation branches run concurrently;
- field evidence is never fabricated and a waiver is never represented as PASS;
- V3/V4 archive branches are recovery/history only and are never V5 integration branches.

## Phase state

- Phase 0 — Authority, architecture program, ADRs, baseline, autonomous protocol: **ACTIVE / NEAR EXIT**.
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

The autonomous pool should close Phase 0 and begin Phase 1/2 foundations in dependency order:

1. verify the current integration SHA and inherited gates remain green after the coordination reset;
2. inventory useful evidence from the five historical labs without bulk-merging them;
3. accept/refine ADR-0001 for build/client architecture and ADR-0002 for real Supabase CI based on current repository/tool evidence;
4. produce the explicit route/domain ownership map and baseline characterization needed by the first migrations;
5. freeze the Phase 0 baseline SHA in this file;
6. begin bounded Phase 1 and Phase 2 implementation PRs in parallel only where ownership is non-overlapping.

## Release rule

There is no V5 release candidate yet. `main`/V4 production remains authoritative for users. A V5 RC may be frozen only after applicable phase acceptance items are closed and the integrated database/browser/security/offline/tenant test matrix is green on one exact candidate SHA. Scheduled agents may not promote V5 to production.