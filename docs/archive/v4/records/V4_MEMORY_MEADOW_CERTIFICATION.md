# BibleQuest V4 Memory Meadow / Kids Memory #38 Certification

Updated: 2026-09-12 JST

## Certified checkpoint

- Release checkpoint: `release/v4-memory-meadow`
- Exact product SHA: `c7a78d71354696130efa07e6d7f010deae7795a0`
- Full accumulated regression run: `34681411008`
- Result: **PASS**

No Memory Meadow runtime change was required for this acceptance gate. The existing implementation already matches the requested #38 behavior, and the exact product SHA passed the complete accumulated suite containing all of the dedicated Memory Meadow contracts below.

## Exact requested behavior mapping

### Mobile layout

Requested: **6 pairs / 12 cards / 3 columns**.

Evidence:
- `memoryLayout(width)` returns 6 pairs / 3 columns below 420 rendered pixels.
- `tests/v3-kids-memory-edge.mjs` explicitly checks 320px and 419px.
- `tests/v3-kids-memory-width-contract.mjs` protects the 419/420 breakpoint.
- `tests/v3-kids-memory-browser.mjs` exercises 320, 360, 390 and 412 viewports and validates the actual rendered game width, card count and column count.

### Wide layout

Requested: **8 pairs / 16 cards / 4 columns**.

Evidence:
- `memoryLayout(width)` returns 8 pairs / 4 columns at 420 rendered pixels and above.
- Edge tests explicitly validate 420px and 430px.
- Browser acceptance also covers 430px and 480px and derives the expected count from the actual rendered game width.

### Resolution timing

Requested: **350 ms correct-match delay / 650 ms mismatch delay**.

Evidence:
- `KIDS_MEMORY_DELAYS` is exactly `{match:350,mismatch:650}`.
- `tests/v3-kids-memory-delays.mjs` locks both values.
- `tests/v3-kids-memory-edge.mjs` verifies the pending resolution generated for actual match and mismatch flips uses those exact delays.

### Input locking

Requested: **input locked while a pair is resolving**.

Evidence:
- second flip sets the game state lock before returning its pending resolution;
- further flips while locked return without applying another selection;
- UI disables cards while `state.locked`, while already-open or completed cards are also non-interactive;
- stale/wrong resolution tokens cannot unlock or mutate the current round;
- replay/leave makes old delayed callbacks stale.

### Rewards

Requested: **stars + coins; no XP**.

Evidence:
- completion reward is `stars` plus `coins`, with coins equal to stars × 4;
- Memory Meadow completion records `type:'game.memory.complete'` with `xp:0` through the canonical Progress owner;
- `tests/v3-kids-memory-no-xp.mjs` explicitly protects zero XP;
- `tests/v3-kids-memory-progress-integration.mjs` completes a real round against the real Progress service and verifies XP is unchanged while stars/coins persist;
- `tests/v3-kids-memory-reward-curve.mjs` protects the star/coin reward curve;
- completion remains one meaningful activity without becoming an XP event.

## Additional retained evidence

- `tests/v3-kids-memory-architecture.mjs`
- `tests/v3-kids-memory-ui-contract.mjs`
- `tests/v3-kids-memory-progress-integration.mjs`
- `tests/v3-kids-memory-round-id.mjs`
- `tests/v3-kids-memory-exit.mjs`
- `tests/v3-kids-memory-reward-curve.mjs`
- `tests/v3-kids-memory-api-surface.mjs`
- `tests/v3-kids-memory-invalid-input.mjs`
- `tests/v3-kids-memory-immutability.mjs`
- `tests/v3-kids-memory-no-xp.mjs`
- `tests/v3-kids-memory-width-contract.mjs`
- `tests/v3-kids-memory-delays.mjs`
- `tests/v3-kids-memory-browser.mjs`

All were retained in the accumulated V4 regression workflow for the certified run.

## Artwork note

The behavioral #38 certification is intentionally separate from the V4 custom-artwork program. Newly uploaded `assets/v4/memory-meadow/*.png` files currently exist on `main`; they were not used to redefine or weaken the behavior contract. They can be integrated in a later isolated artwork tranche while preserving this certified game logic.

## Release rule

Any later Memory Meadow change that affects pair/card counts, the 420px breakpoint, delays, input lock, round identity, stale callback safety, Progress integration, stars/coins or XP behavior requires renewed exact-SHA certification.