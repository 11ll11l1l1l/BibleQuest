# A2 contract report — #42 Same-room Play Together

Agent: `BQ-A2-CONTRACT`
Inspection date: 2026-09-11 JST

## Exact state inspected

- Canonical: `feature/v3-same-room-play-together` @ `3d0d3591e10abc45cb24687a6ecd32ca4951bd4d`.
- Canonical parent / frozen base: `release/v3.65-reset-recovery` @ `ab3584906b3d017ea555416910f23e9414ed2ef8`.
- Expected A1 quarantine candidate `agent/a1-work/042-*`: **not found** during this inspection.
- Actions runs on `feature/v3-same-room-play-together`: **none found** at inspection time.
- Authoritative inventory at canonical SHA still records #42 `Same-room Play Together` as `Not started` with acceptance `2–6 players; rotating turns; scoreboard; finish`; #43 `Live Rooms` is a distinct `Not started` milestone with `create/join/leave; reconnect; no stale room state`.

## Primary evidence inspected before TRIAGE

- `FEATURE_INVENTORY_V3.md` @ `3d0d3591...`, rows #38–49.
- `DEVELOPMENT_HANDOFF_V3.md` @ `3d0d3591...`.
- Retained `classic.html` @ `3d0d3591...`, which loads `group-play.js` and separately loads `live-rooms.js`.
- Retained `group-play.js` @ `3d0d3591...`.
- Canonical commit `3d0d3591...` and its patch relative to frozen `ab358490...`.
- `src/app/games.js` ownership change represented by canonical commit `3d0d3591...`.
- `tests/v3-games-edge.mjs` @ `3d0d3591...`.
- `.github/workflows/v3-regression.yml` @ `3d0d3591...`.
- GitHub Actions branch-run query for `feature/v3-same-room-play-together`.
- Only after provisional findings were formed: `automation/TRIAGE.md` on `automation/v3-agent-control`.

## FACT — recovered product contract

1. The authoritative #42 contract is narrow: **2–6 players, rotating turns, scoreboard, finish**.
2. #42 is same-device / same-room play. Retained `group-play.js` describes Play Together as turning **one phone into a room activity**, requires at least two roster participants, and contains pass-the-phone / rotating-player behavior plus score awards and completion handling.
3. #43 Live Rooms is a separate capability. Retained `classic.html` loads `group-play.js` and `live-rooms.js` separately, and the inventory gives #43 its own network-room lifecycle contract. #42 therefore must not absorb create/join/leave, reconnect, remote synchronization, or stale-room-state responsibilities.
4. Existing v3 Games already has one verified launcher/service owner in `src/app/games.js`; `tests/v3-games-edge.mjs` explicitly asserts that `createGameLauncherService` has exactly one owner there and that the service does not own DOM/storage/backend implementations.
5. Canonical commit `3d0d3591...` changes only `src/app/games.js` relative to frozen v3.65 and adds local same-room state/actions: limits 2–6, player score state, rotating `currentPlayerIndex`, answer locking, next-turn progression, finish state, reset, and launcher teardown reset. This is compatible with the existing Games service ownership rather than creating a second service owner.
6. The canonical change currently creates default labels `Player 1` … `Player N`. The narrow inventory contract does not require custom names, roster/cloud persistence, XP, remote multiplayer, or retained secondary group activities such as Conversation Circle, Verse Hunt, Pair & Share, Couples Growth, or a persistent group leaderboard. Those must not be invented as #42 requirements without new authoritative evidence.
7. Inventory at exact canonical SHA still says #42 `Not started`; no bookkeeping promotion has occurred.

## FACT — current verification state

1. No `agent/a1-work/042-*` candidate was found.
2. No GitHub Actions run was found for `feature/v3-same-room-play-together`, so there is no exact-SHA functional PASS for `3d0d3591...`.
3. The permanent accumulated workflow at `3d0d3591...` contains all prior v3.65 architecture, edge/security and browser/mobile lists, but has **no #42-specific validator, edge regression, or browser/mobile smoke invocation**.
4. Existing `tests/v3-games-edge.mjs` does not call `startSameRoom`, `answerSameRoom`, `nextSameRoom`, `finishSameRoom`, or `resetSameRoom`; therefore the newly added #42 state transitions are not covered by that retained test at this SHA.

## INFERENCE

- `src/app/games.js` is the correct service/state owner for the narrow #42 game lifecycle because it is already the verified single owner for Games and the canonical implementation extends it without adding DOM/network/storage authority. UI ownership is not yet established by the canonical commit and should be recovered/implemented without creating a competing game service owner.
- A minimal faithful #42 implementation should expose the exact contract through the existing Games surface: select 2–6 local players, visibly identify the active rotating turn, answer once per turn, show per-player score, advance deterministically, reach a complete/final scoreboard state, and leave/reset cleanly. This is an inference from the inventory plus retained same-room behavior, not permission to reproduce every feature in old `group-play.js`.

## RECOMMENDATION

- Keep #42 bounded to local same-room play and preserve #43 Live Rooms as a separate milestone.
- Before #42 can be promoted, add meaningful permanent tests for the recovered contract and ensure the exact accumulated workflow actually invokes them. At minimum verify lower/upper player limits and invalid counts, deterministic rotating turns, correct/incorrect score behavior, duplicate-answer locking, final scoreboard/finish, and teardown/reset; browser/mobile evidence should verify the usable same-room surface and active-turn/score presentation.
- Do not treat prior v3.65 green evidence as evidence for `3d0d3591...`; this SHA requires its own accumulated execution.

## Missing evidence / open contract questions

- No exact #42 candidate or exact functional run exists yet.
- No #42-specific permanent tests/workflow wiring exist at the inspected SHA.
- The canonical commit contains service/state implementation only; no primary evidence yet establishes the final v3 UI owner or proves end-to-end rendered parity.
- The inventory says 2–6 players, but retained `group-play.js` itself visibly proves only a minimum roster of two in the inspected source excerpt. The upper bound of six is therefore authoritative from the inventory/handoff contract, not independently inferred from retained runtime code.

## TRIAGE comparison — read after independent findings

`automation/TRIAGE.md` is now SHA-stale regarding repository movement: it states that no `feature/v3-same*` branch was found and defers #42, while canonical `feature/v3-same-room-play-together` now exists at `3d0d3591...` with a product change. Its underlying firewall instruction remains a separate governance decision and is not contract evidence. This A2 report does **not** authorize further product work or promotion.

## Staleness conditions

This report becomes stale immediately if any of the following changes: `feature/v3-same-room-play-together` HEAD; appearance or movement of an `agent/a1-work/042-*` candidate; latest frozen release; inventory row #42/#43; `src/app/games.js` or the same-room UI owner; #42 validators/tests/workflow wiring; exact Actions evidence; or authoritative retained-contract evidence.