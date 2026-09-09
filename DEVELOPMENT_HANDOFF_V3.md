# BibleQuest v3 continuation handoff

Updated: 2026-09-10 JST

This file is the durable restart point if a chat or usage window ends. GitHub is authoritative; reconcile remote branches and workflow runs before changing code.

## Repository and immutable checkpoints

- Repository: `11ll11l1l1l/BibleQuest`
- Latest frozen base: `release/v3.44-leaderboards`
- Frozen base SHA: `b14415bb9b59c1eed109f02a822a48298844f8d1`
- Exact v3.44 bookkeeping run: `34412074523` (complete accumulated suite green against the frozen SHA)
- Active remote branch: `feature/v3-congregation-recognition`
- Exact #72 functional candidate: `516d2f2da33d73aea076b9cdd35225b8e68c0a27`
- Exact #72 functional run: `34414579164` (architecture, edge and browser/mobile all green against that exact SHA)
- Separate production-v2 safety PR: `#88` — stale-device progress conflict protection into `main`; draft and unmerged

## Current authoritative inventory

- Regression-tested: 71, including #71 Leaderboards after surviving the complete #72 suite.
- Verified: 1 (#72 Congregation Recognition).
- Implemented: 0.
- Not started: 28.
- Strict implemented-or-better parity: 72/100.
- Official regression stability: 71/100.
- Deferred by user priority: #15 Japanese furigana and Kids #38–40.

## #71 Leaderboards checkpoint

- `src/app/leaderboards.js` is the sole v3 period/lane normalization and ranking-projection owner.
- `src/core/api.js` remains the sole browser Supabase boundary and consumes the retained `public.bible_leaderboard(uuid,timestamptz)` aggregate plus the active congregation directory.
- Today / This Week / All Time and the eight recovered lanes remain verified.
- Period cutoffs use the active congregation IANA timezone when present, with browser-local timezone only as fallback.
- Corrected exact functional candidate `08345c522c007679915d9a072db8cbd81fdd4eec` passed run `34411253995`.
- Exact bookkeeping candidate `b14415bb9b59c1eed109f02a822a48298844f8d1` passed run `34412074523` and is frozen as `release/v3.44-leaderboards`.
- #71 is now Regression-tested because it survived the complete #72 functional suite.

## #72 Congregation Recognition checkpoint

- Retained `congregation-recognition.js` plus the later leader-dashboard role/privacy hardening were recovered before implementation instead of guessing behavior.
- `src/app/congregation-recognition.js` is the sole v3 client owner for recognition normalization, congregation scope, active-target validation, the nine retained presets and client-side award permission checks.
- `src/features/congregation-recognition/index.js` is presentation-only and is reached through the existing Community route.
- `src/core/api.js` remains the sole browser Supabase boundary. It reads active congregation directory rows, visible `bible_member_recognitions`, congregation `bible_user_badges`, active `bible_badge_catalog`, and performs the bounded recognition insert.
- Persisted special recognition is limited to `leader`, `pastor` and `admin`; `facilitator` is deliberately view-only. Existing Supabase RLS independently enforces the same authority and active-target membership.
- All active congregation members may view visible recognition and earned congregation badges allowed by existing RLS.
- Awards target only active members of the selected congregation and support the retained nine presets plus bounded optional custom title/note.
- #72 does not own trusted score-event calculation, leaderboard ranking, local XP, private study notes, Couple Journey data or credentials.
- Permanent architecture, edge and 390px browser/mobile regressions are accumulated in `.github/workflows/v3-regression.yml`.
- Exact functional candidate `516d2f2da33d73aea076b9cdd35225b8e68c0a27` passed the complete accumulated architecture, edge and Playwright/mobile suite in run `34414579164`.
- The isolated functional verification branch was reset from its temporary trigger commit to the exact clean candidate after success.
- No production Supabase migration/function, Cloudflare, v2 or `main` change was made for #72.

## Exact next sequence

1. Complete only the #72 promotion/bookkeeping documentation on `feature/v3-congregation-recognition`.
2. Create/reset isolated `verify/v3.45-congregation-recognition-bookkeeping` from the exact clean bookkeeping candidate.
3. Add only the temporary one-shot trigger needed to execute the manual-only workflow, explicitly checking out/asserting that clean bookkeeping SHA.
4. Require the complete accumulated architecture, edge and Playwright/browser-mobile suite to pass against that exact SHA.
5. Reset the bookkeeping verification branch to the exact clean candidate and freeze `release/v3.45-congregation-recognition` at that same SHA.
6. Only after the freeze, create `feature/v3-assignments` from v3.45 and recover #73 Assignments receive/open/complete/status-sync contracts before implementation.

Production deployment remains out of scope during rebuild verification. Do not deploy pending migrations or functions merely to satisfy parity testing.

## Non-negotiable continuation rules

- Rebuild-and-verify; no patch accumulation.
- One owner/source of truth per responsibility.
- Run the complete accumulated regression suite after every milestone.
- Normal Actions stays `workflow_dispatch`-only; temporary push triggers belong only on isolated one-shot verification branches and never become release candidates.
- Never modify production v2, `main`, production Cloudflare or production Supabase during the rebuild without explicit approval.
- Never start implementation of the next feature before the current functional and bookkeeping/release gates close.
