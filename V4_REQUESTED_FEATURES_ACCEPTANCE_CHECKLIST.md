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

Certified assignment/status checkpoint: `release/v4-home-assignments` @ `c676e0ec821ffb1ff2d8ddc0ecdd6168c50a62e7`; accumulated runs `34678365877` and `34678385543` passed. See `V4_HOME_ASSIGNMENTS_CERTIFICATION.md`.

- [x] Complete the V4 Home assignment/status card using the existing Assignments owner/service.
- [x] Explicitly cover signed-out state.
- [x] Explicitly cover offline/local-preview state.
- [x] Explicitly cover authenticated user with no congregation.
- [x] Explicitly cover loading state.
- [x] Explicitly cover API failure state.
- [x] Explicitly cover no-open-assignments state.
- [x] Explicitly cover one open assignment.
- [x] Explicitly cover multiple open assignments.
- [x] Explicitly cover started assignment.
- [x] Explicitly cover due-soon assignment.
- [x] Explicitly cover overdue assignment.
- [x] Explicitly cover completed assignment.
- [x] Keep a clear direct action/link to the existing Assignments route.
- [x] Keep Daily Journey prominent on Home. Daily Journey remains the first high-value shortcut in the certified rail and retains its Home entry point.
- [x] Replace/upgrade the current quick-action treatment to the requested horizontal shortcut/icon rail. **Done:** `release/v4-home-rail` @ exact SHA, run green.
- [x] Rail must support touch/swipe and normal scrolling. Native horizontal overflow scroll, verified scrollable at 320px.
- [x] Rail must use scroll snap where appropriate. `scroll-snap-type:x proximity` + per-item `scroll-snap-align:start`.
- [x] Rail must support mouse/trackpad. Native overflow-x scroll (no custom scroll-hijacking).
- [x] Rail must be keyboard/focus accessible. Left/Right arrow-key navigation between shortcuts, verified in browser smoke.
- [x] Rail must show icon + text labels. Real SVG icon (new `calendar` icon added) + visible text label per item.
- [x] Rail must work from 320 px upward without document overflow. Verified: zero document-level horizontal overflow at 320px in browser smoke.
- [x] Rail must be reduced-motion safe. `prefers-reduced-motion:reduce` override included.
- [x] Initial high-value shortcuts should normally include Daily Journey, Reader, Assignments, Calendar and Progress/Grow. All 5 present in that order.
- [x] Add focused automated acceptance coverage for the Home assignment state matrix and shortcut rail. Assignment-state matrix covered by `tests/v4-home-assignments-edge.mjs`; rail covered by `tests/v4-home-rail-static.mjs` + `tests/v4-home-rail-smoke.mjs`.

## B. Priority-1 workflow surfaces

Calendar certification: `release/v4-calendar` @ `658f202d65481f4486a2f6c010cf0f2248f8b391`; full accumulated run `34679464999` passed. See `V4_CALENDAR_CERTIFICATION.md`.

Assignments certification: `release/v4-assignments-page` @ `65d7ef14b6e1bf5dc8925a88c5838bc233e9fd95`; full accumulated run `34680055519` passed.

Daily Journey certification: `release/v4-daily-journey` @ `fbd8b474a3f8f71044b9cae48b47528f2075436a`; full accumulated run `34680442340` passed. See `V4_DAILY_JOURNEY_CERTIFICATION.md`.

Progress/Grow certification: `release/v4-progress-grow` @ `6c55de27154b9f856faaf80d7cd17b18124c54f3`; full accumulated run `34680840140` passed. See `V4_PROGRESS_GROW_CERTIFICATION.md`.

Primary-family certification: `release/v4-primary-family` @ `c7a78d71354696130efa07e6d7f010deae7795a0`; full accumulated run `34681411008` passed. See `V4_PRIMARY_FAMILY_CERTIFICATION.md`.

- [x] Calendar: complete dedicated V4 UX/presentation and certify it, not merely preserve the old functional route.
- [x] Assignments: final V4 acceptance audit of the full page/workflow while preserving its existing owner/service.
- [x] Daily Mission / Daily Journey: final page-level V4 acceptance audit beyond Home integration.
- [x] Progress / Grow: final V4 acceptance audit and consistency pass.
- [x] Home, Learn, Play, Grow and More remain a coherent modern app family with all required entry points reachable.

## C. Secondary/social/family/media V4 tranche

