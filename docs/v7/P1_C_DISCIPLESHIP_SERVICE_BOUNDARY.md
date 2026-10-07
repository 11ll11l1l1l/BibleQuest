# P1-C — ONE 2 ONE service boundary

Status: implementation interface ready for the P1 schema and route owners to bind.
Owner: Lane C — discipleship core.

`src/app/discipleship.js` provides a repository-independent service for pairing, curriculum, published lesson revisions, operational progress, private responses, and item-level sharing. It uses the accepted P0-A lesson sequence and P0-C privacy boundary. It does not define physical tables, policies, route registrations, assignment persistence, Reader navigation, or a messaging transport.

## Construction

```js
createDiscipleshipService({ repository, session, membership })
```

The shared session must expose `getState()`. The existing congregation-membership service must expose `getActive()`. An authenticated user and explicitly selected active congregation are required before any repository call. Account and congregation identity are checked again after every awaited operation; late results from the previous context are rejected.

`context` passed to the repository contains `{ userId, congregationId }` for scoping and consistency checks. It is not an authorization credential. Each repository method must use the existing authenticated API/backend and RLS authority, enforce participant/capability and parent-resource scope on every request, and return only fields that the caller may read.

## Repository adapter methods

| Method | Contract |
|---|---|
| `listPairs(context)` | Return pairs visible to this participant and congregation. Each normalized pair has `id`, `congregationId`, `mentorId`, `menteeId`, and `state`. |
| `getPair(pairId, context)` | Return the requested pair; the service verifies participant, congregation, returned ID, and active state where needed. |
| `loadCurriculum(pair, context)` | Return the pair's authorized track hierarchy. |
| `loadLessonRevision(revisionId, pair, context)` | Return exactly the requested published revision with ordered `steps`; the service enforces Scripture → Understand → Discuss → Reflect → Apply → Pray → Action. |
| `loadOperationalProgress(revisionId, pair, context)` | Return operational state only. The service projects an allowlist of status/timestamp fields before returning it to a route. |
| `loadPrivateResponses(revisionId, pair, context)` | Resume the current mentee's own responses for the resolved assignment and exact lesson revision. Return current item-level audience as well as response data; never treat pairing as permission to read private text. |
| `saveProgress(revisionId, progress, pair, context)` | Persist mentee-owned progress after backend validation of assignment, pair, lesson revision, and allowed transitions. |
| `savePrivateResponse({ lessonRevisionId, stepId, response, visibility: 'owner', pair, context })` | Persist one mentee response as private by default. Never copy its body into operational progress or audit payloads. |
| `setResponseShare({ lessonRevisionId, stepId, responseId, audienceUserIds, pair, context })` | Set item-level audience only after the UI names the recipient and the mentee confirms. This service limits the audience to the paired mentor. |

The adapter maps accepted conceptual contracts to the physical schema selected by Lane A. The normalized hierarchy returned by `loadCurriculum` is an ordered array of tracks, each with a revision, title, position, ordered modules, and ordered lessons. Modules and lessons also carry stable IDs, revision IDs, titles, and positions. The service rejects duplicate IDs/positions, missing version/order fields, and child rows that name a different parent or scope. The service does not assume tables or bypass database policy.

## Existing V6 boundaries

- **Assignments:** V6 assignments retain assignment lifecycle and completion authority. This service accepts a pair and published revision; it does not create a parallel assignment system.
- **Reader:** Scripture steps retain canonical Scripture references. The existing Reader service owns passage loading and reading progress. The current Reader API has no generic `openReference` method, so route integration must use its actual book/chapter boundary and preserve return context.
- **Communications:** Lane A's P1 inventory found no V6 pair-private messaging capability: congregation broadcasts and group/session messages do not meet this boundary. This is an unresolved mismatch with the frozen P0-A/P0-C contract. Lane C does not bind pair messages to those broader systems or add a transport; resolve the contract through Lane A's integration coordination before implementing pair messaging.
- **Routes/shell:** the service can be injected into the approved `one-to-one`, pair, track, module, and lesson destinations. The approved thread route remains unbound while the pair-private messaging contract gap is unresolved. Global route registration and shell links remain with the shared router integration owner.

