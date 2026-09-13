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
8. Complete the accepted V5 content/UX track: a connected weekly spiritual journey, useful Today surface, Tagalog-first localization, full Cebuano/Bisaya UI/authored-content target, true colored calendar, completed-live-service Media automation, stronger Transformation/family/couples content, and lightweight discovery/progress presentation — all on the current architecture.

## Accepted cross-phase V5 content/UX additions

These are product-completion tasks and must be closed before Phase 8 can be accepted. They may be dispatched as bounded non-overlapping tranches alongside the established phase sequence, but they must not replace or weaken any Phase 1-7 gate.

### P0

- **Today / This Week home surface:** compose existing current-architecture sources into an immediately useful view of next event, current assignment, continue-reading state, latest service, Transformation prompt, and unread notifications.
- **Connected weekly journey:** connect an existing sermon/service to Scripture, Transformation/reflection, discussion, prayer, assignment/action, and calendar context without introducing a new workflow/state engine.
- **Tagalog-first localization:** complete Tagalog for Transformation and then the main member-facing UI, including navigation, controls, empty/error states, Calendar, Assignments, notifications, settings, leader instructions, and other authored application copy. Scripture text must continue to come from approved/licensed Bible translations; BibleQuest must not machine-translate Scripture.
- **Real calendar presentation:** month-grid calendar as the primary calendar-format view, with event category colors plus text/icon labels so color is never the sole accessibility cue; preserve existing personal/congregation/assignment behavior and active-congregation filtering.
- **Latest completed live service in Media:** when the current livestream/recording source exposes a stable completed recording, surface it automatically in the existing Media/Recordings experience using stable video identity for deduplication; allow authorized hide/edit correction and do not create a new media platform/ingestion architecture.

### P1

- **Transformation content flow:** structure authored Transformation content as Scripture/context -> understand -> reflect -> apply -> pray, with optional spouse/family discussion and weekly action using existing data/assignment patterns.
- **Pastor/leader weekly message:** a small current-architecture content surface that can anchor the week's Scripture, service, Transformation, assignment, and calendar event.
- **My Journey / reflection history:** present existing reading, Transformation, assignment and personal reflection/progress signals as an encouraging personal history; no new analytics/state engine and no competitive spiritual leaderboard.
- **Family & Couples content tracks:** short practical journeys for communication, forgiveness, finances/stewardship, intimacy/love, parenting, serving together, family Bible time, gratitude, kindness and prayer, reusing existing Journey/Transformation/Assignment patterns.
- **Personal milestones/achievements:** encouraging non-competitive milestones for reading, reflection, prayer/journey and assignment consistency using existing progress sources where possible.
- **Ask at Dinner:** optional one-question spouse/family discussion prompt attached to a sermon/Transformation/weekly journey.

### P2

- **Full Cebuano/Bisaya localization:** complete member-facing UI and BibleQuest-authored content in Cebuano/Bisaya. CEBOCB or another approved existing Cebuano Scripture source remains the Scripture text; do not generate an app-owned Bible translation.
- **Lightweight discovery:** simple filtering/search across content already exposed by the current architecture (Bible passages where supported, existing Media metadata, Transformation topics and church activities). Do not build the V6 search/index/content platform.
- **Media organization:** improve the existing Recordings/Media presentation with categories such as latest service, Sunday services, Bible studies, worship, testimonies, couples/family and kids, using existing metadata/owners rather than a replacement media engine.

### Explicit V6 boundary for this track

The additions above do **not** authorize a new Reader engine, generalized offline/cache framework, notification engine, background-sync framework, global repository/data-access rewrite, tenant engine, media-platform replacement, generalized search/index engine, or new state-ownership model. If an item requires one of those to implement correctly, V5 must stop at the current-architecture version and defer the replacement architecture to V6.

## Phase state

- Phase 1 — Leader Center: NOT STARTED.
- Phase 2 — Admin Console completion: NOT STARTED.
- Phase 3 — Icon/artwork completion: NOT STARTED.
- Phase 4 — Push notifications (minimum): NOT STARTED.
- Phase 5 — Baseline offline Bible reading: NOT STARTED.
- Phase 6 — Multi-congregation verification/tooling: NOT STARTED.
- Phase 7 — Verification debt (CEBOCB/Couples Journey/Sections E-G): NOT STARTED.
- Cross-phase content/UX completion track: ACCEPTED / NOT YET CERTIFIED.
- Phase 8 — V5 certification and promotion: NOT STARTED.

## Sequencing with V6 and V7

`DEVELOPMENT_PLAN_V6.md` (architecture upgrade, formerly numbered V5) and `DEVELOPMENT_PLAN_V7.md` (full motion/sound/polish rollout, formerly numbered V6) are already scoped and do not change. Neither begins until this V5 completes Phase 8 certification. This is a strict sequence, not parallel tracks: complete the product first, transform the base second, apply full polish third.
