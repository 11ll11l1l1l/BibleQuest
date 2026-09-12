# BibleQuest V4 Requested Features & Acceptance Checklist

Updated: 2026-09-12 JST
Purpose: persistent user-request checklist so requested features, UX requirements, special flows, artwork work, and release gates are not lost between development sessions.

## Mandatory usage

- The manual captain / active development chat must read this file before selecting remaining V4 work.
- Repository evidence overrides stale chat summaries.
- Do not mark an item complete merely because an older V3 feature exists. V4 completion requires the requested V4 UX/presentation plus preserved functionality and relevant regression evidence.
- Update this checklist as evidence changes. Do not delete an unfinished user request to make the status look cleaner.
- Preserve V3 single-owner architecture, privacy/isolation, auth/RLS, persistence, PWA and backend contracts unless a proven requirement demands a controlled change.
- Do not modify production/main merely to advance V4.

## A. Home — release-critical requested behavior

- [ ] Complete the V4 Home assignment/status card using the existing Assignments owner/service.
- [ ] Explicitly cover signed-out state.
- [ ] Explicitly cover offline/local-preview state.
- [ ] Explicitly cover authenticated user with no congregation.
- [ ] Explicitly cover loading state.
- [ ] Explicitly cover API failure state.
- [ ] Explicitly cover no-open-assignments state.
- [ ] Explicitly cover one open assignment.
- [ ] Explicitly cover multiple open assignments.
- [ ] Explicitly cover started assignment.
- [ ] Explicitly cover due-soon assignment.
- [ ] Explicitly cover overdue assignment.
- [ ] Explicitly cover completed assignment.
- [ ] Keep a clear direct action/link to the existing Assignments route.
- [ ] Keep Daily Journey prominent on Home.
- [ ] Replace/upgrade the current quick-action treatment to the requested horizontal shortcut/icon rail.
- [ ] Rail must support touch/swipe and normal scrolling.
- [ ] Rail must use scroll snap where appropriate.
- [ ] Rail must support mouse/trackpad.
- [ ] Rail must be keyboard/focus accessible.
- [ ] Rail must show icon + text labels.
- [ ] Rail must work from 320 px upward without document overflow.
- [ ] Rail must be reduced-motion safe.
- [ ] Initial high-value shortcuts should normally include Daily Journey, Reader, Assignments, Calendar and Progress/Grow.
- [ ] Add focused automated acceptance coverage for the Home assignment state matrix and shortcut rail.

## B. Priority-1 workflow surfaces

- [ ] Calendar: complete dedicated V4 UX/presentation and certify it, not merely preserve the old functional route.
- [ ] Assignments: final V4 acceptance audit of the full page/workflow while preserving its existing owner/service.
- [ ] Daily Mission / Daily Journey: final page-level V4 acceptance audit beyond Home integration.
- [ ] Progress / Grow: final V4 acceptance audit and consistency pass.
- [ ] Home, Learn, Play, Grow and More must remain a coherent modern app family with all required entry points reachable.

## C. Secondary/social/family/media V4 tranche

- [ ] Community: finish and certify V4 presentation/UX.
- [ ] Couples: finish and certify V4 presentation/UX.
- [ ] Journey Groups: finish and certify V4 presentation/UX.
- [ ] Teams: finish and certify V4 presentation/UX.
- [ ] Live Rooms: finish and certify V4 presentation/UX.
- [ ] Recognition: finish and certify V4 presentation/UX.
- [ ] Leaderboards: finish and certify V4 presentation/UX.
- [ ] Media: finish and certify V4 presentation/UX.
- [ ] Recordings: finish and certify V4 presentation/UX.
- [ ] Encouragements: finish and certify V4 presentation/UX.
- [ ] Add/maintain a unified V4 acceptance/static preservation contract for this tranche instead of assuming CSS presence equals completion.

## D. Named user-request flows that require exact acceptance

- [ ] Kids Memory Match / Memory Meadow must be checked against the requested #38 behavior, not just old feature presence.
- [ ] Mobile Memory Meadow target: 6 pairs / 12 cards / 3 columns.
- [ ] Wide Memory Meadow target: 8 pairs / 16 cards / 4 columns.
- [ ] Correct-match delay target: 350 ms.
- [ ] Mismatch delay target: 650 ms.
- [ ] Input locking during resolution must work correctly.
- [ ] Rewards must remain stars + coins, with no unintended XP change.
- [ ] Couples Journey / communication journey must be audited against the requested husband-wife journey/level system and current product requirements.
- [ ] Cebuano/Bisaya CEBOCB Reader integration must remain intact through all later V4 changes.

## E. Existing areas already substantially converted but still protected by final audit

These should not be casually rebuilt if already green; instead preserve them and include them in the whole-app final audit.

- [ ] Design system / shell remains intact and consistent.
- [ ] Learn V4 composition remains intact.
- [ ] Reader V4 presentation remains intact.
- [ ] Play / Games V4 presentation remains intact.
- [ ] Avatar Vault V4 presentation remains intact.
- [ ] Account remains intact.
- [ ] Private/cloud Notes remain intact.
- [ ] Transform remains intact.
- [ ] Personality/Psychometrics remain intact.
- [ ] Accessibility settings remain intact.
- [ ] Admin Console remains intact.
- [ ] Admin Operations remains intact.
- [ ] Content Review remains intact.
- [ ] Congregation remains intact.
- [ ] Diagnostics/recovery remain intact.
- [ ] Ministry Hub / Workspace remains intact and coherent with the V4 family.

