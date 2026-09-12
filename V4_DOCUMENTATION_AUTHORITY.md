# BibleQuest V4 Documentation Authority

Updated: 2026-09-13 JST

This file exists to prevent stale V4 checkpoint/release documents from being mistaken for the current project state.

## Mandatory reading order

For any question or action involving current BibleQuest V4 status, remaining work, release readiness, active development, or next steps, use this order:

1. **`V4_ACTIVE_STATUS.md` — CURRENT AUTHORITY**
   - official active branch and current development line;
   - current phase status;
   - current blockers and next work;
   - current release-candidate policy;
   - determines whether V4 is actively developing, frozen, release-ready, or production-live.

2. **`V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` — REQUIREMENTS / ACCEPTANCE INVENTORY**
   - preserves requested UX/features and acceptance evidence;
   - remains release-blocking for applicable unchecked requirements;
   - any RC1-era wording that describes “current” release status is historical and defers to `V4_ACTIVE_STATUS.md`.

3. **`DEVELOPMENT_PLAN_V4.md` — ARCHITECTURE / ORIGINAL PROGRAM REFERENCE**
   - preserves the original modernization plan, architecture boundaries, and historical phase structure;
   - its older phase numbering must not be used to infer the current post-RC1 phase or release state;
   - current execution sequencing is controlled by `V4_ACTIVE_STATUS.md`.

4. **Phase/checkpoint certification files — SCOPE-SPECIFIC EVIDENCE**
   - files such as Home, Calendar, Assignments, Daily Journey, artwork, Section H, Section I, privacy/presence/admin checkpoint certifications remain valid evidence for the exact scope/SHA they name;
   - they do not override the active-status file and do not automatically certify later integration bytes.

5. **`V4_RC1_AUTOMATED_CERTIFICATION.md`, `V4_RC1_FIELD_ACCEPTANCE.md`, PR #151, RC1 preview records — HISTORICAL RC1 EVIDENCE**
   - RC1 `cf58fa2e467f70f1c4a963b4ca50e33f11da9983` was a valid certified checkpoint;
   - official V4 development continued after RC1;
   - RC1 is no longer the current release candidate unless the user explicitly orders a rollback to that line;
   - its green checks must never be presented as certification of post-RC1 application bytes.

6. **Issue #124 / PR comments / chat summaries — COORDINATION CONTEXT**
   - useful for discussion and history;
   - repository branch/commit/CI evidence plus the authority chain above wins when discussion text is stale.

## Official current line

The official development line is `v4/modern-ui-overhaul`.

At the 2026-09-13 consolidation snapshot it was at `4ba9eac283487b54494cc58b4bcfdda5c1a18ca2`, 47 commits ahead of frozen RC1. Phase 5 Help/Tutorial stabilization was active after post-RC1 Phases 1-3 and the explicit Phase 4 Leader Center skip.

Always inspect the live branch head before quoting a SHA as current.

## Rules for future documentation changes

- Any change that materially alters current phase status, remaining release blockers, official scope, or release-candidate identity must update `V4_ACTIVE_STATUS.md` in the same serialized development stream.
- Do not duplicate a second independent “current release status” section in another file. Link or defer to `V4_ACTIVE_STATUS.md` instead.
- Historical certification documents should not be rewritten to pretend they certify newer bytes. Mark them historical/superseded for current-state purposes while preserving their exact-SHA evidence.
- If a new RC is frozen, update `V4_ACTIVE_STATUS.md` first, then the acceptance checklist and new RC certification records.
- If the user explicitly changes scope (for example, skips or restores a phase), record that decision in `V4_ACTIVE_STATUS.md` so it cannot be rediscovered incorrectly from old documents.
- Before answering “What is left?”, “Is V4 done?”, “Is it release-ready?”, “What is being developed?”, or similar questions, read `V4_ACTIVE_STATUS.md` rather than inferring the answer from RC1 documents.

## Current release interpretation

As of this consolidation, the post-RC1 line is the official V4 program. A new exact candidate (normally RC2 or later) must be frozen and recertified after the active post-RC1 work and live/integrated verification are complete. RC1 is preserved as historical evidence and fallback information, not the default promotion target.
