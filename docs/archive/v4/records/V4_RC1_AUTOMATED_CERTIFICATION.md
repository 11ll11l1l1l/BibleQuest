# BibleQuest V4 RC1 automated certification

## Status

BibleQuest V4 RC1 is **automated-gate certified** from the unchanged exact candidate:

`cf58fa2e467f70f1c4a963b4ca50e33f11da9983`

The candidate is frozen at `release/v4-rc1` and represented by draft PR #151 targeting `main`. PR #151 remains intentionally unmerged until the separate preview/staging and physical-device release gates are satisfied.

## Exact automated evidence

All of the following executed against the same exact RC1 SHA:

- Full accumulated build/architecture/static/security/edge/browser-mobile regression `34694787827`: **PASS**.
- Dedicated Section I security/privacy gates `34694787800`: **PASS**.
- Dedicated Section H responsive/accessibility/performance/PWA browser gates `34694787772`: **PASS**.
- Whole-app browser audit `34694787823`: **PASS**.

The full accumulated regression passed every stage: Cloudflare deployment/build compatibility, accumulated architecture validators, accumulated edge regressions, guarded field-harness syntax checks, Playwright/Chromium setup, local application startup, and the complete accumulated browser/mobile regression matrix.

## Protected-page evidence on RC1

The dedicated `v4-protected-pages-audit.yml` workflow is configured to trigger on pull requests targeting `v4/modern-ui-overhaul`, so it does not independently attach a run to final PR #151, whose base is `main`.

This does **not** leave the RC1 protected-page contracts unexecuted. The exact-RC accumulated regression includes the same protected architecture validators, protected static/edge contracts, and protected browser workflows used by the dedicated protected-page audit. Therefore run `34694787827` is the exact-SHA RC1 evidence for those protected contracts.

The workflow trigger is not changed for RC1 because changing candidate bytes solely to obtain a duplicate workflow label would invalidate the frozen SHA and require a new candidate/rerun without increasing tested behavior coverage.

## Release-plan reconciliation

RC1 contains the Section I-integrated V4 product plus the repository-truth/documentation reconciliation completed before freeze. No additional product feature tranche is required by `DEVELOPMENT_PLAN_V4.md`, issue #124, or `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` before release consideration.

The exact Section I runtime candidate remains independently preserved at `release/v4-section-i` (`9f8c530668b2d9cbaa0cca226750fe9278f0a24f`). RC1 includes that product state and subsequent documentation-only reconciliation commits.

## Rollback preservation

The verified V3 rollback reference remains intact:

- branch: `release/v3.71-japanese-furigana`
- SHA: `c631bea8d5177a9a2ff68139cb104b6fbf26015b`

It must remain available until V4 production acceptance is complete.

## Gates still open

Automated certification is not production authorization by itself. These release gates remain explicitly open:

1. Preview/staging smoke against the intended RC1 deployment or equivalent exact-candidate environment.
2. Installed-PWA behavior on a real device.
3. Physical Android Chrome at 100% zoom.
4. Physical Android Brave at 100% zoom.
5. Promotion of the exact verified V4 state to `main` only after the preceding gates are satisfied.
6. Post-promotion verification that Cloudflare production serves the intended bytes/build identity and passes production browser smoke.

The canonical production host follows `main`; testing the current production site before promotion does not constitute RC1 preview/staging evidence.

## Promotion rule

Do not merge PR #151 or otherwise promote V4 to `main` while any required field/preview gate above remains unverified. Any runtime/product-byte change to RC1 invalidates this certification and requires a new exact candidate with complete applicable reruns.