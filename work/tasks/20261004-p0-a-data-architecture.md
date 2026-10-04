# Task: Define the V7 P0-A data architecture contract

Owner: P0-A lane executor  
Branch: `v7/p0-a-data-architecture`  
Starting SHA: `7d972a0ecdc048fc435e5ca44f94f6d7d38692d3`  
Status: COMPLETE — P0-A proposal ready; overall P0 freeze is pending integration

## Scope

- Requested outcome: define logical entities, ownership and relationships for Library, discipleship content, groups/decks, media and moderation.
- Files/surfaces owned: `docs/v7/V7_DATA_ARCHITECTURE.md`; this task record.
- Excluded: runtime, migrations, workflows, release configuration, status authority, security/RLS policy and other P0 lanes.
- Dependencies: P0-B UX/IA, P0-C security/tenancy, P0-D acceptance/content contracts; P0 integration owner reconciles and freezes the combined P0 contract.

## Execution and evidence

- Read current `V7_ACTIVE_STATUS.md`, `docs/V7_STARTING_POINT.md`, `work/RULEBOOK.md`, `AGENTS.md`, task template, and the existing `docs/v7/V7_FREE_MEDIA_FILE_STORAGE.md`.
- Added the logical data contract. It reuses V6 identity/group/Live Room authorities; separates content revisions, user progress, deck/session state and media attachment/moderation records; states the V7 exclusions.
- Recorded the later approved centralized Google Drive model and explicitly flagged the older ImageKit-first proposal for P0 integration reconciliation before P4. No provider code or migration was added.
- Reviewed the fetched contract for trailing whitespace and changed Markdown links; after removing two trailing-space lines, the scan found zero trailing-whitespace lines and zero Markdown links requiring target checks.
- No runtime, schema, workflow, production, or acceptance-evidence paths changed.

## Handoff

- Contract commit: `26c53a8ad6403ab1b3e1b524b47c5ddecb3600a5` on `v7/p0-a-data-architecture`.
- Current authority updated: none; `V7_ACTIVE_STATUS.md` is reserved for the serialized P0 integration owner.
- Remaining action: review this proposal with P0-B/P0-C/P0-D, reconcile the media-provider document, then freeze one P0 contract before P1 schema work.
- Production impact: none.
