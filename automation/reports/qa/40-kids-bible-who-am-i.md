# A4 QA / Regression — #40 Kids Bible Who Am I

Identity: `BQ-A4-QA`

## STATE / PROVENANCE

- Active parity target: **#40 Kids Bible Who Am I**.
- Frozen base: `release/v3.71-japanese-furigana` @ exact `c631bea8d5177a9a2ff68139cb104b6fbf26015b`.
- Dedicated canonical #40 branch: **not found**.
- Dedicated `agent/a1-work/040*` candidate: **not found**.
- Exact frozen bookkeeping run: `34550650269` = **SUCCESS**.
- Run `34550650269` explicitly checked out and asserted exact SHA `c631bea8d5177a9a2ff68139cb104b6fbf26015b`, then executed accumulated architecture validators, edge regressions, and browser/mobile regressions.
- No PASS from v3.71 transfers to any future #40 candidate or bookkeeping SHA.
- `automation/CURRENT.md` is stale (#75/v3.48 era) and was not used as product-state authority.

## PRIMARY EVIDENCE INSPECTED BEFORE TRIAGE

1. `FEATURE_INVENTORY_V3.md` at `c631bea8...`: totals 97 Regression-tested / 1 Verified / 2 Not started; #40 is the next reopened parity item; #39 is explicitly deferred.
2. `DEVELOPMENT_HANDOFF_V3.md` at `c631bea8...`: #40 is the next active parity target after v3.71 and requires historical mapping before implementation.
3. Live branch searches: no canonical #40 product branch and no `agent/a1-work/040*` work candidate.
4. Exact Actions run `34550650269`, job `103112654823`, including decoded job logs showing exact checkout/assertion of `c631bea8...` and the actual lists of architecture, edge, and browser/mobile tests executed.
5. Current accumulated Games/Kids Memory coverage on v3.71, including the exact executed edge list and browser/mobile list.
6. Commit `918762b11d3487d07880449bb37264da1e33ace3`, which deleted `tests/v3-kids-memory-lazy-progress-capability.mjs`.
7. `tests/v3-content-moderation-edge.mjs` at v3.71, which exercises Games construction/other moderation behavior but does not launch Memory Meadow without `Progress.getState()`.
8. `tests/v3-admin-operations-edge.mjs` at v3.71, which injects a mocked privileged API for status/dashboard/deleteUser behavior.
9. Only after these provisional findings: `automation/TRIAGE.md`.

## FACTS

- #40 remains **pre-implementation**. There is no exact product candidate to audit.
- The authoritative inventory requires exact contract/owner recovery before #40 implementation and focused + accumulated browser/mobile verification afterward.
- Exact baseline run `34550650269` is genuinely green for `c631bea8...`; however its executed edge list does **not** include `tests/v3-kids-memory-lazy-progress-capability.mjs` because that regression had been deleted before v3.71.
- Commit `918762b...` deleted two semantic assertions from that test: (1) Memory Meadow child construction with a minimal `Progress.record()` capability and (2) fail-loud launch when required Progress balance state / `Progress.getState()` is unavailable.
- The retained `v3-content-moderation-edge.mjs` does not execute the second launch/fail-loud scenario. Therefore the successful v3.71 accumulated suite can remain green while that specific launch-time contract regresses.
- `tests/v3-admin-operations-edge.mjs` exercises the client service with a mocked `api.deleteUser()` and mocked authorization/status responses. It does not execute the production trusted destructive-account authorization boundary. Thus its green result is not faithful server-authority evidence for #93.
- These are accumulated-harness evidence defects that predate #40; they are not invented #40 product requirements.

## #40 ACCEPTANCE MATRIX FOR FIRST CANDIDATE

A future exact #40 candidate must prove all applicable recovered behavior with permanent coverage:

1. **Kids entry / routing** — the recovered Kids-facing `Bible Who Am I?` entry exists in the intended surface and opens the existing Character Detective experience.
2. **Single Games owner** — no second launcher, detective state machine, Progress owner, Storage owner, scoring owner, or backend path.
3. **Recovered contract only** — content/entry/scoring/reward semantics follow retained/v2 primary evidence; no Kids-only bank or behavior is invented without evidence.
4. **Real full-round behavior** — clue display, text entry, submission, correct/incorrect feedback, Scripture reference, score/reward behavior, replay, and return through the real UI.
5. **Duplicate-submit protection** — tap/click/Enter after lock cannot double-score or double-award.
6. **Round identity / result writes** — one meaningful round/result identity and no duplicate Progress/Storage writes.
7. **Replay/leave cleanup** — no stale listeners, state, locks, timers, or duplicate handlers after replay or launcher/back navigation.
8. **390 px mobile browser acceptance** — reachable entry, readable clues/reference, usable input/actions, no horizontal overflow, no browser errors.
9. **Keyboard acceptance** — input and Enter submission behave once and respect locking.
10. **Accumulated integrity** — the exact executed workflow invokes permanent #40 validator/edge/browser coverage and all prior required accumulated coverage.
11. **Pre-existing harness repairs retained** — assertion-equivalent #38 fail-loud Progress-capability coverage and faithful #93 trusted-boundary evidence must be present and executed in the candidate accumulated suite if those baseline blockers are corrected before #40 starts.

## NEGATIVE / EDGE CASES

- Blank/whitespace answer follows recovered behavior without corrupting state.
- Wrong answer locks once and cannot be farmed for reward.
- Correct answer locks once and cannot double-award.
- Replay creates one clean new round.
- Leave/relaunch creates one active instance.
- Unknown/unavailable game entry fails safely through the established Games boundary.
- Keyboard Enter cannot bypass answer locking.

## ACCUMULATED HARNESS AUDIT

### Exact v3.71 execution

Run `34550650269`, exact product SHA `c631bea8...`, successfully executed:

- accumulated architecture validators, including `validate-v3-kids-memory.mjs`;
- accumulated edge regressions, including the listed Kids Memory tests through `v3-kids-memory-delays.mjs`;
- accumulated browser/mobile regressions, including `v3-games-smoke.mjs` and `v3-kids-memory-browser.mjs`.

### Confirmed weakening / missing faithful evidence

**#38:** `v3-kids-memory-lazy-progress-capability.mjs` is absent from v3.71 and absent from the exact executed edge list. The deleted fail-loud launch assertion has no assertion-equivalent permanent test located in the executed suite.

**#93:** `v3-admin-operations-edge.mjs` uses a mocked privileged API. Its PASS does not prove the actual trusted server authorization/delete boundary.

These issues mean the green v3.71 run is valid as evidence of what it actually executed, but it is not sufficient evidence that the complete intended accumulated semantic protection remains intact.

## EXACT RUN REQUIREMENTS FOR FUTURE #40 SHA

For candidate SHA `X`:

- focused #40 tests execute against exact `X`;
- complete architecture validators execute against exact `X`;
- complete edge/security suite executes against exact `X`;
- complete browser/mobile suite executes against exact `X`;
- logs visibly show #40 permanent tests plus retained/repaired prior coverage;
- no existing test is deleted, skipped, narrowed, renamed away, or replaced with weaker evidence;
- if bookkeeping creates SHA `Y`, `Y` receives its own complete exact-SHA gate; PASS from `X` does not transfer.

## FAILURES / BLOCKING QA FINDINGS

1. **Accumulated regression weakening — #38:** the explicit Memory Meadow fail-loud launch regression was deleted and is not assertion-equivalently retained in the exact v3.71 executed suite.
2. **Missing faithful trusted-boundary evidence — #93:** Admin Operations destructive authorization remains client-mock coverage rather than executable/faithful production-boundary evidence.
3. **#40 itself:** no candidate exists, so there is no #40 product failure to report.

## MISSING EVIDENCE

- Dedicated canonical #40 branch/HEAD.
- Exact `agent/a1-work/040*` candidate SHA.
- Permanent #40 validator/edge/browser tests.
- Exact #40 functional run ID and logs.
- Later exact bookkeeping SHA/run.
- Assertion-equivalent permanent #38 fail-loud Progress-capability regression in the accumulated harness.
- Faithful executable #93 destructive-account trusted-boundary authorization evidence.

## QA DISPOSITION

**PRE-IMPLEMENTATION / NOT READY.**

#40 has no candidate yet. Independently, the current accumulated harness contains two material evidence debts that can remain green while protected behavior/security authority regresses (#38 fail-loud launch capability and #93 trusted destructive authorization). A future #40 candidate must not be treated as promotion-ready merely because it inherits v3.71 green status.

If #40 remains a bounded entry into the existing Games/Character Detective owner with additive tests only, it is provisionally NORMAL-RISK. Any modification to existing accumulated tests/workflow, verified-owner replacement, global shell/router ownership, persistence/sync semantics, dependencies, schema/RLS, or trusted backend behavior reclassifies it HIGH-RISK and requires exact-candidate A4/A5 review before promotion.

## TRIAGE RECONCILIATION (READ AFTER PROVISIONAL FINDINGS)

Current `automation/TRIAGE.md` (generated 2026-09-11 11:00 JST) is now aligned with the live pre-implementation #40 state: frozen `c631bea8...`, no #40 candidate, provisional NORMAL-RISK, and the same two accumulated-evidence blockers. TRIAGE agreement is corroboration only and was not used to establish the findings above.

## STALENESS CONDITIONS

This report becomes stale when any of the following occurs:

- a canonical #40 branch appears or moves;
- an `agent/a1-work/040*` candidate appears or changes SHA;
- frozen baseline advances beyond `c631bea8...`;
- #40 authoritative contract/inventory changes;
- #40 permanent tests/workflow invocations appear/change;
- #38 fail-loud coverage or #93 trusted-boundary evidence is repaired/changed;
- an exact #40 functional or bookkeeping run completes.