Operational progress is projected to pair/learner/revision IDs, current step ID, status, and lifecycle timestamps. Reflection, discussion, prayer, and action response bodies are read or written through a separate owner-private response interface; they are never included in the progress projection.

## Local verification

Focused checks: `node --trace-uncaught tests/v7/discipleship-core.test.mjs`.

These checks cover missing session/scope, participant and congregation denial, inactive pairing, lesson sequence/revision binding, versioned hierarchy normalization, progress revision binding/private projection, mentee-only writes and stale congregation results. They do not certify a backend adapter, RLS policy, browser route or physical device path.

## Integrated schema adapter (2026-10-04)

`src/app/discipleship-supabase-adapter.js` binds the service to Lane A's integrated `v7_*` tables. `createSupabaseDiscipleshipService({ client, session, membership })` accepts the existing authenticated client or its provider and composes a context guard before client resolution and immediately before mutations. Shared API/bootstrap/route registration remains with Lane A; this factory is its injection interface.

Curriculum is restricted to non-cancelled pair assignments and their exact published lesson revisions. Track/module versions come from their physical `revision_id`; lesson versions come from the assigned `v7_lesson_revisions.id`, never the logical lesson revision token or latest revision. Draft/withdrawn hierarchy and other-congregation tracks are rejected even for author clients with broader RLS visibility. Empty assignments return empty curriculum. Multiple active assignments for one requested revision fail explicitly rather than selecting an arbitrary assignment; supporting an explicit assignment selector is a future bounded interface change.

Progress maps the database states `not_started`, `in_progress`, and `completed` and uses the physical assignment/learner conflict key. Completion requires its timestamp. Writes allowlist fields and use the current mentee identity. Responses are persisted separately and create no sharing row by default. Explicit sharing validates the response's assignment, lesson revision, step, and owner before granting the paired mentor access. No private body is selected for operational progress or sharing validation.

Verification: `node --test tests/v7/discipleship*.test.mjs` — 12 passing tests on Node 24.19.0. Includes assigned-revision retention, unassigned revision rejection, cross-tenant curriculum denial, ambiguous assignment denial, mentee-only writes, private progress projection, response sharing scope, and context switching during assignment lookup before mutation. These are local service/query-contract checks; live database and route/browser evidence remain open. No schema change or connected-project DDL was performed.

Next shared integration: bind the factory to the existing API client/session/congregation owners and approved ONE 2 ONE routes. Lane A owns those shared surfaces and the P1 exit-gate reconciliation. Pair-private messaging remains the separately recorded contract dependency.

## P3-D — owner response resume

The composed service now exposes `loadPrivateResponses(pairId, lessonRevisionId)` for the lesson runner. It requires the active pair's mentee, resolves the exact non-cancelled assignment, and reads only that assignment/revision/learner. Account and congregation are revalidated before and after the response read.

Returned records contain `id`, `stepId`, `lessonRevisionId`, an immutable `response`, `updatedAt`, `visibility` and `audienceUserIds`. Current active share rows determine the audience: unshared/revoked responses are `owner`; an existing share is `shared` with the named paired mentor. Do not relabel a shared response as private when restoring it. Unexpected recipient, learner, revision, pair/congregation metadata, duplicate response IDs/steps, and incomplete data fail closed.

The read creates no sharing rows, performs no mutation, and does not put response text into operational progress, audit or analytics. Runner consumers must clear private response state on existing context-change/disposal signals and preserve unsaved text on a normal save error. This method supplies persisted resume data; it is not browser/runner acceptance.

Verification: 21 focused discipleship service/adapter tests passed on Node 24.19.0, including owner-only read, mentor denial before the response query, immutable snapshots, assignment/revision/learner filters, exact existing audience, revoked-share exclusion, and late-context rejection. No schema/RLS or production DDL changed.
