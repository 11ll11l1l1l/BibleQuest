# BibleQuest v3 Development Status

Updated: 2026-09-11 JST during #42 Same-room Play Together bookkeeping verification.

`FEATURE_INVENTORY_V3.md` is authoritative. Live GitHub refs and executed Actions evidence supersede stale text.

## Deployment safety

- Latest frozen release: `release/v3.65-reset-recovery` at `ab3584906b3d017ea555416910f23e9414ed2ef8`; exact bookkeeping verification run `34535332838` passed.
- Active branch: `feature/v3-same-room-play-together`.
- #42 green functional candidate: `22d054725ba983c4fe81fbd220688a3c12ee211c`; complete run `34539110697` passed architecture, edge, and browser/mobile regressions.
- `main`, production v2, Supabase/data, and Cloudflare remain untouched.
- Product regression workflow remains `workflow_dispatch` only; temporary push triggers stay isolated.

## Current bookkeeping candidate state

| State | Count |
|---|---:|
| Regression-tested | 92 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 7 |
| Total | 100 |

Strict parity is **93/100**; regression stability is **92/100**. #94 is now Regression-tested because it survived the complete #42 functional gate; #42 is Verified. #15 and Kids #38–40 remain deferred. #43 Live Rooms is next; #44–45 Bible World remain unfinished.

## #42 verified functional boundary

#42 restores same-device pass-and-play for 2–6 players inside the clean Games owner. It provides player-count setup, rotating turns, an in-session scoreboard, explicit finish, and a final winner/tie result. Same-room score state is ephemeral and does not award profile XP or write persistence. #43 Live Rooms remains separate and is not absorbed by this milestone.

Permanent evidence: `docs/V3_SAME_ROOM_PLAY_TOGETHER_CONTRACT.md`, `src/app/games.js`, `src/features/games/index.js`, `scripts/validate-v3-same-room-play-together.mjs`, `tests/v3-same-room-play-together-edge.mjs`, `tests/v3-same-room-play-together-smoke.mjs`, `.github/workflows/v3-regression.yml`.

## Defect / root-cause ledger

- The first partial #42 feature commit exposed service methods but no reachable Play-page UI or permanent regression wiring, so it was rejected as a promotion candidate.
- The first isolated writer failed because it assumed `docs/` already existed; after correction, the product patch passed focused architecture/edge checks. Its initial push then hit GitHub App workflow-write restrictions. Product files were pushed separately and the permanent manual regression workflow was updated through the connected GitHub writer.
- Exact functional candidate `22d054725ba983c4fe81fbd220688a3c12ee211c` passed complete run `34539110697`.
- Lifecycle audit run `34539369826` found one promotion pin: the new #42 validator required literal `Not started`. It is corrected to accept valid lifecycle states while retaining exact row identity and acceptance text. Because bookkeeping changes the SHA, the resulting candidate requires a fresh complete exact-SHA gate.

## Next major milestone

Run complete exact-SHA bookkeeping verification. On green, freeze `release/v3.66-same-room-play-together` at that exact successful bookkeeping SHA, verify refs, then recover #43 Live Rooms from retained behavior before implementation.

## Release rule

Never freeze an untested bookkeeping SHA. Temporary verifier commits are never release SHAs.
