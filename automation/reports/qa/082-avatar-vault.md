# A4 QA / Regression Investigation — #82 Avatar Vault

Generated: 2026-09-10 JST
Identity: BQ-A4-QA

## STATE / PROVENANCE
- Active milestone: #82 Avatar Vault — HIGH-RISK.
- Exact canonical/candidate inspected: `feature/v3-avatar-vault` at `589827943ba5467e805d793c001a33a41b9f42b7`.
- Frozen base: `release/v3.54-psychometrics` at `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- No dedicated `agent/a1-work/082-*` branch found.
- Exact functional workflow: run `34482680612`, completed `success`.
- Verifier commit `e4ebe2021553020bc3b88e955ae6cbb55524e954` explicitly checked out `589827943ba5467e805d793c001a33a41b9f42b7` and asserted that exact HEAD before tests.
- This report becomes stale on any #82 candidate/head/test/workflow change.

## EXACT RUN EVIDENCE
FACT:
Run `34482680612` completed all recorded phases successfully:
- exact candidate assertion;
- accumulated architecture validators;
- accumulated edge/security regressions;
- Playwright installation;
- Chromium installation;
- local server startup;
- accumulated browser/mobile regressions.

The exact-SHA mechanics for this run are valid. A green run does not establish requirements that the executed harness did not test.

## ACCUMULATED HARNESS AUDIT
FACT:
- `scripts/validate-v3-avatar-vault.mjs` is invoked in the architecture loop.
- `tests/v3-avatar-vault-edge.mjs` is invoked in the edge loop.
- There is no `tests/v3-avatar-vault-smoke.mjs` in the candidate delta and no Avatar Vault-specific smoke invocation in the browser/mobile loop.
- `AVATAR_VAULT_V3.md` explicitly requires the real Avatar Vault surface to be usable at 390px with no horizontal overflow.

BLOCKER:
- The complete run's browser/mobile phase passed without opening/testing Avatar Vault itself. Therefore the run cannot satisfy the candidate's own #82 390px acceptance requirement.

## TEST QUALITY AUDIT
FACT:
`tests/v3-avatar-vault-edge.mjs` meaningfully tests:
- 15-style catalog presence;
- 5 enabled / 10 unavailable decision;
- XP/streak threshold boundaries;
- locked selection rejection;
- guest no-cloud behavior;
- owner isolation;
- local persistence;
- high-level `synced:false` behavior when a mocked `api.avatarVault.save` throws.

MISSING / INSUFFICIENT:
- It does not execute or faithfully simulate `src/core/api.js` `avatarVault.save` data-layer behavior.
- It cannot detect that `save()` replaces the whole `bible_congregation_members.avatar` JSON object with `{cosmetic:...}`.
- It cannot detect first-write-success / second-write-failure divergence because its API mock throws as one indivisible operation.
- It does not prove reopening actually retries/reconciles a failed congregation-avatar propagation write.
- It does not test an invalid remote `selected_style` lifecycle end-to-end.
- It does not test cross-feature compatibility with Congregation Recognition's full avatar object after a cosmetic update.

BLOCKER:
- The current tests can pass while a real user loses existing avatar fields and while cloud state becomes permanently divergent. This is a test gap for observable persistence/data-integrity behavior, not a speculative edge case.

## VALIDATOR AUDIT
FACT:
- `scripts/validate-v3-avatar-vault.mjs` explicitly requires the source token `bible_congregation_members').update({avatar}`.
- In the current API this is the path that replaces the full structured avatar object.
- The validator also requires a migration adding the avatar column/self-update policy based on contract claims that conflict with read-only live schema evidence.

BLOCKER:
- The new validator is partially coupled to implementation strings that preserve the current data-integrity defect instead of asserting semantic field preservation/reconciliation. Passing it cannot be used as proof of safe cloud persistence.

## EXISTING ACCUMULATED TEST CHANGE
FACT:
- Candidate commit `589827943ba5467e805d793c001a33a41b9f42b7` changes `scripts/validate-v3-psychometrics.mjs` from requiring #82 `Not started` forever to requiring #82 use any defined lifecycle state.
- This is the same class of stale future-state assertion previously encountered: #81 is already frozen at v3.54 and its accumulated validator must remain valid when later milestones legitimately advance.

QA assessment:
- The one-line change is narrowly scoped and preserves #81 Psychometrics feature assertions while removing only the obsolete future-row freeze. I find no evidence in that line itself of weakened #81 runtime/security coverage.
- Because an existing accumulated validator changed, master guardrails still require HIGH-RISK exact-candidate review. This report supplies review for `589827...` only; it does not transfer to a corrected later SHA.

## ACCEPTANCE MATRIX
- Browse/open from Grow: implementation present; no dedicated executable browser proof for #82.
- Select unlocked style: edge-covered.
- Reject locked style: edge-covered.
- Guest persistence/isolation: edge-covered with in-memory storage double.
- Signed-in cloud persistence: API boundary exists; unsafe semantics and incomplete faithful tests.
- Preserve existing avatar data: FAIL by source inspection; no regression test.
- Cloud failure/retry: FAIL/UNPROVEN; UI promise not matched by load reconciliation.
- Leaderboard cosmetic render: source composition present; dedicated browser behavior not executed.
- 390px no-overflow/interaction: MISSING EVIDENCE.
- Accumulated prior features: suite executed green, but shared avatar mutation risk is not exercised by current prior tests.

## CROSS-FEATURE RISK
FACT:
- Congregation Recognition passes through the full member `avatar` object.
- #82's save path currently replaces that shared object with a cosmetic-only object.

Therefore a dedicated regression must verify that existing avatar keys survive #82 selection and that existing congregation surfaces still render correctly.

## READY / NOT READY
**NOT READY** for HIGH-RISK promotion at `589827943ba5467e805d793c001a33a41b9f42b7`.

Reasons:
1. Concrete shared-avatar field-loss defect is not covered and is visible in current API semantics.
2. Partial cloud-write recovery promised by UI is not implemented/proven.
3. #82-specific browser/mobile smoke is absent despite the milestone's own 390px acceptance requirement.
4. New architecture validator enforces defective implementation shape instead of safe persistence semantics.

## NEXT REQUIRED QA EVIDENCE
- Correct the product/data contract first; do not change tests merely to match current behavior.
- Add a faithful API/data-layer regression that starts with a structured avatar and proves cosmetic selection preserves all unrelated keys.
- Add first-write-success / second-write-failure recovery coverage and prove reopen/retry convergence.
- Add a real Playwright Avatar Vault smoke at 390px covering open, select, visible state, return navigation, no horizontal overflow/page error, and leaderboard/consumer rendering where feasible.
- Keep all prior accumulated coverage.
- Run a new exact-SHA complete functional gate.
- Because the corrected SHA will differ, obtain fresh A4 review for that exact HIGH-RISK candidate; no READY transfers from this report.