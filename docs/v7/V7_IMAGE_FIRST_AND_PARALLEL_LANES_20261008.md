# BibleQuest V7 — Image-first UI, integrated lettering, and four-lane parallel execution

**Decision date:** 2026-10-08 JST  
**Status:** Release-blocking V7 scope, effective on integration into `v7/development`  
**Authority:** Latest user visual direction; supersedes conflicting no-rasterized-text and tiny-carousel guidance only as explicitly described here.  
**Related:** `V7_UI_UX_RELEASE_REQUIREMENTS_20261008.md`, `V7_VISUAL_ASSET_PRODUCTION_20261008.md`, issues #1300–#1303, visual asset audit PR #1351.

## 1. Product outcome

Turn Home, Library, devotional browsing, Feelings/Needs discovery, Scripture highlights, and relevant ONE 2 ONE entry points into a coherent, premium, **image-led** mobile experience. Use beautiful purposeful photographs/illustrations, deliberately integrated editorial lettering, and large intuitive surfaces rather than rows of tiny icons, dashboard clutter, or small generic tiles. Bible text must remain accurate, readable, selectable in the actual reader, properly attributed and accessible. This is required for V7, **not deferred to V8**.

- **Hero placement:** Home's primary active journey remains discoverable immediately. Show one dominant visual hero/featured story, with a clear Start/Continue action. Avoid competing dashboard widgets above it.
- **Full-width tabs/collections:** Bible, Library, Devotionals, Books, Teachings and relevant content discovery show large, edge-to-edge or near-edge-to-edge imagery within safe-area padding; section navigation stays obvious.
- **Rolling swipe decks:** Feelings and Needs are independent decks. One featured portrait card occupies approximately **80–90% of available viewport width** on phones, with edges of neighboring cards visible and layered behind. Swipe left/right; tap/focus a neighboring card to select. Preserve active card position, clear category identity, accessible buttons, keyboard arrows where relevant, reduced-motion support, and a non-swipe fallback.
- **Devotional covers:** Favor tall **4:5** artwork and near-full-width featured cards; use intentionally cropped portrait imagery rather than 88–132px image tiles for the main discovery experience. A compact thumbnail rail is allowed only as a secondary navigation component.
- **Library:** Clear Devotionals / Books / Teachings / Saved tabs and search, large cover-led items, concise duration/author/topic and one action. On narrow phones use a single comfortable column. Cover art must not obscure title or controls.
- **Bible/reading:** Scripture text remains a readable live-text reader. Intro cards, quote highlights and section interludes may use designed, image-integrated Scripture excerpts. Never render a complete reading passage solely as pixels.
- **Composition:** Preserve realistic human/emotional scenes, diverse settings and contemporary subtle spirituality. Use restrained depth, high-quality lighting, subject-specific narratives, deliberate negative space, and variety in color/setting/point of view. Do not reuse one sunset/cross/praying-hands composition with different words.

Concrete dimensions are **design targets**, not brittle fixed breakpoints. At 320/390/430 CSS px and tablet sizes, adaptive geometry must pass no-overflow, visible text/action, thumb and keyboard checks; safe areas must not swallow the cards.

## 2. Required three-file visual bundle

For each newly accepted content art concept, produce **three usable, connected outputs**; do not count one PNG as three images:

1. **CLEAN** — original high-quality, text-free artwork. Canonical source/master, suitable for localized/live-text rendering and future reuse. Record its actual format and hash.
2. **TYPE** — a separate, professionally typeset artwork with visually integrated **exact reviewed** title / emotion label and optional **short** Bible excerpt or Scripture reference, matched to the intended surface and locale. This is intentionally baked into the image, not merely a layer overlaid at runtime. Choose deliberate typography, optical alignment, kerning, hierarchy, appropriate contrast/shadow/scrim, composition balance, and accurate spelling. Render professionally rather than trusting pseudo-lettering from a generation model. The dominant title is elegant editorial serif/display, and **one brief expressive phrase** may use an elegant calligraphic/cursive script. Avoid cursive for whole Bible paragraphs, controls, metadata or difficult-to-read translated scripts. For large scripted lettering target tested contrast and measure its readability on real phone previews.
3. **THUMB** — a deliberately focal-aware crop exported at the intended card/deck size, with no fragile text near crop boundaries. Prefer clean/no baked text for compact thumbnails; preserve face/gesture/concept, and provide the correct aspect ratio required by the actual surface. This is not a CSS resize of a huge master.

Suggested stable suffixes: `<asset-id>.<format>`, `<asset-id>-with-text-<locale>.<format>`, `<asset-id>-thumbnail.<format>`. Use the conventions and derivative scripts from #1351 where integrated. For presentation-specific variants, add a distinct crop role/aspect and avoid ambiguous duplicate paths. **A bundle is complete only when all three files exist and are individually validated.**

The existing clean-master `imagePath` and version-1 metadata remain backward-compatible. Add verified variant entries containing `kind`, `locale` (for TYPE), exact included wording and canonical source revision, `imagePath`, format, pixel dimensions, bytes, SHA-256, focal/crop intent, visual QC, type QA and rights. Do not fabricate measurements or create fake completion flags. Asset registry generation is centralized and deterministic; five image agents only write their own unique binary/sidecar files. A temporarily clean-only asset may remain usable, but is **partial** for new bundle-production metrics.

