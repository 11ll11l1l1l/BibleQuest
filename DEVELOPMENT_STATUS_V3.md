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

These bookkeeping values are not canonical/release truth until this exact bookkeeping SHA passes the complete accumulated gate and is promoted.

Current leading rows:
- #73 Assignments — Regression-tested.
- #74 Advanced assignments — Regression-tested because it survived the complete #75 functional suite.
- #75 Assignment push workflow — Verified in this bookkeeping candidate after exact functional candidate `a42100452d1b1fff7c146543e8ab5cd67da32193` passed complete accumulated run `34444825916` and received current HIGH-RISK A3 READY, A4 READY and A5 promotion recommendation.
- #76 Ministry Hub — Not started and remains the next non-deferred inventory row after #75 closes.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

## #75 Assignment Push — functional gate complete, bookkeeping gate pending

Recovered and verified behavior is bounded to authorized ministry publish → eligible member receive → existing assignment completion.

- `src/app/assignments.js` remains the sole assignment application owner.
- `src/core/api.js` remains the sole browser Supabase/trusted-function/Realtime boundary.
- `src/features/assignments/index.js` remains the assignment presentation/event-forwarding surface.
- `supabase/functions/bq-assignment/index.ts` remains trusted server authority for target discovery, create and recipient response mutations.
- Publishing supports `all`, `member`, `team`, and `group` targets and retained advanced assignment metadata while excluding #77 notification delivery and #79 linked-activity execution.
- Trusted server authorization independently ministry-gates `targets/create`, scopes discovery to active same-congregation entities, rejects invalid/foreign/inactive targets before insertion, and keeps start/complete authorization recipient-specific.
- Permanent tests include `validate-v3-assignment-push.mjs`, `v3-assignment-push-edge.mjs`, `v3-assignment-response-auth-edge.mjs`, `v3-assignment-publish-auth-edge.mjs`, and `v3-assignment-push-smoke.mjs` in the accumulated workflow.
- Exact functional run `34444825916` explicitly checked out/asserted `a42100452d1b1fff7c146543e8ab5cd67da32193` and passed accumulated architecture, edge/security and browser/mobile phases.

## Review state

For exact functional candidate `a42100452d1b1fff7c146543e8ab5cd67da32193`:
- A2 contract audit: current; no retained-contract blocker.
- A3 architecture/security: READY.
- A4 QA/regression: READY.
- A5 firewall: 0 BLOCKER; promotion recommended.

Because #75 is HIGH-RISK, those reviews authorized creation of this separate bookkeeping state only. No PASS transfers to the new bookkeeping SHA.

## Defect / root-cause ledger

- Historical #75 precursor `fc09fa02ea86522b1bdc7ea03f0964f4fd56f2a4` failed because the new VM test fixture did not strip one TypeScript annotation. Classification: `TEST/FIXTURE DEFECT`; application behavior was not changed to obtain green.
- Fixture-only correction produced exact functional candidate `a42100452d1b1fff7c146543e8ab5cd67da32193`; replacement run `34444825916` passed fully.
- Earlier defect regressions remain retained in the accumulated suite.

## Exact next gate

1. Finish consistent #75 bookkeeping on the quarantine/bookkeeping branch.
2. Produce the exact clean bookkeeping SHA.
3. Run the complete accumulated workflow against that exact SHA with explicit checkout/assertion; no functional-candidate PASS transfers.
4. Only if every required phase is green, fast-forward `feature/v3-assignment-push` without force and create the next immutable frozen v3 release at that same exact SHA.
5. Do not begin #76 until #75 release closure is complete.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase and production Cloudflare remain unchanged throughout the rebuild.