# BibleQuest v4 — A1 Design System Report

Agent: `BQ-A1-V4-DESIGN-SYSTEM`
Authority: analysis/reporting only
Central control: `BIBLEQUEST_V4_ANALYSIS_HUB.md`

A1 may update only this file. Do not modify product code, tests, workflows, branches, deployment, Supabase, Cloudflare, or the central hub.

## Latest inspected ref

- Branch: `main`
- Inspected product/documentation HEAD before this report write: `aa312e3248271f7cbe9c47d7af67069c19acb397`
- Inspection date: 2026-09-12 JST
- The repository route/composition owner inspected was `src/app/bootstrap.js`; global shell owner was `src/ui/shell.js`; stylesheet assembly was inspected in `index.html`.
- v3 material was treated as historical evidence only. The v4 direction in `BIBLEQUEST_V4_ANALYSIS_HUB.md` is authoritative for this report.

## Executive finding

BibleQuest already has broad functional breadth, but the current presentation system still behaves like a historically accumulated website/app shell: a small generic shell, pages composed mostly from repeated panels/cards/buttons, and a very large globally loaded chain of feature-specific base styles plus `*-visual-polish.css` and `*-phase-b.css` overlays. That architecture explains why many surfaces can be functional yet still feel visually similar, text-heavy, or patched rather than intentionally designed.

The v4 redesign should not add another global polish layer. It should establish a compact v4 design foundation and then redesign pages as page-specific compositions using shared primitives. The system should support distinct experience families without forcing sameness:

1. **Explore / Home / Journey** — warm, aspirational, progress-oriented Bible + quest identity.
2. **Learn / Reader / Study** — mature editorial clarity, strong Scripture hierarchy, calm information density.
3. **Play / Kids / Bible World / Avatar** — playful, visual, animated, collectible/game-like without becoming noisy.
4. **Grow / Reflection / Notes / Transform** — personal, contemplative, spacious, emotionally safe.
5. **Community / Couples / Media** — relational and human, with clear identity and trust cues.
6. **Ministry / Assignments / Workspace / Admin** — mature operational UI, restrained color, explicit state/status hierarchy and privacy/permission clarity.

This is a DESIGN PROPOSAL. It preserves the current feature/state/service ownership and does not require parallel runtimes.

## Authoritative surface matrix

The current composition owner imports and routes the following shipped surface families; these must all remain in the v4 redesign inventory.

