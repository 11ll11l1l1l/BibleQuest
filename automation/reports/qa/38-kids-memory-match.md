# A4 QA regression audit — #38 Kids Memory Match

Agent: `BQ-A4-QA`

## Exact state inspected

- Canonical branch: `feature/v3-kids-memory-match`
- Canonical HEAD: `ba4394a1c6acaf62a9f24b1883b5ec5ec4d12be9`
- Dedicated `agent/a1-work/038*` candidate: **not found**
- Frozen base: `release/v3.69-bible-world-artwork` @ `368b4e905c94ede38e733585d151891c7bdca96b`
- Exact functional/product SHA exercised by the available isolated verification run: `918762b11d3487d07880449bb37264da1e33ace3`
- Verification branch/workflow SHA: `agent/a1-verify/038-kids-memory-match` @ `64418e97cd5852258cb22222cc4d4d34a45aa8c2`
- Exact run inspected: `34546962603` — **SUCCESS**

This report becomes stale immediately if any canonical/candidate/frozen SHA changes, a `038` work candidate appears, the permanent workflow/test set changes, the deleted capability regression is restored/replaced, or a newer exact-SHA verification run supersedes the evidence below.

## Authoritative acceptance

**FACT:** `FEATURE_INVENTORY_V3.md` is the authoritative parity ledger. At canonical `ba4394a1...`, row #38 is marked **Verified** and requires:

- Memory Meadow under Games ownership;
- `<420px`: 6 pairs / 3 columns;
- `>=420px`: 8 pairs / 4 columns;
- 350 ms match lock / 650 ms mismatch lock;
- replay/leave cleanup;
- unique round identity;
- stars + coins through Progress with zero XP;
- complete accumulated browser/mobile verification.

**FACT:** the same inventory states that a row is Verified only when its acceptance workflow has passed in the v3 browser regression suite.

## Exact execution evidence

**FACT:** run `34546962603` completed successfully. Its isolated workflow did not merely test the verification-branch checkout: it fetched, checked out and asserted exact product SHA `918762b11d3487d07880449bb37264da1e33ace3` before executing the accumulated suite.

**FACT:** the run completed the accumulated architecture, edge/security and browser/mobile phases successfully; no phase skip was observed in the run/jobs evidence inspected.

**FACT:** the executed/current accumulated workflow contains the #38 architecture validator and a substantial permanent #38 regression set, including `v3-kids-memory-edge`, architecture/UI-contract, Progress integration, round identity, exit/cleanup, reward curve, API surface, invalid-input, immutability, no-XP, width-contract, delay tests, and the browser/mobile Memory regression, while retaining the observed earlier accumulated milestone invocations.

**FACT:** there is no Actions run whose `head_sha` is current canonical `ba4394a1c6acaf62a9f24b1883b5ec5ec4d12be9`, and no run on `feature/v3-kids-memory-match` was returned by the branch-scoped query at inspection time.

**QA RULE:** PASS is not transferred from `918762b...` to `ba4394a1...`. The successful run is therefore recorded only as exact execution evidence for `918762b...`.

## Regression weakening found

**FACT:** canonical lineage commit `918762b11d3487d07880449bb37264da1e33ace3` removed `tests/v3-kids-memory-lazy-progress-capability.mjs`.

That deleted permanent test covered two distinct behaviors:

1. Games/Memory construction with a minimal Progress capability lacking `getState()`; and
2. launching Memory Meadow without `Progress.getState()` fails loudly instead of silently accepting an unusable Progress owner.

**FACT:** current `tests/v3-content-moderation-edge.mjs` gives primary evidence for the first behavior: Games/Memory can be constructed with a minimal Progress stub exposing `record()`.

**FACT:** the inspected permanent tests do **not** provide assertion-equivalent coverage for the second deleted behavior. In particular, the existing invalid-input coverage does not exercise the launch-without-`Progress.getState()` fail-loud contract.

**INFERENCE:** the claim that accumulated moderation coverage wholly replaces the deleted capability regression is not supported by the inspected primary evidence. The removal therefore weakens an accumulated #38 regression unless/until an equivalent permanent assertion is demonstrated or restored.

Under the A4 guardrail, unexplained weakening/removal/bypass of accumulated regression coverage is not acceptable.

## Risk and promotion disposition

**FACT:** #38 changes the already-established persistent Progress owner to carry/persist stars and coins for Memory rewards while preserving zero XP for this game. This is broader than a presentation-only child-game change.

**INFERENCE / QA classification:** treat #38 as **HIGH-RISK for promotion review** because it changes a verified persistent/global owner boundary. HIGH-RISK policy requires an exact-candidate A4 review before autonomous bookkeeping/promotion.

**FACT:** no `agent/a1-work/038*` candidate exists at the inspected live state. Therefore there is no exact candidate SHA for A4 to mark READY.

**FACT:** current canonical `ba4394a1...` is already bookkeeping/closure state and the authoritative inventory marks #38 Verified.

**A4 disposition:** **NOT READY / QA BLOCKING ISSUE PRESENT.** Do not treat this report as a PASS for `ba4394a1...`, and do not transfer the successful `918762b...` run across SHAs.

The minimum evidence needed to clear A4 is:

1. restore `v3-kids-memory-lazy-progress-capability.mjs` or add a permanent assertion-equivalent regression proving Memory launch fails loudly when required Progress capability is absent;
2. ensure the exact accumulated workflow invokes that regression and retains all prior coverage;
3. provide an exact HIGH-RISK candidate SHA (or other control-plane-authorized exact candidate state) for independent A4 review;
4. run the accumulated workflow against that exact candidate and obtain green architecture, edge/security and browser/mobile phases;
5. only then perform bookkeeping/promotion from the exact reviewed candidate under the control-plane rules.

## TRIAGE comparison — read only after provisional QA findings

**FACT:** `automation/TRIAGE.md` is stale relative to primary repository state. It still identifies #45 Bible World artwork as active and explicitly defers beginning #38, while live canonical/inventory evidence now shows #38 implemented and marked Verified.

**FACT:** TRIAGE also carries older #93/#94 governance blockers. This A4 report does not adjudicate or override A5's firewall classification; it reports the independent #38 QA issue above.

## Staleness conditions

Re-audit before relying on this report if any of the following occurs:

- `feature/v3-kids-memory-match` moves from `ba4394a1c6acaf62a9f24b1883b5ec5ec4d12be9`;
- an `agent/a1-work/038*` candidate appears or changes;
- `release/v3.69-bible-world-artwork` no longer represents the inspected frozen base;
- the #38 contract/inventory changes;
- the permanent accumulated workflow changes;
- the deleted capability regression is restored/replaced;
- a newer exact verification run is produced;
- A5 changes the applicable HIGH-RISK promotion controls.
