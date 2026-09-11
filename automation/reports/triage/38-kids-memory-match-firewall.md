# A5 Firewall Triage — #38 Kids Memory Match

Agent: `BQ-A5-FIREWALL`
Generated: 2026-09-11 10:00 JST

## Exact live state

- Canonical: `feature/v3-kids-memory-match` @ `ba4394a1c6acaf62a9f24b1883b5ec5ec4d12be9`.
- Dedicated `agent/a1-work/038*` candidate: not found.
- Latest frozen release: `release/v3.70-kids-memory-match` @ `ba4394a1c6acaf62a9f24b1883b5ec5ec4d12be9`.
- Frozen base for #38: `release/v3.69-bible-world-artwork` @ `368b4e905c94ede38e733585d151891c7bdca96b`.
- Exact functional product SHA: `918762b11d3487d07880449bb37264da1e33ace3`; run `34546962603` completed success.
- Exact bookkeeping SHA: `ba4394a1c6acaf62a9f24b1883b5ec5ec4d12be9`; isolated run `34547970159` completed success. Its verifier commit `d4a8a7835ebb5a4cf77bf3fbe91606b9d9378968` explicitly checked out/asserted `ba4394a1c6acaf62a9f24b1883b5ec5ec4d12be9`.
- `918762b... -> ba4394a...` is one documentation/bookkeeping commit; no product/test/workflow files changed in that step.
- Writer lease observed FREE.

## Report freshness

- A2 #38 analyzed `918762b...`: stale for current canonical, but still useful for contract provenance context.
- A3 #38 analyzed `918762b...`: SHA-stale, but the canonical-only delta to `ba4394a...` is bookkeeping/docs, so A5 independently confirms the product trust-boundary facts did not change in that step.
- A4 #38 analyzed current canonical `ba4394a...` and is current. Disposition: NOT READY / QA blocking issue present.
- `automation/CURRENT.md` is materially stale (#75/v3.48 state) and is not used as live product authority.

## Primary-evidence findings

### BLOCKER — accumulated regression weakening in #38

Commit `918762b...` deleted `tests/v3-kids-memory-lazy-progress-capability.mjs`. The deleted test asserted both constructor compatibility with a minimal Progress capability and fail-loud behavior when Memory Meadow is launched without required `Progress.getState()` capability. Current `tests/v3-content-moderation-edge.mjs` proves only the constructor side by constructing Games with a `progress` stub exposing `record()`; it does not launch Memory Meadow and therefore does not preserve the second assertion.

Counterfactual: if this is ignored, a future Progress/Memory capability regression can silently lose the explicit launch-time fail-loud contract while the accumulated suite remains green. Master control explicitly treats unexplained deletion/weakening of accumulated regression protection as BLOCKER.

### BLOCKER — HIGH-RISK promotion barrier was not satisfied for the frozen #38 state

#38 expands the verified persistent Progress owner with stars/coins reward state and event semantics. That is a cross-feature persistent-owner expansion and therefore HIGH-RISK under the control rules. No `agent/a1-work/038*` exact candidate exists, and current A4 review of `ba4394a...` is NOT READY because of the missing assertion-equivalent regression. Exact functional/bookkeeping green does not override the required HIGH-RISK independent review barrier.

Counterfactual: if autonomous work simply treats v3.70 as review-clean and proceeds, the system normalizes a HIGH-RISK persistence-owner expansion despite an independently confirmed regression-coverage gap. The frozen ref must remain immutable; remediation must occur on a new corrective lineage/release rather than moving v3.70.

### MILESTONE — parity provenance for detailed Memory contract remains unproven

A2 could not locate retained/v2 primary source independently proving the `<420px` 6-pair/3-column contract, `>=420px` 8-pair/4-column contract, 350/650 ms delays, exact animal set, reward curve, coins=`stars*4`, or zero-XP semantics. The implementation-lineage commit introducing these values is not independent historical provenance.

Counterfactual: if this evidence gap is ignored, BibleQuest can report 97/100 strict parity while some #38 details are reconstructed assumptions rather than demonstrated old-version parity. Before final parity closure, attach retained/historical provenance or explicitly record them as a deliberate product decision rather than recovered parity.

### BLOCKER — #93 trusted-boundary evidence debt remains visible in current lineage

At current #38 canonical, `tests/v3-admin-operations-edge.mjs` still supplies an injected mock Admin Operations API and asserts client-service behavior. It does not execute the privileged server handler/JWT/platform-role/Owner-only destructive-account boundary. Current code search did not surface a faithful `bq-admin-ops` server-boundary regression.

Counterfactual: privileged authorization/destructive-delete behavior can regress while the client mock still returns success and accumulated tests remain green. Do not treat the security lineage as fully review-clean until faithful trusted-boundary coverage exists and passes exactly.

## DEFER

- #15 Japanese furigana and #40 Kids Bible Who Am I product implementation until the current blockers are reconciled; read-only contract recovery is safe.
- #39 Hiragana Match remains explicitly deferred.

## IGNORE

- Absence of a branch-native Actions run on `ba4394a...`: the isolated bookkeeping verifier explicitly checked out/asserted that exact SHA, so run `34547970159` is valid exact-SHA execution evidence.
- Any PASS transfer from `918762b...` to `ba4394a...`: unnecessary; the bookkeeping SHA has its own exact successful run.
- Moving or rewriting `release/v3.70-kids-memory-match`: frozen releases are immutable.

## Firewall decision

**3 BLOCKER; 1 MILESTONE. NO AUTONOMOUS NEXT-MILESTONE PRODUCT PROGRESSION.**

The safest correction is a new branch from immutable v3.70 that restores or replaces the missing fail-loud regression with assertion-equivalent permanent coverage, runs the complete accumulated suite on an exact corrective candidate, receives fresh exact-state A3/A4 review plus A5 promotion recommendation, and freezes a new corrective release. In parallel, recover retained provenance for the detailed #38 parity constants and add faithful #93 trusted-boundary evidence before declaring the lineage review-clean.

## Staleness

This report is stale if `feature/v3-kids-memory-match`, `release/v3.70-kids-memory-match`, the #38 permanent test/workflow set, #93 trusted-boundary coverage, or a new corrective candidate/release changes.
