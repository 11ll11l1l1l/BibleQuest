# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after #86 functional verification.

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. Development continues under rebuild-and-verify with exact-SHA verification and one-owner boundaries.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase, production data, and production Cloudflare remain untouched.
- Latest frozen checkpoint: `release/v3.58-tutorial-avatar-reactions` at `c71db1502618a0a5679bf880fbd830762f9f5ef4`.
- Active branch: `feature/v3-accessibility-support`.
- Normal v3 Actions remain `workflow_dispatch` only on product branches.
- Temporary `push:` triggers are restricted to isolated `verify/...` branches and are reset away after each run.

## Current bookkeeping candidate state

| State | Count |
|---|---:|
| Regression-tested | 85 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 14 |
| Total | 100 |

Strict implemented-or-better parity is **86/100**. Regression stability is **85/100**.

- #85 Tutorial avatar reactions — **Regression-tested** after surviving #86's complete accumulated functional suite.
- #86 Accessibility support — **Verified** by exact functional candidate `168a2b32d96d9c999cd6e93879d3215bebfe25da` in run `34502063494`.
- #87 Content reporting — **Not started** and remains separate from #86.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred.

These counts are represented by this #86 bookkeeping transaction, but they are not frozen until the exact bookkeeping SHA passes its own complete accumulated gate. No PASS transfers from the functional candidate after documentation changes.

## #86 verified functional boundary

Accessibility is rebuilt as a clean service + explicit presentation runtime rather than the legacy global injector. `src/app/accessibility.js` owns device-local text, motion and contrast preferences through the shared Storage service. `src/ui/accessibility.js` owns root presentation attributes and Tab containment for visible modal dialogs. `src/features/accessibility/index.js` owns the settings page exposed from More. Existing shell route focus, feature-owned Escape behavior, Router, account/cloud state, Progress, API and backend ownership remain unchanged.

Permanent evidence includes `ACCESSIBILITY_SUPPORT_V3.md`, `src/app/accessibility.js`, `src/ui/accessibility.js`, `src/features/accessibility/index.js`, `src/ui/accessibility.css`, `scripts/validate-v3-accessibility.mjs`, `tests/v3-accessibility-edge.mjs`, `tests/v3-accessibility-smoke.mjs`, and permanent invocation in `.github/workflows/v3-regression.yml`.

## Defect / root-cause ledger

- #85 historical test defects remain retained in Git history and permanent regressions.
- Targeted run `34501867982`, candidate `168a2b32d96d9c999cd6e93879d3215bebfe25da`: exact SHA, #86 architecture/edge checks, #85 regression checks, shell integration and Accessibility browser/mobile checks all passed without product correction.
- Full functional run `34502063494`, same exact candidate: complete accumulated architecture validators, complete edge/security regressions and complete browser/mobile regressions all passed.

## Next major milestone: #86 bookkeeping and v3.59 freeze

1. Verify this exact bookkeeping SHA with inventory validation plus the entire accumulated suite on an isolated verifier.
2. On green, reset the verifier to the clean bookkeeping SHA and freeze `release/v3.59-accessibility-support` at exactly that SHA.
3. Verify the release ref.
4. Create the next feature branch from v3.59 and recover #87 Content reporting read-only before product writes.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase/data and production Cloudflare remain unchanged throughout the rebuild.