# A4 QA — #42 Same-room Play Together

Identity: `BQ-A4-QA`

## STATE / PROVENANCE

- Observed: 2026-09-11 JST.
- Canonical branch: `feature/v3-same-room-play-together`.
- Exact canonical HEAD at final refresh: `22d054725ba983c4fe81fbd220688a3c12ee211c`.
- Dedicated `agent/a1-work/042-*` candidate: **not found**. `git/matching-refs/heads/agent/a1-work/` exposed only the historical #75 work branch during this audit.
- Frozen base: `release/v3.65-reset-recovery` @ `ab3584906b3d017ea555416910f23e9414ed2ef8`.
- Exact canonical workflow run: `34539110697`, `head_sha=22d054725ba983c4fe81fbd220688a3c12ee211c`, completed `success`.
- Run job: `103077472091`, all accumulated architecture, edge/security and browser/mobile phases completed `success`; no phase was skipped.
- `automation/CURRENT.md` is materially stale (#75/v3.48 era) and was not used as product-state authority.

This report is stale immediately if canonical HEAD, candidate lineage, frozen base, workflow/test content, or exact run evidence changes.

## AUTHORITATIVE ACCEPTANCE

FACT — `FEATURE_INVENTORY_V3.md` at the exact canonical SHA still records #42 as `Not started` with the authoritative contract: **2–6 players; rotating turns; scoreboard; finish**. #43 Live Rooms remains a separate Not-started milestone.

FACT — the frozen-to-canonical comparison is exactly two commits ahead of v3.65. The product implementation stays inside the existing Games owner and the later commit adds #42 invocation to the permanent accumulated workflow.

## ACCEPTANCE MATRIX

| Requirement | Primary executable evidence | Result |
|---|---|---|
| 2–6 players | Edge test asserts limits `{min:2,max:6}`, rejects 1 and 7, starts 3 and 6; 390px smoke exposes exactly five 2–6 choices | PASS |
| Rotating turns | Edge test verifies Player 1 → Player 2 → Player 3 after answered questions; browser smoke verifies the same visible turn progression | PASS |
| Scoreboard | Edge test verifies active-player score isolation and final scores `[1,0,0]`; browser smoke verifies three visible scoreboard players and Player 1 increment | PASS |
| Duplicate-answer protection | Edge test answers the same question twice and verifies `duplicate=true` with no second score increment | PASS |
| Finish | Edge test verifies early `finishSameRoom()` reaches `same-room-complete`; browser smoke verifies Finish reaches completion with final scoreboard | PASS |
| Local-only boundary | Edge test verifies zero profile-progress events and zero storage writes for same-room scoring/session state | PASS |
| Reset / launcher cleanup | Edge test verifies reset returns setup and opening launcher clears the active same-room session | PASS |
| Mobile usability | 390×844 touch browser smoke verifies no horizontal overflow and minimum game-button target height >=44px | PASS |
| Runtime console/page errors | Browser smoke fails on console/page errors and completed green in the exact accumulated run | PASS |

## PERMANENT REGRESSIONS / TEST QUALITY

FACT — `scripts/validate-v3-same-room-play-together.mjs` checks the Games-owner API, 2–6 constants, UI contract markers, absence of profile XP writes in the same-room path, authoritative inventory row, and permanent workflow invocation.

FACT — `tests/v3-same-room-play-together-edge.mjs` is executable service-level coverage, not a source-string-only test. It exercises limits, start, score isolation, duplicate answer handling, rotation, finish, reset, launcher cleanup, no profile XP and no storage persistence.

FACT — `tests/v3-same-room-play-together-smoke.mjs` drives the real app with Playwright at 390px through Play → Play Together → 3-player start → answers → rotation → finish, then checks final scoreboard, overflow, touch target size and runtime errors.

FACT — these tests could realistically fail for incorrect #42 behavior. They are therefore meaningful evidence for the recovered contract.

## ACCUMULATED HARNESS AUDIT

FACT — `.github/workflows/v3-regression.yml` at exact `22d054725ba983c4fe81fbd220688a3c12ee211c` remains `workflow_dispatch`-only.

FACT — the #42 workflow commit changes the three accumulated loop lines only to append:
- `scripts/validate-v3-same-room-play-together.mjs`;
- `tests/v3-same-room-play-together-edge.mjs`;
- `tests/v3-same-room-play-together-smoke.mjs`.

FACT — prior validator, edge/security and browser/mobile entries visible in the accumulated workflow remain present. No prior entry was observed deleted, renamed away, skipped, commented out, or bypassed; the existing browser timeout remains `240s` per test and the job timeout remains 12 minutes.

FACT — run `34539110697` is bound directly to exact canonical SHA `22d054725ba983c4fe81fbd220688a3c12ee211c`. Job `103077472091` completed the architecture-validator phase, edge-regression phase and browser/mobile phase successfully. Because the executed workflow at that same SHA contains the #42 invocations above, this is exact-SHA accumulated functional evidence; no PASS transfer is being made from another SHA.

## FAILURES

No application/test failure was observed in exact run `34539110697`.

## MISSING EVIDENCE / GOVERNANCE

FACT — no authorized `agent/a1-work/042-*` quarantine candidate exists. The current implementation therefore lacks the mandatory autonomous implementation lineage required by `MASTER_CONTROL.md`, even though #42 itself is NORMAL-RISK product work.

FACT — `automation/TRIAGE.md`, read only after this independent primary-evidence pass, is stale about repository movement: it says no `feature/v3-same*` branch was found, while the branch now exists and has exact green run evidence. TRIAGE separately carries unresolved #93/#94 HIGH-RISK governance/security blockers. Those are firewall findings outside #42's recovered runtime contract and are not treated here as proof of a #42 product defect.

INFERENCE — the current #42 implementation/test delta remains NORMAL-RISK from a QA perspective because it is local Games-owner behavior and adds only the milestone's required regression invocations; no schema/RLS/server/dependency/global-owner change was observed in the exact base-to-canonical comparison.

RECOMMENDATION — do not broaden #42 into #43 Live Rooms/network behavior. Preserve the exact passing tests and prior accumulated suite.

RECOMMENDATION — A5/A1 should reconcile the missing quarantine lineage and pre-existing #93/#94 firewall debt before any release promotion. This is a governance prerequisite, not a reason to invent additional #42 product requirements or rerun an unnecessary extra QA cycle solely because #42 is NORMAL-RISK.

## A4 DISPOSITION

**#42 PRODUCT QA: PASS at exact canonical `22d054725ba983c4fe81fbd220688a3c12ee211c`.**

**AUTONOMOUS PROMOTION: NOT READY at this observed repository state** because mandatory quarantine provenance is absent and current A5 TRIAGE contains unresolved prior HIGH-RISK blockers. There is no observed #42 acceptance failure and no accumulated-regression weakening that would independently block the milestone.