| Surface / family | Current design assessment | Severity | Primary v4 direction | Change class | Likely owner |
|---|---|---:|---|---|---|
| Home / launch | HIGH | HIGH | Replace stacked panel landing-page feel with a real app dashboard: journey hero, current task, compact progress, personalized shortcuts, media secondary | UX-STRUCTURE | `src/features/home/index.js`, Home styles |
| Global shell / topbar / bottom nav | HIGH | HIGH | New v4 app chrome with coherent icon set, modern brand mark, route-aware title/context, clearer account/progress affordances | UX-STRUCTURE | `src/ui/shell.js`, shell styles |
| Learn hub | HIGH | HIGH | Replace ten near-identical text buttons with grouped learning modes, visual categories, recent/continue state, compact source-safety treatment | UX-STRUCTURE | `src/features/learn/index.js` |
| Reader / translation / source context | MEDIUM | HIGH | Editorial reading canvas, stronger Scripture typography, translation/source drawer, low-distraction tools, contextual verse actions | UX-STRUCTURE | Reader feature + `src/ui/reader.css` |
| Guided Study | MEDIUM | HIGH | Step-based study workspace with clear active step, Scripture anchor and reflection area; avoid generic card stack | UX-STRUCTURE | Study feature/styles |
| Deep Questions | MEDIUM | MEDIUM | Mature inquiry layout with strong question focal point, Scripture evidence, reflection space and provenance separated visually | UX-STRUCTURE | Deep Questions feature/styles |
| Story Journey | MEDIUM | HIGH | Scene-based narrative flow with illustration slots, chapter/scene progress and readable Scripture checkpoints | UX-STRUCTURE | Story Journey feature/styles |
| Wisdom Situations | MEDIUM | MEDIUM | Scenario-first decision composition with choice hierarchy and rationale reveal, not quiz-card sameness | UX-STRUCTURE | Wisdom feature/styles |
| Adaptive Learning | MEDIUM | MEDIUM | Smart-review queue UI with due-state, mastery cues and lightweight progress visualization | DESIGN-ONLY / UX-STRUCTURE | Adaptive feature/styles |
| Open Review | MEDIUM | MEDIUM | Flashcard/recall composition with source answer reveal and confidence controls visually dominant | DESIGN-ONLY / UX-STRUCTURE | Open Review feature/styles |
| Bible World | MEDIUM | HIGH | Treat as explorable world/map, not another panel page: region art, map progression, locked/unlocked states, journey continuity | UX-STRUCTURE | Bible World feature/styles/assets |
| Daily Journey / Mission | MEDIUM | HIGH | One focused daily path with visible stage progression, Scripture anchor and completion reward; should feel central to the app | UX-STRUCTURE | Daily Mission feature/styles |
| Progress | MEDIUM | MEDIUM | Replace metric blocks with meaningful journey history, streak/calendar rhythm, milestones and next-step guidance | UX-STRUCTURE | Progress feature/styles |
| Transform | MEDIUM | MEDIUM | Mature personal-growth dashboard with private tone, dimensions/insights and careful progress visualization | UX-STRUCTURE | Transform feature/styles |
| Personality / Psychometrics | MEDIUM | MEDIUM | Assessment/result surfaces should look clinical-trustworthy rather than gamified; use clear sections, confidence/explanation and privacy cues | SECURITY-PRIVACY-AFFECTING if data meaning changes; otherwise DESIGN-ONLY | Personality/Psychometrics features |
| Games launcher | HIGH | HIGH | Visual game library with recognizable game art, category/state cues and last-result/progress badges; current launcher remains text/card heavy | UX-STRUCTURE | `src/features/games/index.js`, games styles/assets |
| Memory Meadow | HIGH | HIGH | Keep 3/4-column game rules, but replace emoji/utility-card look with cohesive meadow art, real card backs/faces, success animation and game HUD | DESIGN-ONLY | Games feature + assets/styles |
| Bible Detective / Timeline / Recall / Play Together | HIGH | HIGH | Give each mode its own visual identity while retaining one launcher/runtime; real iconography/art instead of emoji markers and repeated question-panel treatment | DESIGN-ONLY / UX-STRUCTURE | Games feature/styles/assets |
| Avatar Vault | MEDIUM | HIGH | Collection/vault experience with avatar grid, rarity/achievement hierarchy and unlock states; avoid generic card page | UX-STRUCTURE | Avatar Vault feature/styles/assets |
| Personal Mission | MEDIUM | MEDIUM | Journey/map framing with current objective, progress and next action; calmer than kids games | UX-STRUCTURE | Mission feature/styles |
| Calendar | MEDIUM | MEDIUM | Modern agenda/month hybrid tuned for BibleQuest events and assignments; dense but calm, with clear event types | UX-STRUCTURE | Calendar feature/styles |
| Private Notes | MEDIUM | MEDIUM | Writing-first private workspace with explicit device-only trust cue, notebook/list + editor hierarchy | UX-STRUCTURE | Private Notes feature/styles |
| Cloud Notes | MEDIUM | MEDIUM | Same visual family as Private Notes but with account/sync state; avoid making cloud/local distinction only textual | UX-STRUCTURE | Cloud Notes feature/styles |
| Couples Family / Couples Cloud | MEDIUM | MEDIUM | Warm relationship-focused composition, shared journey cards, Scripture connection, clear local-vs-shared trust state | UX-STRUCTURE | Couples features/styles |
| Community hub | MEDIUM | HIGH | Human-centered community dashboard: groups, people, live activity, assignments and recognition with clear hierarchy | UX-STRUCTURE | Community feature/styles |
| Journey Groups / Encouragements | MEDIUM | MEDIUM | Conversation/group identity, member context, empty/loading states and safer message affordances | UX-STRUCTURE | Group/encouragement features |
| Live Rooms | MEDIUM | MEDIUM | Live-presence treatment with strong session status, participants and join/leave clarity; avoid ordinary panel treatment | UX-STRUCTURE | Live Rooms feature/styles |
| Recordings / Media Library | MEDIUM | MEDIUM | Media-library visual language: thumbnails/posters, metadata hierarchy, filters and one consistent player context | UX-STRUCTURE | Recordings/Media features/styles |
| Ministry Hub | HIGH | HIGH | Mature role-aware ministry dashboard with operational sections and permission context; no playful game styling | UX-STRUCTURE | Ministry Hub feature/styles |
| Assignments | HIGH | HIGH | Task-management hierarchy: status, due dates, assignee/audience, privacy of responses, completion progress and leader/member views | UX-STRUCTURE / SECURITY-PRIVACY-AFFECTING | Assignments feature/service |
| Notification Center | MEDIUM | MEDIUM | Inbox/feed pattern with read/unread, type icon, target route, timestamps and empty state; avoid generic stacked panels | UX-STRUCTURE | Notification Center feature/styles |
| Workspace | HIGH | HIGH | Real workspace composition with modules/notes/reference/task context rather than generic cards; preserve current data owners | UX-STRUCTURE | Workspace feature/styles |
| Team Center / Leaderboards / Recognition | MEDIUM | MEDIUM | Role/team dashboard and recognition hierarchy; distinguish competition from ministry administration | UX-STRUCTURE | respective features/styles |
| Congregation | MEDIUM | HIGH | Mature organization/membership page with role/status trust cues, member directory/action hierarchy | SECURITY-PRIVACY-AFFECTING if permission presentation changes | Congregation feature/styles |
| Content Review / Moderation / Reporting | MEDIUM | HIGH | Professional review-console pattern with evidence, decision state, provenance and irreversible-action clarity | SECURITY-PRIVACY-AFFECTING | Content review/reporting features |
| Admin Console / Admin Operations | MEDIUM | HIGH | Operational/admin design system: tables/status/diagnostics/actions, minimal decorative art, strong warning hierarchy | SECURITY-PRIVACY-AFFECTING | admin features/styles |
| Account / authentication / recovery | MEDIUM | HIGH | Calm account center with clear auth state, sync implications, recovery hierarchy and trusted visual language | SECURITY-PRIVACY-AFFECTING if flows change | Account feature/styles |
| Tutorial | MEDIUM | MEDIUM | Contextual coach-mark/onboarding sequence using the v4 shell and real destinations; avoid separate outdated visual language | UX-STRUCTURE | Tutorial feature/styles |
| Accessibility | MEDIUM | MEDIUM | Make accessibility a first-class settings experience with previews, grouped controls and immediate state feedback | UX-STRUCTURE | Accessibility feature/styles |
| More hub | HIGH | HIGH | Replace catch-all list/page with categorized destination hub and strong information architecture; primary source of discoverability debt | UX-STRUCTURE | More feature/styles |
| Offline / recovery / loading / empty / denied states | HIGH | HIGH | One coherent state system with page-context illustration/icon, concise explanation, primary recovery action and retained shell | DESIGN-ONLY / UX-STRUCTURE | shell recovery + individual features |

