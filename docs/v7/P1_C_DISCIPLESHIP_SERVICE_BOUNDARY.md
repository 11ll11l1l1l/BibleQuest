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
| `saveProgress(revisionId, progress, pair, context)` | Persist mentee-owned progress after backend validation of assignment, pair, lesson revision, and allowed transitions. |
| `savePrivateResponse({ lessonRevisionId, stepId, response, visibility: 'owner', pair, context })` | Persist one mentee response as private by default. Never copy its body into operational progress or audit payloads. |
| `setResponseShare({ lessonRevisionId, stepId, responseId, audienceUserIds, pair, context })` | Set item-level audience only after the UI names the recipient and the mentee confirms. This service limits the audience to the paired mentor. |

The adapter maps accepted conceptual contracts to the physical schema selected by Lane A. The service does not assume tables or bypass database policy.

## Existing V6 boundaries

- **Assignments:** V6 assignments retain assignment lifecycle and completion authority. This service accepts a pair and published revision; it does not create a parallel assignment system.
- **Reader:** Scripture steps retain canonical Scripture references. The existing Reader service owns passage loading and reading progress. The current Reader API has no generic `openReference` method, so route integration must use its actual book/chapter boundary and preserve return context.
- **Communications:** pair messages remain in the existing V6 one-to-one communication capability, scoped to an active pair. No thread engine or group messaging is added here.
- **Routes/shell:** the service can be injected into the approved `one-to-one`, pair, track, module, lesson, and thread destinations. Global route registration and shell links remain with the shared router integration owner.

## Local verification

Focused checks: `node --trace-uncaught tests/v7/discipleship-core.test.mjs`.

These checks cover missing session/scope, participant and congregation denial, inactive pairing, lesson sequence/revision binding, private progress projection, mentee-only writes and stale congregation results. They do not certify a backend adapter, RLS policy, browser route or physical device path.
