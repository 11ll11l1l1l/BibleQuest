# BibleQuest v3 Development Status

Updated: 2026-09-06

This is the working execution ledger. `FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production GitHub Pages: **v2 unchanged** (`gh-pages` is not used for v3 development).
- Last frozen milestone: `release/v3.3-reader-core` at `aaed163ca956e2fc6da33b13d467797ce7dfd2dd`.
- Current work branch: `feature/v3-progress-core`.
- Candidate progress release after this exact ledger commit passes: `release/v3.4-progress-core`.
- No Cloudflare changes are part of v3 development.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 18 |
| Verified | 4 |
| Implemented | 1 |
| Not started | 77 |
| Total | 100 |

## Completed milestones

- Milestone 1 — Foundation: #1–#5 Regression-tested.
- Milestone 2 — Account/auth: #6–#10 Regression-tested.
- Milestone 3A — Reader/data: #11–#13, #18–#19, #21–#23 Regression-tested after surviving the later progress milestone; #20 STEPBible remains Implemented pending unavailable-data behavior.

### Milestone 4 — User progress foundation — Verified

Verified rows:

- #24 User progress service
- #25 XP
- #26 Streak
- #27 Achievements/badges

Single owner:

- `src/core/progress.js` — XP, streak, meaningful activities, metric counters, badges, deterministic event identities, timezone-aware civil dates, persistence, and immutable progress snapshots.

Verified workflows include:

- one global progress owner and one storage key
- canonical progress state published into the global store
- deterministic/idempotent event IDs
- conflicting event-ID semantics rejected before mutation
- unknown/invalid metrics rejected before mutation
- XP awarded once across duplicate calls and reload
- same-day activity without extra streak increment
- next-day continuation and missed-day reset
- explicit Asia/Tokyo midnight boundary regression
- backdated-event protection
- 3-day and 7-day streak badge unlocks
- First Step, Reader, Bible Recall, and Reflection badge rules
- malformed persisted-state recovery
- reader mark-read routed through progress instead of direct XP mutation
- simulated partial reader transaction failure followed by retry without duplicate XP
- shell/home/Grow progress rendering
- 390px mobile top-bar/progress layout regression

## Next major milestone

Milestone 5 — #31 Core lesson engine.

The lesson audit found repeated lifecycle machinery across old Quick Recall, Context Challenge, Mixed Quest, Story Journey, Wisdom Situations, Deep Questions, Timeline, and Play Together: start/resume, current step, response locking, feedback, advance, finish, progress handoff, and teardown. The v3 engine will centralize that lifecycle while allowing scored and reflective/unscored lesson types.

Daily Mission/Journey (#28–#30) remains intentionally Not started until #31 is Verified. This prevents Daily Journey from becoming another isolated state machine.

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
- **Fix:** keep the chip non-interactive, give it a stable compact minimum footprint to avoid top-bar jitter, and test visible XP text, font size, height, viewport fit, and overall horizontal overflow instead of treating it as a button.
- **Regression prevention:** `tests/v3-progress-smoke.mjs` enforces 44px on the interactive account control and legibility/layout semantics on the static progress chip.

## Release rule

A release snapshot is created only after the exact ledger/status commit passes every configured v3 architecture, service, and accumulated browser gate. No feature status is advanced merely because its screen renders.
