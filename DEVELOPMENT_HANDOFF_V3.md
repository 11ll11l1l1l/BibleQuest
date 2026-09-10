# BibleQuest v3 continuation handoff

Updated: 2026-09-10 JST by `BQ-A1-RELEASE-CAPTAIN`.

GitHub live refs and exact executed verification evidence are authoritative.

## Immutable / frozen baseline

- Repository: `11ll11l1l1l/BibleQuest`.
- Latest frozen release before #75 closure: `release/v3.47-advanced-assignments` at `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact v3.47 bookkeeping verification run: `34433120915` — complete accumulated architecture, edge and browser/mobile suite green against that exact SHA.
- Previous frozen release: `release/v3.46-assignments` at `fceb115e763ae729e07325bbb4c9f592206b2c9e`.
- Safety refs remain immutable and untouched.
- `main`, production v2, production Supabase and production Cloudflare remain untouched.

## #75 canonical / quarantine state

- Canonical milestone branch: `feature/v3-assignment-push`.
- Canonical HEAD before bookkeeping/promotion: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Designated quarantine/bookkeeping branch: `agent/a1-work/075-assignment-push`.
- Exact HIGH-RISK functional candidate: `a42100452d1b1fff7c146543e8ab5cd67da32193`.
- Exact functional run: `34444825916` — successful complete accumulated architecture, edge/security and browser/mobile suite with explicit checkout/assertion of `a42100452d1b1fff7c146543e8ab5cd67da32193`.
- A3 architecture/security review: READY for the exact functional SHA.
- A4 QA/regression review: READY for the exact functional SHA.
- A5 firewall: 0 BLOCKER; promotion recommended for the exact functional SHA.

## #75 verified functional boundary

#75 remains narrowly bounded to authorized ministry **publish → eligible member receive → existing #73/#74 complete**.

- `src/app/assignments.js` remains the sole assignment application owner.
- `src/core/api.js` remains the sole browser Supabase/trusted-function/Realtime boundary.
- `src/features/assignments/index.js` remains the assignment presentation/event-forwarding surface.
- `supabase/functions/bq-assignment/index.ts` remains trusted server authority for target discovery, creation and recipient response mutations.
- Retained target scopes are `all`, `member`, `team`, and `group`.
- Trusted `targets/create` is ministry-gated to active `facilitator`, `leader`, `pastor`, and `admin` roles and independently enforces active same-congregation target scope before insertion.
- Recipient `start/complete` authorization remains recipient-specific rather than ministry-wide.
- Publish carries retained advanced metadata without absorbing #77 Notification Center/push delivery, #79 linked-activity execution, or browser recurrence generation.
- Successful create reloads server truth and eligible members receive through the existing assignment RLS/Realtime path.
- No direct browser assignment/progress/score table mutation was introduced.

Permanent accumulated #75 coverage includes:
- `scripts/validate-v3-assignment-push.mjs`;
- `tests/v3-assignment-push-edge.mjs`;
- `tests/v3-assignment-response-auth-edge.mjs`;
- `tests/v3-assignment-publish-auth-edge.mjs` — faithful production-handler authorization test;
- `tests/v3-assignment-push-smoke.mjs` — 390px ministry publish → member receive/start/complete flow.

## Historical fixture correction

Precursor `fc09fa02ea86522b1bdc7ea03f0964f4fd56f2a4` failed run `34444649968` because the new VM fixture did not strip one TypeScript annotation. This was classified as a `TEST/FIXTURE DEFECT`; no application assertion failed and no PASS was transferred. Fixture-only correction produced `a42100452d1b1fff7c146543e8ab5cd67da32193`, whose replacement run `34444825916` passed fully.

## Bookkeeping transaction now prepared

This branch now contains the off-canonical #75 bookkeeping transaction:
- #74 Advanced assignments is represented as **Regression-tested** because it survived the complete #75 functional suite.
- #75 Assignment push workflow is represented as **Verified**.
- Ledger totals represented by this bookkeeping state: **74 Regression-tested, 1 Verified, 0 Implemented, 25 Not started**.
- Strict implemented-or-better parity represented here: **75/100**.
- Regression stability represented here: **74/100**.

These values are provisional bookkeeping until the exact final bookkeeping SHA passes a new complete accumulated workflow. They are not canonical/frozen truth merely because the docs were committed.

## Exact next executable sequence

1. Treat the final tip of `agent/a1-work/075-assignment-push` after this bookkeeping commit as the exact clean #75 bookkeeping candidate.
2. Create/use an isolated verification branch only to trigger GitHub Actions. Its temporary workflow must explicitly checkout and assert that exact bookkeeping candidate SHA; the trigger commit is not the candidate.
3. Run the complete accumulated architecture, edge/security and browser/mobile regression suite. No PASS transfers from `a4210045...`.
4. If any phase fails, do not move canonical or freeze a release; classify/root-cause the failure and correct only verified causes on quarantine, then produce a new SHA and rerun.
5. If the exact bookkeeping SHA is fully green, restore/remove temporary trigger state, recheck the writer lease and live canonical HEAD, then fast-forward `feature/v3-assignment-push` without force to the exact green bookkeeping SHA.
6. Create the next immutable frozen release ref `release/v3.48-assignment-push` at the same exact green bookkeeping SHA. Never move that ref afterward.
7. Update `automation/CURRENT.md`, release the writer lease, and only then begin independent recovery of #76 Ministry Hub on a later cycle.

## Non-negotiable continuation rules

- Rebuild-and-verify; never patch-and-accumulate.
- One source of truth per responsibility.
- Never claim a test passed unless it actually executed against the claimed SHA.
- Normal Actions remain `workflow_dispatch`-only; temporary `push:` belongs only on isolated verification branches.
- Never weaken/delete/skip accumulated regression coverage to get green.
- Never modify `main`, production v2, production Cloudflare or production Supabase without separate explicit authorization.
- Never move safety refs or an existing frozen `release/v3.*` ref.
- Do not begin #76 before #75 exact bookkeeping verification and release closure.