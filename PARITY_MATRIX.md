# BibleQuest v3 Feature Parity Matrix

The previous matrix treated **Clean**, **Standalone**, and **Compatibility** access as feature-surface parity. That definition is retired because it could call a feature complete without verifying its real workflow.

The authoritative audit is now [`FEATURE_INVENTORY_V3.md`](FEATURE_INVENTORY_V3.md), containing 100 old-version capability rows and only four allowed implementation states:

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
- A verified feature becomes **Regression-tested** only after at least one later feature milestone also passes the full suite.
- BibleQuest v3 reaches 100% feature parity only when every applicable inventory row is **Verified** or **Regression-tested**.

## Current audit result

At the start of v3, the old/current application still supplies the behavioral and visual reference set, but most capabilities are intentionally reset to **Not started** for the clean architecture.

The v3 foundation milestone currently implements only:

- application shell
- primary navigation
- mobile shell/layout
- global application state owner
- storage boundary

These remain **Implemented**, not Verified, until the foundation browser regression passes.

All other old-version capabilities remain explicitly tracked in `FEATURE_INVENTORY_V3.md` and will be migrated in the ordered architecture plan in `ARCHITECTURE_V3.md`.
