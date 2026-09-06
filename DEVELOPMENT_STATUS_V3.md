# BibleQuest v3 Development Status

Updated: 2026-09-06

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production GitHub Pages: **v2 unchanged**.
- Last frozen milestone: `release/v3.6-daily-mission` at `da43d4e8bccd2693639a5a60f824b6e647ca7e68`.
- Current work branch: `feature/v3-transform-basic`.
- Cloudflare untouched.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 26 |
| Verified | 1 |
| Implemented | 1 |
| Not started | 72 |
| Total | 100 |

Counts stay unchanged while #46 Basic Transform is under implementation. #48 Transform engine is Verified; #46/#47 are not promoted by engine availability.

## Current sub-milestone — 7B Basic Transform

Scope is exactly row #46:
- 12 spiritual dimensions
- 1–5 response UI
- complete-only calculation through the verified engine
- deterministic lowest-three focus guidance
- private local persistence/reload/reopen
- reset/edit/recalculate
- explicit non-diagnostic/non-ranking safety language
- one retry-safe +20 XP / Reflection metric through progress event `transform:spiritual:v1:complete`
- guest workflow with zero Supabase traffic
- desktop + 390px mobile regression

`src/app/transform.js` is orchestration only. It reconciles an already-saved Basic Transform result to the canonical progress service. A progress-write failure after result persistence is recoverable on reopen and cannot duplicate XP.

Full Transform Big Five, thinking patterns, recommendations and journal UI (#47) remain intentionally absent from this sub-milestone.

## Next major milestone

After #46’s exact promoted ledger is green, start 7C Full Transform (#47) using the same `src/engines/transform.js` and `src/app/transform.js`. No Audio/Recordings work starts until all Transform rows #46–#48 are completed and the Transform release is frozen.

## Defect / root-cause ledger

- `V3-ROUTER-001` — single synchronous router fixed URL/view drift.
- `V3-AUTH-GATE-001` — static Supabase version pin is architecture-auditable.
- `V3-SHELL-001` — brand and primary navigation selectors are distinct.
- `V3-SIGNUP-001` — recovery-code issuance is independent from optional auto-sign-in.
- `V3-ACCOUNT-ACCEPTANCE-001` — duplicate signup and post-recovery login are explicit tests.
- `V3-READER-ACCEPTANCE-001` — invalid search respects native form validation.
- `V3-PROGRESS-UI-001` — static label readability is separate from touch-target semantics.
- `V3-TRANSFORM-OWNER-001` — Basic orchestration initially defined a second `calculateSpiritual` function name. The architecture gate correctly rejected the semantic owner collision. The orchestration action is now `completeBasicAssessment`; only `src/engines/transform.js` defines `calculateSpiritual`, and the Basic edge suite asserts that duplicate owner name cannot reappear.

Basic Transform remains unpromoted until its exact CI evidence exists.

## Release rule

Transform freezes only after engine + Basic + Full all pass and the final exact Transform ledger/status commit is green.