`HIGH` in the assessment column means the surface needs significant v4 redesign, not that its functionality is broken.

## Prioritized findings

### A1-V4-001 — The global shell still communicates “v3 rebuild,” not a finished v4 product

- Exact branch/SHA: `main` @ `aa312e3248271f7cbe9c47d7af67069c19acb397`
- Route/surface: global shell, all routes
- Evidence: `src/ui/shell.js` hard-codes a `BQ` text mark, subtitle `Rebuild v3`, unicode navigation icons (`⌂`, `▤`, `◆`, `◌`, `⋯`), persistent progress chip and account chip above a five-item bottom nav.
- Category: VISUAL SYSTEM / NAVIGATION
- Severity: CRITICAL
- Problem: the chrome looks like an internal rebuild shell and uses placeholder-like symbols rather than an intentional production identity.
- Why weak/outdated: text logo + unicode glyph navigation makes the app look prototypical. The shell also has no page-specific context beyond active bottom-nav state, so deep surfaces inherit the same generic frame.
- Recommended v4 direction: redesign the shell as a modern mobile app frame with a real BibleQuest mark/icon system, unified SVG iconography, context-aware top area, clearer account/avatar affordance, and an adaptive bottom navigation pattern. Retain five top-level destinations if A4 confirms the IA, but redesign their treatment completely.
- Change class: UX-STRUCTURE. Any change to route destinations is FUNCTION-AFFECTING and must be owned with A4/captain review.
- True owner: `src/ui/shell.js`, shell CSS; router remains `src/app/router.js`.
- Dependencies: A4 navigation IA; A2 mobile safe-area/touch/focus behavior; A3 shell/runtime ownership.
- Proof after implementation: all routes preserve navigation/back behavior, 320–430 widths, keyboard/focus, reduced motion, no duplicate shell/runtime, exact route highlighting.
- Confidence: HIGH.

