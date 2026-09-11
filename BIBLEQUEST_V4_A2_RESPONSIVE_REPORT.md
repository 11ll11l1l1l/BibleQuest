# BibleQuest v4 — A2 Responsive & Accessibility Report

Agent: `BQ-A2-V4-RESPONSIVE-ACCESSIBILITY`
Authority: analysis/reporting only
Central control: `BIBLEQUEST_V4_ANALYSIS_HUB.md`

A2 may update only this file. Do not modify product code, tests, workflows, branches, deployment, Supabase, Cloudflare, or the central hub.

## Latest inspected ref

- Branch: `main`
- Inspected HEAD before this report write: `b3b6cd84603defe0eeca88f3db6982dfcb65eff9`
- Inspection date: 2026-09-12 JST
- Authoritative composition/routes were recovered from `src/app/bootstrap.js` and `src/app/router.js`.
- Responsive foundation inspected: `src/ui/app.css`, `src/ui/accessibility.css`, `index.html`.
- PWA ownership inspected: `src/app/pwa-install.js`, `offline-shell-sw.js`.
- Existing v3 tests/evidence were treated only as historical evidence. No current v4 implementation candidate exists yet, so findings below distinguish static facts from post-implementation validation requirements.

## Executive finding

BibleQuest currently has a competent mobile-safe baseline in several important details: `viewport-fit=cover`, a fixed five-item bottom nav with bottom safe-area padding, 44–46 px minimum sizing on several important account/button controls, global `:focus-visible`, a user-selectable reduced-motion runtime, and a same-origin offline shell.

However, the responsive system is still fundamentally a **single narrow 760 px application column with one major `max-width:480px` shell breakpoint**, plus many feature-specific styles layered globally. That is adequate for making pages fit, but it is not an intentional v4 phone/tablet/desktop composition system. Desktop/tablet space is largely left unused by the global shell, while small-screen accessibility is partially handled by shrinking the requested XL text scale rather than forcing layouts to reflow.

The v4 responsive program should therefore be treated as a composition redesign, not a collection of viewport fixes. Establish common responsive primitives and explicit experience-family breakpoints, then redesign each page around those primitives. Phone, tablet and desktop should often use different information arrangements while keeping the same feature/state owners.

## Width-by-surface matrix

Legend: `R` = substantial responsive redesign recommended; `V` = validation-heavy, structure may remain; `P` = primarily preserve/revalidate current behavior. These are design/readiness classifications, not claims that the current page is functionally broken.

