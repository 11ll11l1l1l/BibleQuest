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

After the v3.27 #55 Private local notes functional gate:

| State | Count |
|---|---:|
| Regression-tested | 53 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 46 |
| Total | 100 |

Strict verified-or-better parity is **54/100**.

Official regression stability remains **53/100**. #55 is correctly held at **Verified** until a later feature milestone runs the entire accumulated suite with Private Notes still green.

#55 Private local notes passed functional run `34169365596`, including its edge regression and real 390px browser workflow for create, reload, edit, JSON export, delete, touch targets, and no horizontal overflow.

#56 Cloud notes remains **Not started** and must compose the verified local Notes owner rather than create a second note model or storage path.