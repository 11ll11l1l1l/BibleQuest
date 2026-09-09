# BibleQuest v3 continuation handoff

Updated: 2026-09-10 JST

This file is the durable restart point if a chat or usage window ends. GitHub is authoritative; reconcile remote branches and workflow runs before changing code.

## Repository and immutable checkpoints

- Repository: `11ll11l1l1l/BibleQuest`
- Latest frozen base: `release/v3.45-congregation-recognition`
- Frozen base SHA: `483662cbad75ee98f0914ee66517b9eeb57f7f61`
- Exact v3.45 bookkeeping run: `34415308296` (complete accumulated suite green against the frozen SHA)
- Active remote branch: `feature/v3-assignments`
- Corrected exact #73 functional candidate: `33871d45aec7111be95524333fe5210dceed71af`
- Exact #73 functional run: `34417012845` (architecture, edge and browser/mobile all green against that exact SHA)
- Initial #73 run `34416898681` failed only because of test fixture defect `V3-ASSIGNMENTS-EDGE-FIXTURE-001`; it was not an application defect.
- Separate production-v2 safety PR `#88` remains draft/unmerged.

## Current authoritative inventory

- Regression-tested: 72, including #72 Congregation Recognition after surviving the complete #73 suite.
- Verified: 1 (#73 Assignments).
- Implemented: 0.
- Not started: 27.
- Strict implemented-or-better parity: 73/100.
- Official regression stability: 72/100.
- Deferred by user priority: #15 Japanese furigana and Kids #38–40.

## #72 Congregation Recognition checkpoint

- Exact functional candidate `516d2f2da33d73aea076b9cdd35225b8e68c0a27` passed run `34414579164`.
- Exact bookkeeping candidate `483662cbad75ee98f0914ee66517b9eeb57f7f61` passed run `34415308296` and is frozen as `release/v3.45-congregation-recognition`.
- #72 is now Regression-tested because it survived the complete #73 functional suite.

## #73 Assignments checkpoint

- `src/app/assignments.js` is the sole #73 application owner for assignment normalization, selected congregation, current-user progress, open/close, member Start/Complete and Realtime refresh lifecycle.
- `src/core/api.js` remains the sole browser Supabase/trusted-function/Realtime implementation boundary.
- Assignment reads rely on existing RLS visibility and request only active selected-congregation rows. Progress reads are further restricted to the signed-in user and visible assignment IDs.
- Start/Complete use only the authenticated retained `bq-assignment` Edge Function. Browser code does not write `bible_assignment_progress` or `bible_score_events` directly and does not calculate trusted assignment points.
- Realtime listens only for selected-congregation assignment changes and signed-in-user progress changes, then reloads server truth. Payloads do not become application truth; cleanup is idempotent.
- Normal members may receive/open/start/complete and view only their own submitted response plus leader feedback.
- Ministry roles (`facilitator`, `leader`, `pastor`, `admin`) are deliberately read-only in #73, matching the retained member-facing assignment center. Leader create/feedback/archive/scheduling/management belongs to later rows.
- #74 Advanced assignments, #75 Assignment push, #76–78 ministry surfaces and #79 Linked activities remain Not started and outside #73.
- Permanent coverage is in `scripts/validate-v3-assignments.mjs`, `tests/v3-assignments-edge.mjs`, `tests/v3-assignments-smoke.mjs`, and the accumulated workflow.
- Initial exact candidate `502e9fd86b96415d379d65295ba76ec3f117f9fd` reached #73 edge coverage in run `34416898681`; the fake API filtered the foreign-row fixture before the owner could inspect it. That test-only defect is recorded as `V3-ASSIGNMENTS-EDGE-FIXTURE-001`.
- Corrected exact candidate `33871d45aec7111be95524333fe5210dceed71af` passed the complete accumulated architecture, edge and Playwright/mobile suite in run `34417012845`.
- The isolated functional verification branch was reset to the exact clean corrected candidate after success.
- No production Supabase schema/function, Cloudflare, v2 or `main` change was made for #73.

## Exact next sequence

1. Finish only #73 promotion/bookkeeping documentation on `feature/v3-assignments`.
2. Treat the resulting branch head as the clean v3.46 bookkeeping candidate.
3. Create/reset isolated `verify/v3.46-assignments-bookkeeping` at that exact SHA.
4. Add only a temporary one-shot trigger that explicitly checks out/asserts the clean candidate.
5. Require all accumulated architecture, edge and Playwright/browser-mobile regressions to pass.
6. Reset the bookkeeping verification branch to the exact candidate and freeze `release/v3.46-assignments` at the same SHA.
7. Only after freeze create `feature/v3-advanced-assignments` from v3.46 and recover #74 advanced fields, due-state, completion and permission contracts before implementation.

## #74 recovery guardrails

The retained live `bq-assignment` already contains server-side support for advanced fields such as scheduled opening, reminder timestamp, recurrence rule, required reflection, minimum quiz score, evidence type and linked activity metadata. Do not automatically expose all of these in #74; first recover retained old UI/behavior and the inventory acceptance contract. Keep #75 push workflow and #79 linked-activity launching separate.

## Non-negotiable continuation rules

- Rebuild-and-verify; no patch accumulation.
- One owner/source of truth per responsibility.
- Run the complete accumulated regression suite after every milestone.
- Normal Actions stays `workflow_dispatch`-only; temporary push triggers belong only on isolated one-shot verification branches and never become release candidates.
- Never modify production v2, `main`, production Cloudflare or production Supabase during the rebuild without explicit approval.
- Never start implementation of the next feature before the current functional and bookkeeping/release gates close.
