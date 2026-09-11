# BibleQuest v3 Development Status

Updated: 2026-09-12 JST after Ministry Hub Calendar promotion and Visual Phase B More-hub icon promotion.

## Current release truth

- current `main` / exact-green product SHA: `046e2a85cafe10d722d03d467d3733eddfeb6e65`
- current product release ref: `release/v3-phase-b-more-icons-20260912`
- current accumulated verifier: run `34618963635` — **success** on exact synthetic merge SHA `046e2a85cafe10d722d03d467d3733eddfeb6e65`
- parent exact-green product: Ministry Hub Calendar surface `350cb1e583b207e10ba8dc50c3bb683dc50f9494`
- Calendar surface release ref: `release/v3-ministry-calendar-surface-20260912`
- Calendar surface verifier: run `34616603649` — **success**
- prior cumulative release/product checkpoint: `cf17f36f9f041aee4715271eaebbe8581fc2c067`
- previous production rollback/reference remains `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

`main` was fast-forwarded directly to each exact green merge candidate after verification, so no extra unverified promotion SHA was created.

## Deployment state

Cloudflare Pages check runs for exact current product `046e2a85...` report **success** for both configured projects:

- `mybiblequest` — deployed exact commit `046e2a8`;
- `biblequest` / `biblequest-7th` — deployed exact commit `046e2a8`.

These provider deployment checks prove the build/deploy jobs accepted the exact commit. They do **not** replace a separate independent byte-for-byte/live-browser production verification. The last fully independent two-host production verifier remains run `34612873935` for the earlier cumulative release.

## Newly completed product work

### Ministry Hub Calendar surface

Exact-green `350cb1e...` adds Calendar to the verified Ministry Hub member-tool projection while preserving `src/app/calendar.js` as the sole Calendar lifecycle/persistence owner. No Calendar schema, API, RLS, storage, recurrence or authorization behavior changed.

Run `34616603649` passed the full accumulated architecture, edge/security and browser/mobile suite, including the updated Ministry Hub role and 390 px navigation regressions. The exact SHA was frozen and promoted to `main` before the later visual milestone.

### Visual Phase B — More hub semantic icons

Exact-green `046e2a85...` adds:

- `assets/more-feature-icons.svg` with 15 same-origin semantic SVG symbols;
- decorative, `aria-hidden` feature icons on the existing More tool cards;
- `src/ui/more-phase-b.css` as a separate Phase B presentation layer after the retained tranche-18 More stylesheet;
- permanent `tests/v3-more-phase-b-static.mjs` and `tests/v3-more-phase-b-smoke.mjs` coverage retained by the accumulated workflow.

No route, callback, feature availability, PWA-install behavior, persistence, API/Supabase, Calendar, gameplay/scoring or service-worker ownership changed. The historical `assets/icons/v3/` family remains absent and was not falsely wired.

Run `34618963635` checked out exact merge candidate `046e2a85...` and passed all accumulated architecture validators, all edge/security/static regressions and the complete browser/mobile suite. The new 390 px More acceptance passed with the committed sprite, distinct semantic references, >=44 px action targets and no horizontal overflow.

## Production Supabase state

Production project: `zkfmgezvzugchcwppreq`.

The existing release migrations remain **APPLIED + LIVE VERIFIED** and were not changed by either new milestone:

- `20260911144939` — `assignment_response_presence`
- `20260911144950` — `calendar_events`
- `20260911145003` — `calendar_congregation_sharing`

Do not reapply them.

## Current blockers

No credible P0/P1 product, security, privacy or data-loss blocker is recorded by the current accumulated regression evidence. Do not describe the application as bug-free.

The previously detected development-status contract regression is **closed**: PR #98 restored the validator-owned `Defect / root-cause ledger` and `Next major milestone` sections, and run `34616114505` passed architecture, edge/security and browser/mobile stages.

PR #99's attempted `push` trigger for the product regression workflow was rejected by the permanent workflow contract (`Product v3 regression workflow must not contain a push trigger`) and was closed without merge. The safety contract remains intact. Exact product verification continues through PR merge candidates/frozen refs.

## Correct next route

Priority 1 remains coordinated functionality/correctness plus Visual Phase B quality.

1. preserve `046e2a85...` and `release/v3-phase-b-more-icons-20260912` as the current exact-green checkpoint;
2. do not repeat the completed Ministry Hub Calendar or More-icon milestones;
3. refresh current repository/investigator evidence before selecting the next write;
4. prefer a genuinely unfinished high-value functionality milestone if its ownership/acceptance can be bounded cleanly; current Calendar candidates are congregation-event edit/delete UI/owner flow and custom recurrence beyond fixed weekly;
5. otherwise continue Visual Phase B on another materially minimal/placeholder surface, using real committed assets rather than nonexistent mapped paths;
6. run focused checks plus the complete accumulated exact-candidate suite for every product change;
7. keep independent production/live-host verification separate from GitHub/Cloudflare deployment checks.

## Defect / root-cause ledger

- **Status-contract regression — closed.** Release-closeout documentation removed validator-owned canonical headings. Run `34615866840` detected it; PR #98 restored the contract without weakening the validator; run `34616114505` passed completely.
- **Invalid push-trigger hardening attempt — rejected/closed.** PR #99 attempted to add a `push` trigger to `.github/workflows/v3-regression.yml`; run `34617187008` correctly failed the permanent workflow contract. No unsafe trigger was merged.
- **Ministry Hub Calendar surface — completed.** Exact-green `350cb1e...`; run `34616603649` success; frozen release ref created and promoted.
- **Visual Phase B More semantic icons — completed.** Exact-green `046e2a85...`; run `34618963635` success; frozen release ref created and promoted; both Cloudflare project deployment checks succeeded at the exact SHA.
- No reproduced P0/P1 product defect is currently open in this ledger. New findings must be reproduced and priority-classified before modification.

## Next major milestone

Select and isolate the next dependency-safe Priority 1 milestone from current exact-green `046e2a85...`. First investigate Calendar congregation-event edit/delete as the leading functionality candidate because Calendar v1.5 already exposes congregation-shared events but does not automatically imply edit/delete UI is complete. If repository evidence shows that requirement is already complete, do not rebuild it; choose the next verified gap or the next materially under-designed Visual Phase B surface instead.

## Evidence rules

Repository evidence overrides stale prose. Docs-only HEAD != product SHA. Never transfer PASS across changed product SHAs. Never claim unexecuted tests. GitHub promotion != independent live-host proof. Cloudflare deployment-check success != byte-for-byte/browser production verification. A committed migration != an applied migration unless production evidence proves it. Do not call the application bug-free.
