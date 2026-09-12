# BibleQuest Documentation Index

Updated: 2026-09-13 JST

Use this file first when deciding which BibleQuest documentation is current.

## Current production

BibleQuest **V4 RC3 is the active production release** on the authoritative Cloudflare project `mybiblequest`.

Current production references:

- `V4_ACTIVE_STATUS.md` — frozen V4 release/acceptance record.
- `BACKUP_MANIFEST.md` — canonical V3/V4 backup branches and exact SHAs.
- `docs/archive/v4/README.md` — V4 archive map and release evidence summary.

## Preparing V5

V5 development has **not started yet**. The clean handoff is:

- `docs/V5_STARTING_POINT.md` — rules and baseline for starting V5 after cleanup.

When V5 begins, create a new V5 authority/status document and explicitly make it the current development authority. Do not repurpose `V4_ACTIVE_STATUS.md` as a V5 status file.

## Historical V4 documentation

V4 root documents remain in their existing paths because workflows/tests and historical links may reference them. Treat them as frozen V4 records after this cleanup. Start with:

- `docs/archive/v4/README.md`
- `V4_ACTIVE_STATUS.md`
- `V4_DOCUMENTATION_AUTHORITY.md`
- `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`
- `RELEASE_FIELD_VALIDATION_V4.md`
- `V4_PHASE6_FIELD_EVIDENCE.json`
- `V4_RELEASE_OWNER_WAIVER.md`

Historical V4 text describing an earlier open blocker does not override the final production acceptance record.

## Historical V3 documentation

V3 contains many root-level feature, architecture, migration, release and validation documents. They remain in place to avoid breaking accumulated regression/architecture contracts and old links.

For V3, start with:

- `docs/archive/v3/README.md`
- `ARCHITECTURE_V3.md`
- `DEVELOPMENT_HANDOFF_V3.md`
- `DEVELOPMENT_STATUS_V3.md`
- `FEATURE_INVENTORY_V3.md`
- `RELEASE_OPERATOR_CHECKLIST_V3.md`

All V3 documents are historical unless a future V5 document explicitly adopts a still-valid contract from them.

## Authority rules

1. Repository/CI/deployed-environment evidence overrides stale chat summaries.
2. `main` is the current code baseline after cleanup; archive branches are backups only.
3. V3 and V4 release documents are frozen historical records, not new-development task lists.
4. Do not physically move or rename a historical file merely for tidiness if a workflow/test references its path; organize it through this index unless the dependent contract is updated in the same change.
5. New V5 documents should live under a clearly named V5 authority structure and link back here.
