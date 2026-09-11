# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after #38 Kids Memory Match complete functional verification.

Live GitHub refs and exact executed evidence are authoritative; recover them first.

## Frozen baseline

- Repo: `11ll11l1l1l/BibleQuest`.
- Latest frozen: `release/v3.69-bible-world-artwork` at `368b4e905c94ede38e733585d151891c7bdca96b`.
- v3.69 exact bookkeeping verification run `34544649744`: **success**.
- `main`, production v2, Cloudflare, data, and Supabase remain untouched.
- Normal v3 Actions are dispatch-only; temporary push triggers stay isolated and are reset after use.

## Current #38 state

- Active branch: `feature/v3-kids-memory-match`.
- Green functional candidate: `918762b11d3487d07880449bb37264da1e33ace3`.
- First full candidate `cebcea607c1219955583e800f18fa3ab0a18e9cf` failed exact-SHA run `34546689660` in accumulated edge regression because the Memory Meadow adapter eagerly required Progress balance state during Games construction.
- Corrected final candidate `918762b11d3487d07880449bb37264da1e33ace3` passed complete functional run `34546962603` across accumulated architecture, edge/security, and browser/mobile suites.
- Promoted state: **96 Regression-tested / 1 Verified / 0 Implemented / 3 Not started**; strict parity **97/100**, regression stability **96/100**.
- #45 Bible World artwork is Regression-tested; #38 Kids Memory Match is Verified.
- A fresh complete bookkeeping gate is still required on the bookkeeping candidate containing this promoted state before v3.70 can freeze.

## #38 verified boundary

Memory Meadow remains Games-owned and uses the Progress owner only for shared rewards. Below 420px it renders 6 pairs / 12 cards / 3 columns; at 420px and above it renders 8 pairs / 16 cards / 4 columns. Match and mismatch resolution delays are 350 ms and 650 ms. The board locks while a pair is pending, stale resolution tokens are ignored, replay gets a fresh round identity, and leave clears the round.

Completion awards deterministic stars and coins through Progress (`stars = clamp(6 - floor(moves / 4), 2, 5)`, coins = stars × 4) with `xp: 0`. There is no separate Memory Meadow balance store or XP award. Current balances are read only when Memory Meadow starts/completes, so unrelated Games construction does not require balance-state capability.

Permanent evidence: `src/features/games/memory.js`, `src/app/kids-memory.js`, `src/app/games.js`, `src/core/progress.js`, `src/features/games/index.js`, `src/ui/games.css`, `scripts/validate-v3-kids-memory.mjs`, `tests/v3-kids-memory-*`, `tests/v3-progress-edge.mjs`, `.github/workflows/v3-regression.yml`.

## Defect/root-cause evidence

- Failed run `34546689660` checked out and asserted exact candidate `cebcea607c1219955583e800f18fa3ab0a18e9cf`; architecture passed, then existing `tests/v3-content-moderation-edge.mjs` failed while constructing Games because Memory Meadow required `progress.getState` before launch.
- Runtime fix `b29e1166a84f4609a818724f62afaa51ec49de25` deferred that balance-state capability check/read to Memory Meadow launch. The existing Content Moderation regression remains the cross-feature regression guard.
- Final full run `34546962603` passed the complete accumulated suite on exact candidate `918762b11d3487d07880449bb37264da1e33ace3`.

## Remaining priority state

#15 Japanese furigana and #40 Kids Bible Who Am I remain reopened for development toward 100/100. #39 Hiragana Match remains explicitly deferred and must not be silently implemented. Both reopened rows still require exact retained contract recovery before code changes.

## Exact next executable sequence

1. Treat the bookkeeping commit containing this handoff/inventory/status/timeline as the new #38 bookkeeping candidate and recover its exact SHA from live `feature/v3-kids-memory-match`.
2. Create/reset an isolated bookkeeping verifier and run a fresh complete exact-SHA accumulated gate; do not transfer PASS from functional SHA `918762b...`.
3. On green, reset the verifier to the clean bookkeeping candidate and freeze `release/v3.70-kids-memory-match` at that exact SHA.
4. Verify release and product refs equal the successful bookkeeping SHA.
5. While the bookkeeping gate runs, perform only read-only contract/dependency recovery for #40 and #15.
6. Branch the next capability only from frozen v3.70 after selecting the dependency-safe row from repository evidence. Keep #39 deferred.
7. Continue focused → complete functional → promotion/bookkeeping → complete bookkeeping → freeze, then immediately continue the next reopened row.

## Non-negotiable safety

Rebuild-and-verify; one owner per responsibility; no PASS transfer across changed SHAs; no production or `main` mutation without explicit authorization. Never freeze an untested SHA.