### A1-V4-002 — The stylesheet model is historically layered and should not be extended into v4

- Exact branch/SHA: same.
- Surface: entire app.
- Evidence: `index.html` globally loads dozens of feature stylesheets plus many separate `*-visual-polish.css` and `*-phase-b.css` files before the application starts.
- Category: DESIGN SYSTEM / ARCHITECTURE
- Severity: CRITICAL
- Problem: visual ownership is fragmented across base CSS and later overlay CSS. This encourages specificity/load-order dependence and makes page identity harder to reason about.
- Why weak/outdated: the current system looks like successive cosmetic tranches rather than a deliberate modern design system.
- Recommended v4 direction: define a small v4 foundation—tokens, typography, spacing, elevation, icon rules, motion, common primitives—and then give each feature one explicit page-level stylesheet/component composition. Migrate page-by-page; do not perform a risky one-shot CSS rewrite.
- Change class: ARCHITECTURE-AFFECTING if stylesheet assembly/ownership is changed; DESIGN-ONLY for individual migrated pages.
- True owner: stylesheet assembly in `index.html`, global primitives in `src/ui/app.css`/future v4 foundation, feature-specific style owners.
- Dependencies: A3 implementation-safety review and migration sequence.
- Proof: CSS load-order regression, visual snapshots/contracts, no uncontrolled `!important`, no removed states, complete browser suite.
- Confidence: HIGH.

### A1-V4-003 — Home is a stacked content page rather than a modern app dashboard

- Exact branch/SHA: same.
- Route: `#/home`
- Evidence: `src/features/home/index.js` renders one hero followed by separate Daily Journey, Tutorial, Live Recordings, Media Library and Progress panels. The hero is strong as a concept but the page then reads as a vertical sequence of unrelated modules.
- Category: PAGE COMPOSITION
- Severity: HIGH
- Problem: primary user intent—continue today's Bible journey—is visually diluted by tutorial/media/promotional blocks.
- Why weak/outdated: every major item receives similar panel weight, producing landing-page density rather than personalized app hierarchy.
- Recommended v4 direction: use a dashboard composition: compact brand/seasonal hero, dominant “Continue today's journey” card, progress/streak row, two or three adaptive shortcuts, then secondary congregation/media content. Tutorial should appear contextually or as a small utility entry once onboarding is complete.
- Change class: UX-STRUCTURE. Reordering existing actions is safe; hiding/conditionalizing content based on state is FUNCTION-AFFECTING and requires A4 review.
- True owner: `src/features/home/index.js`, Home styles/assets.
- Dependencies: A4 determines state/priority logic; A2 mobile density.
- Proof: Home actions still navigate to correct current owners; empty/no-daily state; long names; 320px composition; no content inaccessible.
- Confidence: HIGH.

### A1-V4-004 — Learn hub is functionally rich but visually overloaded and undifferentiated