| Surface / family | 320 | 360 | 390 | 412 | 430 | Tablet ~768–1024 | Desktop >=1280 | Primary concern |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Global shell / topbar / bottom nav | R | R | R | R | R | R | R | Mobile chrome can work, but tablet/desktop remain constrained to the same narrow column; top safe-area is not explicitly consumed |
| Home | R | R | R | R | R | R | R | Stacked modules should become mobile-priority flow and richer dashboard composition at larger widths |
| Learn hub | R | R | R | R | R | R | R | Many equal destinations need grouped mobile scanning and multi-column/tablet structure |
| Reader / source / translation | R | R | R | R | R | R | R | Reading measure, tool placement and source drawers should adapt rather than simply scale |
| Study / Deep Questions / Story / Wisdom | R | R | R | R | R | R | R | Sequential mobile flow; split/reference workspace opportunity on tablet/desktop |
| Adaptive / Open Review | V | V | V | V | V | R | R | Review controls must remain thumb-friendly; larger widths can support context/history without widening text excessively |
| Bible World | R | R | R | R | R | R | R | World/map experience needs purposeful mobile viewport and larger-screen spatial composition |
| Daily Journey / Mission | R | R | R | R | R | R | R | Focused mobile step flow; progress/context can become side rail or split composition on larger widths |
| Progress | R | R | R | R | R | R | R | Charts/history/cards need reflow and text-scale resilience |
| Transform / Personality / Psychometrics | R | R | R | R | R | R | R | Dense private results need readable mobile sequence and restrained wider dashboards |
| Games / Kids | R | R | R | R | R | R | R | Controls/HUD/game boards need game-specific responsive rules, orientation checks and no accidental scroll traps |
| Avatar Vault | R | R | R | R | R | R | R | Collection grid should change column count/inspection pattern by width |
| Calendar | R | R | R | R | R | R | R | Month grid alone is weak at 320; mobile agenda/hybrid should differ from tablet/desktop calendar |
| Private / Cloud Notes | R | R | R | R | R | R | R | Mobile editor/list handoff vs larger split-pane writing workspace |
| Couples | R | R | R | R | R | R | R | Shared/local state cues and Scripture actions must remain clear under narrow width/text scaling |
| Community / Journey Groups / Encouragements | R | R | R | R | R | R | R | Feed/group/member composition and mobile action placement need deliberate hierarchy |
| Live Rooms | R | R | R | R | R | R | R | Join/leave/status controls should remain reachable without crowding; participant layout adapts by width |
| Recordings / Media | R | R | R | R | R | R | R | Media player context, lists/thumbnails and controls need responsive media-library treatment |
| Ministry / Assignments / Workspace | R | R | R | R | R | R | R | Dense operational data should not be reduced to horizontally compressed cards/tables; use mobile task/detail patterns |
| Notifications | V | V | V | V | V | R | R | Feed/list can stay linear on mobile; desktop may use detail pane |
| Team / Leaderboards / Recognition | R | R | R | R | R | R | R | Ranking/team data requires deliberate narrow-width structure and text scaling |
| Congregation / Content Review / Admin | R | R | R | R | R | R | R | Tables/operations/permission context need mobile list/detail alternatives, not horizontal clipping |
| Account / Auth / Recovery | V | V | V | V | V | R | R | Existing controls are reasonably touch-sized, but recovery/device rows and XL text require reflow validation |
| Tutorial | R | R | R | R | R | R | R | Coach marks must anchor safely after shell/page redesign and survive viewport changes |
| Accessibility settings | V | V | V | V | V | V | V | Main issue is preserving selected text size rather than reducing it at narrow widths |
| Offline / loading / empty / error / denied | R | R | R | R | R | R | R | State composition must preserve shell, recovery action, safe-area and focus behavior consistently |

## Prioritized findings

### A2-V4-001 — Global responsive ownership is too narrow for the v4 design target

- Exact branch/SHA: `main` @ `b3b6cd84603defe0eeca88f3db6982dfcb65eff9`
- Route/surface: global shell and every routed page
- Viewport context: all requested phone widths, tablet, desktop
- Evidence: `src/ui/app.css` constrains both `.bq-topbar` and `.bq-main` to `width:min(100% - 22px,760px)` and keeps the same 760 px ceiling at all larger widths. The only global small-screen composition breakpoint is `@media(max-width:480px)`. The route table in `src/app/bootstrap.js` exposes dozens of materially different experiences underneath that same global container.
- Category: RESPONSIVE / INTERACTION
- Severity: CRITICAL
- Problem: the shell supplies a mobile-ish narrow column rather than a true responsive application frame. A 768–1440 px viewport does not gain a deliberate content rail, secondary pane, wider game board, workspace split, or page-specific layout region from the global system.
- Recommended v4 direction: define a v4 responsive foundation with named content measures and composition regions rather than one universal max width. Keep narrow editorial measures for Scripture/text, but allow dashboards, maps, games, media, ministry/admin and workspace pages to opt into wider page grids. Use a small set of semantic breakpoints driven by composition failure, not device names.
- Change class: ARCHITECTURE-AFFECTING for global layout primitives; UX-STRUCTURE for page adoption.
- True owner: `src/ui/app.css` / future v4 layout foundation and each feature stylesheet; `src/ui/shell.js` for chrome structure. Router/state owners should not move.
- Dependencies: A1 design-system primitives; A3 stylesheet ownership/migration safety; A4 navigation/page IA.
- Post-implementation validation: 320/360/390/412/430, ~768, ~1024, 1280 and 1440; portrait/landscape where relevant; no horizontal overflow; no clipped focus rings; readable text measures; route shell remains single-owner.
- Confidence: HIGH.