## F. Custom artwork / icon program

- [ ] Complete the custom BibleQuest artwork/icon inventory.
- [ ] Use the planned cute, cohesive Pinoy-in-Japan BibleQuest visual theme where appropriate.
- [ ] Generate transparent-background asset sheets efficiently with multiple assets per generated image.
- [ ] Maintain deterministic position/order metadata for every generated sheet.
- [ ] Build/use a position-aware Python cutter that extracts each asset automatically.
- [ ] Save each extracted asset under the exact canonical filename needed by the app.
- [ ] Replace remaining generic, low-quality or placeholder icons/artwork where the custom asset is ready.
- [ ] Keep visual identity coherent across Home, Learn, Play, Grow, Community and Ministry families.
- [ ] Generated visual improvements may be implemented without waiting for separate user approval, provided they follow V4 rules and do not break functionality.

## G. Whole-app V4 polish audit

- [ ] Audit loading states.
- [ ] Audit empty states.
- [ ] Audit error states.
- [ ] Audit success/completion states.
- [ ] Audit signed-out states.
- [ ] Audit offline/recovery states.
- [ ] Audit icon consistency.
- [ ] Audit typography hierarchy.
- [ ] Audit spacing and card/surface consistency.
- [ ] Audit clipping and document overflow.
- [ ] Audit layout shifts.
- [ ] Audit Japanese/English/Cebuano text expansion and localization resilience.
- [ ] Audit micro-interactions/transitions.
- [ ] Audit reduced-motion behavior.
- [ ] Audit placeholder/legacy artwork still visible anywhere in maintained routes.
- [ ] Audit navigation/IA so every maintained feature remains reachable and intuitive.

## H. Responsive / accessibility / performance / PWA release gates

- [ ] Verify 320 px viewport.
- [ ] Verify 360 px viewport.
- [ ] Verify 390 px viewport.
- [ ] Verify 412 px viewport.
- [ ] Verify 430 px viewport.
- [ ] Verify tablet layouts.
- [ ] Verify desktop layouts.
- [ ] Verify portrait/landscape/orientation behavior where relevant.
- [ ] Verify safe-area behavior.
- [ ] Verify keyboard-only operation.
- [ ] Verify visible/usable focus states.
- [ ] Verify screen-reader semantics on major workflows.
- [ ] Verify reduced-motion preference.
- [ ] Review asset/performance cost and avoid unnecessary regressions.
- [ ] Verify installed-PWA behavior.
- [ ] Verify offline behavior.
- [ ] Verify recovery/reconnect behavior.
- [ ] Verify physical Android Chrome at 100% zoom.
- [ ] Verify physical Android Brave at 100% zoom.

## I. Security, privacy and data integrity release gates

- [ ] Preserve authentication boundaries.
- [ ] Preserve RLS/security rules.
- [ ] Preserve account isolation.
- [ ] Verify multi-account isolation for Assignments.
- [ ] Verify multi-account isolation for Groups/Teams.
- [ ] Verify multi-account isolation for Couples.
- [ ] Verify multi-account isolation for Live Rooms.
- [ ] No duplicate state/API owners introduced by V4 presentation work.
- [ ] No production database shortcuts or weakened privacy controls.

## J. Final V4 release candidate / deployment gates

- [ ] Reconcile this checklist against `DEVELOPMENT_PLAN_V4.md` and issue #124 before declaring feature-complete.
- [ ] Synchronize `V4_ACTIVE_STATUS.md` with current repository evidence before RC freeze.
- [ ] Freeze one exact V4 release-candidate SHA.
- [ ] Run `bash build.sh` successfully on the exact candidate.
- [ ] Run architecture validation on the exact candidate.
- [ ] Run the complete accumulated static/security/edge regression suite on the exact candidate.
- [ ] Run complete browser/mobile coverage for changed and critical workflows.
- [ ] Run Home assignment-state/shortcut-rail acceptance tests.
- [ ] Run all changed-feature regressions.
- [ ] Run the multi-account/privacy/isolation matrix.
- [ ] Perform preview/staging smoke verification.
- [ ] Perform installed-PWA field verification.
- [ ] Preserve a known-good V3 rollback reference until V4 is accepted.
- [ ] Promote only after exact-candidate evidence is green.
- [ ] After promotion, verify production bytes/build identity and production browser behavior.

## Current audit conclusion at time of creation

- Most requested functional features exist in the repository and are being preserved.
- V4 is **not yet feature/acceptance complete**.
- Definite remaining Home gaps include the requested horizontal shortcut rail and explicit completion/proof of the full Home assignment-state UX matrix.
- Calendar and several secondary/social/family/media surfaces still require dedicated V4 acceptance/certification.
- Custom artwork/icon generation, cutting, canonical naming and integration remain active work.
- Final whole-app responsive/accessibility/performance/PWA/security/device/release gates remain mandatory.

This file is a release-blocking checklist: V4 should not be declared complete merely because the general regression suite is green while unchecked requested acceptance items remain.