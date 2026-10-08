# BibleQuest V7 — Motion and animation release requirements

**Approved direction:** 2026-10-08 JST  
**Status:** V7 release-scope addition; implement in parallel with the existing image-first UI overhaul  
**Canonical lane trackers:** #1300 (A), #1301 (B), #1302 (C), #1303 (D)  
**Companions:** `V7_UI_UX_RELEASE_REQUIREMENTS_20261008.md` and `V7_IMAGE_FIRST_AND_PARALLEL_LANES_20261008.md`

## 1. Product intent and priority

Add restrained, cohesive, premium-feeling motion to BibleQuest V7, especially the Feelings/Needs rolling decks, devotional/Library browsing, Home hero, labeled navigation and ONE 2 ONE lesson progression. Motion must make navigation and state changes *easier to understand*, never compete with Scripture or conceal unavailable content. It is part of the V7 release work, not a speculative V8-only proposal.

**P0 release-required:** shared motion tokens/reduced-motion behaviors; dependable page/nav transitions; card/touch feedback; the two Library decks with spring-like swipe/settle/reveal behavior; accessible and readable entry/exit transitions; ONE 2 ONE progress/step transitions; deterministic automated functional/accessibility/performance checks.  
**P1 preferred before release, but not a prerequisite to ship:** tasteful reveal animation for featured devotional/Library cards, subtle image zoom/position changes *only* where readability and performance allow, selective short editorial verse/title reveals.  
**P2 post-core opt-in:** independently moving clouds, water, sunlight and other layered cinematic effects; video/animated illustration, elaborate scenes or complex multi-layer parallax. No P2 work may delay P0 release readiness.

No mandatory conversion of CLEAN/TYPE/THUMB still images to videos or motion sprites. The three audited image variants remain the canonical asset bundle. A still image plus CSS transform/opacity is the default motion asset.

## 2. Shared motion contract — Lane D authority

- Expose one versioned motion-token interface for all lanes; suggested timings: micro feedback 120–180 ms, standard transitions 180–260 ms, page/card entry 260–400 ms. Distances/easing should be modest; tuning and measured usability trump exact numbers.
- Use CSS transitions/keyframes and the Web Animations API where suitable; prefer compositor-friendly `transform` and `opacity`, and avoid unnecessary layout/paint animation and heavyweight runtime dependencies.
- Implement four primitives or equivalent stable behavior interfaces: `pressFeedback`, `pageTransition`, `cardReveal`, `deckSpring` with a shared `motionEnabled/reducedMotion` decision.
- Respect `prefers-reduced-motion: reduce` across every surface: skip nonessential parallax/ambient motion and spring/fling; retain immediate accessible state change and focus visibility. Do not hide content until an animation completes in reduced-motion mode.
- Preserve keyboard, touch, pointer, screen-reader and non-swipe routes. Animation cannot be the only indicator of selection, progress, disabled state or error.
- Animations must not delay actions, start duplicate actions, trap focus, block tap targets, intercept background clicks or leave a route half-rendered. Cancel/finish old transitions on fast interaction, navigation, context switch, unmount and asset failure.
- Avoid unwanted cumulative layout shift, image text illegibility, fake text/Scripture transformations and horizontal overflow; respect safe areas, 200% text scaling and 320/390/430 px plus tablet widths.
- No autoplay sound; pause/stop any P1/P2 ambient motion when hidden/offscreen, on reduced motion or constrained performance/network settings. Offline and low-end experience always works with static assets.

## 3. Surface-specific behavior

### Home / navigation / reader — Lane D

- Labeled bottom navigation: brief selected-state transition and consistent destination changes; selection/focus must be visually and semantically obvious with motion disabled.
- Home primary hero and Continue/Start action: staged but quick reveal, subtle button feedback; no long intro or content-blocking loading animation.
- Devotional and book cards: gently reveal/crossfade and optionally modest zoom; title/action remain stable and legible above photography.
- Bible reader: reading text remains live, selectable, stable and accessible. No continuous verse-by-verse movement or motion that disturbs scrolling. Optional short highlighted verse/title reveal must not affect exact Scripture identity.

### Library Feelings / Needs decks and Content Review — Lane B

- Two **independent** decks of large cards (about 80–90% active-card viewport width) with visible neighbors, responsive positioning and a spring-like settle after swipe; adjacent cards preview clearly.
- Touch swipe, tap on neighbor, visible Prev/Next buttons and keyboard Left/Right/Home/End produce the same selection and action semantics. Support cancellation, reversal and rapid input without jumping, double activation or wrong card selection.
- Respect user scroll intent: horizontal deck swipes must not make vertical page scrolling unusable; non-swipe and reduced-motion paths remain complete.
- Content Review pagination/search/filter animations must preserve keyboard focus, result counts, decision identity and clickability; no delayed or stale approval actions.
- TYPE image lettering must remain exact-locale/approved and not be obscured or distorted by zoom, crop or overlays. CLEAN/live-text and static fallback when TYPE proof unavailable.