- Exact branch/SHA: same.
- Route: `#/learn`
- Evidence: `src/features/learn/index.js` presents ten learning destinations as the same `bq-learning-card` button in one grid, followed by a large doctrinal-safety panel and source guide.
- Category: INFORMATION HIERARCHY
- Severity: HIGH
- Problem: Reader, Study, Deep Questions, Story Journey, Wisdom, Bible World, Adaptive Learning, Open Review and two note systems have nearly equal visual priority.
- Why weak/confusing: users must read every card; visual scanning does not communicate “Read / Study / Explore / Review / Notes.” Safety/source information is important but competes with task selection.
- Recommended v4 direction: regroup into meaningful clusters with distinct iconography and restrained color families. Make “Read Bible” and “Continue” dominant. Put provenance/content-safety behind a visible but compact trust/details section instead of a large equal-weight destination block.
- Change class: UX-STRUCTURE; doctrinal policy content itself must not be altered by A1.
- True owner: `src/features/learn/index.js`; provenance/source owners remain protected.
- Dependencies: A4 information architecture; A3 doctrinal-boundary review.
- Proof: all ten destinations remain discoverable, source labels remain reachable/readable, keyboard order matches visual order, mobile grouping does not become excessively long.
- Confidence: HIGH.

### A1-V4-005 — Games need stronger page-specific art and game feel while preserving one runtime

- Exact branch/SHA: same.
- Route: `#/play` and in-game phases.
- Evidence: `src/features/games/index.js` uses one launcher with repeated `bq-panel bq-game-card` structures. Individual modes still rely on emoji/unicode markers such as fox, detective, stars, coins, book and Scripture glyphs, while multiple modes reuse the same question-card/explanation pattern.
- Category: VISUAL / GAME EXPERIENCE
- Severity: HIGH
- Problem: game logic is varied but visual identity is not equally differentiated.
- Why weak/outdated: emoji and repeated panels feel like functional prototypes. Kids modes in particular underuse illustration, tactile feedback and collectible presentation.
- Recommended v4 direction: keep the single existing launcher/game state owner, but create a v4 game visual kit: real SVG/WebP game marks, card-back system, HUD/progress primitives, answer-state motion, celebratory but reduced-motion-safe completion, and separate visual themes per mode. Memory Meadow can be illustrated and playful; Recall should remain closer to study/flashcards.
- Change class: DESIGN-ONLY for assets/motion; UX-STRUCTURE for launcher composition. Gameplay/rules changes are FUNCTION-AFFECTING and out of A1 scope.
- True owner: `src/features/games/index.js`, game CSS/assets; game service/rules remain unchanged.
- Dependencies: A2 reduced-motion/performance, A3 asset/runtime review.
- Proof: exact game-state transitions unchanged, disabled/locked/correct/wrong states visible, 3-column/4-column memory contracts preserved, asset fallback, first-load budget.
- Confidence: HIGH.

### A1-V4-006 — Serious operational/private surfaces need a separate mature design language

- Exact branch/SHA: same.
- Surfaces: Account, Ministry Hub, Assignments, Workspace, Congregation, Content Review/Reporting, Admin operations, private/cloud notes.
- Evidence: these routes are all first-class owners in `src/app/bootstrap.js`, but the global shell and historical panel/button language are shared broadly across the app.
- Category: TRUST / VISUAL HIERARCHY
- Severity: HIGH
- Problem: a single game/adventure aesthetic cannot safely scale across auth, privacy, ministry and administrative decisions.
- Why weak/confusing: if the same decorative treatment is used everywhere, users receive weak cues about privacy, authority, destructive actions, sync state and role context.
- Recommended v4 direction: define an “operational/trust” subset of the v4 system: neutral surfaces, stronger typography hierarchy, status chips, metadata rows, permission banners, tables/lists, irreversible-action treatment and explicit local/cloud/account state. Artwork should be minimal and supportive.
- Change class: DESIGN-ONLY when visual; SECURITY-PRIVACY-AFFECTING if the redesign changes which data/permission state is exposed or actionable.
- True owner: each corresponding feature page; auth/RLS/backend remain outside A1 authority.
- Dependencies: A3 security/privacy; A4 task flows.
- Proof: role/permission/empty/denied/loading/error states; screen-reader and keyboard ordering; no hidden privileged action; mobile admin layouts.
- Confidence: HIGH.

