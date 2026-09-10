# BibleQuest v3 Linked Activities / Challenges Contract

Milestone #79 is bounded to the inventory requirement: **launch linked activity; completion handoff**.

## Recovered v2 behavior

The retained v2 Assignment Center and `assignment-launch-hardening.js` establish the compatibility contract:

1. A visible assignment is authorized and loaded by the existing Assignments workflow.
2. Starting a linked assignment first records the assignment `start` through the trusted `bq-assignment` server boundary.
3. The activity destination is selected from `linked_activity.kind` when present, otherwise from the assignment type.
4. The linked destination opens through the app's existing owner; the linked feature does not become an assignment writer.
5. Finishing a linked activity does **not** automatically award assignment completion. The recipient returns to Assignments and submits completion there. Required reflection/evidence/quiz-score rules remain authoritative.

Recovered link kinds are `reader`/`reading`, `guided-study`, `mission`, `wisdom`, `journey`, `live`, `couples`, `group`, `reflection`, and `quiz`. In v3, `journey` resolves to the verified Daily Mission/Journey owner. `live` remains unavailable because Live Rooms #43 is not rebuilt yet and therefore fails closed rather than opening a guessed surface.

## v3 ownership rules

- `src/app/assignments.js` remains the sole assignment state/start/completion owner.
- `src/app/linked-activities.js` is a thin orchestration owner. It may resolve a verified route and delegate `start` / `complete` to Assignments; it may not call Supabase, an Edge Function, storage, or another persistence API directly.
- `src/core/api.js` may project the already-existing server field `linked_activity`; #79 does not create or alter its database schema.
- `linked_activity` is treated as untrusted remote data. It must be a plain object with a recognized `kind`; arbitrary route names are never accepted.
- Assignment type fallback is retained for Reading, Guided Study, Mission, Quiz, Reflection, Couples, and Journey Group assignments. Custom assignments without a verified link remain instruction-only.
- Linked activity launch does not bypass assignment visibility, schedule, membership, or recipient checks. `assignments.start()` remains the gate and the trusted server re-authorizes the recipient.
- Completion handoff delegates to `assignments.complete()`. A linked activity cannot self-award assignment points or bypass required reflection, confirmation, or minimum-quiz-score requirements.
- Ministry-role assignment views remain read-only as recipients; #79 does not widen authoring or recipient permissions.
- No production v2, `main`, production Supabase, production Cloudflare, schema, migration, RLS, grant, RPC, or Edge Function change is part of this milestone.

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

## Acceptance

#79 is not complete until permanent tests prove:

- API projection includes `linked_activity` without adding a new write path;
- malformed/unknown linked kinds fail closed;
- all currently verified route mappings are deterministic;
- Live Rooms remains unavailable rather than guessed;
- launch delegates to `assignments.start()` before navigation;
- completion handoff delegates to `assignments.complete()` and preserves requirement failures;
- the real Assignments UI exposes the linked action and remains usable at 390 px;
- the complete accumulated v3 regression workflow remains green on the exact functional candidate and then again on the exact bookkeeping candidate.
