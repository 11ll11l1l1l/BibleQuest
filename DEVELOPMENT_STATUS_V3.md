# BibleQuest v3 Development Status

Updated: 2026-09-10 JST

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity ledger. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase and production Cloudflare remain untouched.
- Active development branch: `feature/v3-assignment-push`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary `push:` triggers are allowed only on isolated one-shot verification branches; trigger commits are never release candidates and verification branches are reset to the exact clean candidate after each run.
- Latest frozen checkpoint observed: `release/v3.47-advanced-assignments` at `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact v3.47 bookkeeping run `34433120915` passed the complete accumulated architecture, edge and Playwright/browser-mobile suite while explicitly checking out and asserting that exact SHA.
- Previous frozen checkpoint: `release/v3.46-assignments` at `fceb115e763ae729e07325bbb4c9f592206b2c9e`; exact bookkeeping run `34417620848` was green.
- Safety refs `safety/pre-autonomous-agents-20260910-*` remain untouched.

## Current progress

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
- #74 Advanced assignments — Verified; exact functional candidate `f01df3e72b5413bba7ae7d16552fca55a448b766` passed run `34432456615`, and exact bookkeeping SHA `2523f85d47f59721eae81da10cf1007d29af4139` passed run `34433120915` and is observed frozen as v3.47.
- #75 Assignment push workflow — Not started at application level; retained contract recovery is complete in `ASSIGNMENT_PUSH_V3.md`.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

Freezing #74 does not itself make #74 Regression-tested; that promotion requires survival of a later complete milestone suite.

## Current architecture boundary

- `src/core/api.js` — sole browser Supabase/trusted-function/Realtime implementation boundary.
- `src/app/congregation-membership.js` — congregation membership and role capability boundary.
- `src/app/assignments.js` — sole #73/#74 assignment owner and required #75 extension point.
- `src/features/assignments/index.js` — assignment presentation/event forwarding only.
- Retained `supabase/functions/bq-assignment/index.ts` — trusted server authority for assignment creation/visibility, scheduled opening, progress persistence, completion requirements, idempotent completion and trusted scoring.
- Existing Router, Session, Reader, Progress, Lesson, Transform, Audio, Recordings, Games, Notes, Couples, Journey Group, Community, Presence, Team Center, Leaderboards, Recognition and diagnostics owners remain unchanged.
- Retained root compatibility `assignment-advanced.js` is recovery evidence only; it must not become a second active assignment owner.

## #73 Assignments — Regression-tested

- Exact corrected #73 functional candidate `33871d45aec7111be95524333fe5210dceed71af` passed run `34417012845`.
- Exact v3.46 bookkeeping candidate `fceb115e763ae729e07325bbb4c9f592206b2c9e` passed run `34417620848` and is frozen as `release/v3.46-assignments`.
- #73 survived the complete #74 functional suite and therefore advanced to Regression-tested.

## #74 Advanced Assignments — Verified and frozen

- Corrected exact functional candidate `f01df3e72b5413bba7ae7d16552fca55a448b766` passed complete run `34432456615`.
- Bookkeeping candidate `2523f85d47f59721eae81da10cf1007d29af4139` passed complete exact-SHA run `34433120915`.
- `release/v3.47-advanced-assignments` is observed at that same bookkeeping SHA.
- `verify/v3.47-advanced-assignments-bookkeeping` was restored to the exact clean candidate after the temporary trigger run.
- Verified behavior remains: scheduled opening; reminder/recurrence metadata; written reflection/text evidence; explicit confirmation; minimum quiz score; deterministic due state; overdue completion; same #73 owner/API boundary; no #79 linked-activity browser projection; no production deployment change.

## #75 Assignment Push — contract recovered, implementation pending

`ASSIGNMENT_PUSH_V3.md` records the recovered contract from the retained compatibility UI, retained trusted `bq-assignment` create action, current #73/#74 owner, and current congregation/team/Journey Group boundaries.

Required recovered behavior:
- active facilitator/leader/pastor/admin may author/publish; ordinary member/signed-out/local-preview/no-congregation cannot;
- retained audience scopes are all/member/team/group and the server independently validates same-congregation targets;
- publish may carry title, instructions, type, Scripture refs, due/points, schedule, reminder metadata, recurrence metadata, reflection, minimum quiz score and evidence requirement;
- create must go through the trusted function and reload server truth;
- member receipt must reuse existing RLS + Realtime assignment flow and existing #73/#74 completion behavior;
- #77 notification/inbox, #79 linked-activity launch/completion and browser recurrence generation remain outside #75;
- no second assignment owner and no direct browser assignment/progress/score table mutation.

The next code step is to define the minimum central API read projection for leader target selectors, especially all active Journey Groups in the selected congregation, before extending the assignment owner and presentation. This avoids reviving the old direct-Supabase compatibility module.

## Defect / root-cause ledger

- `V3-ADVANCED-ASSIGNMENTS-VALIDATOR-001` — case-sensitive validator fixture mismatch; corrected without changing application behavior.
- `V3-ASSIGNMENTS-VALIDATOR-FUTURE-STATE-001` — older #73 validator incorrectly froze #74 at Not started; corrected while retaining #73 ownership and #75/#79 boundaries.
- `V3-ASSIGNMENTS-EDGE-FIXTURE-001` and `V3-STATUS-BOOKKEEPING-001` remain recorded from v3.46.
- All earlier defect regressions remain in the accumulated suite.

## Exact next milestone sequence

1. Re-read `feature/v3-assignment-push` before each write and preserve any concurrent/manual changes.
2. Extend the existing central API boundary with only the audience-directory data required for member/team/group selectors, reusing current congregation/team/Journey Group contracts where possible.
3. Extend `src/app/assignments.js` with the single leader publish lifecycle and `src/features/assignments/index.js` with ministry-role authoring UI; keep the member completion owner unchanged.
4. Add permanent #75 architecture validator, edge tests and 390px leader publish → eligible member receive → existing completion browser coverage.
5. Run targeted checks, then the complete accumulated exact functional gate.
6. After a green functional candidate, update inventory/status/handoff, run the complete accumulated suite against the exact bookkeeping SHA, and only then freeze the next sequential release.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase and production Cloudflare remain unchanged throughout the rebuild.