### A1-V4-007 — Page states need a coherent v4 state language

- Exact branch/SHA: same.
- Surfaces: global recovery plus all asynchronous/stateful pages.
- Evidence: shell recovery is its own generic `bq-panel` with eyebrow/title/text/two buttons. Individual feature pages implement their own loading, locked, empty and failure presentations.
- Category: STATE DESIGN
- Severity: HIGH
- Problem: important states are visually inconsistent and frequently text-first.
- Why weak/outdated: modern apps treat loading/empty/offline/permission/recovery as designed states, not fallback paragraphs.
- Recommended v4 direction: shared state primitives with icon/illustration slot, title, concise reason, primary/secondary recovery action, optional diagnostic/details region, and per-context tone. Keep the shell available whenever technically safe.
- Change class: DESIGN-ONLY / UX-STRUCTURE. Retry semantics must remain owned by existing services.
- True owner: shared UI primitives + `src/ui/shell.js` recovery rendering + each feature state owner.
- Dependencies: A2 accessibility/offline, A3 recovery/runtime ownership, A4 wording/action priority.
- Proof: offline, remote unavailable, unauthenticated, permission denied, empty data, first-load, retry-success and retry-fail cases.
- Confidence: HIGH.

### A1-V4-008 — Typography and density need explicit v4 tiers rather than page-by-page inheritance

- Exact branch/SHA: same.
- Surface: global.
- Evidence: current pages repeatedly use eyebrow → h1/h2 → paragraph → panel/card patterns, with feature styles layering additional adjustments.
- Category: TYPOGRAPHY / SPACING
- Severity: MEDIUM
- Problem: hierarchy is structurally repetitive and page density is driven more by inherited panel conventions than content type.
- Recommended v4 direction: establish explicit typography roles: app/display, page title, section title, reading/Scripture, body, metadata, labels, numeric/stat, and kid/game display. Pair with 4/8-based spacing scales but allow denser operational surfaces and more spacious reflective/reading surfaces.
- Change class: DESIGN-ONLY.
- True owner: future v4 tokens/foundation and feature composition.
- Dependencies: A2 font scaling/accessibility.
- Proof: 200% zoom, long Tagalog/Japanese labels, dynamic content wrapping, high-contrast modes.
- Confidence: HIGH.

### A1-V4-009 — Iconography should be replaced as a system, not page-by-page with emoji

- Exact branch/SHA: same.
- Surface: shell, games, cards, states.
- Evidence: shell uses unicode navigation symbols; games contain emoji markers; many destination cards are text-only.
- Category: ICONOGRAPHY / ASSET
- Severity: HIGH
- Problem: mixed unicode/emoji/text presentation has inconsistent stroke, baseline, cultural rendering and platform appearance.
- Recommended v4 direction: one original/allowed-use SVG icon family with defined sizes/strokes and filled/active variants; separate richer illustration assets for game/story moments. Emoji may remain only where intentionally part of game content, not as production navigation/iconography.
- Change class: DESIGN-ONLY.
- True owner: shared asset/icon system + surface presentation owners.
- Dependencies: provenance/license record, A2 accessible labeling, A3 asset strategy.
- Proof: asset fallback, no icon-only unlabeled controls, offline availability, dark/high-contrast compatibility if supported.
- Confidence: HIGH.

### A1-V4-010 — BibleQuest needs purposeful page identity without theme fragmentation

- Exact branch/SHA: same.
- Surface: all.
- Category: BRAND / ART DIRECTION
- Severity: HIGH
- Problem: v3/v3.5 visual work improved consistency, but v4 risks either preserving too much sameness or overcorrecting into unrelated mini-apps.
- Recommended v4 direction: shared brand DNA—shape language, icon family, typography, motion, spacing, navigation chrome—while allowing page families to vary backgrounds, illustration density, accent palette and composition. Bible World can feel map-like; Reader editorial; Games playful; Ministry operational; Couples warm.
- Change class: DESIGN-ONLY / UX-STRUCTURE.
- True owner: v4 design foundation + page presentation owners.
- Dependencies: captain art direction.
- Proof: cross-page review for coherence plus page-by-page usability evidence.
- Confidence: HIGH.

