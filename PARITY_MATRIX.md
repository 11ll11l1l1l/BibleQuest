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

After the corrected #100 Backup/export/import/reset functional gate:

| State | Count |
|---|---:|
| Regression-tested | 61 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 38 |
| Total | 100 |

Strict verified-or-better parity is **62/100**.

Official regression stability is **61/100**. #99 Offline opened Bible packs advanced to **Regression-tested** after the later #100 complete functional suite remained green. #100 is correctly held at **Verified** until a later feature milestone runs the entire accumulated suite with backup/export/import/reset behavior still green.

Recent frozen checkpoints:
- `release/v3.29-congregation-membership` — `7bf024ba4f2b6501f6fb9e87ddc010c84426c7d1`; bookkeeping `34200768014`.
- `release/v3.30-operational-recovery` — `7ec0290a50086112210c4c301db3288b970a2cc0`; bookkeeping `34203169381`.
- `release/v3.31-client-diagnostics` — `61af8aaee121356d6ef0388130df2b545ff943d9`; bookkeeping `34208493773`.
- `release/v3.32-pwa-install` — `200d69ec37b9aba48e8b926dfef7f2a8203d4855`; bookkeeping `34213223642`.
- `release/v3.33-offline-shell` — `6c7e2e93d07def6e104e48c606dbbb3a7d3e48f7`; bookkeeping `34216091431`.
- `release/v3.34-offline-bible-packs` — `bfba29fdb500c2f8ea3f466e941f043dae908f26`; bookkeeping `34218225949`.

#99 Offline opened Bible packs functional candidate `8eaaf4e0687cd4d10a74f00de8ffbee291fe062e` passed run `34217190770`, then exact bookkeeping SHA `bfba29fdb500c2f8ea3f466e941f043dae908f26` passed run `34218225949` and was frozen in v3.34.

#100 Backup/export/import/reset corrected exact functional candidate `f7419897af9d10af92fd2cbe22e7cfb4ddcd6215` passed the complete accumulated architecture, edge and browser/mobile suite in run `34219329591`. It is Verified pending its independent exact v3.35 bookkeeping/release gate; #99 is Regression-tested through this later complete-suite evidence.
