# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-11 JST

`FEATURE_INVENTORY_V3.md` remains authoritative.

## Current completion snapshot

- Total capabilities: 100
- Bookkeeping after #86 functional verification: 85 Regression-tested / 1 Verified / 0 Implemented / 14 Not started
- Implemented or better: **86/100**
- Regression stability: **85/100**
- Latest frozen checkpoint: `release/v3.58-tutorial-avatar-reactions` at `c71db1502618a0a5679bf880fbd830762f9f5ef4`
- #86 product candidate: `168a2b32d96d9c999cd6e93879d3215bebfe25da`
- #86 targeted run: `34501867982` — green
- #86 complete functional run: `34502063494` — green
- #87 Content reporting is next only after v3.59 bookkeeping verification/freeze.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred.

## Recent frozen release line

- `release/v3.56-innovation-suite` — `f04af346f651150a6726f2ae4ebd740e40cdd604`
- `release/v3.57-tutorial-onboarding` — `f19d51826b9d191c221c0fdd96bda78b42e2aa95`
- `release/v3.58-tutorial-avatar-reactions` — `c71db1502618a0a5679bf880fbd830762f9f5ef4`
- `release/v3.59-accessibility-support` — pending exact bookkeeping verification/freeze

## Recent milestone sequence

| Capability | State now | Evidence |
|---:|---|---|
| #84 Tutorial/onboarding trainer | Regression-tested | frozen v3.57; retained by #85/#86 full suites |
| #85 Tutorial avatar reactions | Regression-tested | frozen v3.58; survived #86 full suite |
| #86 Accessibility support | Verified | exact candidate `168a2b32...`; targeted `34501867982`; full `34502063494` |
| #87 Content reporting | Not started | waits for v3.59 freeze |

## #86 functional chronology

1. Started from frozen v3.58.
2. Recovered retained accessibility behavior from `accessibility-runtime.js`, `accessibility-runtime.css`, and `journey-accessibility.js`.
3. Rebuilt preferences through shared Storage and explicit v3 UI composition; legacy direct storage, global BQ namespace and MutationObserver were not ported.
4. Added More → Accessibility routing, text/motion/contrast controls, keyboard-visible focus, modal Tab containment and persistent preference behavior.
5. Added permanent architecture, edge and browser/mobile regressions to the accumulated workflow.
6. Exact product candidate `168a2b32d96d9c999cd6e93879d3215bebfe25da` passed targeted run `34501867982` and complete accumulated functional run `34502063494`.
7. #86 is promoted to Verified in bookkeeping and #85 advances to Regression-tested; changed bookkeeping still requires its own exact-SHA full gate.

## Next sequence

1. Full exact-SHA bookkeeping verification including inventory validation.
2. Freeze v3.59 only if green.
3. Create #87 branch from frozen v3.59.
4. Recover Content reporting contracts read-only, then implement/verify without bundling moderation/admin scope.

## Release discipline

Production v2, `main`, production Supabase/data and production Cloudflare remain untouched. Normal CI stays manual-only; temporary push triggers are isolated and removed after use.