Certified checkpoint: `release/v4-community-family` @ `e72b6427fdc2c7e742152264c5091d80f9e6ad6d`; full accumulated regression run `34677870938` passed build/deployment gate, architecture validators, edge regressions, guarded harness syntax, and complete browser/mobile suite.

- [x] Community: finish and certify V4 presentation/UX.
- [x] Couples: finish and certify V4 presentation/UX.
- [x] Journey Groups: finish and certify V4 presentation/UX.
- [x] Teams: finish and certify V4 presentation/UX.
- [x] Live Rooms: finish and certify V4 presentation/UX.
- [x] Recognition: finish and certify V4 presentation/UX.
- [x] Leaderboards: finish and certify V4 presentation/UX.
- [x] Media: finish and certify V4 presentation/UX.
- [x] Recordings: finish and certify V4 presentation/UX.
- [x] Encouragements: finish and certify V4 presentation/UX.
- [x] Add/maintain a unified V4 acceptance/static preservation contract for this tranche instead of assuming CSS presence equals completion. `tests/v4-community-family-static.mjs` byte-locks all 11 existing feature owners to the pre-tranche baseline.

## D. Named user-request flows that require exact acceptance

Memory Meadow behavior certification: `release/v4-memory-meadow` @ `c7a78d71354696130efa07e6d7f010deae7795a0`; full accumulated run `34681411008` passed. See `V4_MEMORY_MEADOW_CERTIFICATION.md`.

- [x] Kids Memory Match / Memory Meadow checked against the requested #38 behavior, not just old feature presence.
- [x] Mobile Memory Meadow target: 6 pairs / 12 cards / 3 columns.
- [x] Wide Memory Meadow target: 8 pairs / 16 cards / 4 columns.
- [x] Correct-match delay target: 350 ms.
- [x] Mismatch delay target: 650 ms.
- [x] Input locking during resolution works correctly, including stale delayed-callback protection.
- [x] Rewards remain stars + coins, with zero XP.
- [x] Couples Journey / communication journey must be implemented/audited against the requested husband-wife communication-level system and self-assessment. **Done.** `src/app/couples-family.js` persists `journeyAssessments` (a 12-item rated self-assessment producing a 5-level communication ladder + per-domain scores), with an explicit safety-priority path when abuse/coercion/violence indicators are present that deliberately routes away from ordinary "both sides" communication exercises. Private, local-device-only, capped history (`JOURNEY_LIMIT`). Checkpoint: `release/v4-couples-journey` @ `ca8e627f0ae8c3db17f17a18105f21a315e67a6d`; full accumulated suite (including the dedicated `tests/v4-couples-journey-smoke.mjs` browser acceptance test) passed at that exact SHA, run `34685699294`.

  One real bug found and fixed while verifying this: the journey-result screen offers two legitimate routes back to the dashboard ("Done" and "Back to Couples"), both sharing `data-couples-go="dashboard"`, which made the smoke test's locator ambiguous (Playwright strict-mode violation) and was failing this feature's own gate before I picked it up. Fixed the test locator only (`.first()`), left the two-button UX as-is since having both labels is a legitimate design choice, not a bug.
- [x] Cebuano/Bisaya CEBOCB Reader integration must remain intact through all later V4 changes. **Certified:** focused preservation workflow run `34686990993` passed the full CEBOCB pack + Reader integration contract (66 books / 30,552 text records / 31,103 verse addresses / 457 preserved bridges); dedicated future-change guard merged as PR #138. See `V4_CEBOCB_READER_CERTIFICATION.md`.

## E. Existing areas already substantially converted but still protected by final audit

These should not be casually rebuilt if already green; instead preserve them and include them in the whole-app final audit.

Certified protected-page checkpoint: focused audit run `34688168693` passed deployment/architecture, protected owner validators, static/edge contracts, and the full protected browser matrix. Durable audit gate merged by PR #140 at `061bae2e50f2070544e840ff8ce07cf38c9d17b3`. No runtime/product regression was found and no behavior patch was required. See `V4_PROTECTED_PAGES_CERTIFICATION.md`.

- [x] Design system / shell remains intact and consistent.
- [x] Learn V4 composition remains intact.
- [x] Reader V4 presentation remains intact.
- [x] Play / Games V4 presentation remains intact.
- [x] Avatar Vault V4 presentation remains intact.
- [x] Account remains intact.
- [x] Private/cloud Notes remain intact.
- [x] Transform remains intact.
- [x] Personality/Psychometrics remain intact.
- [x] Accessibility settings remain intact.
- [x] Admin Console remains intact.
- [x] Admin Operations remains intact.
- [x] Content Review remains intact.
- [x] Congregation remains intact.
- [x] Diagnostics/recovery remain intact.
- [x] Ministry Hub / Workspace remains intact and coherent with the V4 family.