### ONE 2 ONE — Lane C

- Provide restrained progress/step transitions for Scripture → Understand → Discuss → Reflect → Apply → Pray → Action and lesson/module entry cards.
- Never move or conceal entire long passages as animation; live Scripture, inputs, response draft, save/share/consent and mentor privacy flows must remain stable.
- Rapid Back/Next, resume, deep-link, tenant switch and pending save must never animate users into wrong lessons, duplicate submissions or cross-account content.
- Use Lane D tokens/primitives, feature-scoped modules and static fallback independently of Lane A image readiness.

### Content images — Lane A

- Continue audited immutable CLEAN/TYPE/THUMB outputs unchanged. Add optional per-asset metadata only if needed to declare safe motion cropping/focal area or `motionSafe`; default to static.
- Do not bake animation, synthetic motion blur or unverified verse text into images. Maintain independent binary SHA-256, rights/font/use/locale/alt/fallback checks. No animated asset is required for the 30 feelings or 300 devotionals.
- If later P2 layered scene assets are proposed, treat each layer as a new versioned, separately rights/bytes/provenance/accessibility-reviewed asset with explicit still fallback; they are **not** V7 release dependencies.

## 4. Parallel responsibility and boundaries

| Lane | Immediate work | Exclusive ownership / no-overlap |
| --- | --- | --- |
| **A** | Original visual assets + metadata, accurate three-image variants and motion-safe focal hints if justified | `data/v7/visual-assets/**`, `public/v7/images/**`, visual audit pipeline. **No** UI animation code |
| **B** | Library-specific deck drag/snap/spring, card reveals and review focus behavior; tests | `src/features/library/**`, `src/features/content-review/**` and feature-scoped CSS/tests. **No** global motion engine or D shell |
| **C** | ONE 2 ONE step/lesson transitions and state-safe tests | `src/features/one-to-one/**`, `src/features/lesson-runner/**` and related styles/tests. **No** global motion engine |
| **D** | Common tokens/primitives, Home/reader/nav transitions, release/browser/a11y/performance gates and merge integration | Global shell, shared components, release workflows. **Do not** rebuild B's Library decks |

Lanes B/C must be able to implement with D's documented token/primitive interface and static mocks immediately. All may work concurrently. Avoid editing the same file in different branches; integrate small green PRs serially on `v7/development`. Do not block A content/art or C privacy fixes behind animation work.

## 5. Machine-verifiable V7 motion ship gates — Lane D consolidates

1. Unit/contract tests prove the shared token API, feature-local consuming behavior and `prefers-reduced-motion` fallback.
2. Built-browser functional tests at 320/390/430 px and tablet, 200% text, EN/TL/CEB/ILO samples, keyboard/pointer/touch emulation, guest/authenticated/offline where relevant. No clipping, unexpected horizontal scrolling, unreadable baked verse lettering or obscured controls.
3. Library decks tested for forward/backward swipe, boundary behavior, snap/reversal, rapid repeated gesture, tap/Prev/Next, keyboard selection, vertical scroll compatibility and independent Feelings/Needs selection.
4. Navigation and ONE 2 ONE tested for fast transitions, Back/Next, focus retention, save/resume/deep-link/tenant switch, safe cancellation and absence of duplicate activation or stale response disclosure.
5. Browser explicitly emulates reduced motion: content remains visible, touch/keyboard remains functional, no nonessential looping/ambient/spring/fling animation.
6. Image missing/invalid/offline/low-end paths fall back to static cards and live text; no reliance on animated image assets or TYPE variants. PWA/offline/cache and exact-hash visual registry remain intact.
7. Record repeatable measurements for browser animation responsiveness, long tasks, layout stability and overall V7 performance/bundle budgets relative to the established baseline; fix material regressions before acceptance. Avoid claiming universal device FPS guarantees from CI emulation.
8. Screenshots/recorded evidence include resting, interacting, settled and reduced-motion states, bound to the exact tested commit SHA and consumed by the consolidated release convergence gate.

**Done** means the P0 behaviors and gates pass on the exact integrated V7 candidate. P1 should land only where it demonstrably helps clarity without violating accessibility or budget; P2 remains separately queued. This document authorizes tasks, not a claim that animation code has been implemented or deployed.
