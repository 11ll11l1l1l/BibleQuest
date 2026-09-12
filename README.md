# BibleQuest

BibleQuest is a Bible learning, study, family, community and ministry web application with games, assignments, Bible reading, congregation features, administrative tools, PWA/offline support and related learning experiences.

## Production

**BibleQuest V4 RC3 remains the active production release.**

- production host: `https://mybiblequest.pages.dev`
- exact promoted V4 application candidate: `7de1c53ddd33c028498b35bee77be30e56878dec`
- exact production merge: `3c74d4f3600dbb05070ba57adb7c3c0b539a9aeb`
- frozen V4 production/acceptance record: `V4_ACTIVE_STATUS.md`

## Current development — V5

V5 architecture planning is active on `v5/architecture-upgrade`, created from cleaned `main` `ef5d46485f9e7138b969777d34de585cfd9ecbd1`.

V5 is a deliberate architecture-level upgrade. Unlike V4, it is not constrained to preserving existing implementation architecture. The plan includes real database/RLS testing, Vite/TypeScript build tooling, Reader/Games decomposition, true offline Bible reading, modern media ownership, Web Push, Leader Center and real multi-congregation operation.

No V5 runtime migration has started yet; current Phase 0 is architecture/governance and baseline acceptance.

## Before changing anything

Read these in order:

1. `DOCUMENTATION_INDEX.md` — cross-version authority map.
2. `V5_ACTIVE_STATUS.md` — current V5 authority/status.
3. `DEVELOPMENT_PLAN_V5.md` — V5 architecture program and phase sequence.
4. `V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` — release-blocking V5 inventory.
5. `docs/v5/adr/README.md` — architecture decision record process.
6. `BACKUP_MANIFEST.md` — canonical frozen V3/V4 backups.

## Version archives

- V3 archive: `docs/archive/v3/README.md`
- V4 archive: `docs/archive/v4/README.md`
- archive policy/index: `docs/archive/README.md`

Historical V3/V4 documents intentionally remain in their existing paths where tests, workflows, architecture validators or old links may reference them. Their old phase state is not current V5 status.

## V5 execution rules

- Keep one serialized integration stream for runtime/data changes.
- V5 may replace implementation architecture, but must preserve or explicitly supersede production data/privacy/authorization outcomes with ADRs and equivalent-or-stronger tests.
- Real database authorization must be tested against actual Postgres/Supabase behavior; static SQL matching is not sufficient V5 release evidence.
- Active congregation/tenant context must be explicit for tenant-sensitive operations.
- Server authorization remains authoritative; client role checks are UX only.
- Offline behavior must be declared per domain, including conflict/retry rules for writable data.
- Do not weaken valid tests to obtain green status.
- Do not fabricate field/device evidence; `WAIVED` is not `PASS`.
- Preserve V4 production/archive rollback until V5 production acceptance is complete.

## Validation transition

The repository still contains accumulated V3/V4-named validators/workflows because they protect current behavior. V5 will migrate them to reusable/version-neutral build, database, security, browser, PWA/offline and release gates only when equivalent-or-stronger coverage exists.