### A2-V4-002 — Requested XL text is intentionally reduced on small screens instead of requiring robust reflow

- Exact branch/SHA: same.
- Route/surface: every surface using accessibility text scaling
- Viewport context: `<=430px`, especially 320/360 px
- Evidence: `src/ui/accessibility.css` defines `html[data-bq-text="xlarge"]{font-size:125%}` but overrides it inside `@media(max-width:430px)` to `118.75%`.
- Category: ACCESSIBILITY / RESPONSIVE
- Severity: HIGH
- Problem: the user-selected larger text level becomes smaller precisely on the most constrained devices. This treats layout pressure by weakening the accessibility preference.
- Recommended v4 direction: preserve the semantic XL scale at phone widths and make components reflow. Replace fixed horizontal arrangements that fail under 125%+ text with wrapping, stacked actions, responsive tabs, list/detail navigation, or content-priority collapse that does not hide functionality. Validate browser text zoom independently from the app preference.
- Change class: DESIGN-ONLY / UX-STRUCTURE; becomes FUNCTION-AFFECTING only if controls are removed or reordered semantically.
- True owner: `src/ui/accessibility.css` for scale policy; individual component/layout owners for reflow failures.
- Dependencies: A1 typography scale; A4 focus/reading order if layouts reorder.
- Post-implementation validation: all core routes at 320 and 360 with XL app text; browser 200% text zoom where supported; no truncation/overlap/off-screen controls; keyboard order matches visual order.
- Confidence: HIGH.

### A2-V4-003 — Bottom safe area is handled, but top/side safe-area composition is incomplete for an edge-to-edge v4 shell

- Exact branch/SHA: same.
- Route/surface: global shell
- Device context: installed PWA / notched phones / landscape
- Evidence: `index.html` opts into `viewport-fit=cover`. `.bq-nav` explicitly applies `padding-bottom:env(safe-area-inset-bottom)`, but the sticky `.bq-topbar` has no `safe-area-inset-top` treatment and the global content rails do not explicitly consume left/right safe areas.
- Category: RESPONSIVE / PWA / INTERACTION
- Severity: HIGH
- Problem: the current bottom navigation anticipates iOS safe-area geometry, but an edge-to-edge v4 shell can still place top or landscape content too close to cutouts/system regions.
- Recommended v4 direction: make safe-area variables part of the shell layout primitives. Apply them at the shell/chrome boundary, not as one-off feature padding. Test browser and installed modes separately because available viewport geometry differs.
- Change class: DESIGN-ONLY / ARCHITECTURE-AFFECTING at shell primitive level.
- True owner: global shell CSS and `src/ui/shell.js` if structural wrappers change.
- Dependencies: A1 shell redesign; A3 PWA ownership review.
- Post-implementation validation: iPhone-style notch portrait + landscape emulation, installed standalone and normal browser, Android edge-to-edge, bottom-nav and sticky-header hit areas, no double-padding when safe-area values are zero.
- Confidence: HIGH static evidence; runtime impact must be browser-verified.

### A2-V4-004 — Five-width evidence is not currently a v4 acceptance contract

- Exact branch/SHA: same.
- Route/surface: all shipped user/leader/admin routes
- Viewport context: 320/360/390/412/430 + tablet/desktop
- Evidence: no current v4 responsive report or current-main test discovered in this inspection establishes a comprehensive route-by-width acceptance matrix. Historical v3 width evidence cannot validate redesigned v4 compositions.
- Category: RESPONSIVE / RELEASE-EVIDENCE
- Severity: HIGH
- Problem: v4 grants structural redesign freedom, so old “fits at mobile width” smoke tests are insufficient. Without a route-by-width contract, regressions in dense secondary surfaces are likely to be missed while Home/Reader/Games look correct.
- Recommended v4 direction: after implementation begins, maintain one reusable responsive browser harness that iterates the authoritative route inventory and target widths. It should test document/viewport overflow, visible-control containment, fixed/sticky chrome, minimum usable targets, focus visibility, page/console errors and route-specific assertions. Add visual snapshots only where stable and useful; do not weaken functional assertions to make redesigns pass.
- Change class: DESIGN VALIDATION / TEST CONTRACT; no product behavior change.
- True owner: browser acceptance tests, with route inventory sourced from the actual composition owner rather than duplicated manually where practical.
- Dependencies: A3 test architecture; A4 authoritative surface/flow list.
- Post-implementation validation: exact candidate SHA, all authoritative routes, all target widths plus tablet/desktop, Chromium plus representative WebKit/Firefox where available.
- Confidence: HIGH.

