# A4 QA / Regression Investigation — #82 Avatar Vault

Generated: 2026-09-10 JST
Identity: BQ-A4-QA

## STATE / PROVENANCE
- Current canonical/bookkeeping head: `feature/v3-avatar-vault` at `dde924f86f83baf78659f303e442930b38749aca`.
- Exact product functional candidate: `37f1dc671804a1bb67ede2e5104002160b24c9dd`.
- Frozen base: `release/v3.54-psychometrics` at `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- Functional run `34483151962` completed success against exact `37f1dc6...`; verifier explicitly targeted that candidate and the accumulated architecture, edge/security and browser/mobile phases completed.
- `37f1dc6...` to `dde924f...` is bookkeeping/status/inventory only. Bookkeeping still requires its own exact complete gate and no functional PASS transfers automatically.
- Stale on product/test/workflow/canonical movement.

## RESOLVED SINCE FIRST QA PASS
FACT:
- `tests/v3-avatar-vault-smoke.mjs` now exists, is registered in the browser/mobile loop, uses a 390x844 mobile/touch viewport, and checks render, 15 cards, equip interaction, back callback, horizontal overflow, and page/console errors.
- Exact functional run `34483151962` executed the current accumulated suite including that smoke. The earlier missing-browser-smoke finding is resolved.

## REMAINING TEST-SUFFICIENCY FAILURES
FACT:
- Current edge tests use a mocked `api.avatarVault` and do not execute/f faithfully model the two actual cloud writes in `src/core/api.js`.
- Current API still replaces the entire congregation avatar JSON with `{cosmetic:selectedStyle}`.
- Current app `load()` does not retry/reconcile the congregation-avatar representation after a partial save.
- The browser smoke is guest/local and does not exercise authenticated Supabase persistence or preservation of an existing structured avatar.

Counterfactual: all current tests can pass while a signed-in user loses existing avatar fields or remains in permanently split cloud state after a partial failure. These are observable persistence/data-integrity failures inside #82's required `persist` behavior.

## VALIDATOR QUALITY
FACT:
- `scripts/validate-v3-avatar-vault.mjs` requires the structural source token for `.update({avatar})`, which in current implementation is the destructive full-object replacement path.
- It also requires migration assumptions about a missing avatar column/self-update policy that conflict with read-only live schema evidence.

Thus the validator proves wiring/presence but not safe persistence semantics.

## EXISTING ACCUMULATED VALIDATOR CHANGE
The #81 Psychometrics validator change only removes an obsolete requirement that later row #82 remain permanently `Not started`; its dedicated #81 assertions remain. I find the change narrowly semantic-preserving. Under master rules it remains HIGH-RISK because an existing accumulated validator changed, so review is exact-state sensitive.

## ACCEPTANCE MATRIX
- Browse/open: PASS in functional smoke.
- 390px render/no-overflow: PASS in functional smoke.
- Select unlocked / reject locked: covered.
- Guest isolation/persistence: covered.
- Signed-in cloud persistence: implementation exists, but unsafe/inadequately tested.
- Preserve pre-existing avatar fields: **FAIL by source inspection; no faithful regression**.
- Partial cloud failure/reopen convergence: **FAIL/UNPROVEN; no faithful regression**.
- Cross-feature full-avatar compatibility: **UNPROVEN**.
- Exact bookkeeping run for `dde924f...`: separate gate; current evidence must be checked independently.

## QA DECISION
**NOT READY** for HIGH-RISK promotion despite functional run `34483151962` being green.

The harness now covers the real mobile surface, but it still cannot fail for the two reproduced cloud persistence defects. Correct the product/data semantics first, add faithful preservation and partial-failure regressions, run a new exact-SHA complete suite, and obtain fresh exact-candidate review. Do not treat a green test suite as evidence for behavior it does not exercise.