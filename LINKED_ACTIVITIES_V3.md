# BibleQuest v3 Linked Activities / Challenges Contract

Milestone #79 is bounded to the inventory requirement: **launch linked activity; completion handoff**.

## Recovered v2 behavior

The retained v2 Assignment Center and `assignment-launch-hardening.js` establish the compatibility contract:

1. A visible assignment is authorized and loaded by the existing Assignments workflow.
2. Starting a linked assignment first records the assignment `start` through the trusted `bq-assignment` server boundary.
3. The old launcher uses `linked_activity.kind` when safely available, otherwise it falls back to the assignment type.
4. The destination opens through the app's existing feature owner; the linked feature never becomes an assignment writer.
5. Finishing a linked activity does **not** automatically award assignment completion. The recipient returns to Assignments and submits completion there. Required reflection/evidence/quiz-score rules remain authoritative.

Recovered link kinds are `reader`/`reading`, `guided-study`, `mission`, `wisdom`, `journey`, `live`, `couples`, `group`, `reflection`, and `quiz`. In v3, `journey` resolves to the verified Daily Mission/Journey owner. `live` remains unavailable because Live Rooms #43 is not rebuilt yet and therefore fails closed rather than opening a guessed surface.

## v3 ownership rules

- `src/app/assignments.js` remains the sole assignment state/start/completion owner.
- `src/app/linked-activities.js` is a thin orchestration owner. It may resolve a verified route and delegate `start` / `complete` to Assignments; it may not call Supabase, an Edge Function, storage, or another persistence API directly.
- The current v3 Assignment API projection intentionally remains unchanged in #79. The safe, already-authoritative assignment-type fallback covers every currently authorable linked v3 type. A legacy custom assignment whose only destination exists inside unprojected `linked_activity` metadata remains instruction-only rather than triggering a guessed route.
- The orchestration owner nevertheless validates any `linkedActivity` object it is explicitly given: it must be a plain object with a recognized `kind`; arbitrary route names are never accepted.
- Assignment type fallback is retained for Reading, Guided Study, Mission, Quiz, Reflection, Couples, and Journey Group assignments. Custom assignments without a verified link remain instruction-only.
- Linked activity launch does not bypass assignment visibility, schedule, membership, or recipient checks. `assignments.start()` remains the gate and the trusted server re-authorizes the recipient.
- Completion handoff delegates to `assignments.complete()`. A linked activity cannot self-award assignment points or bypass required reflection, confirmation, or minimum-quiz-score requirements.
- Ministry-role assignment views remain read-only as recipients; #79 does not widen authoring or recipient permissions.
- No production v2, `main`, production Supabase, production Cloudflare, schema, migration, RLS, grant, RPC, Edge Function, or broad API-contract change is part of this milestone.

## Verified v3 destinations

| Recovered kind / fallback | v3 route |
|---|---|
| `reader`, `reading` | `reader` |
| `guided-study` | `study` |
| `mission` | `mission` |
| `wisdom` | `wisdom-situations` |
| `journey` | `mission` (Daily Mission/Journey owner) |
| `couples` | `couples-cloud` |
| `group` | `journey-groups` |
| `reflection` | `cloud-notes` |
| `quiz` | `open-review` |
| `live` | unavailable until #43 |
| unlinked `custom` | instruction-only |

## Completion handoff

A linked route is navigation only. Assignment completion stays explicit and trusted:

- launch/reopen calls `assignments.start()` first;
- the linked feature performs its own verified workflow;
- the recipient returns to Assignments;
- the existing completion form calls the Linked Activities handoff, which delegates to `assignments.complete()`;
- server-side recipient checks, required reflection/evidence, quiz thresholds, duplicate-completion protection and score-event authority remain unchanged.

## Acceptance

#79 is not complete until permanent tests prove:

- no new database/API write owner is introduced;
- malformed/unknown explicit linked kinds fail closed;
- all currently verified route mappings are deterministic;
- Live Rooms remains unavailable rather than guessed;
- currently authorable assignment types use the recovered type-fallback launch mapping;
- launch delegates to `assignments.start()` before navigation;
- completion handoff delegates to `assignments.complete()` and preserves requirement failures;
- the real Assignments UI exposes the linked action and remains usable at 390 px;
- the complete accumulated v3 regression workflow remains green on the exact functional candidate and then again on the exact bookkeeping candidate.
