# BibleQuest Documentation Index

Updated: 2026-09-13 JST

Use this file first when deciding which BibleQuest documentation is current.

## Current production

BibleQuest **V4 RC3 remains the active production release** on the authoritative Cloudflare project `mybiblequest`.

Production references:

- `V4_ACTIVE_STATUS.md` — frozen V4 release/acceptance record.
- `BACKUP_MANIFEST.md` — canonical V3/V4 backup branches and exact SHAs.
- `docs/archive/v4/README.md` — V4 archive map and release evidence summary.

## Current development — V5

V5 architecture planning is active on `v5/architecture-upgrade`. Runtime architecture migration has not started yet.

Read current V5 documents in this order:

1. `V5_ACTIVE_STATUS.md` — single authority for current V5 phase, branch, blockers, candidate identity and next work.
2. `DEVELOPMENT_PLAN_V5.md` — deliberate architecture-upgrade program and phase sequencing.
3. `V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` — V5 release-blocking architecture/feature inventory.
4. `docs/V5_STARTING_POINT.md` — cleaned V4→V5 handoff and safety baseline.
5. `docs/v5/adr/README.md` — architecture decision record process and initial ADR queue.

V5 is explicitly allowed to replace V4 implementation architecture. Historical V3/V4 status files do not constrain V5 architecture unless V5 explicitly inherits a safety/behavior contract.

## Historical V4 documentation

V4 root documents remain in their existing paths because workflows/tests and historical links may reference them. Treat them as frozen V4 records. Start with:

- `docs/archive/v4/README.md`
- `V4_ACTIVE_STATUS.md`
- `V4_DOCUMENTATION_AUTHORITY.md`
- `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`
- `RELEASE_FIELD_VALIDATION_V4.md`
- `V4_PHASE6_FIELD_EVIDENCE.json`
- `V4_RELEASE_OWNER_WAIVER.md`

Historical V4 text describing an earlier open blocker does not override the final V4 production acceptance record or the current V5 authority.

## Historical V3 documentation

V3 contains many root-level feature, architecture, migration, release and validation documents. They remain in place to avoid breaking accumulated regression/architecture contracts and old links.

For V3, start with:

- `docs/archive/v3/README.md`
- `ARCHITECTURE_V3.md`
- `DEVELOPMENT_HANDOFF_V3.md`
- `DEVELOPMENT_STATUS_V3.md`
- `FEATURE_INVENTORY_V3.md`
- `RELEASE_OPERATOR_CHECKLIST_V3.md`

All V3 documents are historical unless a V5 authority/ADR explicitly adopts a still-valid contract from them.

## Authority rules

1. Repository/CI/deployed-environment evidence overrides stale chat summaries.
2. `main` remains the production code baseline until a later V5 promotion; `v5/architecture-upgrade` is the current V5 integration line.
3. `V5_ACTIVE_STATUS.md` is the current development authority; V3/V4 release documents are frozen historical records.
4. V3/V4 archive branches are backups only and must not receive V5 development.
5. Do not physically move/rename a historical file merely for tidiness if a workflow/test references its path; migrate the dependent contract in the same change first.
6. Material V5 architecture decisions belong in an ADR and current phase/blocker changes belong in `V5_ACTIVE_STATUS.md`.
7. A historical test/workflow name containing `v3` or `v4` may still protect current behavior until V5 replaces it with equivalent-or-stronger version-neutral coverage.