## 3. Typography and Scripture integrity

- **Typography system:** clear sans-serif for navigation/UI, restrained editorial serif/display for cover titles, high-quality **calligraphic cursive accent** for a short featured phrase or selected Scripture headline. Fonts must have verifiable redistribution/embedding rights, correct glyph coverage and licensed shipping files. The design must have reliable fallbacks, no Flash Of Invisible Text, and render appropriately in dark/light conditions.
- **Text accuracy:** no invented Bible quote, misquoted Scripture, unverified translation, or invented reference. Select text only from a source/revision whose Bible translation and permitted use are already verified (e.g., approved BSB corpus); bind image wording to the exact verse, reference, translation, locale and revision. If no verified exact passage is available, use an approved devotional title or a **reference only**, not a generated verse. No ellipsis/rearrangement that changes meaning.
- **Languages:** English, Tagalog, Cebuano and Ilocano versions use separate TYPE variants when their wording is embedded. Do **not** show a baked-English label or verse as translated content. For a locale lacking an accepted TYPE variant, use CLEAN plus **live localized HTML text**. Longer wording must be manually or mechanically typeset and separately QA'd, not auto-shrunk to illegibility.
- **Accessibility:** TYPE is decorative editorial artwork; title, excerpt, reference, author/duration, primary action and all essential controls **also exist as semantic localized live UI** and accessible names. Avoid redundant visual text overlays when the artwork already carries the same title; the semantic copy may be visually placed next to/below it or offscreen solely for assistive technology where warranted. Image alternatives describe the visual scene and, where needed, report embedded words; decorative duplicates should not double-announce. Full Bible passages never become baked-only assets.
- **Readability:** normal live text contrast >=4.5:1, large >=3:1; branded artwork lettering must meet legibility checks through intentional safe regions and contrast/scrims, with 200% text scaling accommodated for essential live content. Do not replace real functional buttons with words inside imagery.
- **Rights:** generated imagery must be original; no fake third-party book covers. Art, font license, underlying wording license, attribution and offline/distribution rights are separate gate fields; unknown rights are fail-closed.

## 4. Visual coverage and production priority

**Priority order for parallel image production:**
P0: 30 distinct feeling/emotion concepts + a small complementary Needs deck, each with semantically distinguishable art; current completed clean masters should receive outstanding TYPE/THUMB derivatives before counting full bundles.
P1: Home featured art + top featured/devotional recommendations, visual covers for Library's launch tabs, devotional detail heroes, Past Teachings/owned thematic book art.
P2: extend relevant distinct concepts across the first **150 approved multilingual devotionals**, using reuse only when emotionally/contextually appropriate, not repeating one visual for unrelated topics.
P3: toward **300** devotionals and more topical/series variations after base launch coverage.

**Count separately:** source masters, complete CLEAN+TYPE+THUMB bundles, distinct covered emotions/needs, visual assignments to approved content, verified localized TYPE variants, and rejected QA candidates. 150/300 devotional **text** targets do not become 150/300 mandatory unique image-generation blockers. A missing derivative falls back to CLEAN/live text, not a broken interface; prioritize completing P0/P1 bundles while keeping production running.

## 5. Parallel lane split and ownership

All four lanes are **simultaneous**. Each may ship a bounded PR as soon as its own contracts/tests pass, without waiting for another lane's entire backlog. Only the merge/integration queue is serialized.

| Lane | Independent work | Outputs / handoff | Must not edit |
| --- | --- | --- | --- |
| **A — Content + Asset Factory** | EN/TL/CEB/ILO 150→300 devotional corpus; 30 feelings/Needs taxonomy; five visual agents' three-file bundles; source, rights, Scripture and metadata; 8-book and Past Teaching launch content | Immutable content snapshot, vetted image binaries + per-asset records, localization/Scripture identity, visual-coverage report. PR #1351 audit/derivatives are A-owned | B approval UI/policy, C ONE 2 ONE, D shell/design/release workflows |
| **B — Library UX + Automatic Quality + Audit** | Library feature-local browse/cards; separate Feelings and Needs rolling decks; fail-closed content/translation/visual/font/Scripture/rights approval, accessible mobile Content Review/queue pagination | Library deck feature modules + tests, `auto_approved/rejected/needs_repair` report, exact revision evidence, automatic repair queue. #1350 is B's review PR; Library deck work should be a separate PR | A corpus/binaries, C runtime, D global shell/shared resolver/release workflows |
| **C — ONE 2 ONE + Feature UX** | Mentor/mentee E2E, privacy/tenant, step/reader readability, feature-specific immersive images, responsive role journeys | Authenticated journey + locale/mobile screenshots and accessibility evidence, adopted shared tokens/components. PR #1349 belongs here | A image/content files, B policy/review, D shell/global primitives |
| **D — Shared Design + Release Integration** | Global shell/navigation/Home/Bible/Reader UI, design tokens and generic CLEAN/TYPE/THUMB resolver, offline/PWA/perf/a11y/browser tests, serialized exact-SHA integration + preview/deploy | Shared design/component contract and full-app tested candidate, verified preview/deployed identity. Existing #1346 guest Library/mobile hotfix and #1348 strict gate remain D-owned; after #1346 B owns *subsequent Library feature UX* | A corpus/asset sidecars, B Library feature/decks/review internals, C ONE 2 ONE runtime |

