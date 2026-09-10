# A4 QA / Regression — #81 Psychometrics suite

Identity: `BQ-A4-QA`
Date: 2026-09-10 JST
Disposition: **READY / CLOSED — frozen as v3.54**

## STATE / PROVENANCE

### FACT
- Frozen release: `release/v3.54-psychometrics`.
- Exact frozen/bookkeeping SHA: `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- Functional candidate: `5d3446916b8aa809f8a419e3cffa88a312c4bbc5`.
- Previous frozen base: `release/v3.53-personality-profile` at `2c62a63e5bbdedae47834714e65751a57d58b696`.
- Authoritative #81 contract: `complete assessment; result; persistence; mobile`.
- Active milestone has advanced to #82 Avatar Vault.

## EXACT RUN EVIDENCE

### FACT — functional gate
Run `34473640903` on verifier branch `verify/v3.54-psychometrics-functional-5d344-20260910` completed successfully. Its exact-target workflow checked out and asserted `5d3446916b8aa809f8a419e3cffa88a312c4bbc5`. Architecture validators, accumulated edge regressions, Playwright/Chromium setup, local server, and accumulated browser/mobile regressions all executed and passed.

The exact executed workflow included `scripts/validate-v3-psychometrics.mjs`, `tests/v3-psychometrics-edge.mjs`, and the accumulated browser sequence including `tests/v3-psychometrics-smoke.mjs`, while retaining the preceding accumulated validators and regressions.

### FACT — bookkeeping/freeze gate
Run `34474642839` on verifier branch `verify/v3.54-psychometrics-bookkeeping-cc591-20260910` completed successfully. Its exact-target assertion passed for bookkeeping SHA `cc591aac786a91183eb5a7a5ad958ae7314a9577`; accumulated architecture, edge/security, and browser/mobile phases all executed and passed.

`release/v3.54-psychometrics` now resolves exactly to `cc591aac786a91183eb5a7a5ad958ae7314a9577`. Therefore PASS is not being transferred across SHAs: the functional candidate and changed bookkeeping candidate each have their own complete exact accumulated green.

## REGRESSION INTEGRITY

### FACT
The restored canonical `.github/workflows/v3-regression.yml` is `workflow_dispatch`-only. It retains #81's permanent validator, edge regression and browser smoke alongside the prior accumulated suite. No unexplained deletion, skipping or workflow narrowing was found in the inspected final state.

## A4 DISPOSITION

**READY / CLOSED** for #81 at exact frozen SHA `cc591aac786a91183eb5a7a5ad958ae7314a9577`.

No remaining #81 QA promotion gate is identified from current primary evidence.

## STALENESS CONDITIONS

This closure must be re-opened only if the immutable release ref changes unexpectedly, exact run evidence is invalidated, or later work weakens/removes #81's permanent accumulated regression coverage. Normal development on #82 does not make this frozen #81 verdict stale.
