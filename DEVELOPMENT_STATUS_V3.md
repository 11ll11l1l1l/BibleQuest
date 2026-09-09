# BibleQuest v3 Development Status

Updated: 2026-09-10 JST

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. `TIMELINE_V3.md` retains release history. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase and production Cloudflare remain untouched.
- Development branch: `feature/v3-congregation-recognition`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary `push:` triggers are permitted only on isolated one-shot verification branches; trigger commits are never release candidates and verification branches are reset to the exact clean candidate after each run.
- Latest frozen checkpoint: `release/v3.44-leaderboards` at `b14415bb9b59c1eed109f02a822a48298844f8d1`.
- Exact v3.44 bookkeeping run `34412074523` passed the complete accumulated suite against that SHA before freeze.

## Current progress

Inventory state after the complete #72 Congregation Recognition functional gate:

| State | Count |
|---|---:|
| Regression-tested | 71 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 28 |
| Total | 100 |

Strict implemented-or-better parity is **72/100**.

Official regression stability is **71/100**.

Current leading rows:
- #69 Team Center — Regression-tested; frozen in v3.42.
- #70 Trusted score events — Regression-tested; frozen in v3.43.
- #71 Leaderboards — Regression-tested after surviving the complete #72 suite; frozen in v3.44.
- #72 Congregation Recognition — Verified by exact functional candidate `516d2f2da33d73aea076b9cdd35225b8e68c0a27` in run `34414579164`.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

## Current architecture boundary

`ARCHITECTURE_V3.md` remains the detailed foundational architecture contract, but its final narrative progress snapshot is historical and still describes the v3.40 checkpoint. Do not use that trailing snapshot as the current progress ledger. Current milestone state and post-v3.40 owner additions are authoritative in `FEATURE_INVENTORY_V3.md`, this status file, `DEVELOPMENT_HANDOFF_V3.md`, `TIMELINE_V3.md`, the milestone-specific contracts, and their accumulated architecture validators. The detailed architecture file will be safely reconciled as a whole during the full old-vs-new audit rather than risk truncating its retained contract through a full-file-only editing surface.

- `src/core/storage.js` — sole direct browser local-storage owner.
- `src/core/api.js` — sole browser Supabase/trusted-function boundary.
- `src/app/congregation-membership.js` — congregation membership and client capability boundary.
- `src/app/trusted-score-events.js` — sole #70 client score-event normalization/scope/stable-ID owner.
- `src/app/leaderboards.js` — sole #71 period/lane normalization and ranking-projection owner.
- `src/app/congregation-recognition.js` — sole #72 client recognition normalization, congregation scope, preset and award-permission owner.
- `src/features/congregation-recognition/index.js` — #72 presentation only.
- Existing Router, Session, Reader, Progress, Lesson, Transform, Audio, Recordings, Games, Notes, Couples, Journey Group, Community and diagnostics owners remain unchanged.

Recovered #72 behavior:
- active congregation members can view visible persisted recognition and earned congregation badges;
- persisted special recognition can be created only by `leader`, `pastor` and `admin` roles;
- `facilitator` remains view-only for persisted recognition;
- award targets must be active members of the selected congregation;
- nine retained recognition presets are supported, with optional bounded custom title/note;
- browser-side checks are fail-closed, while existing Supabase RLS remains the independent final authorization boundary;
- #72 does not own score calculation, leaderboard ranking, XP, private notes, Couple Journey data or account credentials;
- permanent architecture, edge and 390px browser/mobile coverage is accumulated in the normal workflow.

## #71 Leaderboards — Regression-tested

- Corrected exact functional candidate `08345c522c007679915d9a072db8cbd81fdd4eec` passed run `34411253995`.
- Exact v3.44 bookkeeping candidate `b14415bb9b59c1eed109f02a822a48298844f8d1` passed run `34412074523` and is frozen as `release/v3.44-leaderboards`.
- #71 survived the complete #72 functional suite and therefore advanced to Regression-tested.

## #72 Congregation Recognition — Verified

- Retained old recognition and later privacy/role hardening were recovered before implementation.
- Live read-only schema/RLS inspection confirmed visible congregation reads and persisted award authority for `leader`, `pastor` and `admin` only.
- Clean v3 composition uses `src/app/congregation-recognition.js`, `src/features/congregation-recognition/index.js` and the existing central `src/core/api.js`; no production migration or new backend function was introduced.
- Exact functional candidate `516d2f2da33d73aea076b9cdd35225b8e68c0a27` passed every accumulated architecture, edge and Playwright/mobile regression in run `34414579164`.
- The isolated functional verification branch was reset from its temporary trigger commit to the exact clean candidate after success.
- #72 remains Verified until its documentation/bookkeeping candidate independently passes the same complete suite and is frozen as v3.45.

## Defect / root-cause ledger

- `V3-LEADERBOARDS-VALIDATOR-001` — a #70 validator encoded meaningless API-export adjacency; it was corrected to verify exported boundaries structurally without weakening ownership/security checks.
- `V3-LEADERBOARDS-TIMEZONE-001` — leaderboard period cutoffs depended on the executing machine timezone; the owner now calculates congregation-calendar boundaries from the congregation IANA timezone with permanent multi-zone regression coverage.
- No new application defect was exposed during the #72 functional gate; the exact #72 candidate passed its first complete accumulated run.

All earlier defect regressions remain in the accumulated suite.

## Next major milestone

1. Run the exact clean #72 promotion/bookkeeping candidate through the complete accumulated architecture, edge and browser/mobile suite on an isolated one-shot verification branch.
2. If green, reset that branch to the exact clean candidate and freeze `release/v3.45-congregation-recognition` at the same SHA.
3. Only after v3.45 is frozen, create `feature/v3-assignments` and recover #73 receive/open/complete/status-sync contracts before implementation.
4. Reconcile the full `ARCHITECTURE_V3.md` narrative safely during the later full old-vs-new audit; do not use its stale v3.40 tail as current bookkeeping.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase and production Cloudflare remain unchanged throughout the rebuild.
