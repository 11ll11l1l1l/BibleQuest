# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after #38 Kids Memory Match complete functional verification.

`FEATURE_INVENTORY_V3.md` is authoritative. Live GitHub refs and executed Actions evidence supersede stale text.

## Deployment safety

- Latest frozen release: `release/v3.69-bible-world-artwork` at `368b4e905c94ede38e733585d151891c7bdca96b`; exact bookkeeping verification run `34544649744` passed the complete accumulated suite.
- Active branch: `feature/v3-kids-memory-match`.
- #38 green functional candidate: `918762b11d3487d07880449bb37264da1e33ace3`.
- First complete #38 candidate `cebcea607c1219955583e800f18fa3ab0a18e9cf` failed run `34546689660` in the accumulated edge suite and was not promoted.
- Complete #38 functional run `34546962603`: **success** for exact SHA `918762b11d3487d07880449bb37264da1e33ace3` across accumulated architecture, edge/security, and browser/mobile suites.
- `main`, production v2, Supabase/data, and Cloudflare remain untouched.
- Product regression workflow remains `workflow_dispatch` only; temporary push triggers stay isolated on verifier branches and are reset after use.

## Current promoted state

| State | Count |
|---|---:|
| Regression-tested | 96 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 3 |
| Total | 100 |

Strict parity is **97/100**; regression stability is **96/100**. #45 Bible World artwork is now Regression-tested because it survived the complete #38 functional gate; #38 Kids Memory Match is Verified. #15 Japanese furigana and #40 Kids Bible Who Am I remain reopened. #39 Hiragana Match remains explicitly deferred.

## #38 verified functional boundary

#38 restores the retained kids Memory Meadow under the existing Games owner without adding a second game, score, or persistence owner. The clean mode uses 6 pairs / 12 cards / 3 columns below 420px and 8 pairs / 16 cards / 4 columns at 420px and above. A first flip remains open; the second flip locks the board until resolution. Matching pairs resolve after 350 ms and mismatches after 650 ms. Duplicate/open-card flips are ignored safely, stale resolution tokens cannot mutate a later state, replay creates a new round identity, and leave resets the game.

The reward curve is deterministic: `stars = clamp(6 - floor(moves / 4), 2, 5)` and coins are `stars * 4`. Completion is recorded through the existing Progress owner with `xp: 0`; Memory Meadow does not award XP. Current star/coin balances are read from Progress at launch/completion, and the game does not create separate reward persistence.

Permanent evidence: `src/features/games/memory.js`, `src/app/kids-memory.js`, `src/app/games.js`, `src/core/progress.js`, `src/features/games/index.js`, `src/ui/games.css`, `scripts/validate-v3-kids-memory.mjs`, the `tests/v3-kids-memory-*` regressions, `tests/v3-progress-edge.mjs`, and `.github/workflows/v3-regression.yml`.

## Defect / root-cause ledger

- #45 bookkeeping candidate `368b4e905c94ede38e733585d151891c7bdca96b` passed exact-SHA complete run `34544649744`; `release/v3.69-bible-world-artwork` was frozen at that clean SHA.
- #38 first complete candidate `cebcea607c1219955583e800f18fa3ab0a18e9cf` failed exact-SHA run `34546689660`. Root cause: `createKidsMemoryGame` required both Progress recording and balance-state capability during `createGameLauncherService` construction. Existing Content Moderation regression legitimately constructs the Games owner with only the Progress capability needed by that path, so the new eager `getState` requirement broke an already verified owner boundary before Memory Meadow was launched.
- Runtime correction `b29e1166a84f4609a818724f62afaa51ec49de25` kept Progress recording required for Memory Meadow but deferred balance-state validation/read until `start()`. This restores constructor compatibility without weakening Memory Meadow's launch requirements. The accumulated Content Moderation regression is retained as permanent cross-feature protection.
- Final clean candidate `918762b11d3487d07880449bb37264da1e33ace3` passed complete functional run `34546962603`. Temporary verifier commits are not candidates and are not release SHAs.

## Next major milestone

Create one #38 bookkeeping candidate from this promoted ledger, run a fresh complete exact-SHA bookkeeping gate, and on green freeze `release/v3.70-kids-memory-match` at that exact bookkeeping SHA. During the gate, read-only recover the remaining #40/#15 contracts and select the next dependency-safe capability from the frozen v3.70 baseline. #39 stays deferred.

## Release rule

Never freeze an untested bookkeeping SHA. Temporary verifier commits are never release SHAs.