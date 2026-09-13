# BibleQuest Documentation Index

Updated: 2026-09-13 JST

Use this file first when deciding which BibleQuest documentation is current.

## Current production

BibleQuest **V4 RC3 remains the active production release** on the authoritative Cloudflare project `mybiblequest`.

Production references:

- `V4_ACTIVE_STATUS.md` — frozen V4 release/acceptance record.
- `BACKUP_MANIFEST.md` — canonical V3/V4 backup branches and exact SHAs.
- `docs/archive/v4/README.md` — V4 archive map and release evidence summary.

## Current development — V5 feature completion

The active development line is `v5/feature-completion`.

Read current V5 documents in this order:

1. `V5_ACTIVE_STATUS.md` — single authority for current V5 phase, blockers, candidate identity and next work.
2. `DEVELOPMENT_PLAN_V5.md` — V5 feature-completion plan.
3. `V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` — V5 release-blocking feature/verification inventory.
4. `V5_COORDINATED_AGENT_PROTOCOL.md` — coordinated five-agent execution rules.
5. Issue #185 — shared task/claim/integration tracker; repository authority still overrides issue text.

V5 deliberately stays on the current proven architecture. Architecture replacement belongs to V6.

## Next version — V6 engine / architecture upgrade

V6 is planned but **blocked until V5 Phase 8 certification/promotion**.

Read:

1. `V6_ACTIVE_STATUS.md` — planned/blocked status and activation gate.
2. `DEVELOPMENT_PLAN_V6.md` — engine architecture plan.
3. `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` — V6 engine certification inventory.
4. `docs/V6_STARTING_POINT.md` — historical/planning handoff notes; the final V6 runtime baseline will be the accepted V5 production SHA.
5. `docs/v6/adr/README.md` — V6 ADR process.

V6 must not start from the old V4 cleanup SHA. Its runtime baseline is the exact V5 production SHA accepted at V5 Phase 8.

## Following version — V7 full overhaul

V7 is planned but **blocked until V6 Phase 12 certification/promotion**.

Read:

1. `V7_ACTIVE_STATUS.md` — planned/blocked status and activation gate.
2. `DEVELOPMENT_PLAN_V7.md` — full application overhaul plan using the V6 engine.
3. `V7_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` — V7 full-overhaul acceptance inventory.

V7 is not another engine rewrite. It uses the certified V6 engine to comprehensively overhaul navigation treatment, page composition, UX, responsive behavior, visual design, artwork, motion, sound and cross-page cohesion.

## Strict version sequence

**V5 feature completion → V6 engine upgrade → V7 full overhaul.**

No V6/V7 runtime implementation should proceed in parallel with an unfinished predecessor.

## Historical V4 documentation

V4 root documents remain in their existing paths because workflows/tests and historical links may reference them. Treat them as frozen V4 records. Start with:

- `docs/archive/v4/README.md`
- `V4_ACTIVE_STATUS.md`
- `V4_DOCUMENTATION_AUTHORITY.md`
- `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`
- `RELEASE_FIELD_VALIDATION_V4.md`
- `V4_PHASE6_FIELD_EVIDENCE.json`
- `V4_RELEASE_OWNER_WAIVER.md`

Historical V4 text describing an earlier blocker does not override the final V4 production record or current V5 authority.

## Historical V3 documentation

V3 root-level feature, architecture, migration, release and validation documents remain in place to avoid breaking tests/workflows/old links.

Start with:

- `docs/archive/v3/README.md`
- `ARCHITECTURE_V3.md`
- `DEVELOPMENT_HANDOFF_V3.md`
- `DEVELOPMENT_STATUS_V3.md`
- `FEATURE_INVENTORY_V3.md`
- `RELEASE_OPERATOR_CHECKLIST_V3.md`

## Authority rules

1. Repository/CI/deployed-environment evidence overrides stale chat summaries.
2. `main` remains production until a later V5 promotion; `v5/feature-completion` is the active development integration line.
3. `V5_ACTIVE_STATUS.md` is the current development authority.
4. `V6_ACTIVE_STATUS.md` and `V7_ACTIVE_STATUS.md` are future-version authorities but remain BLOCKED until predecessor certification.
5. V3/V4 archive branches are backups/history only.
6. Do not move/rename historical files merely for tidiness if workflows/tests still reference them; migrate dependent contracts in the same change.
7. V5 architecture limitations are recorded for V6 rather than solved through temporary broad rewrites.
8. V6 engine decisions belong in V6 ADRs under `docs/v6/adr/`.
9. A historical workflow/test name containing `v3` or `v4` may continue protecting current behavior until V6 replaces it with equivalent-or-stronger version-neutral coverage.