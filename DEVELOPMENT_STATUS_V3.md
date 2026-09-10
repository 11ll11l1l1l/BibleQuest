# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after #43 Live Rooms functional verification.

`FEATURE_INVENTORY_V3.md` is authoritative. Live GitHub refs and executed Actions evidence supersede stale text.

## Deployment safety

- Latest frozen release: `release/v3.66-same-room-play-together` at `4a5f4b428d637dc5552bcd8a66d99d9c669ae4db`; exact bookkeeping verification run `34539753714` passed.
- Active branch: `feature/v3-live-rooms`.
- #43 green functional candidate: `29db077fd134aa9b3b7044e9fda7c86306cd680d`; complete run `34541326308` passed exact-SHA architecture, edge/security, and browser/mobile regressions.
- Focused #43 run `34541198770` passed syntax, architecture, and lifecycle edge checks on its exact focused candidate.
- `main`, production v2, Supabase/data, and Cloudflare remain untouched.
- Product regression workflow remains `workflow_dispatch` only; temporary push triggers stay isolated and are reset after use.

## Current promoted state

| State | Count |
|---|---:|
| Regression-tested | 93 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 6 |
| Total | 100 |

Strict parity is **94/100**; regression stability is **93/100**. #42 Same-room Play Together is now Regression-tested because it survived the complete #43 functional gate; #43 Live Rooms is Verified. #15 and Kids #38–40 remain deferred. #44 Bible World is the next dependency-safe capability; #45 Bible World artwork remains a separate milestone.

## #43 verified functional boundary

#43 restores the retained account/congregation-backed Live Rooms lifecycle without importing the legacy global runtime: ministry-capable hosts create an unended `live-room` shared session with a short code, members join by code, participant and room changes refresh through the central API realtime boundary, disconnect retains only the in-memory room identity for reconnect, reconnect reloads canonical server state and idempotently rejoins the participant, explicit Leave clears room/participant/channel state, and host End closes the server room then clears local state. Ended or missing rooms cannot be revived from stale client state.

The retained Supabase schema, realtime publication, participant hardening, and Pastor RLS parity already support the capability. No production migration or function deployment was required or performed. Legacy direct `localStorage`, direct Supabase access, `window.BQ*`, and Live Room quiz/poll/hunt/discussion scoring remain out of this milestone.

Permanent evidence: `docs/V3_LIVE_ROOMS_CONTRACT.md`, `src/app/live-rooms.js`, `src/features/live-rooms/index.js`, `src/core/api.js`, `src/app/bootstrap.js`, `src/features/community/index.js`, `scripts/validate-v3-live-rooms.mjs`, `tests/v3-live-rooms-edge.mjs`, `tests/v3-live-rooms-smoke.mjs`, `.github/workflows/v3-regression.yml`.

## Defect / root-cause ledger

- Focused lifecycle work reproduced a stale-account condition: the Live Rooms service could retain a previous authenticated user's cached congregation memberships after identity changed. Root cause was membership caching without an authenticated-user key. Permanent handling keys membership state to the current user and forces reload on identity change; the edge regression protects the account-switch case.
- The first Live Rooms architecture validator expected a bootstrap-level `liveRooms.disconnect` token even though route teardown owns disconnect and global page teardown correctly uses `liveRooms.clear`. The validator was corrected to validate the actual ownership boundary rather than force duplicate lifecycle wiring.
- Exact functional candidate `29db077fd134aa9b3b7044e9fda7c86306cd680d` passed complete run `34541326308`.

## Next major milestone

Create one bookkeeping candidate with the promotion ledger/handoff/timeline updates. Run a fresh complete exact-SHA bookkeeping gate. On green, freeze `release/v3.67-live-rooms` at that exact bookkeeping SHA, verify refs, then branch #44 Bible World from the frozen release and implement its recovered render/progress/navigation contract. Do not fold #45 artwork into #44 unless the inventory boundary requires only graceful missing-asset behavior.

## Release rule

Never freeze an untested bookkeeping SHA. Temporary verifier commits are never release SHAs.
