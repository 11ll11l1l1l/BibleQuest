# BibleQuest V6 → V7 Handoff

Updated: 2026-10-04 JST  
V6 authority: `V6_ACTIVE_STATUS.md`  
V6 acceptance inventory: `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`  
V6 architecture plan: `DEVELOPMENT_PLAN_V6.md`  
V6 durable evidence/ADRs: `docs/v6/`

## Purpose

This is the concise engineering handoff from the completed V6 architecture line to future V7 development. It does not replace V6 release evidence, acceptance history, ADRs, migrations, provenance records, or rollback records. Historical task boards and agent chatter are not V7 requirements.

## Stable V6 contracts V7 must preserve unless deliberately superseded

- Server-side authorization, RLS/privacy outcomes, explicit active-congregation/tenant isolation, and fail-closed role checks.
- Typed application/module boundaries and deterministic build/deployment identity.
- Executable database/security validation and migration-history integrity.
- Reader/content/offline ownership, including true offline Bible behavior and source/license attribution.
- BSB Audio provenance, exact source/timing identity, verified alignment semantics, offline-source evidence, Media Session behavior, and accessibility/manual-navigation safeguards.
- Notification/push/background-sync delivery contracts and assignment notification semantics.
- Deterministic Games engine contracts.
- Observability/error taxonomy, performance budgets, accessibility preferences, motion/sound preferences, and PWA/offline contracts.
- Exact-SHA release evidence, rollback references, and durable certification records under `docs/v6/`.

V7 must not silently weaken these contracts. A deliberate replacement should be recorded with equivalent-or-stronger tests/evidence and, where architectural, an ADR.

## Protected data and migration contracts

- Preserve all shipped Supabase/Postgres migration history. Do not squash, renumber, rewrite, or delete applied migrations for repository tidiness.
- Preserve tenant/congregation identifiers and authorization semantics across schema/repository changes.
- Preserve user data compatibility and rollback/recovery evidence when changing persistence formats.
- Preserve Bible/BSB source, license, attribution, checksum/version, timing, and provenance records.
- Preserve V6 security/tenant tests and release certification evidence even when implementation is reorganized.

## Intentionally deferred to V7

V6 built the reusable engine and representative modern surfaces; V7 owns the broader product overhaul. Already documented/approved V7 directions include:

- full product/UI overhaul on the V6 engine rather than another engine rewrite;
- Library expansion for books, devotionals, and Past Teachings;
- central Google Drive-backed ministry media workflow with Supabase metadata/moderation;
- Leader Conversation Deck for small groups;
- ONE 2 ONE discipleship flows and mentor/mentee support;
- Ilocano priority for Bible content, followed by UI localization;
- broader life-topic devotional/library experiences.

These are directions, not implementation specifications. V7 should create its own acceptance inventory and ADRs before turning them into architecture or data contracts.

## Known technical/documentation debt

- `DOCUMENTATION_INDEX.md` is stale and still describes V4 production/V5 development. Treat `V6_ACTIVE_STATUS.md` as current authority until the index is reconciled.
- `docs/V6_STARTING_POINT.md` is a historical Phase-0 starting snapshot; statements that V6 runtime migration has not started are no longer current.
- `V6_AGENT_TASK_BOARD.md` is an execution-history/task snapshot, not current acceptance truth. Its old SHAs, counts, BSB, push, and Cloudflare blockers must not be imported into V7 as open work without revalidation.
- `V6_ACTIVE_STATUS.md` intentionally contains historical checkpoints beneath its current authority section. Use the newest dated checkpoint first; older sections are evidence/history, not the current queue.

## Repository conventions for V7

1. Start from exact repository truth, not chat summaries or historical worker prompts.
2. Establish one V7 active-status authority, one acceptance inventory, one development plan, and ADRs for material architecture decisions.
3. Keep durable evidence separate from transient task/agent coordination.
4. Prefer bounded PRs based on current integration; rebase/revalidate stale work before integration.
5. Never weaken security, tenant isolation, migration safety, provenance, accessibility, offline/PWA, or release evidence merely to simplify implementation.
6. Keep production promotion/release authorization separate from development or cleanup authorization.
7. Preserve historical release records in place when paths are referenced by tests/workflows; migrate references atomically if paths must change.

## V6 documentation authority map

| Topic | Canonical V6 source |
| --- | --- |
| Current phase/release truth | `V6_ACTIVE_STATUS.md` |
| Acceptance inventory | `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` |
| Architecture/program | `DEVELOPMENT_PLAN_V6.md` |
| ADRs, provenance, security and release evidence | `docs/v6/` |
| Historical starting snapshot | `docs/V6_STARTING_POINT.md` |
| Historical worker/task execution | `V6_AGENT_TASK_BOARD.md` |

When documents conflict, repository/CI/deployed-environment evidence and the current authority files above override historical snapshots.
