# BibleQuest v3 Feature Parity Matrix

The authoritative audit is [`FEATURE_INVENTORY_V3.md`](FEATURE_INVENTORY_V3.md), containing 100 old-version capability rows and only four allowed implementation states:

1. **Not started**
2. **Implemented**
3. **Verified**
4. **Regression-tested**

## Completion rules

- An old script still existing in the repository is not parity.
- `classic.html` access is not parity.
- A standalone old page is not parity.
- A page rendering without completing its workflow is not verification.
- A feature becomes **Verified** only after its complete acceptance workflow passes the v3 browser regression suite.
- A verified feature becomes **Regression-tested** only after at least one later feature milestone also passes the full accumulated suite.
- BibleQuest v3 reaches 100% feature parity only when every applicable inventory row is **Verified** or **Regression-tested**.

## Current audit result

After the #66 Congregation membership/roles functional gate:

| State | Count |
|---|---:|
| Regression-tested | 55 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 44 |
| Total | 100 |

Strict verified-or-better parity is **56/100**.

Official regression stability is **55/100**. #56 Cloud Notes advanced to **Regression-tested** after the later #66 full functional suite remained green. #66 is correctly held at **Verified** until a later feature milestone runs the entire accumulated suite with Congregation Membership still green.

#55 Private local notes is frozen at `release/v3.27-private-local-notes` (`e8b58b1bd9c9053243bb5d394c2d2afae44c9f59`; bookkeeping run `34169778300`).

#56 Cloud Notes is frozen at `release/v3.28-cloud-notes` (`1b8cb0a4847b1fc633ce23412982c91c38825148`; functional run `34183773524`; bookkeeping run `34184699391`).

#66 Congregation membership/roles passed its exact functional candidate `87ed099fb9b0a18f0f5b85b9476a16af6bbb5349` on full-suite run `34185569051`. Its independent v3.29 bookkeeping/release gate remains pending.