### A2-V4-005 — Mobile navigation should be redesigned for thumb reach and text scaling, not simply restyled

- Exact branch/SHA: same.
- Surface: global five-item bottom navigation
- Viewport context: 320–430 px; installed PWA
- Evidence: `.bq-nav` is fixed, 72 px high, five equal columns. Labels use `10px` text and icons are current text/unicode glyphs. The safe-area bottom padding is included inside the declared fixed height.
- Category: INTERACTION / ACCESSIBILITY
- Severity: HIGH
- Problem: five destinations are reachable, but 10 px labels are visually small, translation/localization or XL text has little room, and a fixed 72 px total height can compress usable content when bottom inset grows.
- Recommended v4 direction: keep bottom navigation only if A4 confirms the five top-level destinations. Give each item a clear SVG icon + readable label, define a minimum interactive zone independent of the safe-area inset, and let the overall chrome height become `content height + inset`. At tablet/desktop, consider a rail or adaptive navigation treatment instead of stretching phone bottom-nav logic.
- Change class: UX-STRUCTURE. Destination changes are FUNCTION-AFFECTING and require A4/captain decision.
- True owner: `src/ui/shell.js`, shell/global layout styles.
- Dependencies: A1 icon/shell system; A4 IA; A3 single-shell ownership.
- Post-implementation validation: thumb-target geometry, 320 px with XL text, long translated labels, keyboard/focus, screen-reader name/current-state, installed-mode safe area, route highlighting.
- Confidence: HIGH.

### A2-V4-006 — Dense operational surfaces need mobile list/detail patterns rather than compressed desktop structures

- Exact branch/SHA: same.
- Routes/surfaces: Ministry Hub, Assignments, Workspace, Team Center, Congregation, Content Review, Admin/leader operations, Calendar
- Viewport context: 320–430 mobile versus tablet/desktop
- Evidence: current route inventory includes multiple data-dense leader/admin/operational features, while the global application frame gives them the same narrow single-column shell. A1 independently identifies these surfaces as needing mature operational UI rather than generic cards.
- Category: RESPONSIVE / INTERACTION
- Severity: HIGH
- Problem: merely making tables/cards `width:100%` will not create a usable mobile operational experience. Status, assignee/audience, due dates, permissions, destructive actions and evidence can compete for one narrow row/card.
- Recommended v4 direction: design mobile-specific list → detail/task flows, sticky contextual action bars only where safe, compact status chips, disclosure for secondary metadata, and full-detail panes/split layouts at tablet/desktop. Do not use `overflow:hidden` to mask data or horizontal scrolling as the default for core tasks.
- Change class: UX-STRUCTURE; SECURITY-PRIVACY-AFFECTING if role/privacy information or dangerous-action confirmation changes.
- True owner: each feature page/styles; underlying services/auth/RLS remain unchanged unless deliberately approved.
- Dependencies: A3 role/security review; A4 task-flow prioritization; A1 mature admin visual language.
- Post-implementation validation: member/leader/admin roles, long names/statuses, 320 XL text, keyboard, destructive-action focus/confirmation, no hidden permission/context fields, tablet split-pane behavior.
- Confidence: HIGH design inference from authoritative surface breadth; exact component failures need runtime reproduction once v4 implementations exist.

### A2-V4-007 — Reader/Study should use responsive reading and reference compositions, not a universally wider canvas