## F. Custom artwork / icon program

- [x] Complete the custom BibleQuest artwork/icon inventory. 160 assets exist across 10 themed sheets (avatar-vault, bible-world, community, core, decorative, games, home-learn, memory-meadow, ministry-more, system).
- [x] Use the planned cute, cohesive Pinoy-in-Japan BibleQuest visual theme where appropriate. Applied across Avatar Vault, Home rail/tiles, Learn cards and the More hub.
- [x] Generate transparent-background asset sheets efficiently with multiple assets per generated image. 16 assets per sheet x 10 sheets.
- [x] Maintain deterministic position/order metadata for every generated sheet. Each sheet cut to stable canonical filenames under assets/v4/<sheet>/.
- [x] Build/use a position-aware Python cutter that extracts each asset automatically. Cut output is present and verified; every referenced file is asserted to exist by tests/v4-custom-art-static.mjs.
- [x] Save each extracted asset under the exact canonical filename needed by the app. Verified: zero broken references.
- [x] Replace remaining generic, low-quality or placeholder icons/artwork where the custom asset is ready. **Wired this cycle:** all 16 Avatar Vault portraits, 5 Home shortcut-rail icons, 3 Home secondary tiles, 9 Learn category cards, 14 More hub destination icons. Coverage rose from 22 to 68 referenced assets.
- [x] Keep visual identity coherent across Home, Learn, Play, Grow, Community and Ministry families. One shared sheet style used for every wired surface.
- [x] Generated visual improvements may be implemented without waiting for separate user approval, provided they follow V4 rules and do not break functionality. Certified: `release/v4-custom-art`, full accumulated suite green, zero markup/logic/service changes.

### Custom artwork wiring notes (this cycle)

Checkpoint: `release/v4-custom-art`. Technique: CSS `background-image` keyed off `data-*` attributes the feature markup already renders, so **no feature file, hook, route, scoring, storage or permission was changed**.

Three conflicts were found and handled rather than forced through:
1. **Bible World region icons: deliberately NOT wired.** The certified `journey-v4.css` tranche intentionally replaced those emoji with a numbered progression step (`counter(bq-world-step)`) plus its own background. Layering art there would have fought that background and rendered "01/02/03" on top of the illustration. The numbered step is the better fit for a journey metaphor, so the region art is intentionally left unused; the exclusion is documented inline in `v4-custom-art.css` so it is not silently reversed.
2. **More hub panels use gradients.** `more-visual-polish.css` sets a certified per-tile `background:linear-gradient(...)` on every `[data-more-*]`. Painting `background-image` on those panels would have silently erased the gradients, so the art targets the existing `.bq-more-icon-wrap` instead.
3. **Learn cards use a gradient too** (`reader.css`). Art is layered via `::after` rather than `background-image` for the same reason.

Every overlay that hides an inline SVG restores it under `@media (forced-colors: active)`.

`tests/v4-custom-art-static.mjs` guards all three failure modes: asset existence, no `background-image` on gradient-backed surfaces, and the Bible World exclusion staying in place.

**Still unused: 92 of 160 assets** — chiefly the `core/` nav+brand set, `system/` status/empty/loading badges, and `decorative/` accents. These are not automatically missing requirements: certified scalable SVG/system presentation is retained where it is the better semantic/theming fit, and unused decorative art remains optional rather than release-blocking.

## G. Whole-app V4 polish audit

Browser-required Section G certification: `release/v4-whole-app-browser-audit` @ exact candidate `65d08e93d4df2629db78f83f52ce3c610ce8bb25`. Focused whole-app run `34690641958`, protected-page run `34690641974`, and full accumulated regression run `34690725670` all passed. See `V4_WHOLE_APP_BROWSER_AUDIT_CERTIFICATION.md`.

