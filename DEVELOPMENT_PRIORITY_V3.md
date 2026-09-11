# BibleQuest v3 — Current Development Priority

Updated: 2026-09-11 JST

This file is the persistent priority order for BibleQuest development after the 2026-09-11 production release. New development/resume sessions must read this file before choosing work. The historical `RELEASE_6PM_2026-09-11.md` remains release evidence, but it no longer overrides post-release development once production is live.

Repository evidence, exact live refs, actual test/workflow results, and the current architecture remain authoritative. Do not trust stale chat memory over the repository.

## Priority 1 — Complete the accepted feature set AND upgrade the visual presentation

Priority 1 is not feature-only. Functional completeness and visual quality are both required parts of the same top priority.

### 1A. Functional completion and correctness

- Preserve the verified v3 architecture and current working feature ownership.
- Complete, correct, and regression-protect all accepted/currently planned BibleQuest features that remain unfinished or incomplete in the active roadmap.
- Do not silently revive historical rows #39 Hiragana Match or #40 Kids Bible Who Am I; those remain retired unless the user explicitly reactivates them.
- Fix reproduced defects discovered while completing the accepted feature set.
- Do not replace working feature contracts with speculative redesigns.

### 1B. Visual/artwork upgrade — required, not optional polish

The current minimal/placeholder visual treatment must be upgraded to a polished, cohesive BibleQuest presentation while preserving the established information architecture, navigation, feature ownership, and core interaction flows.

Required visual direction:

- Introduce **actual polished icon artwork** where the current UI relies on weak, generic, text-like, emoji-like, placeholder, or overly minimal visual markers.
- Introduce **background illustrations** where they meaningfully improve atmosphere, identity, world-building, section distinction, or perceived quality.
- New icons/backgrounds may be real asset files such as SVG, PNG, or WebP as appropriate; visual improvement is not limited to CSS restyling.
- Do **not** satisfy the visual requirement merely by making buttons more decorative. Icons and illustrations should be recognizable visual assets in their own right.
- Keep the existing interface structure recognizable unless a small layout adjustment is necessary to correctly host the new artwork.
- Maintain readability, touch usability, contrast, responsive behavior, performance, and PWA/offline compatibility.
- Use one coherent BibleQuest art direction across Home, Reader, Games, Transform, journeys/world surfaces, account/profile areas, and other major user-facing sections rather than unrelated one-off styles.
- Replace weak/minimal assets progressively instead of performing an uncontrolled full-interface rewrite.
- If a visual improvement requires generating a new image/art asset, generate it and implement it directly when safe; do not stop merely to ask for approval of the generated visual.
- Every implemented visual asset must be checked in the actual product surface. A generated image that is not wired into the UI does not count as completed visual work.

### Priority-1 execution rule

Where practical, finish a user-facing surface as a complete unit: functional correctness first, then its polished icon/background/art treatment, then focused tests. Avoid repeatedly reopening the same surface for separate functional and cosmetic passes unless architecture or risk requires separation.

## Priority 2 — Implement the BibleQuest Calendar

Calendar implementation is now an approved development objective and should follow Priority 1 stabilization rather than remain an indefinite post-release idea.

Before coding the calendar:

- Recover any existing calendar requirement, prior design, issue, branch, note, or related contract from repository evidence/history if one exists.
- If no prior authoritative contract exists, define a small explicit `CALENDAR_V3.md` contract before implementation so ownership, persistence, offline behavior, date/time handling, and integration boundaries are clear.
- Integrate with existing BibleQuest architecture instead of creating a duplicate global state/date system.
- Reuse existing assignment, mission, journey, notification, event, or scheduling ownership only where the existing contracts support it; do not invent hidden cross-feature coupling.
- Design the calendar for mobile first and verify desktop/tablet behavior as well.
- Add focused tests and then run the relevant accumulated regression suites before promotion.

## Priority 3 — Cross-feature integration and regression hardening

After Priority 1 surfaces and the Calendar are integrated:

- Run focused checks for every changed owner/surface.
- Run accumulated architecture, edge/security/static, browser/mobile, PWA/offline, and accessibility checks relevant to the changed product state.
- Verify representative mobile widths and touch behavior.
- Fix root causes rather than weakening validators to make failures disappear.
- Never transfer PASS from an older SHA to a changed product SHA.

## Priority 4 — Production promotion

Only promote a changed product state after the exact candidate SHA has passed the required verification.

- Preserve the current production baseline before large development work.
- Keep feature development isolated from `main` until the candidate is verified.
- Update `DEVELOPMENT_STATUS_V3.md` and `DEVELOPMENT_HANDOFF_V3.md` with exact evidence before promotion.
- Treat Cloudflare deployment and production smoke as separate evidence from GitHub merge/promotion.

## Non-negotiable development rules

- Rebuild-and-verify.
- One owner per responsibility.
- Repository evidence overrides stale conversation context.
- Do not claim tests that were not executed.
- Do not call the app bug-free.
- Do not mutate production Supabase/data without a verified requirement.
- Avoid broad architecture rewrites when targeted work can achieve the objective.
- New visual assets must be implemented into the product, not just generated or shown in chat.

## Short priority summary

1. **Priority 1:** finish/correct all accepted features **and** upgrade the product with real polished icon artwork and background illustrations.
2. **Priority 2:** implement and integrate the Calendar.
3. **Priority 3:** full cross-feature regression/mobile/PWA/accessibility hardening.
4. **Priority 4:** verify the exact candidate, update evidence, and promote safely to production.
