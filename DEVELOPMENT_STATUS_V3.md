# BibleQuest v3 Development Status

Updated: 2026-09-10 JST

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity ledger. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase and production Cloudflare remain untouched.
- Active development branch: `feature/v3-ministry-hub`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary `push:` triggers are allowed only on isolated one-shot verification branches; trigger commits are never release candidates.
- Latest frozen checkpoint: `release/v3.48-assignment-push` at `e725e5dee5a46fcaebf05200301efdb93f868b22`.
- Exact v3.48 bookkeeping verification run: `34450088492`, complete accumulated architecture, edge/security and browser/mobile suite green against the frozen SHA.
- Safety refs remain untouched.

## Current progress represented by the #76 bookkeeping transaction

| State | Count |
|---|---:|
| Regression-tested | 75 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 24 |
| Total | 100 |

Strict implemented-or-better parity represented by this bookkeeping transaction is **76/100**.
Official regression stability represented by this bookkeeping transaction is **75/100**.

These values are provisional until the exact final #76 bookkeeping SHA passes a new complete accumulated gate and is frozen. No PASS transfers from the functional SHA to a changed bookkeeping SHA.

Current leading rows:
- #74 Advanced assignments — Regression-tested.
- #75 Assignment push workflow — Regression-tested because it survived the complete #76 functional suite.
- #76 Ministry Hub — Verified by exact functional candidate `dfc6440cd7105c73107081dfb4fb16f8bfac2d71` in complete run `34460593373`.
- #77 Notification Center/inbox — next non-deferred inventory row after #76 release closure.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

## #76 Ministry Hub — functional gate complete

The milestone is intentionally bounded to the authoritative inventory contract: **open tools; role guard; navigation**.

Recovered and verified behavior:
- one native `#/ministry-hub` route composed by the existing bootstrap/router;
- `src/app/ministry-hub.js` projects a read-only portal from the existing `src/app/congregation-membership.js` owner;
- signed-out state fails closed without querying congregation membership;
- ordinary valid congregation members can open existing Assignments and Journey Groups routes;
- Facilitator, Leader, Pastor and Admin memberships can see bounded ministry convenience UI;
- unsupported roles fail closed and receive neither readable congregation tools nor ministry-only controls;
- assignment publishing delegates to the existing Assignments owner and its already-trusted server authorization boundary;
- Live Room (#43) and Leader Dashboard remain visibly unavailable instead of being falsely treated as migrated;
- Notification Center (#77), Workspace (#78), Linked Activities (#79), retained legacy messages/devotionals, polls, calendar and media CRUD remain outside #76;
- no schema, migration, RLS, grant, RPC, Edge Function, storage policy, Realtime ownership or production-system change was introduced.

Permanent #76 coverage:
- `scripts/validate-v3-ministry-hub.mjs` — architecture/scope/workflow contract;
- `tests/v3-ministry-hub-edge.mjs` — signed-out/member/ministry/unsupported-role boundary;
- `tests/v3-ministry-hub-smoke.mjs` — real route plus 390px browser/mobile navigation, deferral and overflow/touch-target coverage;
- `.github/workflows/v3-regression.yml` invokes all three while retaining the complete prior accumulated suite.

Exact functional candidate `dfc6440cd7105c73107081dfb4fb16f8bfac2d71` passed run `34460593373`. The isolated verification workflow explicitly checked out and asserted that exact SHA, then passed accumulated architecture validators, all edge/security regressions and the full browser/mobile regression suite.

## Defect / root-cause ledger

No #76 application failure was observed in the exact functional gate. The implementation was kept narrow instead of copying the retained v2 hub's direct-client messages/polls/calendar/media backend behavior, because those paths exceed the proven #76 contract and would create a new trust boundary.

Earlier milestone defect regressions remain retained in the accumulated suite.

## Next major milestone

The immediate release gate is #76 bookkeeping and freeze; #77 must not be treated as verified early.

1. Complete only the #76 bookkeeping/status/handoff transaction on `feature/v3-ministry-hub`.
2. Treat its final branch tip as the exact clean bookkeeping candidate.
3. Verify that exact bookkeeping SHA with an isolated one-shot workflow that explicitly checks out/asserts it and executes the complete accumulated architecture, edge/security and browser/mobile suite.
4. If any phase fails, do not freeze; identify the exact root cause, preserve all prior coverage and rerun a corrected exact SHA.
5. If fully green, restore/remove temporary verification trigger state and create immutable `release/v3.49-ministry-hub` at that exact green bookkeeping SHA.
6. Only after v3.49 is frozen should #77 Notification Center/inbox recovery begin.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase and production Cloudflare remain unchanged throughout the rebuild.