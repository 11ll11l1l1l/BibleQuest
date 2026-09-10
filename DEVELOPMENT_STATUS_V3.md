# BibleQuest v3 Development Status

Updated: 2026-09-10 JST

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity ledger. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase and production Cloudflare remain untouched.
- Active development branch: `feature/v3-assignment-push`.
- Current quarantine/bookkeeping branch: `agent/a1-work/075-assignment-push`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary `push:` triggers are allowed only on isolated one-shot verification branches; trigger commits are never release candidates.
- Latest frozen checkpoint observed before #75 bookkeeping: `release/v3.47-advanced-assignments` at `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact v3.47 bookkeeping run `34433120915` passed the complete accumulated architecture, edge and Playwright/browser-mobile suite.
- Safety refs remain untouched.

## Current progress represented by this bookkeeping candidate

| State | Count |
|---|---:|
| Regression-tested | 74 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 25 |
| Total | 100 |

Strict implemented-or-better parity represented by this bookkeeping candidate is **75/100**.
Official regression stability represented by this bookkeeping candidate is **74/100**.

These bookkeeping values are not canonical/release truth until the final exact bookkeeping SHA passes the complete accumulated gate and all review requirements caused by accumulated-test changes are satisfied.

Current leading rows:
- #73 Assignments — Regression-tested.
- #74 Advanced assignments — Regression-tested because it survived the complete #75 functional suite.
- #75 Assignment push workflow — Verified in this bookkeeping candidate after exact functional candidate `a42100452d1b1fff7c146543e8ab5cd67da32193` passed complete accumulated run `34444825916` and received HIGH-RISK A3 READY, A4 READY and A5 promotion recommendation.
- #76 Ministry Hub — Not started and remains the next non-deferred inventory row only after #75 closes.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

## #75 Assignment Push — functional gate complete, bookkeeping gate under correction

Recovered and verified behavior is bounded to authorized ministry publish → eligible member receive → existing assignment completion.

- `src/app/assignments.js` remains the sole assignment application owner.
- `src/core/api.js` remains the sole browser Supabase/trusted-function/Realtime boundary.
- `src/features/assignments/index.js` remains the assignment presentation/event-forwarding surface.
- `supabase/functions/bq-assignment/index.ts` remains trusted server authority for target discovery, create and recipient response mutations.
- Publishing supports `all`, `member`, `team`, and `group` targets and retained advanced assignment metadata while excluding #77 notification delivery and #79 linked-activity execution.
- Trusted server authorization independently ministry-gates `targets/create`, scopes discovery to active same-congregation entities, rejects invalid/foreign/inactive targets before insertion, and keeps start/complete authorization recipient-specific.
- Permanent #75 tests remain present and accumulated.
- Exact functional run `34444825916` explicitly checked out/asserted `a42100452d1b1fff7c146543e8ab5cd67da32193` and passed accumulated architecture, edge/security and browser/mobile phases.

## Review state

The A3/A4/A5 approvals listed above apply to exact functional SHA `a42100452d1b1fff7c146543e8ab5cd67da32193`. Bookkeeping subsequently exposed and required correction of an existing accumulated validator. Because modifying an accumulated validator is automatically HIGH-RISK under the rebuild guardrails, the resulting new exact candidate must receive fresh exact-SHA A4/A5 review before canonical/release promotion. No earlier review transfers across that SHA change.

## Defect / root-cause ledger

- Historical #75 precursor `fc09fa02ea86522b1bdc7ea03f0964f4fd56f2a4` failed because the new VM fixture did not strip one TypeScript annotation. Classification: `TEST/FIXTURE DEFECT`; application behavior was not changed to obtain green.
- Fixture-only correction produced exact functional candidate `a42100452d1b1fff7c146543e8ab5cd67da32193`; replacement run `34444825916` passed fully.
- `V3-STATUS-BOOKKEEPING-075-001` — first #75 bookkeeping candidate `bcb678b51ee5c9a22ad58518b14e8429135e8b2a` failed exact run `34449669830` because `DEVELOPMENT_STATUS_V3.md` renamed the validator-required `Next major milestone` heading. The document was corrected; the validator was not weakened.
- `V3-ASSIGNMENTS-VALIDATOR-FUTURE-STATE-075-001` — corrected bookkeeping candidate `e960f5904d1353352e1c94a1c816156d899b3eff` reached the accumulated #73 Assignments validator in exact run `34449808528`, which failed only because `scripts/validate-v3-assignments.mjs` hard-coded inventory #75 to remain `Not started`. Root cause is a stale future-state assertion in an older accumulated validator: #75 is now the active, functionally verified milestone, while #79 remains the later linked-activity boundary that must stay Not started. The correction preserves #73 ownership assertions and the #79 deferral, but permits #75 to occupy any valid lifecycle state. This is an existing-test correction and therefore remains HIGH-RISK pending fresh exact-candidate A4/A5 review.
- Earlier defect regressions remain retained in the accumulated suite.

## Next major milestone

The immediate release gate remains #75; #76 must not start early.

1. Verify the exact candidate produced by the narrowly scoped #73 validator future-state correction plus this bookkeeping record.
2. Run the complete accumulated architecture, edge/security and browser/mobile workflow against that exact SHA with explicit checkout/assertion. No PASS transfers from functional or prior failed bookkeeping SHAs.
3. If fully green, keep that exact candidate unchanged for fresh A4 QA review and A5 firewall promotion recommendation because an existing accumulated validator changed.
4. Only after those exact-candidate reviews authorize promotion may A1 re-verify any final bookkeeping SHA as required, fast-forward `feature/v3-assignment-push` without force, and create immutable `release/v3.48-assignment-push` at an exact fully green SHA.
5. After #75 release closure, independently recover #76 Ministry Hub from authoritative retained/inventory evidence.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow and all applicable exact-SHA HIGH-RISK review requirements are satisfied. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase and production Cloudflare remain unchanged throughout the rebuild.