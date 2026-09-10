# BQ-A5-FIREWALL — #85 Tutorial avatar reactions

Generated: 2026-09-11 01:02 JST

## Exact state
- Active milestone: #85 Tutorial avatar reactions.
- Risk: NORMAL-RISK only while changes remain presentation-only inside verified Tutorial ownership.
- Canonical: `feature/v3-tutorial-avatar-reactions` at `19cde1f613993951c9e0ad406965ba26245eca19`.
- Dedicated `agent/a1-work/085-*`: none found.
- Frozen base: `release/v3.57-tutorial-onboarding` at `f19d51826b9d191c221c0fdd96bda78b42e2aa95`.
- Compare: canonical is 2 commits ahead of frozen base.
- Exact targeted run `34499380103`: FAILURE. Exact product assertion passed; tutorial architecture/edge checks passed; tutorial browser/mobile checks failed.
- Complete accumulated exact-SHA #85 run: none found at inspection time.
- Lease: FREE.

## Primary evidence verified before agent reports
**FACT:** Master control requires unverified implementation to live on `agent/a1-work/<milestone-id>-<slug>` and only later fast-forward canonical after exact gates.

**FACT:** Canonical moved from frozen `f19d518...` to `19cde1f...`. The first new commit is `feat(v3): rebuild tutorial trainer reactions`; the second changes `tests/v3-tutorial-avatar-reactions-smoke.mjs` to normalize browser zero-position formatting.

**FACT:** Current product code derives trainer state from a static Tutorial-owned map in `src/features/tutorial/trainer.js` and renders it from `src/features/tutorial/index.js`. The inspected design remains presentation-local; no backend/auth scope was identified.

**FACT:** The authoritative inventory still records #85 as `Not started` with contract `correct reaction/state; mobile positioning` at canonical `19cde1f...`; bookkeeping has not promoted it.

**FACT:** Permanent `.github/workflows/v3-regression.yml` at `19cde1f...` invokes the #85 validator, edge test and browser smoke and retains the accumulated prior lists.

**FACT:** Run `34499380103` completed with `failure`. Its job asserted the exact product SHA successfully, passed tutorial architecture/edge checks, installed and started the browser environment, then failed `Run tutorial browser and mobile checks`. Therefore `19cde1f...` has direct failed acceptance evidence, not merely missing evidence.

## Report freshness
- A2: no #85 contract report found on control branch; missing, not adverse evidence.
- A3: `automation/reports/architecture/85-tutorial-avatar-reactions.md` analyzed canonical/frozen `f19d518...` before implementation. Its presentation-only NORMAL-RISK boundary is useful context, but candidate-specific conclusions are stale because canonical moved to `19cde1f...`.
- A4: `automation/reports/qa/85-tutorial-avatar-reactions.md` analyzed only `f19d518...`, explicitly with no candidate. It is stale for the changed state and cannot approve or reject `19cde1f...`.

## Classifications
### BLOCKER — quarantine transaction bypass
Counterfactual: if canonical `19cde1f...` is treated as the candidate/release source without reconciliation, autonomous implementation has bypassed mandatory isolation and exact-gate sequencing, allowing unverified state into release lineage.

### BLOCKER — exact targeted acceptance failure
Counterfactual: if bookkeeping/release proceeds despite run `34499380103`, the release knowingly includes a SHA whose tutorial browser/mobile acceptance failed; additionally, no complete accumulated exact-SHA run proves prior regressions on this SHA.

### MILESTONE — reproduce/fix without weakening coverage
Reproduce the run-34499380103 browser/mobile failure, identify the demonstrated root cause, preserve the intended retained reaction/mobile-position semantic assertion, keep the #85 validator/edge/browser tests permanently wired, and rerun exact targeted plus complete accumulated verification after correction.

### DEFER
#86 Accessibility support and later inventory rows remain separate.

### IGNORE
Old #82 TRIAGE blockers are stale for current lineage. Stale A3/A4 preimplementation dispositions are not candidate blockers for NORMAL-RISK #85. Fresh A4 is not required solely to add an artificial cycle if the future exact candidate remains NORMAL-RISK and all current gates pass.

## Decision
**2 BLOCKER; NO PROMOTION/RELEASE RECOMMENDATION for `19cde1f613993951c9e0ad406965ba26245eca19`.**

Next safe action: reproduce the failed browser/mobile check, correct only its verified root cause, reconcile the work into `agent/a1-work/085-*` without rewriting immutable refs, preserve accumulated coverage, and obtain complete exact-SHA green before bookkeeping/promotion.

## Staleness
This report is stale immediately if canonical/frozen/work refs move, new targeted or complete run evidence appears, #85 product/test/workflow scope changes, or new A2/A3/A4 reports analyze a different exact SHA.