# BibleQuest V5 Starting Point

Status: **V5 ARCHITECTURE PLANNING ACTIVE — RUNTIME MIGRATION NOT YET STARTED**

Updated: 2026-09-13 JST

## Baseline

The V5 integration line now exists:

- branch: `v5/architecture-upgrade`
- exact cleaned starting SHA: `ef5d46485f9e7138b969777d34de585cfd9ecbd1`
- current V5 authority: `V5_ACTIVE_STATUS.md`
- detailed plan: `DEVELOPMENT_PLAN_V5.md`
- acceptance inventory: `V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`

The accepted production runtime remains BibleQuest V4 RC3:

- exact application candidate: `7de1c53ddd33c028498b35bee77be30e56878dec`
- production merge: `3c74d4f3600dbb05070ba57adb7c3c0b539a9aeb`
- production host: `https://mybiblequest.pages.dev`

V3 and V4 archive branches remain recovery/history references only and must not become V5 development branches.

## What changed from the preparation-only handoff

The release/archive cleanup is complete and verified. V5 now has its own branch and authority documents. Phase 0 planning/governance is active, but no V5 runtime architecture migration or feature implementation has started yet.

Before the first runtime architecture change:

1. accept/merge the V5 planning documents;
2. run the inherited architecture, regression, security/privacy, responsive/PWA, protected-page and whole-app baseline on the exact V5 planning head;
3. accept ADR-0001 for build/client architecture and ADR-0002 for real database CI;
4. record the exact Phase 0 baseline SHA in `V5_ACTIVE_STATUS.md`.

## V5 architecture policy

V5 is deliberately allowed to replace V4 implementation architecture. This includes build tooling, module/component boundaries, state management, service-worker/offline architecture, media ownership, database-test infrastructure and feature internals.

Architecture freedom does not authorize silent regressions. Server-side authorization, RLS/privacy outcomes, data migration safety, user-facing accepted behavior and rollback evidence must be preserved or intentionally superseded by an explicit V5 ADR with equivalent-or-stronger tests.

## Historical documentation rule

- `/V5_ACTIVE_STATUS.md` controls current V5 state.
- `/DEVELOPMENT_PLAN_V5.md` controls the planned architecture program.
- `/V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` controls release acceptance inventory.
- `/DOCUMENTATION_INDEX.md` defines cross-version documentation authority.
- `/BACKUP_MANIFEST.md` defines canonical backups.
- `/docs/archive/v3/README.md` and `/docs/archive/v4/README.md` classify historical records.

V3/V4 documents may be consulted for history/requirements, but their old phase state does not become a V5 task automatically.

## First V5 cleanup/migration targets

The accepted V5 plan specifically addresses:

- Vite/TypeScript/build tooling and typed module contracts;
- executable Supabase/Postgres CI and deterministic two-congregation fixtures;
- Reader and Games decomposition;
- true offline Bible reading;
- modern media ownership;
- Web Push/background delivery;
- Leader Center;
- explicit multi-congregation operation;
- dead architectural owners, version-specific CI naming, observability and performance debt after the new foundations exist.

No archive branch should be modified as part of V5 work.
