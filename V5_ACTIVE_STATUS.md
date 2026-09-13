# BibleQuest V5 Official Active Status

Updated: 2026-09-13 JST
Execution model: one serialized integration stream
Official V5 integration branch: `v5/feature-completion`
Baseline: current production `main`

## Authority

This file is the single authoritative source for current BibleQuest V5 phase, scope, blockers, candidate identity, and next work. Repository branch/commit/CI/live-backend evidence overrides stale chat context.

**Renumbering note:** the architecture-replacement program previously tracked as "V5" (branch `v5/architecture-upgrade`, `DEVELOPMENT_PLAN_V5.md` covering build tooling/real DB testing/Reader-Games decomposition/media platform/push/offline/Leader Center/multi-congregation) has been renumbered **V6**. Its documents now live at `DEVELOPMENT_PLAN_V6.md` / `V6_ACTIVE_STATUS.md` / `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`, and its branch is `v6/architecture-upgrade`. The full motion/sound/polish rollout that depends on it is renumbered **V7** (`DEVELOPMENT_PLAN_V7.md`). This V5 is a new, product-completeness program on the *current* architecture, sequenced to run first.

## V5 product decision

V5 completes concrete, previously-identified missing/incomplete functionality on the current, already-working architecture. **No architecture, build-tooling, or state-ownership change is in scope for V5** - that is V6's explicit mandate, not V5's. V5 exists so that unfinished product work does not get carried forward and re-done twice across an architecture change.

V4 remains the production fallback until a V5 candidate is explicitly accepted and promoted.

## Current state

**Phase 0 — plan established, no implementation started.**

This document and `DEVELOPMENT_PLAN_V5.md` are the first V5 deliverable. Runtime work begins with Phase 1 (Leader Center) once this plan is reviewed.

## Mandatory V5 outcomes

1. A working Leader Center (previously officially skipped), built entirely from existing Phase 1/Phase 3 capabilities.
2. Admin Console UI for the already-built Phase 2 emergency actions, plus the missing email-change/recovery action.
3. Icon/artwork completion: Games' 21 remaining emoji, remaining Congregation Recognition/Couples/Notification/Encouragements icons, and deletion of the dead Media Library owner.
4. A real, minimum Web Push implementation for existing in-app notification types.
5. A real, minimum offline-reading capability for previously-opened Scripture passages.
6. Multi-congregation verification unblocked (a real second test congregation) plus a minimum active-congregation switcher.
7. Closure of three specific pieces of verification debt: CEBOCB Reader re-verification, Couples Journey bidirectional-sharing verification, and the deferred V4 whole-app audit Sections E/G.

## Phase state

- Phase 1 — Leader Center: NOT STARTED.
- Phase 2 — Admin Console completion: NOT STARTED.
- Phase 3 — Icon/artwork completion: NOT STARTED.
- Phase 4 — Push notifications (minimum): NOT STARTED.
- Phase 5 — Baseline offline Bible reading: NOT STARTED.
- Phase 6 — Multi-congregation verification/tooling: NOT STARTED.
- Phase 7 — Verification debt (CEBOCB/Couples Journey/Sections E-G): NOT STARTED.
- Phase 8 — V5 certification and promotion: NOT STARTED.

## Sequencing with V6 and V7

`DEVELOPMENT_PLAN_V6.md` (architecture upgrade, formerly numbered V5) and `DEVELOPMENT_PLAN_V7.md` (full motion/sound/polish rollout, formerly numbered V6) are already scoped and do not change. Neither begins until this V5 completes Phase 8 certification. This is a strict sequence, not parallel tracks: complete the product first, transform the base second, apply full polish third.