- Exact branch/SHA: same.
- Routes: Reader, Guided Study, Deep Questions, Story Journey, Wisdom Situations
- Viewport context: phone, tablet landscape, desktop
- Evidence: these features share the same global 760 px ceiling despite very different needs. A1's v4 design audit identifies editorial reading, Scripture anchors, evidence/provenance and reflection as separate hierarchy needs.
- Category: RESPONSIVE / ACCESSIBILITY
- Severity: HIGH
- Problem: simply widening these pages on desktop would reduce reading quality, while retaining the phone stack everywhere wastes larger screens and makes study/reference switching cumbersome.
- Recommended v4 direction: preserve an accessible editorial line length for Scripture/long prose. On mobile, use a single primary reading/task column with drawers/sheets for secondary source tools. On tablet/desktop, allow secondary reference/source/reflection panes around a constrained reading column. Maintain semantic DOM/reading order so visual pane placement does not scramble keyboard or screen-reader order.
- Change class: UX-STRUCTURE.
- True owner: Reader/Study feature composition and page styles; source/doctrinal data owners unchanged.
- Dependencies: A1 editorial design; A4 task hierarchy; A3 source/doctrinal boundaries.
- Post-implementation validation: 320–430, 768/1024/1440, text zoom, keyboard traversal, screen-reader landmark/order, drawer focus trap/return, no horizontal verse scrolling.
- Confidence: HIGH.

### A2-V4-008 — Games require responsive game boards and orientation testing as a separate experience family

- Exact branch/SHA: same.
- Routes: Play launcher and individual games including Memory Meadow and other shipped modes
- Viewport context: 320–430 portrait, phone landscape, tablet
- Evidence: current Games are routed under the same application shell and global width system, while game modes have different board/HUD/control requirements. A1 confirms several modes currently reuse generic panel/question structures despite varied gameplay.
- Category: RESPONSIVE / INTERACTION / PERFORMANCE
- Severity: HIGH
- Problem: game screens can technically fit yet still feel cramped, require excess page scrolling, or put repeated actions outside comfortable reach. Board/card grids and animation assets have materially different responsive constraints from Reader/Admin pages.
- Recommended v4 direction: define game-layout primitives separate from editorial page primitives: safe HUD zones, board aspect/column policies, large touch targets, compact feedback, optional landscape enhancement where beneficial, and controlled animation budgets. Never lock orientation unless a specific game truly cannot function otherwise.
- Change class: DESIGN-ONLY / UX-STRUCTURE; FUNCTION-AFFECTING if board rules/card counts change, which A2 does not recommend by default.
- True owner: Games feature/styles/assets; existing game runtime/state remains single owner.
- Dependencies: A1 game art; A3 asset/performance budget; A4 gameplay/task flows.
- Post-implementation validation: all target phone widths, portrait/landscape, tablet, touch emulation, no scroll traps, board state preserved on resize/orientation, reduced motion, low-end performance sanity.
- Confidence: HIGH.

### A2-V4-009 — Accessibility motion policy is strong in intent but should move from blanket emergency override toward component-aware v4 motion

- Exact branch/SHA: same.
- Surface: global reduced-motion behavior
- Context: users with `data-bq-effective-motion="reduce"`
- Evidence: `src/ui/accessibility.css` globally forces animation and transition duration to `.001ms` with `!important` for all elements/pseudo-elements and disables smooth scrolling. This is deliberate and bounded accessibility behavior, not an uncontrolled cosmetic patch.
- Category: ACCESSIBILITY / INTERACTION
- Severity: MEDIUM
- Problem: the blanket rule is safe as a fallback, but v4 intends richer motion. Some future component transitions may convey state/location; eliminating them indiscriminately can be less clear than using a non-motion alternative.
- Recommended v4 direction: retain the global emergency guarantee, but require every meaningful v4 motion primitive to define a reduced-motion state explicitly: instant state swap, opacity-only treatment where appropriate, static success state, no parallax/large translation. Decorative motion must never be required for comprehension.
- Change class: DESIGN-ONLY.
- True owner: v4 motion tokens/primitives plus `src/ui/accessibility.css` fallback.
- Dependencies: A1 motion system; A3 CSS ownership.
- Post-implementation validation: OS reduced-motion + app reduced-motion, games/rewards/tutorial/sheets, no essential information lost, no long residual transitions.
- Confidence: HIGH.

