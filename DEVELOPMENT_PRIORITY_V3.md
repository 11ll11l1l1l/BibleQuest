# BibleQuest v3 — Current Development Priority

Updated: 2026-09-12 JST after exact-green Visual Phase B Progress/Grow promotion.

This is the cross-feature task-selection authority. Read `RECONCILIATION_V3.md` next for exact product/release ancestry and evidence.

## Current product truth

- current exact-green product: `2c601b3289dba891f349801219f49804f85f63cc`
- current frozen product ref: `release/v3-phase-b-progress-artwork-20260912`
- current accumulated verifier: run `34633247237` — **success**
- current product PR: #110
- parent exact-green Account product: `2f04b7150b36d4a14dac953fd08ae2c5a307d0d9`, run `34632158164` — success
- prior Avatar Vault product: `df2a7051e305474a5ea24912c3f5341f33bc61b8`, run `34630985269` — success
- prior Personal Mission product: `df1bbd18782bee6430546ee7b444ad4bc48f5116`, run `34629528297` — success
- prior Calendar product: `c15d1fceddce537fa8a31a6b2b5c909d197b1b3e`, run `34627049878` — success
- production Supabase release migrations: **APPLIED + LIVE VERIFIED** and unchanged
- previous rollback: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

Run `34633247237` explicitly checked out exact PR synthetic merge candidate `2c601b3...`; the complete accumulated architecture, edge/security/static and browser/mobile suite passed. The exact candidate was frozen before `main` moved to the same SHA.

Provider deployment identity and fresh independent two-host verification are not yet recorded for this exact product and must not be inferred from older PASS evidence.

## Authority order

1. latest explicit user instruction;
2. this file for cross-feature priority;
3. `RECONCILIATION_V3.md` for product/release ancestry and integration truth;
4. current handoff/status;
5. selected feature/release-gate contract;
6. exact-candidate workflow/deployment/live evidence;
7. historical inventory/release/agent evidence.

## Priority 1 now — release hardening plus evidence-driven visual completion

Resume from exact-green `2c601b3...`. Do not create additional product work merely because historical issues remain open.

### 1A — functionality/correctness firewall

A credible current-v3 P0/P1 reproduced through the current runtime interrupts all other work. Stale labels or legacy-root bugs do not.

Old PR #88 remains non-actionable for current v3 unless reproduced through the current v3 runtime: v3 boots through `src/app/bootstrap.js`; Account behavior lives under `src/app/account.js`; Progress behavior lives under `src/core/progress.js`.

Completed and not automatic work anymore include Calendar v1/v1.5, Ministry Hub Calendar, Calendar creator edit/delete, existing Calendar migrations/security state and fixed-weekly congregation recurrence. Custom non-weekly recurrence remains deferred absent explicit release need.

### 1B — required release evidence

The immediate dependency-safe milestone is a permanent final-candidate mobile/PWA acceptance gate.

Verify 320/360/390/412/430 CSS px against the **current v3 architecture**:

- no page horizontal overflow / no zoom-out requirement;
- Home and Daily Journey remain immediately usable;
- topbar/header does not crowd or clip;
- five current primary nav destinations (`Home`, `Learn`, `Play`, `Grow`, `More`) remain equal, readable and usable;
- relevant controls retain practical ~44 px targets;
- critical supporting text does not collapse to tiny unreadable sizes;
- PWA manifest/install/offline-shell/update/cache contracts remain green;
- console/page errors remain absent.

Issue #6 contains stale historical structural wording about four tabs and a squeezed nine-node path. Do not regress current v3 back to obsolete structure. Preserve the acceptance intent instead.

Issue #68 remains a separate multi-account field-validation gate; it cannot be closed by static tests alone.

### 1C — Visual Phase B

Completed bounded checkpoints now include More, Calendar, Personal Mission, Avatar Vault, Account and Progress/Grow. Do not repeat them.

Issue #94 remains mandatory for final release, but further visual product changes must be evidence-driven. Inspect current investigator/firewall findings and the current tree before selecting another surface. If a material placeholder/generic/emoji-like current-v3 surface remains, use real committed same-origin artwork, preserve behavior/ownership, add focused acceptance, then require a complete exact-candidate regression.

The historical `assets/icons/v3/` mapped binary family remains absent. `docs/V3_ICON_ASSET_MAP.md` is semantic guidance, not proof that binaries exist.

### 1D — final production gate

Before official public release:

- establish one exact intended final candidate;
- run complete architecture/static, edge/security, browser/mobile, visual, accessibility, reduced-motion, PWA/offline/cache, core functional, explicit-width and console/page-error verification on that exact SHA;
- complete Issue #68 multi-account field validation;
- record exact provider deployment identity;
- independently verify both production hosts match the exact candidate;
- promote no unverified follow-up product commit.

## Production migration state

Known release migrations remain `APPLIED + LIVE VERIFIED`; do not reapply:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

## Priority firewall

- P0 — severe current production/security/privacy/data-loss/core outage reproduced through current v3.
- P1 — major user-facing release capability broken without reasonable workaround, or an explicitly required release-gate correction.
- P2 — real defect/usability issue but not primary-use blocker.
- P3 — cosmetic/speculative/low-impact issue outside the approved visual program.

Approved Visual Phase B work is not automatically P3, but visual work without evidence of a remaining material gap is not automatically P1 either.

## Non-negotiable rules

Rebuild-and-verify; one owner/source of truth per responsibility; preserve `src/core/api.js` as the single browser backend/Supabase owner unless intentionally redesigned; every changed product candidate earns its own complete verification; never transfer PASS; never claim unexecuted tests; docs/validation-only commits are not product SHAs; do not weaken tests; workflow remains `workflow_dispatch` + `pull_request` with no forbidden `push`; preserve frozen refs/rollback; GitHub promotion, provider deployment and independent live proof remain separate; do not call the app bug-free.
