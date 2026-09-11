# A2 Contract Investigation — #40 Kids Bible Who Am I

Agent: `BQ-A2-CONTRACT`
Date: 2026-09-11 JST
Role: product read-only contract/provenance investigation

## Exact state

- **FACT — latest frozen v3 release:** `release/v3.71-japanese-furigana` = `c631bea8d5177a9a2ff68139cb104b6fbf26015b`.
- **FACT — preceding canonical:** `feature/v3-japanese-furigana` = the same exact SHA `c631bea8d5177a9a2ff68139cb104b6fbf26015b`; #15 is frozen, not the active product implementation anymore.
- **FACT — authoritative inventory at `c631bea...`:** 97 Regression-tested / 1 Verified / 0 Implemented / 2 Not started. #40 `Kids Bible Who Am I` is the next reopened parity item. #39 remains explicitly deferred.
- **FACT — #40 canonical product branch:** no `feature/v3-*who-am-i*` / #40 canonical product branch was found at inspection time.
- **FACT — #40 A1 candidate:** no `agent/a1-work/040*` branch was found.
- **FACT — contract-extraction verifier:** `verify/v3-kids-who-am-i-contract-20260911` exists as a temporary investigation verifier. Run `34548719730` executed at temporary verifier SHA `5fba6ef694df751abbe899724a15971543982a89`, succeeded, recovered a historical Kids Games bundle from source ref `e666e84e86ac677bfe3e817539076a52a27dfcbd`, uploaded artifact `retained-kids-games-contract`, and the verifier branch was subsequently reset away from that temporary commit. This is investigation evidence, not a #40 product candidate or promotion gate.
- **FACT — frozen v3.71 exact bookkeeping evidence:** verifier run `34550650269` succeeded. Its job included an explicit exact-bookkeeping-candidate assertion followed by accumulated architecture validators, accumulated edge regressions, and accumulated browser/mobile regressions for product SHA `c631bea8d5177a9a2ff68139cb104b6fbf26015b`.

## Authoritative inventory contract

At frozen `c631bea...`, row #40 states:

> `Kids Bible Who Am I` — Old version: Yes; v2 availability: Clean; v3: Not started; required verification: `priority reopened; recover exact old-version Kids Bible Who Am I contract and Games-owner boundary before implementation; then focused + accumulated browser/mobile verification`.

This row deliberately does **not** authorize invention of a new child-specific question bank, scoring model, persistence owner, reward model, or standalone game engine.

## Primary retained/v2 evidence

### Clean v2 implementation

**FACT:** `bq2-games.js` on `rebuild-v2-parity-import` contains the clean Kids Games launcher. Its three children are Memory Match, Hiragana Match, and `Bible Who Am I?`.

The #40 tile is defined as:

- title: `Bible Who Am I?`
- description: `Easy character clues for family play.`
- click handler: `$('#kidBible').onclick=detective`

The same file defines the ordinary Games `Who Am I?` / Character Detective entry and the single shared `detective()` implementation.

**FACT:** therefore the clean v2 #40 behavior is not a second detective engine. The Kids launcher delegates directly to the same `detective()` function used by the ordinary Who Am I game.

### Exact shared v2 detective behavior

The clean v2 `detective()` function:

1. chooses one item from shared `BQ_DETECTIVES` data;
2. starts with one clue visible;
3. supports `Reveal another clue`, one clue at a time up to the item's clue count;
4. accepts a free-text answer;
5. checks the trimmed lowercase input against the item's answer;
6. reveals the canonical answer and Scripture reference after checking;
7. records activity through the existing application activity owner, with reward dependent on correctness and number of clues shown;
8. does not create a separate Kids storage key, game engine, data bank, account/cloud owner, or server boundary.

### Historical Kids Games extraction

**FACT:** run `34548719730` successfully reconstructed an older compressed Kids Games/BrainBloom bundle from historical ref `e666e84...`. Its logged searches found Memory Meadow and Japanese/Kana games but did **not** find `Who Am I`, `whoami`, or Bible-character game evidence in either recovered `app.js` or `classic/app.js`.

**CONCLUSION:** that historical BrainBloom bundle is useful provenance for other Kids games but is **not** affirmative provenance for #40. It must not be used to invent a separate #40 contract. The clean v2 `bq2-games.js` is the direct primary implementation evidence currently found for #40.

## Current verified v3 owner

**FACT:** at frozen `c631bea...`, Character Detective already exists inside the single Games owner.

`src/app/games.js`:

- imports `DETECTIVE_MODE` / `DETECTIVES`;
- owns `startDetective()`, `answerDetective()`, `replayDetective()`;
- uses shared Games round identity;
- writes activity only through the verified Progress owner;
- persists ordinary Games result metadata through the existing Storage owner;
- rejects duplicate answer application after lock;
- exposes no separate Kids detective persistence/backend owner.

