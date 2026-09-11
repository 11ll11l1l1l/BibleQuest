# BibleQuest v3 — Current Development Priority

Updated: 2026-09-11 JST

This is the **current post-release task-selection authority** for BibleQuest v3.

## Document authority order

When documents disagree, use this order:

1. the user's latest explicit instruction;
2. this `DEVELOPMENT_PRIORITY_V3.md`;
3. current `DEVELOPMENT_HANDOFF_V3.md` and `DEVELOPMENT_STATUS_V3.md`;
4. milestone-specific contracts and current exact-SHA verification evidence;
5. `FEATURE_INVENTORY_V3.md` as the historical/release-parity ledger;
6. historical release, visual-tranche, and agent documents as evidence only.

Repository refs, exact SHAs and actually executed workflow results override stale prose. `RELEASE_6PM_2026-09-11.md` is historical release control from the completed September 11 release and no longer overrides post-release development.

## Priority 1 — Functional completion + visual/artwork upgrade + Calendar

All three streams are active Priority 1 work. Sequence them by dependency and risk; do not postpone Calendar until every cosmetic task is finished, and do not postpone meaningful visual work until every functional task is finished.

### 1A. Functional completion and correctness

- Complete/correct accepted and currently planned BibleQuest functionality that remains unfinished or incomplete.
- Preserve verified v3 ownership and existing working contracts.
- Fix reproduced defects encountered in the selected milestone.
- Do not silently revive #39 Hiragana Match or #40 Kids Bible Who Am I; they remain retired unless the user explicitly reactivates them.
- Do not create competing implementations or broad speculative rewrites.

### 1B. Visual/artwork Phase B — required product-quality work

The earlier replacement-level visual tranche program through tranche 16 is now classified as **Visual Phase A: first-pass presentation polish complete**. It is preserved as verified historical evidence; it does **not** mean all desired visual work is complete.

Visual Phase B is active Priority 1 work and targets the remaining minimal/placeholder appearance with real polished assets:

- replace weak/generic/emoji-like/text-like or placeholder visual markers with coherent icon artwork where appropriate;
- add background illustrations or decorative scene assets where they materially improve identity, atmosphere or section distinction;
- use real SVG/PNG/WebP assets where appropriate instead of treating CSS/button decoration alone as sufficient;
- keep the established interface recognizable and preserve navigation, feature ownership, persistence, backend contracts and core interaction flows;
- maintain readability, contrast, touch usability, responsive behavior, performance and PWA/offline compatibility;
- use a coherent BibleQuest art direction across major surfaces.

If visual work needs an AI-generated image/art asset, **generate it, choose the best result, implement it directly, and verify it in the actual UI. Do not ask the user to approve the generated image first.** A generated asset does not count as completed work until it is wired into the product and tested.

### 1C. BibleQuest Calendar — active implementation work

Calendar is part of Priority 1, not an indefinite future item.

Before implementation:

- recover any existing Calendar requirement/design/branch/history;
- if no authoritative contract exists, create a concise `CALENDAR_V3.md` defining owner, persistence, offline/date-time behavior, authorization and integration boundaries;
- reuse established assignment/journey/notification/event ownership only where contracts genuinely support it;
- do not introduce duplicate global state or a competing backend owner;
- design mobile-first and verify desktop/tablet behavior;
- add focused tests and exact-SHA accumulated verification.

If Calendar has a prerequisite, complete that prerequisite first and then continue into Calendar without requiring another routine approval.

## Priority 2 — Cross-feature integration and regression hardening

After each Priority 1 milestone, run focused checks. At suitable exact-green checkpoints, run the accumulated architecture, edge/security/static, browser/mobile, PWA/offline and accessibility suites. Verify representative mobile widths and touch behavior. Fix root causes rather than weakening validators.

## Priority 3 — Production integration/promotion

A green development branch is not automatically production-live.

- Preserve production/rollback points until a production integration milestone is selected.
- Keep development isolated from production until the exact candidate is verified.
- Review/deploy required migrations only as part of an explicit integration/release step.
- Update status/handoff with exact evidence.
- Treat GitHub promotion, Cloudflare propagation and live smoke verification as separate evidence.

## Agent/investigation evidence rule

Historical investigator findings remain evidence, but a finding against an older SHA is **not automatically an active blocker**. Before interrupting current Priority 1 work, revalidate the finding against the current exact product checkpoint. P0/P1 may interrupt the roadmap only when current evidence supports them; stale, speculative, duplicate or already-fixed findings must be suppressed.

The old `RELEASE_AGENT_READONLY_2026-09-11.md` is historical release-agent guidance. Current development sessions may use agent findings, but task selection follows this file and current exact-SHA evidence.

## Non-negotiable development rules

- Rebuild-and-verify.
- One owner per responsibility.
- Never transfer PASS across changed product SHAs.
- Never claim tests that were not executed.
- Documentation-only commits are not verified product SHAs.
- Do not call the app bug-free.
- Do not mutate production Supabase/data without a verified integration requirement.
- Avoid broad architecture rewrites when targeted implementation can achieve the objective.
- New visual assets must be implemented into the product, not merely generated or shown.

## Short priority summary

1. **Priority 1A:** finish/correct accepted functionality.
2. **Priority 1B:** continue the required real artwork/icon/background Visual Phase B.
3. **Priority 1C:** implement and integrate Calendar when dependencies permit.
4. **Priority 2:** accumulated integration/regression hardening.
5. **Priority 3:** exact-SHA production integration/promotion when explicitly selected.
