# V5 production reconciliation against main — 2026-09-18

Purpose: record the deliberate reconciliation performed before V5 production promotion.

## Inputs

- pre-release production/main: `95d45c18aed3dbb9862749d73749b571fceaa66e`
- certified V5 integration merge: `635230ec04b72ade84e66e3b79eba6acc49630c2`
- certified V5 runtime/source freeze: `c0772d458e9d17ab1728c47c568e99857c7d67a1`
- rollback ref: `rollback/v4-pre-v5-production-20260918`

## Main-only review

The six commits unique to pre-release `main` were documentation-only.

The newer V6/V7 planning updates are retained because they clarify the post-V5 sequence and do not alter V5 runtime behavior.

The alternate main-only V5 Feature Flag / Runtime Configuration checklist expansion is **not** imported into the certified V5 acceptance contract. It was created on a stale concurrent documentation line and conflicts with the active V5 authority that was subsequently implemented and certified at 122/122. Feature-flag/runtime-configuration architecture remains a V6 concern unless a future accepted plan explicitly changes that boundary.

The older main-only V5 status/checklist snapshots are superseded by the final active V5 status and 122-item acceptance ledger on the certified integration line.

## Tree rule

The production release tree uses the certified V5 integration tree for runtime, V5 plans, status, acceptance evidence, tests, workflows, migrations and Edge Function source. Only the current `DEVELOPMENT_PLAN_V6.md` and `DEVELOPMENT_PLAN_V7.md` contents from pre-release main are overlaid, plus this reconciliation record.

No V5 runtime file is taken from the divergent pre-release main line.
