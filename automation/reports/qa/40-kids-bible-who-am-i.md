# A4 QA / Regression — #40 Kids Bible Who Am I

Identity: `BQ-A4-QA`

## STATE / PROVENANCE

- Active parity target from authoritative inventory: **#40 Kids Bible Who Am I**.
- Latest frozen v3 baseline: `release/v3.71-japanese-furigana` @ `c631bea8d5177a9a2ff68139cb104b6fbf26015b`.
- Dedicated canonical product branch for #40: **not found**.
- Dedicated `agent/a1-work/040*` candidate: **not found**.
- The only similarly named branch found is `verify/v3-kids-who-am-i-contract-20260911` @ `ba4394a1c6acaf62a9f24b1883b5ec5ec4d12be9`; this is not a #40 product candidate and predates v3.71.
- Exact baseline accumulated bookkeeping run: `34550650269` = **SUCCESS**. Its job explicitly asserted the bookkeeping candidate and completed accumulated architecture, edge/security, and browser/mobile phases.
- No PASS is transferred from the v3.71 baseline to a future #40 SHA.

## PRIMARY EVIDENCE INSPECTED

1. `FEATURE_INVENTORY_V3.md` at `c631bea8...`: #40 is `Not started`, priority reopened, and requires recovery of the exact old-version Kids Bible Who Am I contract and Games-owner boundary before implementation, followed by focused + accumulated browser/mobile verification.
2. `src/features/games/` at `c631bea8...`: current verified Games owner contains `content.js`, `detectives.js`, `index.js`, `memory.js`, and `timelines.js`.
3. `src/features/games/index.js` at `c631bea8...`: current Character Detective is already rendered and controlled inside the Games launcher lifecycle (`state.phase === 'detective'`), with clue presentation, answer input, locked feedback, replay, launcher return, Scripture reference, score and XP display.
4. GitHub Actions run `34550650269`: complete accumulated baseline gate is green at the v3.71 bookkeeping candidate.
5. Live branch search: no current `agent/a1-work/040*` and no canonical #40 feature branch.
6. `automation/TRIAGE.md` was read only after provisional findings. It is stale relative to current product evidence: it still treats #38/v3.70 as active and defers #40, while the authoritative v3.71 inventory explicitly marks #40 as the next reopened parity item.

## FACTS

- #40 has **no implementation candidate to audit yet**.
- The existing Character Detective implementation is already owned by the current Games service/UI path; a #40 implementation must therefore be tested for reuse/entry-point behavior rather than assumed to require another game owner.
- The authoritative inventory does not authorize inventing a second scoring engine, persistence owner, launcher, question engine, or cloud/backend path for #40.
- Current baseline coverage is green, but that baseline only proves the state before #40 implementation.

## ACCEPTANCE MATRIX FOR THE FIRST #40 CANDIDATE

A future exact candidate should not be marked READY unless permanent tests prove all applicable items below:

1. **Kids entry exists and launches correctly** — the Kids-facing Bible Who Am I entry is visible/reachable in the recovered intended surface and launches the intended Who Am I experience.
2. **Single Games owner** — launch, answer, lock, feedback, replay and leave/cleanup remain under the existing Games owner; no second launcher or parallel detective state machine is introduced.
3. **Recovered contract only** — wording/content/entry behavior follows primary retained/v2 evidence. No Kids-only question bank, reward curve, scoring semantics, persistence behavior or backend behavior may be treated as parity unless primary evidence supports it.
4. **Full round behavior** — clue display, answer submission, correct/incorrect feedback, Scripture reference, score/reward behavior, replay and return to launcher work through the real UI.
5. **Duplicate-action protection** — once an answer is locked, repeated submit/tap/Enter cannot double-score or double-award progress.
6. **Round identity / persistence compatibility** — if the existing Games/Progress owner records a result, #40 must preserve the same single meaningful event semantics and must not create duplicate writes.
7. **Navigation cleanup** — leaving during an active round and returning does not preserve invalid listeners, timers, stale locks or duplicate handlers.
8. **Mobile browser acceptance** — real browser test at 390 px: entry reachable, clues readable, text input usable, submit/replay/return targets usable, no horizontal overflow, no browser errors.
9. **Keyboard acceptance** — text input and submit via keyboard/Enter work once and do not bypass locking.
10. **Accumulated integrity** — the permanent workflow must invoke #40's new validator/edge/browser tests and retain all prior accumulated architecture, edge/security and browser/mobile coverage. No unexplained deletion, skip, narrowing or replacement of existing regressions is acceptable.

## NEGATIVE / EDGE CASES REQUIRED

- Blank/whitespace-only answer follows the recovered product contract without corrupting state.
- Wrong answer locks once and cannot be farmed/re-submitted for extra reward.
- Correct answer locks once and cannot double-award.
- Replay creates a clean new round under the existing owner.
- Back/launcher navigation followed by relaunch produces one active instance only.
- Any malformed/unknown game id or unavailable item fails safely through the established Games boundary.

## EXACT RUN REQUIREMENTS

For a future #40 candidate SHA `X`:

- focused #40 tests must execute against exact `X`;
- complete accumulated architecture validators must execute against exact `X`;
- complete accumulated edge/security regressions must execute against exact `X`;
- complete accumulated browser/mobile regressions must execute against exact `X`;
- the executed workflow must visibly invoke #40's permanent tests and retain prior coverage;
- if bookkeeping changes produce SHA `Y`, `Y` requires its own complete exact-SHA gate. PASS from `X` cannot transfer to `Y`.

## FAILURES

- None observed in a #40 candidate because **no #40 product candidate exists**.

## MISSING EVIDENCE

- Exact canonical #40 branch/HEAD.
- Exact `agent/a1-work/040*` candidate.
- Exact retained/v2 contract evidence packaged with the implementation candidate.
- Permanent #40 validator/edge/browser tests.
- Exact functional run ID for a #40 candidate.
- Exact bookkeeping run ID for a later #40 bookkeeping SHA.

## QA DISPOSITION

**PRE-IMPLEMENTATION / NOT READY FOR PROMOTION.**

This is not a product failure. #40 simply has no exact implementation candidate yet. The first candidate should be evaluated as a bounded extension/entry into the existing Games/Character Detective owner unless its actual diff enters a HIGH-RISK area. If it modifies an existing accumulated test/workflow beyond adding #40 invocations, replaces a verified owner, or broadens persistence/sync/security behavior, reclassify HIGH-RISK and require exact-candidate A4/A5 review before promotion.

## STALENESS CONDITIONS

This report becomes candidate-stale immediately when any of the following occurs:
- a canonical #40 branch is created or moved;
- an `agent/a1-work/040*` candidate appears or changes SHA;
- the latest frozen v3 release moves beyond `c631bea8...`;
- #40's authoritative inventory/contract changes;
- #40 permanent tests/workflow invocations are added/changed;
- a #40 functional or bookkeeping run completes.
