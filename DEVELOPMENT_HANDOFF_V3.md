# BibleQuest v3 continuation handoff

Updated: 2026-09-10 JST by `BQ-A1-RELEASE-CAPTAIN`.

This file is the durable restart point if a chat or execution window ends. GitHub and exact verification evidence are authoritative.

## Repository and immutable checkpoints

- Repository: `11ll11l1l1l/BibleQuest`
- Latest frozen release observed: `release/v3.47-advanced-assignments`
- Frozen v3.47 SHA: `2523f85d47f59721eae81da10cf1007d29af4139`
- Exact v3.47 bookkeeping verification run: `34433120915` — complete accumulated architecture, edge and Playwright/browser-mobile suite green while the isolated workflow explicitly checked out and asserted SHA `2523f85d47f59721eae81da10cf1007d29af4139`.
- The v3.47 release ref already existed at that exact SHA when re-read after the run; it was not moved or rewritten by this Captain cycle.
- Previous frozen release: `release/v3.46-assignments` at `fceb115e763ae729e07325bbb4c9f592206b2c9e`.
- Previous exact v3.46 bookkeeping run: `34417620848`, complete accumulated suite green. A redundant exact revalidation in this cycle, run `34433023861`, also completed green against `fceb115e763ae729e07325bbb4c9f592206b2c9e`.
- Active canonical development branch: `feature/v3-assignment-push`.
- #75 contract-recovery commit at this handoff start: `9d39585b0569ac7cf664cd63f5f6caa8d98a7e0e` (`ASSIGNMENT_PUSH_V3.md`).
- Production-v2 safety PR `#88` remains separate; no action was taken on it.
- Safety refs `safety/pre-autonomous-agents-20260910-canonical` and `safety/pre-autonomous-agents-20260910-advanced` were not moved.

## Current authoritative inventory

