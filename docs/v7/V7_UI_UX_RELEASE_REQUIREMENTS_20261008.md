# BibleQuest V7 UI/UX Release Requirements

Updated: **2026-10-08 JST**  
Status: **RELEASE-BLOCKING V7 SCOPE OVERRIDE**  
Authority: user-directed V7 release requirement  
Integration owner: **Lane D** for global shell/design system and release certification; each feature lane adopts the system inside its owned surfaces.

## 1. Objective

V7 must ship with a coherent, polished, mobile-first interface that is immediately understandable and visually readable. The interaction principles may be informed by mature Bible apps such as YouVersion, but BibleQuest must use its own original branding, icons, illustrations, component styling and visual assets. Do not copy third-party assets, layouts, trade dress or branded artwork.

The UI overhaul is part of V7 release scope. It is not deferred to V8.

## 2. Product-level design principles

1. **One obvious next action per screen.** Secondary actions are visually subordinate and progressively disclosed.
2. **Content first.** Devotionals, Books, Teachings, Scripture and ONE 2 ONE content receive visual priority over settings or system chrome.
3. **Predictable navigation.** Primary destinations stay in the same location across the app and use both icons and text labels.
4. **Readable before decorative.** Contrast, typography and hierarchy take precedence over visual effects.
5. **Photography/illustration for content; icons for actions/navigation.** Do not represent major content collections only with generic icons.
6. **Original BibleQuest visual language.** Use a consistent icon family, brand palette, spacing scale, card system and type hierarchy.
7. **Graceful degradation.** Missing images, offline data, loading and errors must still leave a usable screen.

## 3. Information architecture and navigation

Primary mobile navigation should expose no more than five top-level destinations. Target ordering:

- **Home** — Today, Continue, recommended/featured content and recent progress.
- **Bible** — Scripture reading, audio and Bible tools.
- **Library** — Devotionals, Books, Past Teachings and Saved.
- **Groups / ONE 2 ONE** — relationship, discipleship and community surfaces that are actually enabled in V7.
- **You** — saved items, progress, language, account and settings.

Requirements:

- Every primary destination has a text label; icon-only bottom navigation is not acceptable.
- Selected state must not rely on color alone.
- Route transitions preserve context and provide an obvious way back.
- Deep links must land on a complete, understandable destination rather than a visually orphaned detail view.
- Advanced leader/admin/review tools remain one level deeper unless the user's role requires them as the primary task.

## 4. Typography

Define and use a single app-wide type scale:

- Page title: visually strongest heading.
- Section/card title: clear secondary hierarchy.
- Body/reader text: comfortable continuous reading.
- Metadata/captions: secondary but still readable.

Acceptance requirements:

- Standard body text target: **>=16 CSS px** at default scale unless a bounded UI control genuinely requires smaller text.
- Body line-height target: **1.45–1.7**.
- Avoid low-contrast gray for important labels, metadata or actions.
- Editorial **TYPE** artwork may have intentionally integrated professional typography (titles, emotion names, short verified Scripture excerpts). All essential information also remains available as semantic localized live HTML for accessibility and localization. The complete Bible reader stays live selectable text.
- At 200% text scaling, primary flows must remain operable without clipping or loss of content.

## 5. Color and contrast

Use a restrained palette: light/neutral reading surfaces, dark readable text, one primary BibleQuest action/selection color, and limited topic accents.

Release thresholds:

- Normal text contrast: **>=4.5:1**.
- Large text: **>=3:1**.
- Interactive controls, focus indicators and meaningful non-text UI boundaries: **>=3:1** against adjacent colors where applicable.
- Selected/active states must include shape, weight, underline, icon fill or another non-color cue.
- Text over photography requires a tested overlay/scrim/gradient or a separate text surface; raw text directly over uncontrolled imagery is not acceptable.

## 6. Icon system

Replace the mixed/inconsistent icon treatment with one BibleQuest icon family.

Requirements:

- One visual grammar: consistent stroke weight, corner treatment, optical size and selected state.
- Use icons primarily for navigation and actions.
- Every non-decorative icon has a visible label where ambiguity is possible and an accessible name.
- Do not use a custom icon where a familiar platform metaphor is clearer.
- Minimum practical touch target: **44 x 44 CSS px** for primary interactive controls.
- New icons must be original or appropriately licensed; do not reuse YouVersion artwork or icon assets.

