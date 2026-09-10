# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after #85 functional verification.

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. Development continues under rebuild-and-verify with exact-SHA verification and one-owner boundaries.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase, production data, and production Cloudflare remain untouched.
- Latest frozen checkpoint: `release/v3.57-tutorial-onboarding` at `f19d51826b9d191c221c0fdd96bda78b42e2aa95`.
- Active branch: `feature/v3-tutorial-avatar-reactions`.
- Normal v3 Actions remain `workflow_dispatch` only on product branches.
- Temporary `push:` triggers are restricted to isolated `verify/...` branches and are reset away after each run.

## Current bookkeeping candidate state

| State | Count |
|---|---:|
| Regression-tested | 84 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 15 |
| Total | 100 |

Strict implemented-or-better parity is **85/100**. Regression stability is **84/100**.

- #84 Tutorial/onboarding trainer — **Regression-tested** after surviving #85's complete accumulated functional suite.
- #85 Tutorial avatar reactions — **Verified** by exact functional candidate `51dcc042ca8af6f321474ea3a3bd3c67cdf1650c` in run `34499796826`.
- #86 Accessibility support — **Not started** and explicitly separate from #85.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred.

These lifecycle counts are represented by this #85 bookkeeping transaction, but they are not frozen until this exact bookkeeping SHA itself passes a new complete accumulated gate. No PASS transfers from `51dcc042ca8af6f321474ea3a3bd3c67cdf1650c` after documentation/validator changes.

## #84 verified functional boundary

#84 remains unchanged: tutorial lifecycle/completion persistence is owned by `src/app/tutorial.js`; `src/features/tutorial/index.js` remains the single overlay presenter; Home owns only the persistent launcher; Account invokes onboarding only after recovery-code save confirmation; Router remains navigation/history owner; the offline-shell service remains the only cache/PWA owner.

#85 adds presentation only: `src/features/tutorial/trainer.js` contains deterministic retained trainer-state mapping; the existing tutorial presenter renders that state; `src/ui/tutorial.css` owns the retained sprite cells, mobile positioning, bob animation, and reduced-motion behavior. #85 adds no persistence, account state, routing, Progress mutation, API/backend state, or second tutorial lifecycle owner.

Permanent #85 evidence:
- `TUTORIAL_AVATAR_REACTIONS_V3.md`
- `src/features/tutorial/trainer.js`
- `src/features/tutorial/index.js`
- `src/ui/tutorial.css`
- `assets/tutorial-trainer-sprite.webp`
- `scripts/validate-v3-tutorial-avatar-reactions.mjs`
- `tests/v3-tutorial-avatar-reactions-edge.mjs`
- `tests/v3-tutorial-avatar-reactions-smoke.mjs`
- accumulated invocation in `.github/workflows/v3-regression.yml`.

## Defect / root-cause ledger

- #84 history remains retained in Git history and its permanent regressions.
- Targeted run `34498989910`, candidate `2644dad902bef17ad72477a91db61ad5e54b3399`: runtime and architecture/edge checks passed, but Chromium normalized CSS `0% 0%` to `0px 0px`. This was a browser-test serialization defect; runtime was unchanged. The smoke now normalizes zero positions semantically.
- Targeted run `34499380103`, candidate `19cde1f613993951c9e0ad406965ba26245eca19`: runtime and architecture/edge checks again passed, but `getBoundingClientRect()` measured the retained ±1° trainer bob transform, yielding ~124.1px around a CSS 122px square. This was a test measurement defect; runtime was unchanged. CSS width/height now verify size while the transformed rectangle remains the viewport-overflow check.
- Targeted run `34499623045`, candidate `51dcc042ca8af6f321474ea3a3bd3c67cdf1650c`: exact SHA, #84/#85 architecture, lifecycle/edge, browser/mobile, reduced-motion and offline checks all passed.
- Full functional run `34499796826`, same exact product SHA: complete accumulated architecture validators, complete accumulated edge/security regressions, and complete browser/mobile regressions all passed.

## Next major milestone: #85 bookkeeping and v3.58 freeze

1. Treat this bookkeeping transaction's exact live tip as a new candidate; reconcile any concurrent movement before verifying.
2. Verify that exact SHA on an isolated verifier with SHA assertion, inventory validation, all accumulated architecture validators, all edge/security regressions, and the complete browser/mobile suite.
3. Correct only a reproduced failure; never weaken accumulated coverage.
4. On green, reset the verifier to the clean bookkeeping SHA and freeze `release/v3.58-tutorial-avatar-reactions` at exactly that SHA.
5. Verify the release ref points to that exact SHA.
6. Only then create the next feature branch and begin #86 Accessibility support from v3.58.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase/data and production Cloudflare remain unchanged throughout the rebuild.