**Current reallocation (2026-10-08):** Lane D's original broad Library/deck assignment is split. D retains its already-open PR #1346 guest Library/mobile/offline fix until that exact head is integrated, plus only the **shared** visual resolver/design primitives; Lane B independently develops Library-specific image cards, Feelings/Needs decks and later Library wiring. To prevent editing conflicts while #1346 is open, B first creates new feature-scoped modules, styles and tests against a pinned mock registry. After #1346 is incorporated into `v7/development`, B alone wires those modules into the Library entry page. No lane waits for assets, design tokens, reviewer queues or test credentials to start its independent feature work. The current active-status file and issues #1300–#1303 own up-to-date execution status.

The five **Visual Agents 1–5 are producers under Lane A**, not substitutes for Lanes A–D. Their existing hourly schedules may continue; prompts must read this spec first and produce **one complete three-output concept bundle when tooling permits**, or truthfully commit a partial and resume the missing derivatives. They must not self-disable after a failed generation or modify other lanes' files.

## 6. Integration contracts and dependency avoidance

- A outputs **immutable asset and content records**; B reads their identifiers and checks policy; D reads the validated deterministic registry. C imports D's published design tokens/components but can independently build and test against a pinned contract or local adapter while D evolves.
- No lane rewrites another lane's files to satisfy a dependency. Publish additive versioned schema/contracts and communicate via issue link/PR. A fixed consumer adapter can be implemented in the consumer's lane after provider interface stabilizes.
- Avoid the known conflicting open PRs: A #1351; B #1350; C #1349; D #1346/#1348. Rebase onto live `v7/development` before merge; do not stack overlapping UI claims or overwrite active work. `main` deployment only after the exact candidate passes the canonical release gate and the deployment path is verified.
- No release blockers requiring the user to manually judge art. Instead, machine-verify dimensions, wording provenance, rights, screenshot text contrast/layout, missing assets and interactivity; aesthetic quality receives an objective editorial rubric and repeated automated critique/QC. Do not mark perceptual/artistic QA as quantitatively proven when it was not visually inspected.

## 7. Deterministic release acceptance

1. Home, Library tabs, featured devotional, independent Feelings and Needs decks, Bible/readers and ONE 2 ONE are functional and navigable at **320/390/430** CSS px plus tablet, including dark/light and representative EN/TL/CEB/ILO.
2. Screenshot comparisons prove large featured imagery, active deck with neighbor peeks, intentional type treatments, label/button readability, and no clipped controls/overflow under reduced motion and **200% text scaling**.
3. Runtime picks correct art variant per placement and locale, falls back CLEAN+live text when localized TYPE absent, and falls back to designed no-image art when offline/unavailable. Above-fold optimized derivatives load without requesting unnecessary master binaries. Accessibility retains full live Scripture and titles.
4. The visual audit verifies every declared derivative's real bytes, hash, dimensions, crop metadata and rights. Typography QA cross-checks **exact** verse/title text and supported locale against immutable source revision; rejects pseudo-lettering, misspellings, wrong verse, incorrect scripture reference or unlicensed font. B's review never auto-approves a failed critical gate.
5. Existing 150 minimum launch devotionals, 300 stretch, complete four-language QA, 8 books, Past Teachings rights, protected review and ONE 2 ONE privacy/tenant safety remain intact.
6. No skip to production just because a design looks good: exact-head tests, release workflow, offline/PWA/perf budget, deployed build identity and preview smoke must pass. Output evidence/PR links and count incomplete derivative bundles truthfully.

## 8. Next executable queue (work in parallel now)

- **A:** integrate/repair #1351; update derivatives to truly polished lettering and verified Bible-source bindings; produce first complete P0/P1 bundles and measurable coverage; continue corpus/translations concurrently.
- **B:** finish #1350; independently implement feature-local Library visual cards + distinct accessible Feelings/Needs decks with mock registry/fallback now (separate PR); validate new `variants` evidence, typographic-source integrity and 12-item Content Review pages. Do not edit #1346's existing Library files until the hotfix has integrated.
- **C:** unblock #1349 with real authenticated tenant fixture; certify mentor/mentee journey; adopt image-led entry components without editing D primitives.
- **D:** deliver component spec and generic runtime resolver ASAP (accept A's versioned registry contract); implement **global** Home/Bible/Reader/navigation/typography and existing #1346 mobile/guest/offline fixes + #1348 strict gate; **B owns the new Library decks**, not D. Run automated screenshot/accessibility/asset/perf preview gates and serialize compatible lane merges.

This is a **work assignment and acceptance contract**, not evidence that its implementation is already finished.
