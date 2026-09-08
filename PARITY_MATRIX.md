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

After the corrected #63 Couples cloud functional gate:

| State | Count |
|---|---:|
| Regression-tested | 63 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 36 |
| Total | 100 |

Strict verified-or-better parity is **64/100**.

Official regression stability is **63/100**. #62 Couples/family local tools advanced to **Regression-tested** after the later #63 complete functional suite remained green. #63 is correctly held at **Verified** until a later feature milestone runs the entire accumulated suite with Couples cloud behavior still green.

Recent frozen checkpoints:
- `release/v3.29-congregation-membership` — `7bf024ba4f2b6501f6fb9e87ddc010c84426c7d1`; bookkeeping `34200768014`.
- `release/v3.30-operational-recovery` — `7ec0290a50086112210c4c301db3288b970a2cc0`; bookkeeping `34203169381`.
- `release/v3.31-client-diagnostics` — `61af8aaee121356d6ef0388130df2b545ff943d9`; bookkeeping `34208493773`.
- `release/v3.32-pwa-install` — `200d69ec37b9aba48e8b926dfef7f2a8203d4855`; bookkeeping `34213223642`.
- `release/v3.33-offline-shell` — `6c7e2e93d07def6e104e48c606dbbb3a7d3e48f7`; bookkeeping `34216091431`.
- `release/v3.34-offline-bible-packs` — `bfba29fdb500c2f8ea3f466e941f043dae908f26`; bookkeeping `34218225949`.
- `release/v3.35-backup-export-import-reset` — `cb72905992b2549d727b4e74f5887bfc53210a06`; bookkeeping `34220313765`.
- `release/v3.36-couples-family-local` — `488fea911cc432c9843a2af39480b6f2cc67711e`; bookkeeping `34236023685`.

#62 Couples/family local tools corrected functional candidate `964fde5ad3381e4fe4d571c15591040c4e55fecb` passed run `34229105566`, then exact bookkeeping SHA `488fea911cc432c9843a2af39480b6f2cc67711e` passed run `34236023685` and was frozen in v3.36.

#63 Couples cloud exact functional candidate `a7fdf3354efb688163d35fec8e2df3a93b4e9294` passed the complete accumulated architecture, edge and browser/mobile suite in run `34238007365`. It is Verified pending its independent exact v3.37 bookkeeping/release gate; #62 is Regression-tested through this later complete-suite evidence.
