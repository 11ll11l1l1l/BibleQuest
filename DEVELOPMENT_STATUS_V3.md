# BibleQuest v3 Development Status

Updated: 2026-09-10 JST

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity ledger. `TIMELINE_V3.md` retains release history. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase and production Cloudflare remain untouched.
- Development branch: `feature/v3-leaderboards`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary `push:` triggers are permitted only on isolated one-shot verification branches; trigger commits are never release candidates and verification branches are reset to the exact clean candidate after each run.
- Latest frozen checkpoint: `release/v3.43-trusted-score-events` at `80d01efa06f3ff08a0284389cf027d16afd35225`.
- Exact v3.43 bookkeeping run `34407984154` passed the complete accumulated suite against that SHA before freeze.

## Current progress

Inventory state after the complete #71 Leaderboards functional gate:

| State | Count |
|---|---:|
| Regression-tested | 70 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 29 |
| Total | 100 |

Strict implemented-or-better parity is **71/100**.

Official regression stability is **70/100**.

Current leading rows:
- #68 Presence — Regression-tested; frozen in v3.41.
- #69 Team Center — Regression-tested; frozen in v3.42.
- #70 Trusted score events — Regression-tested after surviving the complete #71 suite; frozen in v3.43.
- #71 Leaderboards — Verified by exact functional candidate `08345c522c007679915d9a072db8cbd81fdd4eec` in run `34411253995`.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

## Current architecture boundary

- `src/core/storage.js` — sole direct browser local-storage owner.
- `src/core/api.js` — sole browser Supabase/trusted-function boundary.
- `src/app/congregation-membership.js` — congregation membership and client capability boundary.
- `src/app/presence.js` — sole Presence lifecycle owner.
- `src/app/team-center.js` — sole Team Center scope/roster/management orchestration owner.
- `src/app/trusted-score-events.js` — sole #70 client score-event normalization/scope/stable-ID owner.
- `supabase/functions/bq-score/index.ts` — retained trusted server scoring authority.
- `src/app/leaderboards.js` — sole #71 period/lane normalization and ranking-projection owner.
- `src/features/leaderboards/index.js` — #71 presentation only.
- Existing Router, Session, Reader, Progress, Lesson, Transform, Audio, Recordings, Games, Notes, Couples, Journey Group, Community and diagnostics owners remain unchanged.

#71 is read-only. It consumes the retained `public.bible_leaderboard(uuid,timestamptz)` aggregate and the active congregation directory through `src/core/api.js`; it does not calculate trusted score awards, mutate score rows, own XP/badges, or implement #72 Congregation recognition.

Recovered Leaderboards parity:
- Today / This Week / All Time.
- Overall, Knowledge, Reading, Wisdom, Mastery, Consistency, Group and Couples lanes.
- trusted points descending, deterministic display-name/user tie-break.
- active congregation members remain visible at zero points.
- former/out-of-scope identities are not exposed.
- congregation IANA timezone owns Today and Monday-week boundaries when present; browser local timezone is fallback only.
- guest, signed-out and local-preview cloud reads fail closed.
- permanent architecture, edge and 390px browser/mobile regression coverage is part of the accumulated workflow.

## #70 Trusted score events — Regression-tested

- Corrected functional candidate `7d3cc6354ac5ff2b40004f6d66b32c5740c20b3b` passed run `34407306308`.
- Exact bookkeeping candidate `80d01efa06f3ff08a0284389cf027d16afd35225` passed run `34407984154` and is frozen as `release/v3.43-trusted-score-events`.
- #70 survived the complete #71 functional suite and therefore advanced to Regression-tested.

## #71 Leaderboards — Verified

- Initial candidate `4286669555e8a1ce7faf59a9d74f28c920d9ca06` exposed a brittle #70 validator assumption requiring adjacent API export text. The validator was corrected to validate the exports structurally without weakening #70 ownership/security checks.
- Candidate `d44479b4543a4e56f7507c8836245a918e1c3b57` exposed a real timezone defect: week/today boundaries depended on the CI machine timezone.
- Root cause was removed from `src/app/leaderboards.js`; period boundaries now use the congregation's IANA timezone and permanent tests cover Asia/Tokyo and America/New_York.
- Corrected exact functional candidate `08345c522c007679915d9a072db8cbd81fdd4eec` passed every accumulated architecture, edge and Playwright/mobile regression in run `34411253995`.
- The isolated functional verification branch was reset to the exact clean candidate after the successful run.
- #71 remains Verified until its documentation/bookkeeping candidate independently passes the same complete suite and is frozen as v3.44.

## Defect / root-cause ledger additions

- `V3-LEADERBOARDS-VALIDATOR-001` — a #70 validator encoded meaningless API-export adjacency; it now checks the existing exported boundaries structurally.
- `V3-LEADERBOARDS-TIMEZONE-001` — leaderboard date cutoffs used the executing machine timezone; the owner now calculates congregation-calendar midnight from an IANA timezone and regression coverage verifies multiple zones.

All earlier defect regressions remain in the accumulated suite.

## Next major milestone

1. Run the exact #71 promotion/bookkeeping candidate through the complete accumulated architecture, edge and browser/mobile suite.
2. If green, reset the isolated bookkeeping verification branch to the exact clean candidate.
3. Freeze that exact SHA as `release/v3.44-leaderboards`.
4. Only after the freeze, create `feature/v3-congregation-recognition` and recover #72 load/award/display/permission contracts before implementation.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase and production Cloudflare remain unchanged throughout the rebuild.
