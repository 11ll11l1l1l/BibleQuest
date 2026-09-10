# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after #94 Reset/recovery functional verification.

`FEATURE_INVENTORY_V3.md` is authoritative. Live GitHub refs and executed Actions evidence supersede stale text.

## Deployment safety

- Latest frozen release: `release/v3.64-admin-operations` at `56fe2469f9c27e925b92afa9b07d7c12998bb7b7`; bookkeeping run `34532823188` passed.
- Active branch: `feature/v3-reset-recovery`.
- #94 green functional candidate: `b3c15b34da0958a136920dc970b24531e3e06e45`; complete run `34534183203` passed.
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

The #94 validator found that permanent `.github/workflows/v3-regression.yml` omitted #94 validator/edge/smoke invocation. This was a verification-contract defect, not a reproduced runtime defect. The dispatch-only workflow was corrected. Exact candidate `b3c15b34da0958a136920dc970b24531e3e06e45` then passed full run `34534183203`.

## Next major milestone

Run complete exact-SHA bookkeeping verification. On green, freeze `release/v3.65-reset-recovery` at that bookkeeping SHA, verify refs, then recover #42 from frozen v3.65 before implementation.

## Release rule

Never freeze an untested bookkeeping SHA. Temporary verifier commits are never release SHAs.