## 7. Image-led content cards

Devotionals, Books and Past Teachings must support strong visual covers/cards.

### Devotionals

For the updated image-led layout, prefer prominent near-full-width 4:5 cards and scrolling decks with visible adjacent cards over a uniform grid of tiny thumbnails. Large typography-integrated cover variants are allowed when paired with semantic live text; see the overriding image-first contract.

Default card composition:

1. photo or illustration;
2. readability overlay where required;
3. live title;
4. topic / life situation;
5. duration or day count;
6. progress where applicable;
7. one primary action: **Start**, **Read** or **Continue**.

Example information hierarchy:  
**When God Feels Silent** → Faith & Waiting · 5 days → Continue Day 3.

### Books

Use cover artwork or a deliberate editorial fallback. Show title, author, permitted-use behavior and one primary action.

### Past Teachings

Use teaching/series imagery, speaker/source imagery when rights permit, or a deliberate editorial fallback. Avoid a generic-icon-only catalog.

### Image style

Prefer broad human/everyday imagery—nature, family, work, solitude, relationships, hope, anxiety, travel, prayer and ordinary life—rather than repetitive crosses, churches, praying hands or Bible stock photography.

### Visual asset data contract

Each content visual must support:

- asset ID / stable URI;
- source type: generated, licensed, public-domain or owned;
- rights/provenance and attribution where required;
- checksum/revision binding where relevant;
- alt text or explicit decorative status;
- focal point/crop metadata when required for responsive cards;
- a deterministic fallback when the asset is unavailable.

Generated imagery must be original and must not imitate a living artist or a third-party application's branded visual style.

## 8. Library redesign

Library is a first-class V7 surface, not a utility table.

Required structure:

- prominent search;
- clear content-type navigation: **Devotionals / Books / Teachings / Saved**;
- topic/life-situation filters that do not dominate the first viewport;
- visual cards with title, concise metadata, progress and one primary action;
- stable back-navigation from detail/reader to the same browse context;
- useful empty states;
- visible retry on recoverable failure;
- cached/fallback content where available rather than a blank broken surface.

Every content card must answer, at a glance:

- **What is this?**
- **What is it about?**
- **How long / how much?**
- **What do I do next?**

## 9. Home and discovery

Home must answer **"What should I do next?"** within the first viewport.

Priority order:

1. Continue current Bible/devotional/ONE 2 ONE activity.
2. Today's or featured Scripture/content.
3. Recommended or recently relevant Library items.
4. Secondary discovery.
5. Administrative or low-frequency actions only when role/context requires them.

Avoid dashboard density, duplicate entry points and horizontally crowded controls.

## 10. Reading surfaces

Bible, devotional, teaching and lesson-reading surfaces must prioritize uninterrupted reading:

- generous readable text;
- clear progress/location;
- obvious previous/next or step navigation where appropriate;
- Scripture references visually distinct and tappable when interactive;
- secondary tools hidden or de-emphasized until invoked;
- persistent, understandable return path to the originating Library/plan/context;
- audio controls shown only where audio is available.

## 11. Loading, empty, offline and error states

Every major route must have designed states for:

- first load;
- skeleton/loading;
- empty result;
- no network/offline;
- partial cached content;
- recoverable request failure;
- hard failure.

Requirements:

- Never leave a blank pane or raw technical error as the user-facing state.
- Recoverable failures expose **Retry**.
- Offline/cached state is explicitly indicated without blocking available content.
- Missing cover imagery falls back to an intentional BibleQuest visual treatment rather than a broken image icon.

## 12. Responsive/mobile acceptance

Required automated view widths: **320, 390 and 430 CSS px** plus at least one wider/tablet layout already supported by the app.

At each required width:

- no clipped navigation or primary actions;
- no unintended horizontal scrolling;
- cards remain readable;
- overlays do not obscure text;
- focus remains visible;
- text scaling does not destroy primary flows;
- bottom navigation does not collide with safe-area/system UI.

## 13. Performance and offline handling for imagery

The visual upgrade must not create a release regression.

Requirements:

