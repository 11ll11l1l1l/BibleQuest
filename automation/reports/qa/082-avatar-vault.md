# A4 QA / Regression Investigation — #82 Avatar Vault

Generated: 2026-09-10 JST
Identity: BQ-A4-QA

## STATE / PROVENANCE
- Active milestone: #82 Avatar Vault — HIGH-RISK.
- Exact candidate inspected: `feature/v3-avatar-vault` at `37f1dc671804a1bb67ede2e5104002160b24c9dd`.
- Frozen base: `release/v3.54-psychometrics` at `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- Earlier exact run `34482680612` successfully checked out/asserted `589827943ba5467e805d793c001a33a41b9f42b7`, not current `37f1dc6...`; PASS does not transfer.
- Since that run, a dedicated Avatar Vault Playwright smoke was added and registered in the browser/mobile loop.
- Stale on any candidate/test/workflow change.

## WHAT IS NOW COVERED IN SOURCE
FACT:
- `scripts/validate-v3-avatar-vault.mjs` is in the architecture loop.
- `tests/v3-avatar-vault-edge.mjs` is in the edge loop.
- `tests/v3-avatar-vault-smoke.mjs` now exists and is in the browser/mobile loop.
- The new smoke uses a 390x844 mobile/touch viewport and checks the Vault renders, all 15 cards appear, equip interaction works, back callback fires, no horizontal overflow occurs, and no page/console errors occur.

This resolves the prior missing dedicated #82 browser-smoke source coverage. It has not yet been proven by an exact complete run at current `37f1dc6...`.

## REMAINING TEST-SUFFICIENCY BLOCKERS
FACT:
- `tests/v3-avatar-vault-edge.mjs` uses a mocked `api.avatarVault` and does not execute/f faithfully simulate current `src/core/api.js` dual-write semantics.
- Current API replaces the full member avatar with `{cosmetic:selectedStyle}`.
- Current app `load()` does not retry/reconcile the second cloud representation after a partial save.
- The new browser smoke is guest/local and does not exercise signed-in Supabase persistence or preservation of an existing structured avatar object.

Counterfactual:
- The complete current test set can be green while an authenticated user loses existing avatar fields or remains with split cloud state after a partial failure.

Required regression evidence:
1. Start from a structured avatar object containing non-cosmetic keys and prove cosmetic selection preserves every unrelated key.
2. Simulate first cloud write succeeding and second failing, then reopen/retry and prove deterministic convergence or truthful retry state.
3. Exercise the actual API/data-layer contract or a faithful boundary test rather than an indivisible mocked `save()` throw.
4. Confirm congregation consumers still receive/render the preserved avatar after cosmetic update.

## VALIDATOR QUALITY
FACT:
- `scripts/validate-v3-avatar-vault.mjs` still requires the source token `bible_congregation_members').update({avatar}`. In current code this is the destructive full-object replacement path.
- It also requires the candidate migration's add-column/self-policy assumptions, even though read-only live schema investigation shows the column and an own-profile UPDATE policy already exist.

QA decision:
- The validator currently proves structural presence, not safe persistence semantics. It should not be treated as evidence that cloud persistence is correct.

## EXISTING ACCUMULATED VALIDATOR CHANGE
FACT:
- #82 lineage changes `scripts/validate-v3-psychometrics.mjs` only to permit #82 to advance through defined lifecycle states instead of remaining permanently `Not started` after #81 freeze.
- That change appears semantically narrow and does not remove #81 Psychometrics runtime assertions.
- Master guardrails nevertheless classify any existing accumulated validator change as HIGH-RISK; exact current candidate still requires fresh review after a new complete run.

## ACCEPTANCE MATRIX AT CURRENT HEAD
- Browse/open/render source: present.
- 390px dedicated smoke source: present, not yet exact-run at current SHA.
- Select unlocked style: edge-covered.
- Reject locked style: edge-covered.
- Guest persistence/isolation: edge-covered.
- Signed-in cloud persistence: implementation exists but unsafe/incompletely tested.
- Preserve existing avatar fields: **FAIL by source inspection**.
- Partial cloud failure/reopen recovery: **FAIL/UNPROVEN by source inspection**.
- Leaderboard cosmetic source rendering: present; preservation compatibility unproven.
- Full accumulated current-SHA execution: **MISSING**.

## READY / NOT READY
**NOT READY** for promotion at `37f1dc671804a1bb67ede2e5104002160b24c9dd`.

The dedicated 390px smoke gap is now corrected in source. Promotion remains blocked because the current cloud persistence semantics can destroy shared avatar fields and can leave unreconciled split state, neither of which the present tests can detect. In addition, no complete exact-SHA run has executed the newly added smoke at the current head.

After product/data-contract correction, add faithful regressions, run the entire accumulated suite on the new exact SHA, and obtain a fresh A4 review for that exact candidate. No READY transfers across SHAs.