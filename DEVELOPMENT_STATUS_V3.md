# BibleQuest v3 Development Status

Updated: 2026-09-10 JST

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase and production Cloudflare remain untouched.
- Active development branch: `feature/v3-advanced-assignments`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary `push:` triggers are allowed only on isolated one-shot verification branches; trigger commits are never release candidates and verification branches are reset to the exact clean candidate after each run.
- Latest frozen checkpoint: `release/v3.46-assignments` at `fceb115e763ae729e07325bbb4c9f592206b2c9e`.
- Exact v3.46 bookkeeping run `34417620848` passed the complete accumulated suite against that SHA before freeze.

## Current progress

Inventory state after the complete #74 Advanced Assignments functional gate:

| State | Count |
|---|---:|
| Regression-tested | 73 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 26 |
| Total | 100 |

Strict implemented-or-better parity is **74/100**.

Official regression stability is **73/100**.

Current leading rows:
- #72 Congregation Recognition — Regression-tested.
- #73 Assignments — Regression-tested after surviving the complete #74 suite; frozen in v3.46.
- #74 Advanced assignments — Verified by corrected exact functional candidate `f01df3e72b5413bba7ae7d16552fca55a448b766` in run `34432456615`.
- #75 Assignment push workflow — Not started pending v3.47 freeze and retained-contract recovery.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

## Current architecture boundary

`ARCHITECTURE_V3.md` remains the detailed foundational architecture contract, but its trailing progress snapshot is historical. Current progress and post-v3.40 owner additions are authoritative in `FEATURE_INVENTORY_V3.md`, this status file, `DEVELOPMENT_HANDOFF_V3.md`, milestone contracts, and accumulated validators. The architecture narrative will be reconciled safely during the later full old-vs-new audit rather than risk truncating retained material through a full-file-only editing surface.

- `src/core/api.js` — sole browser Supabase/trusted-function/Realtime implementation boundary.
- `src/app/congregation-membership.js` — congregation membership and role capability boundary.
- `src/app/assignments.js` — sole #73/#74 assignment owner; #74 extends this owner rather than creating a competing advanced-assignment service.
- `src/features/assignments/index.js` — assignment presentation/event forwarding only.
- Retained `supabase/functions/bq-assignment/index.ts` — trusted server authority for assignment visibility, scheduled opening, progress persistence, written-evidence/minimum-quiz requirements, idempotent completion and trusted scoring.
- Existing Router, Session, Reader, Progress, Lesson, Transform, Audio, Recordings, Games, Notes, Couples, Journey Group, Community, Presence, Team Center, Leaderboards, Recognition and diagnostics owners remain unchanged.

## #73 Assignments — Regression-tested

- Exact corrected #73 functional candidate `33871d45aec7111be95524333fe5210dceed71af` passed run `34417012845`.
- Exact v3.46 bookkeeping candidate `fceb115e763ae729e07325bbb4c9f592206b2c9e` passed run `34417620848` and is frozen as `release/v3.46-assignments`.
- #73 survived the complete #74 functional suite and therefore advanced to Regression-tested.

## #74 Advanced Assignments — Verified

Recovered and verified behavior:
- `schedule_at` determines future opening; scheduled member start/completion is blocked client-side and independently rejected by the retained server function;
- `reminder_at` is retained/displayed metadata only in #74;
- weekly/monthly `recurrence_rule` is retained/displayed while automatic recurrence generation remains explicitly disabled;
- `required_reflection` and `evidence_type=text` require a non-empty bounded written response;
- `evidence_type=confirmation` requires an explicit member acknowledgement in the client, without being misrepresented as independently trusted server evidence;
- `min_quiz_score` requires a valid 0–100 score meeting the threshold and passes that score to `bq-assignment`;
- due state is deterministic: completed, scheduled, overdue, or open; overdue tasks remain completable because the retained server does not reject late completion;
- #74 reuses the #73 Assignments owner and existing API boundary; no second advanced-assignment runtime was introduced;
- `linked_activity` remains excluded from the #74 browser projection because launch/completion handoff belongs to #79;
- leader create/publish belongs to #75 and was not added to #74;
- permanent architecture, edge and 390px browser/mobile coverage is accumulated in the normal workflow.

Functional verification evidence:
- targeted run `34432082061` exposed only `V3-ADVANCED-ASSIGNMENTS-VALIDATOR-001`, a case-sensitive validator fixture defect; no application behavior changed.
- corrected targeted run `34432169732` passed the #74 validator and edge regression against exact candidate `2bf160004040f46c9d000ba9e114c51704aefb0d`.
- first complete functional run `34432254170` exposed only `V3-ASSIGNMENTS-VALIDATOR-FUTURE-STATE-001`, a stale #73 validator assertion that permanently required #74 to remain Not started.
- corrected exact functional candidate `f01df3e72b5413bba7ae7d16552fca55a448b766` passed the complete accumulated architecture, edge and Playwright/browser-mobile suite in run `34432456615`.
- the isolated functional verification branch was reset to the exact clean candidate after success.

## Defect / root-cause ledger

- `V3-ADVANCED-ASSIGNMENTS-VALIDATOR-001` — the new validator searched for lowercase `recurrence is stored` while the verified UI text correctly began with `Recurrence`; the case-sensitive fixture was corrected without changing app behavior.
- `V3-ASSIGNMENTS-VALIDATOR-FUTURE-STATE-001` — the permanent #73 validator froze #74 at `Not started`, causing the first full #74 gate to fail after #74 legitimately advanced. The validator now protects #73 ownership and still requires #75/#79 to remain Not started, while permitting #74 to follow its own lifecycle.
- `V3-ASSIGNMENTS-EDGE-FIXTURE-001` and `V3-STATUS-BOOKKEEPING-001` remain recorded from v3.46.
- All earlier defect regressions remain in the accumulated suite.

## Next major milestone

1. Complete only #74 promotion/bookkeeping documentation on `feature/v3-advanced-assignments`.
2. Treat the resulting clean branch head as the v3.47 bookkeeping candidate.
3. Create/reset isolated `verify/v3.47-advanced-assignments-bookkeeping` at that exact SHA and add only the temporary trigger that explicitly checks out/asserts it.
4. Require the complete accumulated architecture, edge and Playwright/browser-mobile suite to pass.
5. Reset the bookkeeping verification branch to the exact clean candidate and freeze `release/v3.47-advanced-assignments` at the same SHA.
6. Only after v3.47 freeze, create the #75 feature branch and recover the retained leader publish → member receive → complete contract before coding.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase and production Cloudflare remain unchanged throughout the rebuild.
