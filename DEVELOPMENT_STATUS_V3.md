# BibleQuest v3 Development Status

Updated: 2026-09-07

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production v2 remains unchanged.
- Last frozen milestone before this candidate: `release/v3.6-daily-mission` at `da43d4e8bccd2693639a5a60f824b6e647ca7e68`.
- Current completion branch: `feature/v3-transform-full`.
- Cloudflare remains untouched by the v3 rebuild.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 28 |
| Verified | 1 |
| Implemented | 1 |
| Not started | 70 |
| Total | 100 |

Strict verified-or-better parity is now **29/100**. #46 Basic Transform and #48 Transform engine are Regression-tested. #47 Full Transform is Verified. #20 STEPBible lexical/context tooling remains Implemented and is still parity debt.

## Completed Transform milestone

### 7A — Transform engine (#48)

`src/engines/transform.js` is the single Transform state/scoring/persistence owner. It owns spiritual, personality, thinking-pattern and reflection state; derived results are reconstructed from validated answers; answer changes invalidate stale results; repeated calculations are idempotent; storage writes are atomic with respect to memory; old `window.BQ_TRANSFORMATION`/modal/runtime-recovery architecture is not recreated.

### 7B — Basic Transform (#46)

Regression-tested workflow:
- Grow → `#/transform`
- all 12 spiritual dimensions render
- 1–5 ratings persist locally
- calculation is performed only by the Transform engine
- exactly three deterministic focus recommendations render
- explicit non-diagnostic/non-ranking boundary is shown
- completion requests deterministic progress event `transform:spiritual:v1:complete`
- +20 XP and Reflection metric award exactly once per v3 assessment version
- reload/reopen restores result without duplicate XP
- editing an answer invalidates the old result and recalculation does not farm XP
- reset clears spiritual answers/result
- failed progress write after result persistence heals on reopen through the same deterministic event
- guest workflow makes no Supabase request
- desktop and 390px mobile workflows pass, including 44px rating targets and no horizontal overflow

### 7C — Full Transform (#47)

Verified workflow:
- native Full Transform mode uses the same `src/engines/transform.js` and `src/app/transform.js` owners
- all 20 personality prompts render and produce deterministic five-factor tendency output
- all five thinking-pattern scenarios render and produce bounded recommendations
- completion records deterministic `transform:full:v1:complete` progress exactly once
- +35 XP and assessment/reflection counters are idempotent across reload and recalculation
- private reflection/journal fields and history persist across reload
- changing a completed section invalidates only that section until recalculated
- switching back to Basic restores the Basic workflow without creating another Transform owner
- guest Full Transform does not contact Supabase
- desktop and 390px mobile browser workflows pass with no horizontal overflow and >=44px response targets
- the accumulated v3 regression suite passed at `16a611708f55147008aa00b361309cbd1dc9999d` after the Full Transform progress-contract repair

## Next major milestone

Milestone 8 — Audio / Live Recordings (#57–60), followed by Media Library (#61). The rebuild must introduce one audio/player owner and one recording-session owner. Required acceptance includes list load, play, pause, seek/stop where supported, switching sources, leaving and returning, teardown without duplicate players/listeners, error recovery, and mobile behavior. Old Live Recordings freeze-prone runtime logic is reference material only and must not be copied as the v3 architecture.

## Defect / root-cause ledger

- `V3-ROUTER-001` — single synchronous router fixed URL/view drift.
- `V3-AUTH-GATE-001` — static Supabase version pin is architecture-auditable.
- `V3-SHELL-001` — brand and primary navigation selectors are distinct.
- `V3-SIGNUP-001` — recovery-code issuance is independent from optional auto-sign-in.
- `V3-ACCOUNT-ACCEPTANCE-001` — duplicate signup and post-recovery login are explicit tests.
- `V3-READER-ACCEPTANCE-001` — invalid search respects native form validation.
- `V3-PROGRESS-UI-001` — static label readability is separate from touch-target semantics.
- `V3-TRANSFORM-OWNER-001` — Basic orchestration initially defined a second `calculateSpiritual` function name. The architecture gate correctly rejected the semantic owner collision. The orchestration action is `completeBasicAssessment`; only `src/engines/transform.js` defines `calculateSpiritual`.
- `V3-TRANSFORM-PROGRESS-001` — Full Transform emitted an `assessments` progress metric that the single progress owner did not yet recognize. `src/core/progress.js` now owns and persists the `assessments` counter, and `tests/v3-progress-edge.mjs` explicitly verifies acceptance, persistence, reload normalization and continued rejection of unknown metric names.

## Release rule

Freeze `release/v3.7-transform-complete` only after the final inventory/status/timeline bookkeeping commit passes the entire accumulated v3 regression suite. After that exact freeze, automatic v3 push-triggered Actions must be removed and development continues from the frozen release into Milestone 8.
