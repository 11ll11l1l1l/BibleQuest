# Task: Reconcile the V7 P0-A data architecture contract

Owner: Lane A — domain and data contracts
Branch: `v7/p0-a-data-architecture-20261004-r2`
Exact starting SHA: `cb484bc839f9874659f501a755d93ae78dbceed6`
Status: COMPLETE — integrated into the serialized P0 contract freeze

## Scope

- Define the logical Library and structured ONE 2 ONE entities, relationships, provenance, revision, learner-history, and privacy-preservation requirements.
- Align with current P0-C pair privacy/tenancy and P0-D Library/ONE 2 ONE acceptance contracts.
- Defer Conversation Decks/group realtime communication, central Drive media storage/moderation, and other V8 scope.
- Owned files: `docs/v7/V7_DATA_ARCHITECTURE.md` and this task record.
- Excluded: runtime, database migrations, generated schema, route design, RLS/authorization policy, workflow/release changes, and the canonical shared status file.
- P0-A is a proposal until the serialized integration owner reconciles all four P0 artifacts and records the phase exit.

## Work completed

- Used the live `v7/development` baseline at `cb484bc839f9874659f501a755d93ae78dbceed6`.
- Read current V7 status/roadmap, rulebook, P0-C security contract, and P0-D acceptance/content contract.
- Defined Library items, immutable revisions, translations, categories/tags, provenance/licensing, and lesson content links.
- Defined Track → Module → Lesson, seven ordered step types, mentor/mentee lifecycle, assignments, learner progress, private-by-default lesson responses, item-level response shares, and pair-scoped communication.
- Kept message transport/storage mapped to the existing V6 communication owner; no duplicate chat infrastructure or new retention period is proposed.
- Explicitly excluded Conversation Decks, broader group/realtime systems, central Drive media pipeline/full moderation, and remaining named V8 scope.
- Kept role, tenant, RLS, authorization, retention, and denial policy with P0-C.
- No runtime, migration, workflow, production, or existing acceptance-evidence files changed.

## Verification and handoff

- Contract and task are documentation-only; no runtime test applies.
- Fetched both files at the resulting branch head; check zero trailing whitespace and no changed local links requiring resolution.
- Current P0-A baseline is exact; do not reuse the older P0-A branch/PR based on `7d972a0ecdc048fc435e5ca44f94f6d7d38692d3`.
- P0-B still needs to align its route/surface map to the narrowed roadmap. The integration owner must reconcile all current P0-A/B/C/D artifacts, then update `V7_ACTIVE_STATUS.md` and freeze P0 before P1 schema work.
- Production impact: none.