- responsive image sizing;
- lazy-load below-the-fold visual assets;
- do not fetch full-resolution artwork for thumbnail cards;
- deterministic placeholder/fallback;
- cache strategy compatible with the existing V7 PWA/offline contract;
- preserve Lane D bundle/performance budgets and release checks.

## 14. Localization

All new labels, card metadata, empty/error states and accessibility names use the existing localization system.

Requirements:

- no English-only UI strings introduced by the redesign;
- layout must tolerate longer translated labels;
- decorative **TYPE** artwork may contain baked-in wording only in its verified language-specific variant; canonical CLEAN art plus live localized cover text is the default fallback and every essential title/verse/reference remains accessible live text;
- EN/TL/CEB/ILO content records can share one CLEAN visual asset and locale-matched TYPE variants. Never label a rasterized English TYPE image as localized Tagalog/Cebuano/Ilocano content.

## 15. Lane ownership

### Lane A — content factory

Add visual metadata to launch content where appropriate:

- image/cover assignment;
- source/provenance/rights;
- alt-text seed or decorative declaration;
- focal/crop metadata;
- deterministic fallback key.

The visual requirement must not reduce the >=150 approved devotional target.

### Lane B — approval and audit

Validate visual rights/provenance and expose the relevant visual metadata/decision evidence in Content Review. The review UI adopts the V7 design tokens/components.

### Lane C — ONE 2 ONE

Adopt the V7 global typography, colors, iconography, navigation, responsive behavior and state patterns in ONE 2 ONE flows without weakening its privacy/security requirements.

### Lane D — global UI + release convergence

Own:

- design tokens and global type/color/spacing/icon rules;
- top-level navigation/app shell;
- reusable card/image primitives;
- shared Home/Library/reader presentation patterns where not owned by another active lane;
- automated contrast/focus/text-scaling/responsive validation;
- final cross-feature visual consistency and release certification.

## 16. V7 ship gate

V7 may not be declared done while any of these are true:

- primary screens are hard to read because of low contrast;
- navigation remains inconsistent or unclear;
- major content collections are represented only by generic icons when image/cover treatment is required;
- Library lacks coherent visual cards and usable loading/empty/offline/error states;
- important controls are unlabeled/ambiguous;
- required 320/390/430 responsive checks fail;
- text scaling causes lost content or unusable primary flows;
- content imagery lacks required rights/provenance/fallback handling;
- the exact release candidate has not passed the UI/a11y/browser checks defined here.

This document overrides earlier V7 planning language that deferred a whole-app visual redesign to V8.

## 17. Image-first typography and lane-parallelization override (2026-10-08)

**Required companion contract:** `docs/v7/V7_IMAGE_FIRST_AND_PARALLEL_LANES_20261008.md`. It establishes near-full-width image-led tabs/cards, large rolling Feelings/Needs decks, verified short Scripture lettering with selective calligraphic/cursive accents, CLEAN+TYPE+THUMB output bundles, safe multilingual/accessible fallbacks, and non-overlapping A/B/C/D implementation responsibilities. When older sections of this file or the earlier visual-production specification insist every image be entirely text-free or that prominent discovery consists only of 88–132px tiles, this section supersedes those restrictions **for editorial TYPE images and redesigned featured/deck surfaces only**. It does not relax Scripture truth, licensed use, accessibility, performance, or release certification.

## 18. Motion and interaction animation addition (2026-10-08)

**Release-binding companion:** `docs/v7/V7_MOTION_AND_ANIMATION_REQUIREMENTS_20261008.md`. Its **P0** motion behavior and automated accessibility/performance tests are included in the section 16 V7 ship gate: shared motion tokens and reduced-motion handling, quick global navigation/Home feedback, spring-like independent Library Feelings and Needs deck settling/swiping with equivalent non-swipe controls, state-safe ONE 2 ONE step transitions and exact-SHA normal/reduced-motion built-browser evidence. The three CLEAN/TYPE/THUMB image variants remain sufficient; no animation media file is required. P1 subtle reveal/zoom may ship only when readable and performant; P2 independently animated scenery is not release-blocking. Ownership remains A = still assets, B = Library/Content Review, C = ONE 2 ONE, D = shared motion primitives/Home/reader/nav/release. This section supersedes any older text treating all motion as V8-only, without changing existing image rights, Scripture, language, privacy, offline or accessibility requirements.
