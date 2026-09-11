# A2 Contract Investigation — #40 Kids Bible Who Am I

Agent: `BQ-A2-CONTRACT`
Date: 2026-09-11 JST
Role: product read-only contract/provenance investigation

## Exact state

- **FACT — latest frozen v3 release:** `release/v3.71-japanese-furigana` = `c631bea8d5177a9a2ff68139cb104b6fbf26015b`.
- **FACT — active #40 canonical product branch:** none found at inspection time.
- **FACT — #40 A1 candidate:** no `agent/a1-work/040*` branch was found.
- **FACT — authoritative inventory at `c631bea...`:** 97 Regression-tested / 1 Verified / 0 Implemented / 2 Not started. #40 `Kids Bible Who Am I` is the next reopened parity item. #39 remains explicitly deferred.
- **FACT — immutable retained/v2 reference inspected:** `release/v2-parity-snapshot` = `825de10b36c7f9b511cc8cab88aa3a6ce79ef939`.
- **FACT — frozen v3.71 exact bookkeeping evidence:** run `34550650269` succeeded. The executed workflow checked out and asserted exact product SHA `c631bea8d5177a9a2ff68139cb104b6fbf26015b`, then completed accumulated architecture validators, edge regressions, and browser/mobile regressions successfully.

## Authoritative inventory contract

At frozen `c631bea...`, row #40 states:

> `Kids Bible Who Am I` — Old version: Yes; v2 availability: Clean; v3: Not started; required verification: `priority reopened; recover exact old-version Kids Bible Who Am I contract and Games-owner boundary before implementation; then focused + accumulated browser/mobile verification`.

This row does **not** authorize invention of a child-specific question bank, scoring model, persistence owner, reward model, backend path, or standalone game engine.

## Primary retained/v2 evidence

### Immutable v2 parity snapshot

**FACT:** `bq2-games.js` at immutable retained ref `release/v2-parity-snapshot` / `825de10b36c7f9b511cc8cab88aa3a6ce79ef939` contains both the ordinary `Who Am I?` game and the Kids Games launcher.

The Kids tile is defined as:

- title: `Bible Who Am I?`
- description: `Easy character clues for family play.`
- click handler: `$('#kidBible').onclick=detective`

The ordinary Games launcher also routes its `detective` mode to the same `detective()` function. The single shared function selects from the same shared `BQ_DETECTIVES` dataset, reveals clues, accepts free-text input, checks the answer, exposes answer/reference feedback, and records activity through the existing application owner.

**FACT:** the retained clean v2 behavior is therefore delegation, not a second Kids detective engine.

**FACT:** the retained v2 parity matrix independently identifies `Character detective` and `Kids games` as clean capabilities under the same `bq2-games.js` owner.

### Contract limits from retained evidence

**FACT:** no separate Kids detective data bank, Kids-only storage key, separate state machine, separate account/cloud owner, or distinct server boundary appears in the retained v2 implementation inspected.

**INFERENCE:** the phrase `Easy character clues for family play` describes the Kids-facing presentation/context. It does not establish a historically separate easy-only dataset because the actual retained click handler delegates to the shared detective function and shared data.

**RECOMMENDATION:** do not infer a separate Kids-only bank, fixed Kids round count, child-specific reward formula, or separate persistence/backend behavior without new primary historical evidence.

## Current verified v3 owner

**FACT:** at frozen `c631bea...`, Character Detective already exists inside the single Games owner.

`src/app/games.js`:

- imports `DETECTIVE_MODE` / `DETECTIVES`;
- includes Character Detective in the shared Games mode registry;
- routes the shared `start()` owner into `startDetective()` for detective entry;
- owns `startDetective()`, `answerDetective()`, `replayDetective()` and shared round identity;
- rejects duplicate answer application after the round is locked;
- records detective activity through the existing verified Progress owner;
- persists ordinary Games result metadata through the existing Storage owner;
- exposes no separate Kids detective persistence or backend owner.

`src/features/games/index.js` already renders the shared Character Detective interaction, including Scripture-based clues, free-text answer input, answer/reference feedback, replay, and return to the Games launcher.

`src/features/games/detectives.js` defines the current shared mode plus five Scripture-referenced records: David, Joseph, Zacchaeus, Esther, and Peter.

## Exact workflow evidence

**FACT:** run `34550650269` is baseline evidence for exact frozen product SHA `c631bea8d5177a9a2ff68139cb104b6fbf26015b`, not evidence for a future #40 SHA.

Its workflow explicitly:

