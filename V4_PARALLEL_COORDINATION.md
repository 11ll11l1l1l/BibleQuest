# BibleQuest V4 Serialized Development Coordination

Updated: 2026-09-12 JST
Status: Authoritative execution coordination for active V4 development

## Purpose

This file keeps its historical filename so existing links and handoffs do not break. The previous parallel two-lane development model is retired. BibleQuest V4 now uses one serialized development stream.

There is no active AI 1 / AI 2, Lane A / Lane B, top-down / bottom-up ownership split, or separate active integration queue.

## Active development stream

- Sole active implementation branch: `v4/modern-ui-overhaul`.
- Governing product plan: `V4_MODERN_UI_DEVELOPMENT_PLAN.md` and `DEVELOPMENT_PLAN_V4.md` where applicable.
- Central current status: `V4_ACTIVE_STATUS.md`.
- Central accumulated evidence/index: `V4_REPORT_INDEX.md` plus exact gate certification documents and GitHub CI evidence.
- Repository state and exact CI evidence override stale chat summaries and stale status text.
- Work is serialized against the current active branch HEAD; one candidate is integrated and verified before the next overlapping tranche advances.

The retired `v4/bottom-up-tranches` branch is historical source/evidence only. Do not start new development there and do not treat it as a second active stream. Useful isolated work from that branch may be reviewed and deliberately folded into the active branch through the normal verification process.

## Integration authority

Development requested by the user is applied directly to the single active stream. Any analysis agents remain analysis/reporting-only unless the user explicitly changes that rule. They must not create autonomous competing runtime branches or independently merge product changes.

## Before every tranche

1. Fetch the current `v4/modern-ui-overhaul` HEAD.
2. Read `V4_MODERN_UI_DEVELOPMENT_PLAN.md`, `DEVELOPMENT_PLAN_V4.md`, `V4_ACTIVE_STATUS.md`, and relevant certification/status evidence.
3. Confirm the last accepted exact SHA and CI result.
4. Inspect recent commits and the target files so the new work does not overwrite newer changes.
5. Classify the work correctly: presentation-only changes must not silently alter runtime/service ownership; behavior/data/infrastructure changes require their own explicit contract and tests.
6. Choose the next unblocked task from the current remaining queue rather than reviving an obsolete lane assignment.

## During implementation

- Keep each tranche coherent and reviewable.
- Preserve the V3 single-owner architecture unless a separately justified migration explicitly replaces an owner.
- Do not create duplicate auth, routing, storage, Bible-data, progress, scoring, media, session, assignment, or backend owners.
- Do not opportunistically rewrite unrelated features.
- Preserve privacy, RLS, account isolation, PWA/offline, accessibility, and route-reachability contracts.
- Add focused regression coverage for the changed surface.
- Shared shell/foundation/workflow changes are allowed when the active tranche requires them, but they must be explicit and verified on the resulting exact SHA.

## Verification and checkpoint rule

A tranche is not complete because files were committed. Completion requires:

1. focused/static tests for the tranche;
2. applicable architecture and security validators;
3. applicable browser/mobile/accessibility checks;
4. the accumulated regression gate appropriate to the change;
5. evidence tied to the exact candidate SHA;
6. status/index synchronization after the evidence is green.

If a regression fails, repair the same candidate stream and rerun the required gate. Do not open a second implementation lane to work around a failure.

## Historical note

On 2026-09-12 the user explicitly retired the former two-AI split and directed BibleQuest development to continue as one stream. Historical commits, old lane status documents, and the retired side branch remain useful forensic evidence, but they no longer assign ownership or control current development.