### A2-V4-010 — PWA service-worker behavior is architecturally stable, but v4 asset growth creates a cache/first-load design dependency

- Exact branch/SHA: same.
- Surface: install/offline/update and all artwork-heavy redesigned pages
- Context: installed standalone, offline reload, first load on constrained network
- Evidence: `offline-shell-sw.js` uses a same-origin network-first cache for navigate/script/style/image/font destinations and warms a supplied shell list with concurrency 8. Its cache namespace remains `biblequest-v3-offline-shell-v1`. `src/app/pwa-install.js` tracks install prompt availability/installed state but does not itself define page presentation.
- Category: PWA / PERFORMANCE
- Severity: MEDIUM
- Problem: v4 will likely add significantly richer imagery. Globally loaded or aggressively warmed assets can increase first-load/cache storage and update churn. The old cache name is not itself a functional defect, but v4 must deliberately define version/update behavior when shell assets materially change.
- Recommended v4 direction: keep service-worker ownership separate from page redesign. Establish an asset budget and distinguish critical shell assets from page/game artwork that can load on demand. Version/cache behavior should change only with an explicit PWA migration plan, not as a CSS workaround. Give install/offline/update states first-class v4 UI in the shell/state system.
- Change class: PERFORMANCE / ARCHITECTURE-AFFECTING if cache strategy changes.
- True owner: `offline-shell-sw.js`, offline-shell service, PWA install service; feature asset owners for lazy loading.
- Dependencies: A1 asset system; A3 PWA/cache architecture.
- Post-implementation validation: cold load, repeat load, install, standalone reload, offline shell, offline previously visited content/assets, update from prior cache, storage/request-size measurement, missing image fallback, no console/page errors.
- Confidence: HIGH for architecture/performance risk; no current v4 performance regression can be claimed before assets are implemented.

### A2-V4-011 — Account baseline has useful touch sizing, but narrow-width text resilience must become a product-wide standard

- Exact branch/SHA: same.
- Route: Account/Auth/Recovery plus reusable form controls
- Viewport context: 320–430
- Evidence: current app CSS gives account inputs/buttons 46 px minimum height and session chip 44 px minimum height. At `max-width:480px` account actions become a grid and primary/secondary buttons become full width. Device rows remain a flex layout and tabs retain three equal columns with smaller 11 px text.
- Category: ACCESSIBILITY / RESPONSIVE
- Severity: MEDIUM
- Problem: the current account page demonstrates several good mobile patterns, but tabs/device rows/recovery content still need long-text and XL-text stress testing. v4 should generalize the good minimum-target/reflow patterns rather than recreate them inconsistently per feature.
- Recommended v4 direction: make minimum target sizes, form control sizing, action stacking and responsive segmented controls shared primitives. Allow segmented tabs to scroll or change composition only when necessary; prefer wrapping/stacking device metadata over shrinking type.
- Change class: DESIGN-ONLY / UX-STRUCTURE.
- True owner: v4 form/control primitives and Account feature composition.
- Dependencies: A1 component system.
- Post-implementation validation: 320 px, XL app text, browser zoom, recovery code wrapping, long email/device names, keyboard focus, autofill, virtual-keyboard viewport behavior.
- Confidence: HIGH.

### A2-V4-012 — Current accessibility focus treatment is broad; v4 must preserve visibility through new layered surfaces