- Regression-tested: 73, including #73 Assignments after surviving the complete #74 functional suite.
- Verified: 1 (#74 Advanced assignments).
- Implemented: 0.
- Not started: 26, including #75 until implementation exists and reaches its functional gate.
- Strict implemented-or-better parity: **74/100**.
- Official regression stability: **73/100**.
- Deferred by user priority: #15 Japanese furigana and Kids #38–40.

Freezing #74 bookkeeping does not by itself promote #74 to Regression-tested. #74 advances only after it survives a later complete milestone suite.

## #73 Assignments checkpoint

- `src/app/assignments.js` remains the sole assignment application owner.
- `src/core/api.js` remains the sole browser Supabase/trusted-function/Realtime implementation boundary.
- Exact corrected #73 functional candidate `33871d45aec7111be95524333fe5210dceed71af` passed run `34417012845`.
- Exact v3.46 bookkeeping candidate `fceb115e763ae729e07325bbb4c9f592206b2c9e` passed run `34417620848` and is frozen as `release/v3.46-assignments`.
- #73 is Regression-tested because it survived the complete #74 functional suite.

## #74 Advanced Assignments checkpoint

- Corrected exact functional candidate: `f01df3e72b5413bba7ae7d16552fca55a448b766`.
- Functional run `34432456615`: complete accumulated architecture + edge + Playwright/browser-mobile suite green.
- Bookkeeping candidate: `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact bookkeeping run `34433120915`: complete accumulated suite green with exact checkout/assertion of that SHA.
- `release/v3.47-advanced-assignments` is observed at the same exact SHA.
- `verify/v3.47-advanced-assignments-bookkeeping` was reset to the exact clean candidate after verification; the temporary `push:` trigger commit is not part of the candidate/release.
- `verify/v3.46-assignments-bookkeeping` was likewise restored to its exact clean candidate after a redundant revalidation in this cycle.
- No production Supabase schema/function, Cloudflare, v2 or `main` change was made.

## #75 Assignment Push contract recovery

Contract recovery is durable in `ASSIGNMENT_PUSH_V3.md` on `feature/v3-assignment-push`.

Recovered authoritative boundaries:

- #75 is leader **publish → eligible member receive → existing #73/#74 complete**. It does not create a second task system.
- `src/app/assignments.js` must remain the sole assignment application owner; #75 extends it rather than adding a competing owner.
- `src/core/api.js` remains the sole browser cloud/trusted-function boundary.
- Retained `supabase/functions/bq-assignment/index.ts` is server authority for `action:create` and allows active `facilitator`, `leader`, `pastor`, and `admin` roles only.
- Retained audiences are `all`, `member`, `team`, and `group`. Non-all targets are required and the retained server independently validates same-congregation membership/team/group scope.
- Retained publish fields include title, instructions, type, Scripture references, due date, points, scheduled opening, reminder metadata, recurrence metadata, required reflection, minimum quiz score and evidence type.
- `linked_activity` remains outside #75 browser publishing because inventory #79 owns linked-activity launch/completion handoff, even though the old compatibility form contains a linked-activity selector.
- Reminder storage does not implement #77 Notification Center/inbox or actual push notification delivery.
- Recurrence remains metadata only; browser recurrence generation is prohibited.
- Successful create must reload server truth and use the existing assignment RLS/Realtime receive path. Member start/completion/idempotent scoring remain the already-verified #73/#74 path.
- No production Supabase change is required for contract recovery.

## Verification work performed in this cycle

- Run `34433120915` is the authoritative new #74 exact-bookkeeping evidence. All workflow phases completed successfully: exact SHA assertion, accumulated architecture validators, accumulated edge regressions, Chromium setup/local server, and accumulated browser/mobile regressions.
- Run `34433023861` redundantly revalidated the already-frozen v3.46 exact candidate; it also completed fully green. It does not change release history.
- No test result is inferred from branch state; only executed runs above are claimed green.

## Current blocker

None established.

The implementation work for #75 has intentionally not been rushed in the same cycle as contract recovery. The next implementation must first add the four-scope target-directory/loading boundary cleanly through the existing API/assignment owner rather than reviving the retained root `assignment-advanced.js` compatibility owner.

## Exact next executable sequence

1. Re-read `feature/v3-assignment-push` and confirm it still descends from exact frozen v3.47 `2523f85d47f59721eae81da10cf1007d29af4139`; reconcile any manual/concurrent movement without force-resetting it.
2. Inspect the current `src/core/api.js` assignment API block plus existing Team/Journey Group/congregation directory contracts to define the minimum read projection needed by #75's `member`, `team`, and `group` target selectors.
3. Extend the existing central API boundary and `src/app/assignments.js` owner with a single leader-publish capability. Do not import or execute retained root `assignment-advanced.js` as a second owner.
4. Extend `src/features/assignments/index.js` with ministry-role authoring UI only; ordinary members remain on the current receive/open/complete surface.
5. Publish only through retained trusted `bq-assignment` `action:create`; do not write assignment/progress/score tables directly.
6. Keep #77 notification/inbox and #79 linked activity out of #75.
7. Add permanent #75 architecture validator, edge regression and 390px leader-publish → member-receive/complete browser coverage, retaining all #1–#74 regressions.
8. Run targeted checks, then the complete accumulated functional gate against the exact clean #75 candidate. Stay on #75 and fix only reproduced/root-caused failures.
9. Only after the exact functional candidate is green, perform promotion bookkeeping, re-run the complete suite against the exact bookkeeping SHA, and freeze the next sequential release.

## Non-negotiable continuation rules

- Rebuild-and-verify; never patch-and-accumulate.
- One source of truth per responsibility.
- Never claim a test passed unless it actually executed.
- Normal Actions remain `workflow_dispatch`-only; temporary `push:` triggers belong only on isolated verification branches and never in a release candidate.
- Never modify `main`, production v2, production Cloudflare or production Supabase without separate explicit authorization.
- Never move the `safety/pre-autonomous-agents-20260910-*` recovery refs.
- Do not begin the next feature milestone before #75 functional and bookkeeping/release gates close.
