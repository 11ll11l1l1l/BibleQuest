# BibleQuest Documentation Index

Updated: 2026-10-04 JST

Use this file first when deciding which BibleQuest documentation is current. Repository/CI/deployed-environment evidence overrides stale chat summaries and historical status text.

## Current production — V6

BibleQuest **V6 is the active production release**. Current production/release truth is recorded in `V6_ACTIVE_STATUS.md`; acceptance is tracked in `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`.

Read current V6 documents in this order:

1. `V6_ACTIVE_STATUS.md` — single authority for current V6 production/release state, exact candidate identity, evidence boundaries, and remaining open/waived items.
2. `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` — authoritative V6 acceptance inventory.
3. `DEVELOPMENT_PLAN_V6.md` — V6 architecture/program plan and durable contracts.
4. `docs/v6/` — V6 ADRs, provenance, security, release, field, and certification evidence.
5. `docs/V6_TO_V7_HANDOFF.md` — concise engineering handoff defining V6 contracts V7 must preserve and the clean V7 starting conventions.

`V6_AGENT_TASK_BOARD.md` is execution history/worker coordination, not current acceptance truth. `docs/V6_STARTING_POINT.md` is the historical Phase-0 starting snapshot.

## Next development — V7 preparation

V7 implementation begins from the completed V6 engine and current repository truth; it must not reinterpret historical V6 worker prompts as open requirements.

Read V7 preparation documents in this order:

1. `docs/V6_TO_V7_HANDOFF.md` — V6 contracts, protected evidence/data boundaries, repository conventions, and documentation debt to carry forward.
2. `DEVELOPMENT_PLAN_V7.md` — approved V7 product direction and phase planning.
3. `docs/v7/` — V7-specific durable contracts/ADRs as they are accepted.

V7 feature implementation should establish its own active-status authority, acceptance inventory, and ADRs before new architecture/data contracts are treated as canonical.

## Historical V5 documentation

V5 root documents remain in place because workflows/tests and historical links may reference them. Treat them as frozen historical records, not current production or current development authority.

Start with:

- `V5_ACTIVE_STATUS.md`
- `DEVELOPMENT_PLAN_V5.md`
- `V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`
- `docs/V5_STARTING_POINT.md`
- `docs/v5/adr/README.md`

## Historical V4 documentation

V4 root documents remain in their existing paths because workflows/tests and historical links may reference them. Treat them as frozen V4 records. Start with:

- `docs/archive/v4/README.md`
- `V4_ACTIVE_STATUS.md`
- `V4_DOCUMENTATION_AUTHORITY.md`
- `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`
- `RELEASE_FIELD_VALIDATION_V4.md`
- `V4_PHASE6_FIELD_EVIDENCE.json`
- `V4_RELEASE_OWNER_WAIVER.md`

Historical V4 text describing an earlier open blocker does not override the final V4 record or current V6 authority.

## Historical V3 documentation

V3 contains many root-level feature, architecture, migration, release and validation documents. They remain in place to avoid breaking accumulated regression/architecture contracts and old links.

For V3, start with:

- `docs/archive/v3/README.md`
- `ARCHITECTURE_V3.md`
- `DEVELOPMENT_HANDOFF_V3.md`
- `DEVELOPMENT_STATUS_V3.md`
- `FEATURE_INVENTORY_V3.md`
- `RELEASE_OPERATOR_CHECKLIST_V3.md`

All V3 documents are historical unless a current authority/ADR explicitly adopts a still-valid contract from them.

## Authority rules

1. Repository/CI/deployed-environment evidence overrides stale chat summaries.
2. `V6_ACTIVE_STATUS.md` is the current production/release authority; `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` owns V6 acceptance state.
3. `docs/V6_TO_V7_HANDOFF.md` and `DEVELOPMENT_PLAN_V7.md` define the clean V7 starting boundary and approved direction; they do not silently supersede V6 security, data, migration, provenance, accessibility, offline/PWA, or release contracts.
4. Historical V3/V4/V5/V6-starting/task-board documents are evidence/history unless a current authority explicitly adopts a still-valid contract from them.
5. Do not physically move/rename a historical file merely for tidiness if a workflow/test references its path; migrate the dependent contract in the same change first.
6. Material V7 architecture decisions belong in V7 ADRs; current V7 phase/blocker changes belong in the future V7 active-status authority rather than historical V6 task boards.
7. A historical test/workflow name containing an older version may still protect current behavior until replaced with equivalent-or-stronger version-neutral coverage.
