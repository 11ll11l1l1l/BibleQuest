# BibleQuest v3 Development Status

Updated: 2026-09-06

This is the working execution ledger. `FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production GitHub Pages: **v2 unchanged** (`gh-pages` is not used for v3 development).
- Last frozen milestone: `release/v3.3-reader-core` at `aaed163ca956e2fc6da33b13d467797ce7dfd2dd`.
- Current work branch: `feature/v3-progress-core`.
- No Cloudflare changes are part of v3 development.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 10 |
| Verified | 8 |
| Implemented | 1 |
| Not started | 81 |
| Total | 100 |

The progress counts above remain unchanged while Milestone 4 is under implementation. Rows #24–#27 will advance only after their acceptance workflow and the complete accumulated suite pass.

## Completed milestones

- Milestone 1 — Foundation: #1–#5 Regression-tested.
- Milestone 2 — Account/auth: #6–#10 Regression-tested.
- Milestone 3A — Reader/data: #11–#13, #18–#19, #21–#23 Verified; #20 STEPBible remains Implemented pending unavailable-data behavior.

## Current milestone — Milestone 4 User progress foundation

Target rows:

- #24 User progress service
- #25 XP
- #26 Streak
- #27 Achievements/badges

Design contract:

1. `src/core/progress.js` is the only owner of XP, streak, activity counters, achievement state, and progress-event persistence.
2. Every award uses a deterministic event ID. Repeated identical events are no-ops; reuse with conflicting semantics is a programmer error and fails loudly.
3. Streaks use civil calendar dates in an explicit client timezone, not raw elapsed-hour arithmetic.
4. Multiple meaningful events on one date increase activity count but never increase the streak more than once for that date.
5. Backdated events cannot rewind or corrupt the current streak.
6. Badge unlocks are monotonic and duplicate-proof.
7. Reader mark-read now requests `reader.chapter.read` progress and uses retry-safe ordering rather than editing XP itself.
8. The local schema is intentionally independent of guest/account identity so future cloud synchronization can define an explicit merge boundary instead of replacing local state ad hoc.

## Next major milestone

After Milestone 4 is frozen, build #31 Core lesson engine. Only after the lesson lifecycle is verified should #28–#30 Daily Mission/Journey be migrated onto it.

## Defect / root-cause ledger

### V3-ROUTER-001 — URL/view could become temporarily inconsistent
- **Root cause:** router changed `location.hash` and relied on the later asynchronous `hashchange` event to render.
- **Fix:** the single router owner updates history and resolves the route synchronously.
- **Regression test:** accumulated navigation browser flow.

### V3-AUTH-GATE-001 — Supabase version pin was not statically provable
- **Root cause:** dependency version was assembled dynamically instead of being statically auditable.
- **Fix:** literal pinned browser dependency plus architecture enforcement.

### V3-SHELL-001 — duplicate primary-navigation selector contract
- **Root cause:** brand navigation reused the primary Home selector.
- **Fix:** unique brand selector with the same single router.

### V3-SIGNUP-001 — successful signup could lose the one-time recovery code
- **Root cause:** trusted account creation and optional automatic sign-in were treated as one success condition.
- **Fix:** recovery-code issuance is the transaction boundary; sign-in/device registration are follow-up outcomes.

### V3-ACCOUNT-ACCEPTANCE-001 — account parity requirements were not explicit assertions
- **Root cause:** duplicate-account and post-recovery sign-in behavior were not individually asserted.
- **Fix:** promotion was blocked until explicit tests existed.

### V3-READER-ACCEPTANCE-001 — invalid-search assertion contradicted native form validation
- **Root cause:** test expected JavaScript handling for a form submission the browser correctly blocked at `minlength=3`.
- **Fix:** test native invalidity and reader stability instead of weakening validation.

### V3-PROGRESS-UI-001 — mobile status-chip test used an interactive touch-target rule for static text
- **Root cause:** the first progress browser acceptance test required the non-interactive XP status chip to be at least 44px wide, conflating a touch-target guideline with text readability. The chip could be narrower while fully legible.
- **Fix:** keep the chip non-interactive, give it a stable compact minimum footprint to avoid top-bar jitter, and test its visible XP text, font size, height, viewport fit, and overall horizontal overflow instead of treating it as a button.
- **Regression prevention:** `tests/v3-progress-smoke.mjs` separately enforces the real 44px target on the interactive account button while checking the progress chip for legibility/layout semantics.

## Release rule

A release snapshot is created only after the exact ledger/status commit passes every configured v3 architecture, service, and accumulated browser gate. No feature status is advanced merely because its screen renders.
