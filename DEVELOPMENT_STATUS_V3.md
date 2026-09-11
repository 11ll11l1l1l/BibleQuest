# BibleQuest v3 Development Status

Updated: 2026-09-12 JST after Visual Phase B Calendar artwork promotion.

## Current release truth

- current exact-green product SHA: `c15d1fceddce537fa8a31a6b2b5c909d197b1b3e`
- current product release ref: `release/v3-phase-b-calendar-artwork-20260912`
- current accumulated verifier: run `34627049878` — **success** on exact PR #104 synthetic merge candidate `c15d1fceddce537fa8a31a6b2b5c909d197b1b3e`
- current product PR: #104 — merged by fast-forwarding `main` to the exact green synthetic merge candidate
- parent exact-green product: Calendar creator edit/delete `7d28d7ced00450f6c1abd93cb31ea78d51c5c876`
- parent release ref: `release/v3-calendar-owner-edit-delete-20260912`
- parent accumulated verifier: run `34623059639` — **success**
- prior Visual Phase B More checkpoint: `046e2a85cafe10d722d03d467d3733eddfeb6e65`, run `34618963635` — **success**
- prior Ministry Hub Calendar surface checkpoint: `350cb1e583b207e10ba8dc50c3bb683dc50f9494`, run `34616603649` — **success**
- previous production rollback/reference remains `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

Run `34627049878` explicitly fetched `c15d1fceddce537fa8a31a6b2b5c909d197b1b3e` as `refs/pull/104/merge`, checked it out, and passed the complete accumulated suite. The exact candidate was frozen before `main` was fast-forwarded to the same SHA. No unverified product promotion SHA was created.

A later docs-only bookkeeping commit may become repository HEAD. That does not replace `c15d1f...` as the exact-green product checkpoint until another changed product candidate earns its own complete verification.

## Deployment state

No deployment-provider or independent live-host evidence has been transferred to exact product `c15d1f...` in this record.

The latest previously recorded Cloudflare Pages provider checks were for older exact-green product `046e2a85...`, where both configured projects (`mybiblequest` and `biblequest` / `biblequest-7th`) reported success. The last fully independent two-host production verifier remains run `34612873935` for an earlier cumulative release.

GitHub regression success and promotion do not prove that either production hostname serves the new exact product. Provider deployment evidence and independent byte/browser live-host verification remain separate release evidence and must be recorded separately when available.

## Newly completed product work

### Visual Phase B — Calendar artwork

Exact-green `c15d1f...` upgrades the Calendar surface without reopening completed Calendar behavior:

- replaces literal Calendar event emoji (`📌`, `⛪`, `🗓️`) with committed same-origin passive SVG artwork;
- adds `assets/calendar-feature-icons.svg` with planner, personal, assignment, congregation and empty-state symbols;
- adds `src/ui/calendar-phase-b.css` after the existing Calendar base stylesheet;
- improves agenda hierarchy, event-source recognition, form containment and mobile presentation;
- keeps decorative artwork `aria-hidden` while text remains authoritative;
- preserves every existing Calendar route, callback, service method, personal/shared event behavior, creator-only edit/delete rule, assignment aggregation, fixed-weekly recurrence behavior, storage boundary, API boundary and Supabase contract;
- adds permanent `tests/v3-calendar-phase-b-static.mjs` and `tests/v3-calendar-phase-b-smoke.mjs` coverage while retaining existing `tests/v3-calendar-smoke.mjs` functional coverage;
- keeps the product workflow trigger contract unchanged (`workflow_dispatch` + `pull_request`; no forbidden `push` trigger).

Run `34627049878` passed all accumulated architecture validators, all accumulated edge/security/static regressions, local app boot, and the full browser/mobile suite. The logs explicitly record `BibleQuest v3 Calendar Phase B static asset contract passed`, existing `BibleQuest v3 Calendar mobile browser regression passed`, and `BibleQuest v3 Calendar Phase B mobile browser acceptance passed` on exact candidate `c15d1f...`.

### Prior completed checkpoints retained

- Calendar creator edit/delete: exact-green `7d28d7c...`, run `34623059639` success.
- Visual Phase B More semantic icons: exact-green `046e2a85...`, run `34618963635` success.
- Ministry Hub Calendar surface: exact-green `350cb1e...`, run `34616603649` success.

Do not repeat these milestones.

## Production Supabase state

Production project: `zkfmgezvzugchcwppreq`.

The existing release migrations remain **APPLIED + LIVE VERIFIED** and were not changed by PR #104:

- `20260911144939` — `assignment_response_presence`
- `20260911144950` — `calendar_events`
- `20260911145003` — `calendar_congregation_sharing`

Do not reapply them. PR #104 is presentation/test integration only and made no production database mutation.

## Current blockers

No credible P0/P1 product, security, privacy or data-loss blocker is recorded by accumulated run `34627049878`. Do not describe the application as bug-free.

The Calendar artwork milestone is closed. Existing Calendar functional coverage remained green together with the new visual acceptance.

Independent production/live-host verification for exact product `c15d1f...` remains a separate release-evidence gap and must not be inferred from GitHub regression success.

## Correct next route

Priority 1 remains coordinated functionality/correctness plus Visual Phase B quality.

1. preserve `c15d1f...` and `release/v3-phase-b-calendar-artwork-20260912` as the current exact-green product checkpoint;
2. do not repeat Calendar artwork, Calendar creator edit/delete, Ministry Hub Calendar, or More-icon work;
3. refresh repository, active PR/action, agent/investigator and production evidence before the next product write;
4. reproduce and priority-classify any newly reported functionality/correctness issue before modifying product code; a credible P0/P1 interrupts visual work;
5. fixed-weekly congregation recurrence is complete; custom non-weekly recurrence remains explicitly deferred unless current evidence/user direction makes it release-required;
6. absent a reproduced P0/P1 gap, continue Visual Phase B on the next materially minimal, placeholder, generic or emoji-like surface using real committed assets;
7. preserve route, feature/state, persistence, API/Supabase, gameplay/scoring, accessibility and PWA ownership unless a separately selected milestone explicitly changes it;
8. add focused permanent regression coverage for the selected surface;
9. require the complete accumulated regression on the exact synthetic merge candidate before promotion;
10. freeze the exact tested candidate before advancing `main`; keep provider deployment and independent live proof as separate evidence.

## Defect / root-cause ledger

- **Status-contract regression — closed.** PR #98 restored validator-owned canonical headings; run `34616114505` passed completely.
- **Invalid push-trigger hardening attempt — rejected/closed.** PR #99 attempted a `push` trigger; permanent workflow contract rejected it and it was not merged.
- **Ministry Hub Calendar surface — completed.** Exact-green `350cb1e...`; run `34616603649` success.
- **Visual Phase B More semantic icons — completed.** Exact-green `046e2a85...`; run `34618963635` success.
- **Calendar creator edit/delete — completed.** Exact-green `7d28d7c...`; run `34623059639` success.
- **Visual Phase B Calendar artwork — completed.** Exact-green `c15d1f...`; run `34627049878` success; frozen release ref created and `main` fast-forwarded to the exact tested synthetic merge candidate.
- **API full-file write syntax slip — contained before prior gate.** A prior Calendar API branch briefly lost one unrelated closing brace; diff inspection caught and corrected it before gating. The final promoted product did not contain that defect.
- No reproduced P0/P1 product defect is currently open in this ledger. New findings must be reproduced and priority-classified before modification.

## Next major milestone

Investigate the next materially under-designed Visual Phase B surface from exact-green `c15d1f...`, while first checking current repository/investigator evidence for any newly reproduced release-blocking functionality/correctness issue. Do not invent feature work merely because optional Calendar expansion is possible. If no P0/P1 functionality gap is reproduced, select the smallest high-value user-facing surface whose presentation is still materially placeholder, generic or emoji-like, implement real committed artwork under `VISUAL_PHASE_B_V3.md`, preserve existing interaction ownership, and require a new exact-SHA accumulated regression before promotion.

Release hardening may proceed in parallel only as evidence work: record Cloudflare/provider deployment identity when available and independently verify both production hostnames for the exact deployed product before claiming production verification.

## Evidence rules

Repository evidence overrides stale prose. Docs-only HEAD != product SHA. Never transfer PASS across changed product SHAs. Never claim unexecuted tests. GitHub promotion != provider deployment proof != independent live-host proof. A committed migration != an applied migration unless production evidence proves it. Do not call the application bug-free.