`src/features/games/index.js` already renders the Character Detective interaction, including clues, free-text input, answer/reference feedback, replay, and launcher return.

`src/features/games/detectives.js` defines the current shared Character Detective mode and five Scripture-referenced character records: David, Joseph, Zacchaeus, Esther, and Peter.

## Contract finding

### FACT

The strongest clean retained/v2 evidence says #40 was a **Kids Games navigation/presentation entry into the already-shared Character Detective behavior**, not an independently owned game implementation.

### INFERENCE

The dependency-safe v3 parity implementation should therefore be narrow: expose a Kids-facing `Bible Who Am I?` entry under the existing Games owner and delegate to the existing verified Character Detective lifecycle/data owner rather than cloning detective logic.

The phrase `Easy character clues for family play` establishes intended Kids-facing presentation/context, but by itself does **not** prove that a distinct easy-only data subset historically existed, because the actual clean v2 click handler calls the same `detective()` function and shared detective dataset.

### RECOMMENDATION

Do not create a new Kids Bible question bank, scoring algorithm, Progress path, Storage key, round owner, persistence layer, backend path, or second detective state machine unless new primary historical evidence proves that the clean v2 delegation omitted an independently retained old-version behavior.

The minimum contract-preserving design is:

1. keep Games as the sole launcher/lifecycle owner;
2. provide a Kids-facing `Bible Who Am I?` launch surface;
3. delegate launch/answer/replay/cleanup to the existing Character Detective owner;
4. preserve shared Scripture-referenced detective content unless direct old-version evidence proves a Kids-specific bank;
5. preserve the existing verified Progress/Storage ownership boundaries rather than reproducing old v2 activity-write details as a second path;
6. verify launcher entry, full round, answer/reference feedback, replay, leave/cleanup, mobile behavior, and absence of duplicate ownership;
7. run focused tests plus the complete accumulated suite on the exact eventual candidate SHA.

## Acceptance contract A2 can support from primary evidence

For an eventual #40 candidate, A2 can presently support the following as parity requirements:

- A Kids Games surface visibly exposes `Bible Who Am I?` or an unambiguous equivalent Kids-facing entry.
- Launch enters the existing Character Detective experience through the Games owner.
- A character is presented through Scripture-based clues.
- The player can submit a free-text character answer.
- Feedback identifies correctness / correct answer and exposes the Scripture reference.
- Replay produces another detective round through the existing owner.
- Leaving returns through normal Games cleanup/launcher behavior.
- No second detective engine/data owner/persistence owner is introduced.
- Mobile/browser verification and the complete accumulated regression suite are required before parity promotion.

A2 does **not** currently support as recovered parity facts: a separate Kids-only detective dataset, a fixed number of Kids rounds, child-specific XP values, child-specific rewards, a separate scoring formula, a separate storage schema, or a distinct server/cloud behavior.

## Missing evidence

- No #40 product canonical branch exists yet.
- No `agent/a1-work/040*` exact candidate exists yet.
- No exact #40 functional or accumulated product run exists yet.
- No primary evidence found so far establishes a Kids-only subset of detective records or a separate historical #40 reward/scoring model.
- The older compressed Kids Games bundle recovered by run `34548719730` contains no affirmative #40 implementation evidence; its absence does not prove #40 never existed elsewhere historically.

## TRIAGE cross-check performed after provisional findings

`automation/TRIAGE.md` was read only after the above contract/provenance finding was formed. It is materially stale against live repository state: it still describes #38/v3.70 as active and defers #15 product implementation, while primary refs now show immutable `release/v3.71-japanese-furigana` at `c631bea...` and the authoritative inventory marks #15 Verified and #40 as the next reopened parity item.

The TRIAGE instruction that read-only #40 contract recovery may continue is consistent with this A2 activity, but its older active-state conclusions are not used as evidence here.

## Staleness conditions

This report becomes stale if any of the following changes:

- a #40 canonical branch appears;
- an `agent/a1-work/040*` candidate appears;
- new retained/v2 primary evidence establishes a distinct Kids-specific detective bank or lifecycle;
- the existing Character Detective owner/data contract changes;
- the frozen baseline advances beyond `release/v3.71-japanese-furigana` / `c631bea...`;
- an exact #40 verification run executes;
- the authoritative inventory changes #40 status or contract.

## A2 disposition

**Contract recovery is sufficient to prevent unnecessary duplication, but #40 remains pre-implementation.** Primary evidence supports implementing #40 as a Kids-facing alias/entry into the existing Games-owned Character Detective lifecycle, not as a new game subsystem. No product PASS, implementation claim, or promotion recommendation is made by A2.
