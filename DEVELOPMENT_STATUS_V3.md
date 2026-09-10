# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after #84 functional verification.

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. Development continues under rebuild-and-verify with exact-SHA verification and one-owner boundaries.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase, production data, and production Cloudflare remain untouched.
- Latest frozen checkpoint: `release/v3.56-innovation-suite` at `f04af346f651150a6726f2ae4ebd740e40cdd604`.
- Active branch: `feature/v3-tutorial-onboarding`.
- Normal v3 Actions remain `workflow_dispatch` only on product branches.
- Temporary `push:` triggers are restricted to isolated `verify/...` branches and are reset away after each run.

## Current bookkeeping candidate state

| State | Count |
|---|---:|
| Regression-tested | 83 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 16 |
| Total | 100 |

Strict implemented-or-better parity is **84/100**. Regression stability is **83/100**.

- #83 Innovation suite — **Regression-tested** after surviving #84's complete accumulated functional suite.
- #84 Tutorial/onboarding trainer — **Verified** by exact functional candidate `9f4f018356e48b4f7d7c62887761cffd8278fbd5` in run `34495260019`.
- #85 Tutorial avatar reactions — **Not started** and explicitly separate from #84.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred.

These lifecycle counts are now represented by the #84 bookkeeping transaction, but they are not frozen until the exact bookkeeping SHA itself passes a new complete accumulated gate. No PASS transfers from `9f4f018356e48b4f7d7c62887761cffd8278fbd5` after documentation changes.

## #84 verified functional boundary

Retained production behavior was recovered from `onboarding-tutorial.js`, `tutorial-launcher.js`, and historical tutorial commits. The clean v3 implementation preserves these semantics:

- anonymous Home remains unobstructed; the full tutorial does not auto-open merely because a guest lands on Home;
- the Home `Show tutorial` launcher permanently force-opens the guide, including after completion;
- account-created onboarding starts only after the existing Account surface displays the one-time recovery code and the user confirms it was saved;
- the recovery code never enters tutorial state, callback arguments, global events, URLs, logs, analytics, or browser-session scratch state;
- tutorial lifecycle owns open/Next/Back/Skip/Finish/completion persistence through the shared storage boundary;
- exactly one overlay presenter is mounted and all route changes are delegated to the existing Router;
- mobile and existing offline/PWA behavior are retained without creating another service-worker/cache owner;
- #85 reaction/sprite behavior is not included.

Permanent evidence:
- `TUTORIAL_ONBOARDING_V3.md`
- `src/app/tutorial.js`
- `src/features/tutorial/index.js`
- `src/features/home/index.js`
- `src/features/account/index.js`
- `src/ui/tutorial.css`
- `scripts/validate-v3-tutorial-onboarding.mjs`
- `tests/v3-tutorial-onboarding-edge.mjs`
- `tests/v3-tutorial-onboarding-smoke.mjs`
- accumulated invocation in `.github/workflows/v3-regression.yml`

## #84 verification history

- Run `34493685748`, candidate `9ed4bc024afff960ebba8614f6a13c8e1f51204c`: shell/account interaction was blocked because an early implementation auto-opened the tutorial on anonymous Home. Retained production evidence showed that trigger was wrong; runtime was corrected to account-created/manual-launch semantics.
- Run `34494727258`, candidate `ad8dd79a1159dfabf7ddf41d506b608eaf95720f`: exact SHA, architecture, lifecycle and shell tests passed, but the new tutorial smoke had an off-by-one test sequence that reached the final step without clicking `Finish guide`. Runtime was unchanged; the test was corrected.
- Targeted run `34495068372`, candidate `9f4f018356e48b4f7d7c62887761cffd8278fbd5`: exact SHA, architecture/privacy validator, lifecycle edges, existing shell smoke and strengthened account-handoff/mobile/offline smoke all passed.
- Full functional run `34495260019`, same exact product SHA: complete accumulated architecture validators, complete accumulated edge/security regressions, and complete browser/mobile regressions all passed.

## Exact next sequence

1. Treat the live tip of `feature/v3-tutorial-onboarding` containing the #84 bookkeeping updates as a new bookkeeping candidate.
2. Verify that exact SHA on an isolated verifier with SHA assertion, inventory validation, all accumulated architecture validators, all edge/security regressions, and the complete browser/mobile suite.
3. Correct only a reproduced failure; never weaken accumulated coverage.
4. On green, reset the verifier to the clean bookkeeping SHA and freeze `release/v3.57-tutorial-onboarding` at exactly that SHA.
5. Verify the release ref points to that exact SHA.
6. Only then create the next feature branch and open #85 Tutorial avatar reactions.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase/data and production Cloudflare remain unchanged throughout the rebuild.
