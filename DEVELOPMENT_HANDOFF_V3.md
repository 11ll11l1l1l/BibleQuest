# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST during #42 Same-room Play Together bookkeeping verification.

Live GitHub refs and exact executed evidence are authoritative; recover them first.

## Frozen baseline

- Repo: `11ll11l1l1l/BibleQuest`.
- Latest frozen: `release/v3.65-reset-recovery` at `ab3584906b3d017ea555416910f23e9414ed2ef8`.
- v3.65 exact bookkeeping verification run `34535332838`: **success**.
- `main`, production v2, Cloudflare, data and Supabase untouched.
- Normal v3 Actions are dispatch-only; temporary push triggers stay isolated.

## Current #42 state

- Active branch: `feature/v3-same-room-play-together`.
- Green functional SHA: `22d054725ba983c4fe81fbd220688a3c12ee211c`.
- Complete functional run `34539110697`: **success** across accumulated architecture, edge and browser/mobile suites, including the dedicated #42 smoke path.
- Bookkeeping state after promotion: **92 Regression-tested / 1 Verified / 0 Implemented / 7 Not started**; strict parity **93/100**, regression stability **92/100**.
- #94 is Regression-tested; #42 is Verified. The changed bookkeeping tip requires a fresh complete exact-SHA gate before v3.66 freeze.

## #42 verified boundary

Same-room Play Together is local pass-and-play only: 2–6 players, rotating turns, visible in-session scoreboard, explicit finish, and winner/tie summary. Games remains the single service owner and the Play page delegates to it. Same-room score state is ephemeral; it does not award profile XP or persist its scoreboard. #43 Live Rooms remains a separate networking/reconnect capability.

Permanent evidence: `docs/V3_SAME_ROOM_PLAY_TOGETHER_CONTRACT.md`, `src/app/games.js`, `src/features/games/index.js`, `scripts/validate-v3-same-room-play-together.mjs`, `tests/v3-same-room-play-together-edge.mjs`, `tests/v3-same-room-play-together-smoke.mjs`, `.github/workflows/v3-regression.yml`.

## Reproduced defects and permanent handling

- Partial SHA `3d0d3591e10abc45cb24687a6ecd32ca4951bd4d` added service state without a reachable clean UI and was not promoted.
- Writer verification initially failed on a missing `docs/` directory and later on GitHub App workflow-write permission; neither was counted as product verification. The repaired writer produced the clean product patch, focused architecture/edge checks passed, and workflow wiring was committed through the connected GitHub writer.
- Candidate `22d054725ba983c4fe81fbd220688a3c12ee211c` then passed complete functional run `34539110697`.
- Lifecycle audit `34539369826` found no other #42 lifecycle pins; only the new same-room validator pinned `Not started`. That assertion is made lifecycle-tolerant for legitimate promotion without weakening capability identity or acceptance checks. The bookkeeping SHA must now pass the entire suite from scratch.

## Next capability boundary

#43 Live Rooms is next after v3.66 freeze. Recover retained create/join/leave, reconnect, and stale-room-state behavior before coding. Do not fold Live Rooms into #42. #15 and Kids #38–40 remain deferred.

## Exact next executable sequence

1. Use the promoted live `feature/v3-same-room-play-together` tip as the bookkeeping candidate.
2. Run isolated exact-SHA complete bookkeeping gate; do not transfer PASS from functional SHA `22d0547...`.
3. On green, freeze `release/v3.66-same-room-play-together` at that exact successful bookkeeping SHA.
4. Verify release/product refs equal it.
5. Branch #43 from frozen v3.66; recover retained Live Rooms contract/owners/tests, then implement and verify.

## Non-negotiable safety

Rebuild-and-verify; one owner per responsibility; no PASS transfer across changed SHAs; no production or `main` mutation without explicit authorization.
