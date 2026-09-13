# BibleQuest V6 Starting Point

Status: **PLANNED / BLOCKED BY V5**

Updated: 2026-09-13 JST

## Required baseline

V6 does not yet have a valid runtime starting SHA.

The only valid V6 runtime baseline will be the **exact accepted V5 production SHA after V5 Phase 8 certification/promotion**.

Planned branch: `v6/architecture-upgrade`
Authority: `V6_ACTIVE_STATUS.md`
Plan: `DEVELOPMENT_PLAN_V6.md`
Acceptance: `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`
ADR path: `docs/v6/adr/`

The older V6/pre-renumber architecture branch history that began from V4-era baselines is experimental/historical evidence only. It may contain useful tests or ideas, but it must not be treated as the official V6 runtime base or bulk-merged after V5.

## Why the baseline changed

The roadmap is now strictly:

1. V5 completes missing product functionality on the current architecture.
2. V6 replaces/upgrades the engine beneath the completed V5 product.
3. V7 performs the full app overhaul using the certified V6 engine.

Starting V6 from V4 would omit V5-completed product behavior and force duplicate feature work. Therefore V6 must inherit V5, not bypass it.

## Activation procedure after V5

When V5 Phase 8 closes:

1. record the exact accepted V5 production SHA in `V6_ACTIVE_STATUS.md`;
2. preserve/archive any pre-V5 V6 experiment refs;
3. create/reset `v6/architecture-upgrade` from the certified V5 SHA;
4. re-run the full inherited V5 baseline on that exact V6 Phase 0 head;
5. accept/refine the V6 ADRs against the real V5-complete codebase;
6. only then begin V6 engine runtime work.

## Engine scope

V6 is deliberately allowed to change:

- build tooling and deployment artifacts;
- module/component boundaries;
- app shell/router/state/data ownership;
- real Supabase/Postgres CI;
- Reader/content/offline engine;
- Games engine;
- media engine;
- notification/background-sync engine;
- tenant context and multi-congregation internals;
- auth/security hardening;
- design/component/i18n/observability/performance platform;
- foundational motion/sound engine.

V6 should migrate and strengthen V5-completed features rather than re-implementing them as if they were still missing.

## V7 boundary

V6 proves the new engine on representative surfaces. Full page-by-page redesign, cross-page UX overhaul, complete visual/motion/sound rollout and cohesion work belong to V7.

## Historical documentation rule

- `V5_ACTIVE_STATUS.md` controls current development while V5 is active.
- `V6_ACTIVE_STATUS.md` controls V6 planning/activation state.
- `DEVELOPMENT_PLAN_V6.md` controls future engine scope.
- `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` controls future V6 release acceptance.
- `DOCUMENTATION_INDEX.md` defines cross-version authority.
- `BACKUP_MANIFEST.md` defines canonical release backups.

No V6 runtime implementation should proceed until the V5 handoff gate above is satisfied.