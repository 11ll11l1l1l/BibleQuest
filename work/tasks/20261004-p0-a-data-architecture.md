# Task: Define the V7 P0-A data architecture contract

Owner: P0-A lane executor
Branch: `v7/p0-a-data-architecture`
Starting SHA: `7d972a0ecdc048fc435e5ca44f94f6d7d38692d3`
Status: REVISED — aligned to the user's narrowed V7 scope; P0 freeze remains pending integration

## Scope

- Requested outcome: define logical entities, ownership and relationships for Library content and structured ONE 2 ONE discipleship.
- Included: Books, Devotionals, Past Teachings; curriculum, mentor/mentee pair lifecycle, assignments, individual progress, private response sharing, pair-scoped direct communication, content revisions and provenance.
- Deferred to V8: Leader Conversation Decks and broader group/realtime communication; uploaded media and moderation; expanded bulk content, expanded Books, Couples, recommendations, and full Ilocano Bible/UI support.
- Files/surfaces owned: `docs/v7/V7_DATA_ARCHITECTURE.md`; this task record.
- Excluded: runtime, migrations, workflows, release configuration, status authority, security/RLS policy and other P0 lane ownership.
- Dependencies: P0-B navigation/IA, P0-C security/tenancy, P0-D acceptance/content contracts; P0 integration owner reconciles and freezes the combined P0 contract before P1 schema work.

## Execution and evidence

- Re-read the P0-A contract, task record, P0-C security contract, and P0-D acceptance/content contract against the user's approved V7 scope: Library plus structured ONE 2 ONE; groups/decks and media/moderation deferred to V8.
- Found the previous P0-A proposal was misaligned: it included decks and Drive media in V7 and deferred mentor pairing, while the narrowed V7 scope requires pair lifecycle and scoped direct communication.
- Revised the logical contract to cover Library revisions/provenance, Track → Module → Lesson and the seven-step flow, mentor-pair lifecycle, assignments, per-user progress, private-by-default responses with item-level sharing, and pair-scoped messages.
- Explicitly excluded decks, broad group/realtime communication, user-uploaded media/moderation, and other deferred V8 scope. No provider or media-storage implementation is proposed for V7.
- Kept role, tenant, authorization, RLS, retention policy and denial behavior with P0-C; no runtime or schema was asserted.
- No runtime, schema, workflow, production, or existing acceptance-evidence paths changed.

## Handoff

- Original proposal branch: `v7/p0-a-data-architecture`; original base remains `7d972a0ecdc048fc435e5ca44f94f6d7d38692d3`.
- Revised contract commit: `1c8691432f3da57d679606a340cb84a464d1eaf5`.
- Current authority updated: none; the serialized P0 integration owner owns `V7_ACTIVE_STATUS.md` and the cross-lane freeze.
- Remaining action: reconcile P0-B/C/D to the narrowed scope, then freeze one P0 contract before P1 DB/RLS work.
- Production impact: none.
