# BibleQuest v3 Development Status

Updated: 2026-09-06

This is the working execution ledger. `FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production GitHub Pages: **v2 unchanged** (`gh-pages` is not used for v3 development).
- Last frozen milestone: `release/v3.2-auth-complete`.
- Current work branch: `feature/v3-reader-core`.
- Candidate reader release after this exact ledger commit passes: `release/v3.3-reader-core`.
- No Cloudflare changes are part of v3 development.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 10 |
| Verified | 8 |
| Implemented | 1 |
| Not started | 81 |
| Total | 100 |

## Completed milestones

### Milestone 1 — Foundation — Regression-tested

- #1 App shell
- #2 Primary navigation
- #3 Mobile shell/layout
- #4 Global application state
- #5 Storage boundary

Single owners remain `src/app/router.js`, `src/app/store.js`, `src/core/storage.js`, and `src/ui/shell.js`.

### Milestone 2 — Account/auth — Regression-tested

- #6 Authentication/session
- #7 Guest mode
- #8 Signup
- #9 Recovery code/password recovery
- #10 Remembered device/security

Single owners remain `src/app/session.js`, `src/app/account.js`, `src/core/api.js`, and the account presentation module. The later reader milestone reran the full account suite successfully, so rows #8–#10 are promoted from Verified to Regression-tested.

### Milestone 3A — Bible data + local reader core — Verified

Verified rows:

- #11 Bible data service
- #12 English BSB Bible
- #13 Tagalog Bible
- #18 ESV/NIV/AMP reader links
- #19 Verse Peek
- #21 Reader navigation
- #22 Reader search
- #23 Reader read-progress marking

Implemented but not yet Verified:

- #20 STEPBible lexical/context tools — passage/reference links and numbered-book encoding exist, but the inventory also requires unavailable-data behavior before promotion.

Single owners:

- `src/core/bible.js` — translation registry, manifest/book metadata, pack loading, validation, cache, reference parsing, text search, and external reader/tool URLs.
- `src/app/reader.js` — reader translation/book/chapter state, navigation, persistence, and read marking.
- `src/features/reader/index.js` — reader presentation/events only.
- `src/ui/reader.css` — reader-specific presentation only.

Verified reader workflows include real repository BSB and Tagalog packs, OT/NT loading, attribution, per-book lazy loading/cache reuse, controlled missing-pack errors, translation switching, reload persistence, cross-book previous/next navigation, reference lookup (`John 3:16`), text search, result navigation/highlighting, reusable Verse Peek, safe ESV/NIV/AMP external links, read marking/persistence, and 390px mobile overflow regression.

Source constraints deliberately remain visible:

- #14 Japanese 口語訳, #15 furigana, and #16 Japanese vocabulary learning remain Not started until a legitimate text/license path is established.
- #17 NLT live path remains Not started until a legitimate provider/license path is implemented and failure behavior is testable.
- Copyrighted Bible text is not copied into the repository merely to satisfy parity.

## Next major milestone

Milestone 4 — User progress foundation:

- #24 User progress service
- #25 XP
- #26 Streak
- #27 Achievements/badges

After Milestone 4 is stable, the plan continues to #31 Core lesson engine before #28–#30 Daily Mission/Journey. This preserves the architecture order so Daily Journey does not become another isolated state machine.

Required design rules for Milestone 4:

1. One progress service owns every XP, streak, achievement, and meaningful-activity mutation.
2. Feature modules may request progress events but may not edit XP/streak/badges directly.
3. Awards must be idempotent by event identity so reload/double-click cannot duplicate XP.
4. Date logic must be deterministic and timezone-aware for Japan and other clients.
5. Local guest progress and future account/cloud progress must use one schema and explicit merge boundaries.
6. Existing reader read-marking must migrate to progress events without breaking its verified behavior.

## Defect / root-cause ledger

### V3-ROUTER-001 — URL/view could become temporarily inconsistent
- **Root cause:** router changed `location.hash` and relied on the later asynchronous `hashchange` event to render.
- **Fix:** the single router owner updates history and resolves the route synchronously.
- **Regression test:** Home → Learn → reload → Play → Back → Learn → Forward → Play.

### V3-AUTH-GATE-001 — Supabase version pin was not statically provable
- **Root cause:** the runtime URL assembled the pinned version while the architecture gate requires an auditable literal dependency/version.
- **Fix:** literal pinned Supabase ESM URL in `src/core/api.js`.
- **Regression prevention:** architecture validator requires the pinned version and rejects privileged browser credentials.

### V3-SHELL-001 — duplicate primary-navigation selector contract
- **Root cause:** the BibleQuest brand reused the primary Home selector.
- **Fix:** brand navigation uses its own selector but the same single router.
- **Regression test:** mobile/desktop primary-route loop requires one route control per destination.

### V3-SIGNUP-001 — successful signup could lose the one-time recovery code
- **Root cause:** trusted account creation and optional automatic sign-in were incorrectly treated as one client success condition.
- **Fix:** recovery-code issuance is the transaction boundary; auto-sign-in/device registration are follow-up outcomes.
- **Regression test:** post-signup sign-in failure must still preserve and display the issued code.

### V3-ACCOUNT-ACCEPTANCE-001 — parity requirements were not explicit assertions
- **Root cause:** duplicate-account and post-recovery sign-in behavior existed in mocks/contracts but were not individually asserted.
- **Fix:** promotion was blocked until explicit tests were added.
- **Regression prevention:** `tests/v3-account-edge.mjs` runs before browser tests.

### V3-READER-ACCEPTANCE-001 — invalid-search browser assertion contradicted native validation
- **Root cause:** the first reader browser test expected a JavaScript service error for a 2-character query, but the search input correctly has native `minlength=3`, so the browser blocks submit before the service receives it.
- **Fix:** retain native validation; assert that the field is invalid, the route does not change, no result workflow starts, and the reader remains usable.
- **Regression prevention:** `tests/v3-reader-smoke.mjs` covers native invalid search plus valid reference/text search in the same accumulated browser run.

## Release rule

A release snapshot is created only after the exact ledger/status commit passes every configured v3 gate: architecture validation, account edge regression, Bible/reader edge regression, accumulated shell/account browser regression, and reader browser regression. No feature status is advanced merely because its screen renders.