- Exact branch/SHA: same.
- Surface: all routes, especially drawers/sheets/modals/tutorial/admin actions
- Evidence: global `:focus-visible` currently applies a 3 px `currentColor` outline with 3 px offset. v4 direction explicitly permits richer surfaces, overlays, artwork and depth.
- Category: ACCESSIBILITY
- Severity: MEDIUM
- Problem: global focus visibility exists, but new dark/colored/artwork surfaces can make `currentColor` insufficiently distinct, and clipping/overflow containers can cut off the 3 px offset ring.
- Recommended v4 direction: define focus-ring tokens with tested contrast against light/dark/accent surfaces and require components to avoid clipping the ring. Modal/sheet focus trapping and focus return must be explicit component contracts.
- Change class: DESIGN-ONLY / UX-STRUCTURE.
- True owner: v4 accessibility/focus primitive plus modal/sheet components.
- Dependencies: A1 color/token system; A4 interaction flows.
- Post-implementation validation: keyboard-only traversal on every experience family, forced/strong contrast as supported, focus not obscured by sticky chrome, correct focus return after drawers/dialogs.
- Confidence: MEDIUM-HIGH; contrast failures must be confirmed on implemented v4 colors.

## Highest-value responsive redesign opportunities

1. **Global shell + responsive composition primitives** — highest leverage because every page currently inherits one 760 px application frame.
2. **Reader/Study family** — mobile single-task reading and tablet/desktop reference workspace can materially improve usefulness without widening prose.
3. **Ministry/Assignments/Workspace/Admin** — deliberate mobile list/detail task patterns prevent dense operational features from becoming card-compression exercises.
4. **Games/Kids** — separate game-responsive primitives, board/HUD geometry and orientation checks are required for real game feel.
5. **Home/Learn/More** — mobile information hierarchy and tablet/desktop dashboard/group layouts should differ rather than simply gain columns.
6. **Calendar** — strongest case for genuinely different mobile and desktop composition: agenda/hybrid on phone, richer calendar at larger widths.
7. **Notes/Media/Community** — mobile stack with larger-screen split panes/detail contexts can reduce navigation churn.
8. **Accessibility system** — preserve full user-selected text scaling, focus visibility and reduced-motion alternatives across every new v4 primitive.

## Cross-agent handoff

### To A1 — Design system

- Define responsive layout primitives as part of the v4 foundation: content measures, wide workspace canvas, page grid, card/list density, form controls, nav chrome, sheet/dialog, focus ring and motion tokens.
- Preserve readable editorial line length even when the app frame becomes wider.
- Treat Games/Kids and operational/admin layouts as different responsive families rather than skins on one panel system.
- Do not solve 320 px pressure by reducing type below the selected accessibility scale.

### To A3 — Architecture/safety

- Review the migration path away from globally stacked feature/polish CSS into v4 page ownership without creating duplicate style owners.
- Design a single route-driven responsive acceptance harness that covers the authoritative route inventory at 320/360/390/412/430 + tablet/desktop.
- Review safe-area ownership, modal/sheet focus infrastructure, and PWA cache/asset loading before rich v4 artwork is broadly deployed.
- Preserve one shell/router/service-worker owner; do not add responsive JavaScript unless a component genuinely requires stateful layout behavior.

### To A4 — UX flows

- Confirm whether the five current top-level nav destinations should remain; A2 recommends adaptive chrome, not changing destinations independently.
- Define which mobile surfaces should be list→detail, sheet/drawer, or single-task step flows so visual reordering does not break task semantics or focus order.
- Prioritize mobile action placement for Assignments/Ministry/Admin, Reader tools, Games and Calendar.
- Specify loading/empty/error/offline/recovery focus targets and return behavior as part of each flow.

## Validation contract recommended for every implemented v4 tranche

For each changed page family, the later implementation/captain should capture exact-SHA evidence at 320, 360, 390, 412 and 430 px, representative tablet portrait/landscape, and desktop. Validate horizontal overflow, clipped content/focus, sticky/fixed collision, touch target geometry, XL app text, browser text zoom, keyboard/focus order, contrast, reduced motion, long labels/content, loading/empty/error/disabled/permission states, viewport resize/orientation, page + console errors and representative Chromium/WebKit/Firefox behavior. PWA-affecting tranches additionally require install, standalone safe areas, offline reload, cache update and online-recovery checks.
