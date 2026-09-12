# BibleQuest V4 Documentation Authority

Updated: 2026-09-13 JST

This file prevents stale V4 checkpoint/release documents from being mistaken for the current project state.

## Mandatory reading order

For any question or action involving current BibleQuest V4 status, remaining work, release readiness, active development, or next steps:

1. **`V4_ACTIVE_STATUS.md` — CURRENT AUTHORITY**
   - official active branch/current development line;
   - current phase state;
   - current blockers and next work;
   - current release-candidate policy;
   - determines whether V4 is actively developing, frozen, release-ready, or production-live.

2. **`V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` — REQUIREMENTS / RELEASE-BLOCKING INVENTORY**
   - preserves requested UX/features and acceptance requirements;
   - unchecked applicable requirements remain release blockers;
   - current-status interpretation always defers to `V4_ACTIVE_STATUS.md`.

3. **`DEVELOPMENT_PLAN_V4.md` — ORIGINAL ARCHITECTURE / PROGRAM REFERENCE**
   - preserves the original modernization plan, architecture boundaries, and historical phase structure;
   - its older phase numbering must not be used to infer the current post-RC1 phase or release state;
   - current execution sequencing is controlled by `V4_ACTIVE_STATUS.md`.

4. **Phase/checkpoint certification files — SCOPE-SPECIFIC EVIDENCE**
   - Home, Calendar, Assignments, Daily Journey, artwork, Section H, Section I and later phase certifications remain valid for the exact scope/SHA they name;
   - they do not override the active-status file and do not automatically certify later integration bytes.

5. **RC1 records — HISTORICAL EXACT-SHA EVIDENCE**
   - `V4_RC1_AUTOMATED_CERTIFICATION.md`, `V4_RC1_FIELD_ACCEPTANCE.md`, PR #151 and RC1 preview records certify RC1 `cf58fa2e467f70f1c4a963b4ca50e33f11da9983` only;
   - official V4 development continued after RC1;
   - RC1 is no longer the current release candidate unless the user explicitly orders a return to it;
   - RC1 green checks must never be presented as certification of post-RC1 application bytes.

6. **Issue #124 / PR comments / chat summaries — COORDINATION CONTEXT**
   - useful for discussion/history;
   - repository branch/commit/CI evidence plus the authority chain above wins when discussion text is stale.

## Official current line

The official development line is `v4/modern-ui-overhaul`.

At the documentation rebase snapshot it was at `44728fc4ff543318202f76564606c1f1c4dc7ef6`, with Phase 5 Help/Tutorial stabilization active after post-RC1 Phases 1-3 and the explicit Phase 4 Leader Center skip.

Always inspect the live branch head before quoting a SHA as current.

## Rules for future documentation changes

- Any change that materially alters current phase status, remaining blockers, official scope, or release-candidate identity must update `V4_ACTIVE_STATUS.md` in the same serialized development stream.
- Do not create a second independent “current release status” narrative in another file. Link/defer to `V4_ACTIVE_STATUS.md` instead.
- Historical certification files remain historical exact-SHA evidence; do not rewrite them to pretend they certify newer bytes.
- If a new RC is frozen, update `V4_ACTIVE_STATUS.md` first, then the acceptance checklist and new RC certification records.
- If the user explicitly changes scope (skip/restore/add/remove a phase), record that decision in `V4_ACTIVE_STATUS.md`.
- Before answering “What is left?”, “Is V4 done?”, “Is it release-ready?”, “What is being developed?”, or similar questions, read `V4_ACTIVE_STATUS.md` and inspect the live integration branch rather than inferring from RC1 records.

## Current release interpretation

The post-RC1 line is the official V4 program. A new exact candidate (normally RC2 or later) must be frozen and recertified after active post-RC1 work plus live/integrated verification are complete. RC1 is preserved as historical evidence and fallback information, not the default promotion target.
