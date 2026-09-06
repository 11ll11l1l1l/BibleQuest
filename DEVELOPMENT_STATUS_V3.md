# BibleQuest v3 Development Status

Updated: 2026-09-06

This is the working execution ledger. `FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production GitHub Pages: **v2 unchanged**.
- Last frozen milestone: `release/v3.6-daily-mission` at `da43d4e8bccd2693639a5a60f824b6e647ca7e68`.
- Current work branch: `feature/v3-transform-engine`.
- No Cloudflare changes are part of v3 development.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 23 |
| Verified | 3 |
| Implemented | 1 |
| Not started | 73 |
| Total | 100 |

Counts remain unchanged during Transform engine implementation. #48 advances only after the engine acceptance suite and browser persistence regression pass; #46/#47 remain Not started until their UI workflows exist.

## Completed milestones

- Milestone 1 — Foundation: #1–#5 Regression-tested.
- Milestone 2 — Account/auth: #6–#10 Regression-tested.
- Milestone 3 — Reader/data: #11–#13, #18–#19, #21–#23 Regression-tested; #20 STEPBible remains Implemented pending unavailable-data behavior.
- Milestone 4 — Progress: #24–#27 Regression-tested.
- Milestone 5 — Core lesson engine: #31 Regression-tested.
- Milestone 6 — Daily Mission/Journey: #28–#30 Verified.

## Current milestone — Milestone 7A Transform engine

Old Transform audit found two user-facing surfaces that must eventually share one clean state owner:

1. Basic spiritual self-reflection (#46): 12 dimensions rated 1–5, a local result, lowest-three focus guidance, and an explicit “not a spiritual score/diagnosis” boundary.
2. Full Transform (#47): 20-item Big Five reflection, five thinking-pattern scenarios, recommendations/action experiment, private journal, and bounded history.

The old full runtime also had its own direct `localStorage`, global `window.BQ_TRANSFORMATION`, body-level modal/root, mutable page indexes, event delegation, standalone account gate and runtime-recovery loader. None of those lifecycle mechanisms are being copied into v3.

Engine contract:

- `src/engines/transform.js` is the only Transform persistence/state/scoring owner.
- Spiritual, personality, bias and reflection domains share one versioned local state schema while remaining independently resettable.
- Ratings and choices are validated before mutation.
- Derived results are reconstructed from validated answers on reload rather than trusted from stored score objects.
- Changing an answer invalidates that domain’s prior result.
- Personality reverse-key scoring and score-band thresholds preserve the old useful behavior.
- Thinking-pattern scoring preserves the five old scenario contracts without labeling the person as “having” a bias.
- Recommendations are deterministic and bounded to four.
- Personality/bias reset preserves the private reflection journal.
- History is bounded to ten entries.
- Storage writes are atomic with respect to engine memory.
- Engine has no DOM, router, Supabase or progress dependency.

## Next major milestone

After #48 Transform engine is independently verified, build #46 Basic Transform UI against it, then #47 Full Transform UI against the same owner. Only after all three pass accumulated regression can the Transform release freeze. Audio/Recordings remains next after that.

## Defect / root-cause ledger

- `V3-ROUTER-001` — synchronous single-owner route resolution fixed URL/view drift.
- `V3-AUTH-GATE-001` — static dependency pinning made the Supabase browser version auditable.
- `V3-SHELL-001` — brand and primary-nav selectors were separated while retaining one router.
- `V3-SIGNUP-001` — recovery-code issuance became the signup transaction boundary so auto-sign-in failure cannot lose the code.
- `V3-ACCOUNT-ACCEPTANCE-001` — duplicate-account and post-recovery sign-in behaviors became explicit assertions.
- `V3-READER-ACCEPTANCE-001` — native invalid-search validation is tested as native validation rather than weakened to satisfy JavaScript expectations.
- `V3-PROGRESS-UI-001` — static progress-chip readability was separated from interactive touch-target semantics.

Transform engine status remains unpromoted until exact CI evidence exists.

## Release rule

A snapshot is frozen only after the exact ledger/status commit passes every configured architecture, service and accumulated browser gate.