- [x] Audit loading states. Browser-rendered loading and loading -> ready/empty transitions are explicitly covered.
- [x] Audit empty states. Ready-empty and no-congregation/context-empty states are browser verified.
- [x] Audit error states. Safe rendered API failure state is verified, including no raw service-detail leakage.
- [x] Audit success/completion states. Successful assignment completion and awarded-points feedback are browser verified; independent Games/Daily Journey regressions cross-check other completion paths.
- [x] Audit signed-out states. Browser verified.
- [x] Audit offline/recovery states. Offline/local-preview, Offline Shell, Cloud Notes local preview, and Operational Recovery browser regressions are green.
- [x] Audit icon consistency. Round 1 + 2, Congregation Recognition, and the final Games artwork tranche are complete. Games was closed by `release/v4-games-art-final` at exact tested candidate `f7d141de7752eeabb628e06f6d0b14f9b67a080b`; focused Games verification, protected-page audit, and full accumulated regression all passed. See `V4_GAMES_ART_FINAL_CERTIFICATION.md`. Icons without an honest semantic asset match remain intentionally textual/emoji rather than being mapped to misleading artwork.
- [x] Audit typography hierarchy. **Fixed:** Community and Couples Journey were missing the shared display-font h1 rule that the other family CSS files already have. Both corrected.
- [x] Audit spacing and card/surface consistency. No gaps found in static review.
- [x] Audit clipping and document overflow. All 42 maintained routes are browser-traversed at 320 px and 430 px. The audit found one real 320 px Backup overflow (320 px viewport expanded to 367 px), traced to the native file picker's intrinsic width; `src/ui/reset-recovery-v4.css` now stacks/constrains only that picker/label, and the complete rerun is green.
- [x] Audit layout shifts. Maintained routes now check late topbar/navigation geometry drift and material leading-content movement after render; the certified matrix is green.
- [x] Audit Japanese/English/Cebuano text expansion and localization resilience. Representative high-value routes receive English, Japanese, and Cebuano/Bisaya text-expansion stress at 320 px; no document overflow or viewport escape remains.
- [x] Audit micro-interactions/transitions. No gaps found in static review.
- [x] Audit reduced-motion behavior. **Confirmed clean:** all transition/animation usage remains covered by local guards or the certified global reduced-motion catch-all.
- [x] Audit placeholder/legacy artwork still visible anywhere in maintained routes. The previously recorded Games exception is closed by `release/v4-games-art-final`; remaining textual/emoji symbols are intentional semantic fallbacks where no honest matching custom asset exists.
- [x] Audit navigation/IA so every maintained feature remains reachable and intuitive. Maintained navigation/3-tap evidence remains green, and the deep-route matrix confirms all 42 maintained routes resolve to real content rather than not-found/recovery surfaces.

### Section G evidence

Static checkpoint: `release/v4-whole-app-audit` @ `b92268b91cc479421bc43a7d86d0725657078282`.

Final browser checkpoint: `release/v4-whole-app-browser-audit` @ `65d08e93d4df2629db78f83f52ce3c610ce8bb25`.

Exact-SHA runs:
- `34690641958` — focused whole-app browser audit: PASS.
- `34690641974` — protected-page audit: PASS.
- `34690725670` — full accumulated build/architecture/edge/browser-mobile regression: PASS.

Real browser defect found and fixed: `#/backup` overflowed at 320 px because the native file picker and its label were laid out horizontally. The presentation-only containment fix changed no Backup behavior, service/data ownership, storage, security logic, or route contract.

Section G is now closed by repository evidence. Section H remains separate and still requires its broader responsive/accessibility/performance/PWA/device matrix.

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

## Current audit conclusion

- The serialized Priority-1 V4 page/family queue is closed with exact-SHA full-suite evidence through `release/v4-primary-family`.
- Home assignment/status states and the requested shortcut rail are explicitly closed with exact evidence.
- Calendar, full Assignments page, Daily Journey, Progress/Grow and primary Home/Learn/Play/Grow/More coherence are certified.
- Memory Meadow exact #38 behavior is certified against the requested card counts, breakpoint, delays, locking and stars/coins/no-XP rules.
- Couples Journey communication levels/self-assessment and the CEBOCB/Bisaya Reader preservation requirement are certified.
- The custom V4 artwork program is certified under Section F, and the final Games artwork/icon tranche is closed by `release/v4-games-art-final`.
- The whole-app Section G polish/browser audit is now closed by `release/v4-whole-app-browser-audit`; one real 320 px Backup overflow was found and fixed during that audit.
- V4 is **not yet release-ready** because Section H responsive/accessibility/performance/PWA/device evidence, Section I privacy/security/field gates, and Section J final RC/deployment gates remain.

This file is release-blocking: V4 should not be declared complete merely because the general regression suite is green while unchecked requested acceptance items remain.