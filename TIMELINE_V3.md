# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-11 JST

This is the current progress view over `FEATURE_INVENTORY_V3.md`, which remains authoritative. Detailed older milestone history remains preserved in Git history; this working timeline is intentionally kept focused on the current frozen line and active gates.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Inventory after #85 functional verification/bookkeeping promotion:** 84 Regression-tested / 1 Verified / 0 Implemented / 15 Not started
- **Implemented or better:** 85 / 100 (**85% strict parity completion**)
- **Official regression stability:** 84 / 100
- **Latest frozen checkpoint:** `release/v3.57-tutorial-onboarding` at `f19d51826b9d191c221c0fdd96bda78b42e2aa95`
- **#85 functional candidate:** `51dcc042ca8af6f321474ea3a3bd3c67cdf1650c`
- **#85 targeted verification:** run `34499623045` — green
- **#85 complete functional verification:** run `34499796826` — green
- **#86 Accessibility support:** next, but no product write until #85 bookkeeping passes and v3.58 freezes
- **#15 Japanese furigana and Kids #38–40:** intentionally deferred
- **Production:** v2 remains live; `main`, production Supabase/data and production Cloudflare remain untouched

## Recent frozen release line

- `release/v3.54-psychometrics` — `cc591aac786a91183eb5a7a5ad958ae7314a9577`
- `release/v3.55-avatar-vault` — `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`
- `release/v3.56-innovation-suite` — `f04af346f651150a6726f2ae4ebd740e40cdd604`
- `release/v3.57-tutorial-onboarding` — `f19d51826b9d191c221c0fdd96bda78b42e2aa95`
- `release/v3.58-tutorial-avatar-reactions` — pending exact bookkeeping verification/freeze

## Recent milestone sequence

| Inventory capability | State now | Evidence / boundary |
|---:|---|---|
| #82 Avatar Vault | Regression-tested | frozen v3.55; retained by later full suites |
| #83 Innovation suite | Regression-tested | frozen v3.56; retained by later full suites |
| #84 Tutorial/onboarding trainer | Regression-tested | frozen v3.57; survived #85 full functional suite |
| #85 Tutorial avatar reactions | Verified | exact functional candidate `51dcc042ca8af6f321474ea3a3bd3c67cdf1650c`; run `34499796826` |
| #86 Accessibility support | Not started | retained contract recovered read-only; waits for v3.58 freeze |

## #85 functional verification chronology

1. #85 was created from frozen `release/v3.57-tutorial-onboarding` at `f19d51826b9d191c221c0fdd96bda78b42e2aa95`.
2. Retained `onboarding-tutorial.js`, `tutorial.css`, and `assets/tutorial-trainer-sprite.webp` established the actual trainer/sprite contract; the stale historical `js/avatar.js` path was not treated as authoritative.
3. Clean v3 ownership was limited to static `src/features/tutorial/trainer.js` mapping plus presentation in the already-owned tutorial overlay/CSS. No new persistence, router, account, Progress, API or backend owner was added.
4. Targeted run `34498989910` reproduced a test-only CSS zero-unit serialization mismatch (`0px` vs `0%`); runtime was unchanged and the assertion was normalized semantically.
5. Targeted run `34499380103` reproduced a test-only transformed bounding-box measurement issue around the retained trainer bob animation; runtime was unchanged and CSS box size became the size criterion while transformed bounds still protect viewport overflow.
6. Candidate `51dcc042ca8af6f321474ea3a3bd3c67cdf1650c` passed targeted run `34499623045` including #84/#85 architecture, edge, browser/mobile, reduced-motion and offline checks.
7. The same exact candidate passed complete accumulated functional run `34499796826`, including all architecture validators, all edge/security regressions and all browser/mobile regressions.
8. #85 is therefore promoted to Verified in bookkeeping; #84 advances to Regression-tested. This changed bookkeeping SHA must still pass its own exact-SHA full gate before v3.58 freezes.

## #86 recovered next boundary

Retained accessibility behavior establishes:
- persistent text size choices: normal, large and extra large;
- motion choices: follow device, reduce motion and full motion;
- normal/stronger contrast choice;
- visible keyboard focus;
- accessible dialog semantics;
- keyboard focus containment/restoration and Escape close behavior;
- reduced-motion behavior across animated/transitional presentation.

The legacy runtime directly accessed browser storage, exposed `window.BQAccessibility`, and used MutationObserver. Those mechanisms are incompatible with the v3 one-owner boundary and must not be copied. #86 should define one clean accessibility preference/service owner using shared storage and explicit presenter composition, while preserving existing route, dialog, and feature ownership.

## Next sequence

1. Run this exact #85 bookkeeping candidate through the complete accumulated exact-SHA bookkeeping gate, including `scripts/validate-v3-inventory.mjs`.
2. On green, reset the isolated verifier to the clean bookkeeping SHA.
3. Freeze `release/v3.58-tutorial-avatar-reactions` at that exact green SHA and verify the ref.
4. Create `feature/v3-accessibility-support` from v3.58.
5. Implement #86 cleanly against the recovered contract, add permanent architecture/edge/browser-mobile regressions, then run targeted and full accumulated gates.
6. Continue milestone-to-milestone without modifying production surfaces.

## Release discipline

- Do not modify `main`, production Supabase/data or production Cloudflare during rebuild.
- Do not replace production v2 with incomplete v3.
- Freeze only after the exact bookkeeping state passes the complete accumulated suite.
- Every reproduced bug records its root cause and retains regression protection.
- Normal v3 CI remains manual-only; temporary push triggers are isolated to verifier branches and removed afterward.