## Asset and performance rules for v4

- Prefer local SVG for icons and simple illustrations; WebP/AVIF-style raster assets only where richer art is materially better and runtime support/build path is validated.
- Avoid loading page-specific heavy artwork on first boot if the route is not visible. A3 should determine whether the current static architecture needs an asset-loading convention.
- Decorative art must not become required to understand navigation or status.
- Every retained external asset requires provenance/license evidence; original/generated assets should be identified as such.
- Avoid full-screen image backgrounds behind long text on Reader/Study/Ministry/Admin surfaces.
- Motion should communicate state/change; avoid ambient animation on serious or text-heavy pages. All nonessential motion must have a reduced-motion path.

## Ranked page/surface redesign priority

1. **Global shell + v4 design foundation** — highest leverage and currently visibly prototype-like (`Rebuild v3`, unicode icons, layered historical CSS).
2. **Home** — defines first impression and daily return behavior.
3. **Learn hub + Reader** — core Bible-use path; currently information-dense and visually undifferentiated.
4. **Games/Kids launcher + Memory Meadow + key games** — largest opportunity for delight and real visual identity.
5. **More hub** — critical discoverability surface for the very broad feature inventory.
6. **Ministry / Assignments / Workspace / Notifications** — needs coherent mature operational design before visual expansion elsewhere creates tone inconsistency.
7. **Daily Journey / Progress / Bible World** — should form one coherent journey/progression ecosystem.
8. **Study / Deep Questions / Story / Wisdom / Adaptive / Review** — redesign as distinct learning experiences, not variants of generic panels.
9. **Account / Notes / Transform / Psychometrics / Accessibility** — trust/privacy/readability-focused redesign.
10. **Community / Groups / Live Rooms / Couples / Media** — relational/media family with human context and richer empty/live states.
11. **Calendar / Avatar Vault / Personal Mission / Team / Leaderboards / Recognition** — integrate newer surfaces into the v4 system instead of preserving phase-B styling as a ceiling.
12. **Admin / Content Review / Operations / diagnostics/recovery** — final dedicated operational visual pass, coordinated closely with A3.

## Cross-agent handoff

### A2 — Responsive / Accessibility

Please validate the proposed v4 foundation against 320/360/390/412/430 widths before implementation patterns harden. Highest A2 risks: bottom/top shell composition, Learn grouping, game HUD/card grids, operational tables/lists, long localization strings, 200% text, touch targets, reduced motion and page-specific imagery. A1 recommends that responsive behavior be designed into v4 primitives rather than appended as viewport-specific patches.

### A3 — Architecture / Safety

Please assess a safe migration from the current globally loaded base + `visual-polish` + `phase-b` CSS chain toward explicit v4 foundation/primitives and page-owned styles. Determine an asset-loading/provenance strategy that does not regress offline/PWA behavior. Review any proposal touching Account, Assignments, Ministry, Workspace, Congregation, Content Review or Admin for privacy/permission implications. Do not allow a visual redesign to create duplicate route/state owners.

### A4 — UX Flows

Please validate the proposed information-hierarchy changes, especially Home priority, five top-level shell destinations, Learn grouping, More hub, Community/Ministry discoverability, and state/action hierarchy. A1 considers shell/Home/Learn/More the highest structural UX redesign candidates, but route changes or conditional visibility must be driven by A4/captain product decisions rather than visual preference.

## Noise rejected

- No recommendation to preserve a v3 layout merely because it already passed v3 visual tests.
- No recommendation for another global polish stylesheet.
- No global `!important` strategy.
- No duplicate v4 shell/router/component runtime.
- No change to game rules, auth, RLS, storage, backend or doctrinal logic disguised as visual work.
- No requirement that every page use the same card treatment, illustration density or accent color.
- No recommendation to add decorative imagery to serious/private surfaces unless it improves comprehension or trust.
