# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST during #94 Reset/recovery bookkeeping verification.

Live GitHub refs and exact executed evidence are authoritative; recover them first.

## Frozen baseline

- Repo: `11ll11l1l1l/BibleQuest`.
- Latest frozen: `release/v3.64-admin-operations` at `56fe2469f9c27e925b92afa9b07d7c12998bb7b7`.
- v3.64 bookkeeping run `34532823188`: success.
- `main`, production v2, Cloudflare, data and Supabase untouched.
- Normal v3 Actions are dispatch-only; temporary push triggers stay isolated.

## Current #94 state

- Active branch: `feature/v3-reset-recovery`.
- Green functional SHA: `b3c15b34da0958a136920dc970b24531e3e06e45`.
- Complete functional run `34534183203`: **success** across exact-SHA assertion, architecture, edge/security and browser/mobile suites.
- First bookkeeping SHA `3f3d6decbb1b3a236c4cbbea3301637f9dfd1c55`; run `34535009560`: **failed** in architecture validation after exact-SHA and ledger assertions passed. Edge/browser stages did not execute.
- Root cause is a stale lifecycle assertion in `scripts/validate-v3-admin-operations.mjs` that forced #94 to remain `Not started`; the corrected validator accepts the valid #94 lifecycle states while retaining row identity/ownership checks.
- Bookkeeping state remains **91 Regression-tested / 1 Verified / 0 Implemented / 8 Not started**; strict parity **92/100**, regression stability **91/100**.
- #93 is Regression-tested; #94 is Verified. The corrected bookkeeping tip requires a fresh complete exact-SHA gate before v3.65 freeze.

## #94 verified boundary

Canonical `/reset` composes existing #9 Account/API recovery ownership. #94 owns only standalone page lifecycle/rendering. It preserves pre-submit cancel, submit-time cancel guard, retryable errors, rotated replacement-code acknowledgement, safe return, and secret non-persistence. #100 portable reset, #96 operational recovery, and #93 Owner deletion remain separate.

Permanent evidence: `RESET_RECOVERY_V3.md`, `reset.html`, `_redirects`, `src/app/reset-entry.js`, `src/app/reset-recovery.js`, `src/features/reset-recovery/index.js`, `src/ui/reset-recovery.css`, `scripts/validate-v3-reset-recovery.mjs`, `tests/v3-reset-recovery-edge.mjs`, `tests/v3-reset-recovery-smoke.mjs`, `.github/workflows/v3-regression.yml`.

## Reproduced defects and permanent handling

- The accumulated workflow initially omitted #94 validator/edge/smoke invocation. Root cause: incomplete verification wiring; no runtime defect reproduced. Workflow wiring was corrected and candidate `b3c15b34da0958a136920dc970b24531e3e06e45` passed run `34534183203`.
- Bookkeeping run `34535009560` then exposed a stale #93 architecture-validator assertion that required #94's inventory row to remain `Not started`. Exact candidate and promoted bookkeeping assertions had passed before the architecture stage failed. This is a validator lifecycle defect, not a #94 runtime regression. The assertion is corrected without weakening #93/#94 ownership or lifecycle validity checks; the resulting new bookkeeping SHA must be reverified from scratch.

## Next capability boundary

#42 Same-room Play Together is next after v3.65 freeze. Acceptance: **2–6 players; rotating turns; scoreboard; finish**. Recover retained behavior and current Games ownership before coding. Do not absorb #43 Live Rooms. #15 and Kids #38–40 remain deferred.

## Exact next executable sequence

1. Resolve the corrected live `feature/v3-reset-recovery` tip after the stale validator fix and use that exact SHA as a new bookkeeping candidate.
2. Run isolated exact-SHA complete bookkeeping gate; do not transfer any PASS from `3f3d6dec...`.
3. On green, reset/remove temporary verifier state and freeze `release/v3.65-reset-recovery` at that exact successful bookkeeping SHA.
4. Verify release/product refs equal it.
5. Branch #42 from frozen v3.65; recover retained contract/owners/tests, then implement and verify.

## Non-negotiable safety

Rebuild-and-verify; one owner per responsibility; no PASS transfer across changed SHAs; no production or `main` mutation without explicit authorization.
