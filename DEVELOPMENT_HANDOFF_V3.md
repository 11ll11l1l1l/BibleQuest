# BibleQuest v3 continuation handoff

Updated: 2026-09-10 JST

This file is the durable restart point if a chat or usage window ends. GitHub is authoritative; reconcile remote branches and workflow runs before changing code.

## Repository and immutable checkpoints

- Repository: `11ll11l1l1l/BibleQuest`
- Latest frozen base: `release/v3.46-assignments`
- Frozen base SHA: `fceb115e763ae729e07325bbb4c9f592206b2c9e`
- Exact v3.46 bookkeeping run: `34417620848` (complete accumulated suite green against the frozen SHA)
- Active remote branch: `feature/v3-advanced-assignments`
- Corrected exact #74 functional candidate: `f01df3e72b5413bba7ae7d16552fca55a448b766`
- Exact #74 functional run: `34432456615` (architecture, edge and browser/mobile all green against that exact SHA)
- Separate production-v2 safety PR `#88` remains draft/unmerged.

## Current authoritative inventory

- Regression-tested: 73, including #73 Assignments after surviving the complete #74 suite.
- Verified: 1 (#74 Advanced assignments).
- Implemented: 0.
- Not started: 26.
- Strict implemented-or-better parity: 74/100.
- Official regression stability: 73/100.
- Deferred by user priority: #15 Japanese furigana and Kids #38–40.

## #73 Assignments checkpoint

- `src/app/assignments.js` remains the sole assignment application owner.
- `src/core/api.js` remains the sole browser Supabase/trusted-function/Realtime implementation boundary.
- Exact corrected #73 functional candidate `33871d45aec7111be95524333fe5210dceed71af` passed run `34417012845`.
- Exact v3.46 bookkeeping candidate `fceb115e763ae729e07325bbb4c9f592206b2c9e` passed run `34417620848` and is frozen as `release/v3.46-assignments`.
- #73 is now Regression-tested because it survived the complete #74 functional suite.

## #74 Advanced Assignments checkpoint

- The retained old `assignment-advanced.js`, advanced assignment server revision, current retained `bq-assignment`, and #73 owner contract were recovered before implementation.
- #74 extends `src/app/assignments.js`; it does not create a competing advanced-assignment owner.
- Advanced assignment reads now include `schedule_at`, `reminder_at`, `recurrence_rule`, `required_reflection`, `min_quiz_score`, and `evidence_type` through `src/core/api.js`.
- The #74 browser projection deliberately excludes `linked_activity`; launch/completion handoff remains #79.
- Due state is normalized as `scheduled`, `open`, `overdue`, or `completed` with completed taking precedence.
- Scheduled assignments cannot be started/completed by the client before opening; the retained server independently enforces the same schedule boundary.
- Required reflection and text evidence require a bounded written response.
- Confirmation evidence requires explicit member acknowledgement in the browser; it is not claimed as independent trusted proof.
- Minimum quiz score requires a valid 0–100 value meeting the assignment threshold, then sends that value through the existing trusted completion action.
- Reminder and recurrence are metadata in #74. Automatic recurrence generation remains explicitly disabled.
- Overdue assignments remain completable because the retained backend does not reject late completion.
- Ministry roles remain read-only in this member-oriented surface. Leader create/publish belongs to #75.
- No production Supabase schema/function, Cloudflare, v2 or `main` change was made.
- Permanent coverage is in `scripts/validate-v3-advanced-assignments.mjs`, `tests/v3-advanced-assignments-edge.mjs`, `tests/v3-advanced-assignments-smoke.mjs`, the existing #73 regressions, and the accumulated workflow.

## #74 verification evidence

- Initial targeted candidate `ce8eb881b3c853e10d61467b01d20b77bffbd963`, run `34432082061`: exact SHA passed; the new validator failed only because of case-sensitive fixture defect `V3-ADVANCED-ASSIGNMENTS-VALIDATOR-001`.
- Corrected targeted candidate `2bf160004040f46c9d000ba9e114c51704aefb0d`, run `34432169732`: #74 validator + edge green.
- First complete functional run `34432254170`: exact SHA and earlier accumulated validators passed until the existing #73 validator rejected #74's legitimate lifecycle advancement; recorded as `V3-ASSIGNMENTS-VALIDATOR-FUTURE-STATE-001`.
- Corrected exact functional candidate `f01df3e72b5413bba7ae7d16552fca55a448b766`, run `34432456615`: complete accumulated architecture + edge + Playwright/browser-mobile suite green.
- Functional verification branch was reset to the exact clean candidate after success.

## Exact next sequence

1. Finish only #74 promotion/bookkeeping documentation on `feature/v3-advanced-assignments`.
2. Treat the resulting branch head as the clean v3.47 bookkeeping candidate.
3. Create/reset isolated `verify/v3.47-advanced-assignments-bookkeeping` at that exact SHA.
4. Add only a temporary push trigger that explicitly checks out/asserts the clean candidate.
5. Require the complete accumulated architecture, edge and Playwright/browser-mobile suite to pass.
6. Reset the bookkeeping verification branch to the exact candidate and freeze `release/v3.47-advanced-assignments` at that same SHA.
7. Only after freeze, create a #75 feature branch from exact v3.47 and recover the retained leader publish → member receive → complete workflow before implementation.

## #75 recovery guardrails

- Recover old leader create/publish UI and exact target/audience semantics before coding.
- Reuse the same assignment identity, `src/app/assignments.js` owner, central API boundary, retained `bq-assignment`, RLS, and server-side authorization rather than building a second task system.
- Separate leader authoring/publishing from #74 member requirement rendering and from #79 linked-activity launch behavior.
- Confirm role permissions, target validation, schedule/reminder/advanced-field publish semantics, member receive visibility, completion, error/empty states, privacy, and idempotency from retained sources.
- Do not deploy or modify production Supabase merely to satisfy parity verification.

## Non-negotiable continuation rules

- Rebuild-and-verify; no patch accumulation.
- One owner/source of truth per responsibility.
- Run the complete accumulated regression suite after every milestone.
- Normal Actions stays `workflow_dispatch`-only; temporary push triggers belong only on isolated one-shot verification branches and never become release candidates.
- Never modify production v2, `main`, production Cloudflare or production Supabase during the rebuild without explicit approval.
- Never start implementation of the next feature before the current functional and bookkeeping/release gates close.