1. checks out `c631bea8d5177a9a2ff68139cb104b6fbf26015b`;
2. asserts that exact SHA;
3. executes accumulated architecture validators;
4. executes accumulated edge regressions;
5. installs Chromium and starts the v3 app;
6. executes accumulated browser/mobile regressions.

The job completed `success`, including all three accumulated validation phases. No PASS is transferable to a future #40 candidate.

## Contract finding

### FACT

The strongest retained/v2 primary implementation evidence says #40 was a **Kids-facing navigation/presentation entry into the already-shared Character Detective behavior**, not an independently owned game implementation.

### INFERENCE

The dependency-safe v3 parity implementation should remain narrow: expose a Kids-facing `Bible Who Am I?` entry under the existing Games owner and delegate to the existing verified Character Detective lifecycle/data owner rather than cloning detective logic.

### RECOMMENDATION

Do not create a new Kids Bible question bank, scoring algorithm, Progress path, Storage key, round owner, persistence layer, backend path, or second detective state machine unless new primary historical evidence proves an independently retained old-version behavior.

The minimum contract-preserving design is:

1. keep Games as the sole launcher/lifecycle owner;
2. provide a Kids-facing `Bible Who Am I?` launch surface;
3. delegate launch/answer/replay/cleanup to the existing Character Detective owner;
4. preserve shared Scripture-referenced detective content unless direct old-version evidence proves a Kids-specific bank;
5. preserve existing verified Progress/Storage ownership boundaries rather than reproducing old v2 activity-write details as a second path;
6. verify launcher entry, full round, answer/reference feedback, duplicate-submit protection, replay, leave/cleanup, mobile behavior, and absence of duplicate ownership;
7. run focused tests plus the complete accumulated suite on the exact eventual candidate SHA.

## Acceptance contract A2 can support from primary evidence

For an eventual #40 candidate, A2 can presently support:

- A Kids Games surface visibly exposes `Bible Who Am I?` or an unambiguous equivalent Kids-facing entry.
- Launch enters the existing Character Detective experience through the Games owner.
- A character is presented through Scripture-based clues.
- The player can submit a free-text character answer.
- Feedback identifies correctness / the correct answer and exposes the Scripture reference.
- Replay produces another detective round through the existing owner.
- Leaving returns through normal Games cleanup/launcher behavior.
- Duplicate answer application does not create duplicate Progress/result writes.
- No second detective engine, data owner, persistence owner, or backend owner is introduced.
- Focused browser/mobile verification and the complete accumulated regression suite are required on the exact implementation candidate before parity promotion.

A2 does **not** currently support as recovered parity facts: a separate Kids-only detective dataset, a fixed number of Kids rounds, child-specific XP values, child-specific rewards, a separate scoring formula, a separate storage schema, or distinct server/cloud behavior.

## Missing evidence

- No #40 canonical product branch exists yet.
- No `agent/a1-work/040*` exact candidate exists yet.
- No exact #40 functional, focused, or accumulated product run exists yet.
- No primary evidence found establishes a Kids-only detective subset or distinct historical #40 reward/scoring model.
- No current implementation diff exists from which to assess whether eventual #40 work remains within the recovered single-owner boundary.

## TRIAGE cross-check performed after provisional findings

`automation/TRIAGE.md` was read only after the above state, retained-source, owner, and workflow findings were independently established.

**FACT:** TRIAGE is now current for this pre-implementation state: it identifies #40 as active/pre-implementation, records no canonical or `agent/a1-work/040*` candidate, records frozen v3.71 at exact `c631bea...`, and treats bounded #40 as provisional NORMAL-RISK while preserving the existing #38/#93 firewall blockers.

**FACT:** TRIAGE agreement is corroborative only; none of the contract conclusions above depend on it.

## Staleness conditions

This report becomes stale immediately if any of the following changes:

- a #40 canonical branch appears or moves;
- an `agent/a1-work/040*` candidate appears or moves;
- new retained/v2 primary evidence establishes a distinct Kids-specific detective bank or lifecycle;
- the existing Character Detective owner/data contract changes;
- the frozen baseline advances beyond `release/v3.71-japanese-furigana` / `c631bea...`;
- an exact #40 verification run executes;
- the authoritative inventory changes #40 status or contract;
- accumulated workflow coverage is changed or weakened.

## A2 disposition

**Contract recovery is sufficient for implementation planning, but #40 remains pre-implementation.** Primary evidence supports #40 as a Kids-facing entry into the existing Games-owned Character Detective lifecycle, not a new game subsystem. No product PASS, implementation claim, or promotion recommendation is made by A2.
