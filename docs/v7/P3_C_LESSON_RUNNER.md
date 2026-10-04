# P3-C — Mentee lesson runner

Starting integration: `1752e4c4`. P1's exit is accepted and the roadmap permits disjoint P3 work alongside P2. Lane C owns `src/features/lesson-runner/` and runner tests. Pairing, authoring, response editing/sharing, schema/generated contracts and shared route/bootstrap wiring retain their assigned owners.

The controller consumes the integrated scoped discipleship service, the existing session/membership owners, a pair ID and an immutable lesson revision ID. It loads only an active participant pair, verifies seven ordered steps with unique stable IDs, and resumes the operational saved step. Unknown saved steps, ambiguous progress and invalid revision/sequence fail visibly without deleting saved state.

Each mentee navigation save targets the same pair/revision, retains the original start timestamp and advances only after persistence succeeds. Failed writes retain the last saved step and expose a retryable error. Concurrent clicks cannot overlap writes. Explicit completion is allowed only at Action and supplies a completion timestamp. Completed lessons can be reviewed without rewriting completion; mentors have read-only navigation. The existing service/backend remain mutation authority. No second progress store, private-response body or auto-sharing behavior is introduced.

The page escapes plain curriculum text (`content.text`, `content.body`, or string content), exposes focusable step headings and status regions, uses disabled save controls while busy and offers Reload/Back. Scripture references are handed unchanged to the existing Reader integration callback with `{ routeKey: 'one-to-one-lesson', pairId, revisionId, stepId }`. The runner never synthesizes or substitutes Scripture text. The callback must resolve the actual canonical reference with the existing Reader and restore the originating lesson; a callback test is not Reader-route certification.

Integration interface:

```js
const runner = createLessonRunner({ service: app.discipleship, session, membership, pairId, revisionId });
const page = createLessonRunnerPage({ runner, onBack, onScripture, subscribeContext });
```

`subscribeContext(listener)` is mandatory: route composition must reuse existing account/congregation invalidation hooks and return its unsubscribe function. Changes immediately clear visible content; the controller also checks scope before navigation/save and suppresses late responses after invalidation/disposal. Page cleanup disposes listeners and the controller. Shared router owner binds the ratified `one-to-one-lesson` destination after pair/module/assignment entry is available; this commit does not add another router.

Local verification: 26 runner/disciple-service/query-composition tests, build, typecheck and diff whitespace on Node 24.19.0. Covers saved revision/step resume, timestamp retention, completion boundary, mentor denial, write failure/retry, malformed saved step, scope switch/sign-out, late results, concurrent clicks, escaped page text, Scripture return context and lifecycle teardown. Browser, live database, route/Reader round trip and physical-device evidence remain open. Initial runner control text falls back to English; reviewed lesson-language selection and response widgets remain integration/authoring work.
