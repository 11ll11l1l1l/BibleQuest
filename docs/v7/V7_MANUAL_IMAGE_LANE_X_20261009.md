# Manual BibleQuest V7 Lane X — orphan Feelings, Needs and Home hero
**Trigger in a separate chat:** `Continue BibleQuest V7 Lane X`.
Read `docs/v7/V7_EIGHT_STREAM_ARTWORK_EXECUTION_20261009.md` first, then active #1300/#1303, taxonomy, queue, and current repo/PR state. Commit only Lane-X-owned art assets/sidecars; never touch scheduled producers' categories, Lane Y legacy repairs, Lane Z devotional-cover IDs, app UI/release CI, or `main`.

## Exact exclusive slots
- P0: `emotion:overwhelm`, `emotion:stress`, `emotion:tiredness_weariness` (retired Agent 3 queue with no current confirmed three-file production bundle).
- P0: `need:comfort` (one of 5 strict launch Need concepts); P1: `need:forgiveness`, `need:patience`, `need:trust`.
- P0: exactly one original `hero:home` first-party Home visual, with responsive 16:9 CLEAN, professionally typeset TYPE only if original wording is safely bound to existing Home source, and intentionally cropped THUMB. Prefer localized CLEAN+live app text; avoid invented headline/verse. The generic hero resolver/runtime remains Lane D-owned.
- Before new work, inspect merged `confusion_uncertainty`, `discouragement`, `hopelessness` Agent-3 records; don't recreate them unless the existing asset is truly unusable and owner-conflict free. These are NOT automatically missing.
- If an in-flight PR already claims a slot, use next slot and link the competing PR in report.

## Every invocation
1. Query exact `v7/development` SHA, current record/queue, open PRs, available source art; produce a truthful `remaining` queue.
2. Prioritize P0 missing Feelings, then launch Need Comfort and Home hero, then remaining three Needs. Use scene briefs `docs/v7/V7_IMAGE_GENERATION_SCENE_BRIEFS_20261008.md`, but generate actual original **one-scene** image per job rather than contact-sheet mockups.
3. Export 3 distinct real independent files per concept: CLEAN master (no text); TYPE with reviewed canonical English label and independently context-checked Scripture reference *only* (Home TYPE may omit Scripture); THUMB with safe crop. Verify real hashes/bytes/dimensions, rights, font licensing, correct locale/rights, alt/focal, 320/390/430 built-browser legibility and image bytes. Type and thumb may be derived reproducibly from accepted clean art.
4. Preserve every failed/candidate asset quarantined until passing independent QA; do not call local or source-only render a production HTTP pass. Deliver PR(s) against `v7/development`, include before/after slot coverage, evidence and next owned slot; do not merge failing work.
5. Coordinate with the hourly Visual QA Agent for review, and Lane D for Home resolver/release when artwork passes; **do not** change those owners' code. Continue next unresolved X-owned slot on later `Continue Lane X` commands; no reset or duplicated work.

## Mandatory construction source for all chats and agents

Every V7 visual generation, variant repair, approval and release step MUST first read `docs/v7/unfinished-artwork-guide/00_COMPLETE_CONSTRUCTION_GUIDEBOOK.md`, its exact-ID scene chapter and `AGENTS.md`. The new guide defines the required human action, location, framing, lighting, original high-resolution raster medium, QA rejection criteria, and checks against accepted, draft and rejected art. It supersedes older generic scene prompts, but not release/rights/Scripture gates or exclusive lane ownership. Until PR #1481 integrates, obtain it from `docs/v7-complete-artwork-construction-guide-20261010`. Preserve an existing verified CLEAN master when correcting only TYPE/THUMB, and do not publish any image solely because a sidecar or structural check claims success.
