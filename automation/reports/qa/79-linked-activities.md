# A4 QA — #79 Linked Activities / Challenges

Status: **NOT READY — exact-SHA execution gate outstanding**

Observed live state: 2026-09-10

- Canonical: `feature/v3-linked-activities` @ `debc386328d4655977681fcb08b7a345346ea3fc`
- Dedicated work candidate: `agent/a1-work/079-linked-activities` **not found during inspection**
- Frozen base: `release/v3.51-workspace` @ `caf9425fcdfef935560e1d65ff13823c60a7f529`
- `release/v3.52-linked-activities`: **not found during inspection**
- Authoritative inventory acceptance: `launch linked activity; completion handoff`

## FACT

1. The live canonical SHA is `debc386328d4655977681fcb08b7a345346ea3fc`. #79 remains `Not started` in the authoritative inventory at this pre-bookkeeping SHA; #78 is `Verified`.
2. Permanent #79 coverage exists and is wired into the normal manual-only accumulated regression workflow:
   - `scripts/validate-v3-linked-activities.mjs`
   - `tests/v3-linked-activities-edge.mjs`
   - `tests/v3-linked-activities-smoke.mjs`
   Existing earlier validator, edge and browser/mobile invocations remain present in the inspected workflow; no unexplained deletion/skip/bypass was observed.
3. The #79 implementation lineage modifies shared `src/app/router.js` to add the `bq:navigation-request` / `requestNavigation()` path. Frozen v3.51 did not contain that path.
4. Historical exact run `34467523354` explicitly checked out/asserted `d6bb001ee6ce29740f61c6f3e40468f2ab5be3c3`. Architecture validators and accumulated edge regressions passed, but the accumulated browser/mobile phase failed in the pre-existing `tests/v3-assignments-smoke.mjs` assertion: `Assignment started state did not reload.` Because the browser tests execute sequentially, #79's browser smoke did not execute in that failed run.
5. After that historical failure, commit `02fd1a38cfa09c7aa0650c42131681bb7606ac62` changed the generic Assignments smoke fixture from `assignment_type:'reading'` to `assignment_type:'custom'`; the current SHA contains that change. This is a test-fixture modification to accumulated pre-existing coverage and therefore must be validated rather than assumed safe.
6. The currently observed verification run `34468261897` is **not exact evidence for the live SHA**. Its temporary verification workflow pins/asserts `b446ea26c190905efa6af2f45727f920eb643cb9`, not `debc386328d4655977681fcb08b7a345346ea3fc`.
7. `automation/TRIAGE.md` is stale: it still describes #77 at `f911226f...` and predates frozen v3.51 / active #79.

## INFERENCE

- The Assignments failure at `d6bb001e...` appears consistent with the later fixture change, but A4 does **not** infer that the change fixes the regression until the complete accumulated suite succeeds on the exact current SHA.
- The shared Router-owner change is materially broader than a leaf-only feature change. Risk-tier determination should be reconciled by A3/A5 against current control rules; A4 does not waive any HIGH-RISK review requirement if they classify it HIGH-RISK.
- The absence of a dedicated `agent/a1-work/079-...` branch is a process nonconformance to the stated quarantine rule, not by itself proof of a runtime defect.

## FAILURES / MISSING EVIDENCE

- No completed exact accumulated workflow PASS was found for `debc386328d4655977681fcb08b7a345346ea3fc`.
- No exact execution has yet proved that the modified pre-existing Assignments smoke still passes while all prior accumulated coverage remains green on the current SHA.
- No exact execution has yet proved the #79 browser/mobile smoke on the current SHA.

## RECOMMENDATION

Do **not** promote/bookkeep/freeze `debc386328d4655977681fcb08b7a345346ea3fc` from current A4 evidence. Preserve the accumulated harness and execute the complete regression workflow against this exact SHA (or against the next exact candidate if the branch moves). If any phase fails, reproduce and correct only the proven cause without weakening/deleting/skipping prior coverage, then rerun on the new exact SHA. If the candidate is treated as HIGH-RISK because of the shared Router-owner change, require fresh A3 trust-boundary review, exact-candidate A4 READY, and A5 promotion recommendation before promotion.

A4 READY is available only after an exact current-SHA full green. PASS/FAIL from `d6bb001e...` or `b446ea26...` must not be transferred to `debc3863...`.

## Staleness

This report becomes stale immediately if the canonical/work/frozen SHA changes, a newer exact candidate run completes, the accumulated workflow/test invocation set changes, or A3/A5 changes the risk classification.