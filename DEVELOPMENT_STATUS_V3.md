# BibleQuest v3 Development Status

Updated: 2026-09-11 JST during #94 Reset/recovery bookkeeping verification.

`FEATURE_INVENTORY_V3.md` is authoritative. Live GitHub refs and executed Actions evidence supersede stale text.

## Deployment safety

- Latest frozen release: `release/v3.64-admin-operations` at `56fe2469f9c27e925b92afa9b07d7c12998bb7b7`; bookkeeping run `34532823188` passed.
- Active branch: `feature/v3-reset-recovery`.
- #94 green functional candidate: `b3c15b34da0958a136920dc970b24531e3e06e45`; complete run `34534183203` passed.
- First #94 bookkeeping candidate: `3f3d6decbb1b3a236c4cbbea3301637f9dfd1c55`; bookkeeping run `34535009560` failed in accumulated architecture validation before edge/browser execution.
- `main`, production v2, Supabase/data, and Cloudflare remain untouched.
- Product regression workflow remains `workflow_dispatch` only; temporary push triggers stay isolated.

## Current bookkeeping candidate state

| State | Count |
|---|---:|
| Regression-tested | 91 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 8 |
| Total | 100 |

Strict parity is **92/100**; regression stability is **91/100**. #93 is Regression-tested; #94 is Verified. #15 and Kids #38–40 remain deferred. #42 Same-room Play Together is next after v3.65 freeze; #43 Live Rooms and #44–45 Bible World remain unfinished.

## #94 verified functional boundary

#94 restores canonical `/reset` as a standalone Account Recovery page while reusing #9 Account for the password/recovery transaction and central API for network access. Page state/rendering remain separate owners. The flow supports safe retry/cancel, replacement-code acknowledgement, secret non-persistence, and 390px mobile behavior. #100 portable reset, #96 operational recovery, and #93 Owner deletion remain separate.

## Defect / root-cause ledger

- The #94 validator found that permanent `.github/workflows/v3-regression.yml` omitted #94 validator/edge/smoke invocation. This was a verification-contract defect, not a reproduced runtime defect. The dispatch-only workflow was corrected. Exact functional candidate `b3c15b34da0958a136920dc970b24531e3e06e45` then passed full run `34534183203`.
- Bookkeeping run `34535009560` failed only in accumulated architecture validation. Exact-SHA and promoted-ledger assertions passed. Root cause: `scripts/validate-v3-admin-operations.mjs` still forced inventory #94 to the pre-milestone literal state `Not started`, even though #94 had legitimately advanced to `Verified`. This is a stale lifecycle-validator defect; no Reset Recovery runtime failure was reproduced. The validator is corrected to require the #94 row and a valid lifecycle state without pinning an obsolete state. Because this changes the bookkeeping candidate, the corrected SHA requires a fresh complete exact-SHA gate.

## Next major milestone

Run complete exact-SHA bookkeeping verification on the corrected candidate. On green, freeze `release/v3.65-reset-recovery` at that exact SHA, verify refs, then recover #42 from frozen v3.65 before implementation.

## Release rule

Never freeze an untested bookkeeping SHA. Temporary verifier commits are never release SHAs.
