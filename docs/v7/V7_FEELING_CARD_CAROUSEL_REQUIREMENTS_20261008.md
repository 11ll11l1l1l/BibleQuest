# V7 Feeling & Need Card Carousel — Product/UI Requirements

Date: 2026-10-08 JST
Status: USER-DIRECTED V7 VISUAL REQUIREMENT — design specification, not implementation evidence.
Integration/UX owner: Lane D (#1303); content/visual metadata: Lane A (#1300); provenance/review: Lane B (#1301).
Parent authority: `docs/v7/V7_UI_UX_RELEASE_REQUIREMENTS_20261008.md`. This is a focused V7 discovery surface, not a separate application or a replacement for Library content/audit.

## 1. Product intent

Create a cinematic, tactile card deck that invites a user to answer **“How are you feeling?”** by swiping horizontally. The active card is large and frontmost; the preceding and following cards remain visibly tucked behind it to convey a rolling/stacked carousel. Cards have distinct, emotionally appropriate imagery and legible, editorial-style titles with concise empathetic secondary text. The user's tap leads to *published, approved devotional discovery*, not to an invented devotional or automatic diagnosis.

Use this design in **Library → Devotionals → How are you feeling?**. The new 2026-10-08 V7 navigation target is Home / Bible / Library / Groups or ONE 2 ONE / You; do not reproduce the mockup's older Home/Bible/Feelings/Community bottom-navigation arrangement. A small Home discovery teaser may deep-link to this Library section where Home is already being redesigned, but the canonical experience lives in Library.

Support a companion **“What do you need right now?”** deck using the same component but distinct `need` taxonomy, accessible through a clear, localized segment/tab switch. Do not conflate emotional states with requested spiritual needs.

## 2. Layout and visual behavior

- Portrait, edge-to-edge imagery with an unobtrusive scrim/gradient behind typography. The card is rounded and elevated with a restrained shadow; avoid glass layers that reduce readability.
- Phone: one central card occupying roughly 70–78% of viewport width, with visible portions of immediate neighboring cards on both sides (target at least ~8% of viewport per side where geometry permits). Card height constrained so bottom navigation and an obvious CTA remain reachable without clipping at 320px width.
- Neighbor cards: slightly smaller, shifted backward (optional modest perspective up to ~12 degrees), softened through scale/opacity rather than aggressively blurred. They must remain recognizably distinct.
- Centered or lower-middle **live HTML** title (display/serif or high-quality equivalent) and a one- or two-line reflection/prompt beneath (sans-serif). Typography must appear *inside* the artwork visually, not baked into pixels; locale text changes must not require regenerated imagery.
- Active card shows its emotion/need label, one brief context sentence, and a single primary action: **Explore devotionals**. Visual “card tap” may perform the same action; do not rely on swipe to select or publish.
- Show **previous/next** arrow controls with accessible labels, current position as text (“3 of 10 featured feelings”), and **View all feelings** for direct scanning. Do not render 30 tiny dot controls. Offer a non-carousel grid/list fallback without losing content.
- Horizontal swipe left advances, swipe right reverses; snap to one card. Mouse drag, arrow buttons, and keyboard arrows work equivalently. No autoplay. A finite accessible sequence is the default; optional looping must not cause screen-reader/focus confusion.
- Gesture recognition cannot steal vertical page scrolling. When a user returns from results or a reader, restore the active card, filters, scroll, and focus position.
- Reduced-motion preference removes perspective/slide animation; do not reduce discoverability or controls.

## 3. Exact taxonomy linkage, not generated sentiment guessing

Reuse `src/features/library/emotion-taxonomy.js` and existing `src/features/library/emotion-discovery-panel.js` / discovery request contract. The current catalog has canonical `emotion` and `need` IDs with EN/TL/CEB/ILO labels; any public title may be a friendlier localized alias, but query IDs must remain canonical.

Initial ten **visual examples** (not a claim that all have published devotional matches):

| Display title | Filter kind | Canonical ID | Art direction |
|---|---|---|---|
| Peace | emotion | `peaceful` | Quiet lake / open sky / calm, cool lavender |
| Hope | emotion | `hopeful` | First light breaking through, spring green and amber |
| Joy | emotion | `joyful` | Candid delight and connection, bright daylight |
| Sadness | emotion | `sad` | Quiet rain/window or reflective solitude, gentle blue |
| Anxiety | emotion | `anxious` | Windy unsettled landscape, blue-gray with safe calm focal point |
| Anger | emotion | `angry` | Powerful red-orange storm/sea; composed, not threatening |
| Loneliness | emotion | `lonely` | Single person in a large quiet setting, deep indigo |
| Gratitude | emotion | `grateful` | Everyday warmth: shared meal, hands or light-filled home |
| Confusion | emotion | `confused` | Crossing woodland paths or fog, muted greens |
| Strength | need | `strength` | Resilient journey over mountain terrain, clear horizon |

**Important:** Strength belongs to the *Need* deck. Default Feeling deck should replace it with another emotion already in taxonomy (e.g., `tired`) and show Strength among the Need deck previews. This preserves honest taxonomy and a clean experience. Both decks must eventually expose all live taxonomy entries; the ten pictures are style prototypes/featured assets, not a fabricated limit of ten records.

The first asset set is intentionally more diverse than the earlier generic sunrise/Bible compositions. Avoid repeating a sunrise for every mood, sentimentalizing grief/anxiety, implying diagnoses, or relying on gender/ethnicity stereotypes. Art direction may share a coherent cinematic color-grade without reusing the same emotional staging.

## 4. Data and discovery contract

- Render cards from canonical taxonomy data; each visual is referenced by stable asset ID and mapping to `{ kind, id }`.
- Asset manifest stores `assetId`, variant/sizes/URI, generated-or-licensed source type, rights/provenance, hash/revision, optional attribution, focus/crop, and alt text or decorative status. Lane A associates assets to taxonomy/categories, Lane B validates publication/use rights, and Lane D consumes verified assets.
- Images are decorative when all meaningful content exists as nearby live text. If a meaningful scene adds information, supply concise localized alt text; no English text baked into the image.
- Selecting a card calls the *existing* Library discovery query with `emotions: [id]` or `needs: [id]`, contentType `devotional`, current locale, existing published/rights-safe filters and pagination. Do not route to arbitrary devotional IDs or bypass existing service permissions.
- After selection, show devotional tiles with title, topic, estimated reading time/day count, approved image, and **Read/Start/Continue**. A devotional opens existing `library-item` and Scripture Reader handoff; Back restores carousel position and filter.
- If no approved devotional matches, use existing suggestion and BSB reference empty-state logic with optional broader matches; never present unpublished content or invent a match.
- Do not persist, share, or infer the user's emotional state without an explicit product privacy decision. Basic carousel position can remain session-local for Back restoration.

## 5. Accessible, localized, and resilient

- Use semantic labeled region/heading and a clear current-item announcement; no focus on off-screen or visually hidden neighbors. Only active card action is keyboard focusable. Previous/Next are at least 44×44 CSS px.
- EN/TL/CEB/ILO live labels, prompts, buttons, counts and accessible names reuse app localization; allow longer labels/wrapping. On language switch, cards preserve the canonical selected ID.
- Text contrast >=4.5:1 (large >=3:1), controls/focus >=3:1; readable over each image via an adaptive or conservative scrim, verified rather than assumed.
- Test keyboard navigation, pointer drag, coarse touch swipe, screen-reader semantics, 200% text scaling, reduced motion and viewport widths 320/390/430 CSS px plus tablet.
- First load: designed skeleton without layout shifts; no image/missing asset: deterministic gradient/illustrative fallback; offline: retained cached content where available and clear indicator; query error: Retry; zero published matches: truthful suggestions.
- Responsive images, constrained sizes and lazy loading outside visible/adjacent cards. Do not load dozens of full-res emotion cards upfront. Follow existing PWA/cache/bundle/performance budgets.
- No new media storage/central Google Drive dependency is introduced by this card deck.

## 6. Component integration proposal

Current live implementation displays feelings as simple chips; retain taxonomy logic and discovery plumbing.

Suggested bounded changes for Lane D:
- Add `src/features/library/emotion-card-carousel.js` (semantic render + interaction), `emotion-card-carousel.css`, and a stable visual manifest or resolver aligned with V7 asset records.
- Compose deck into `src/features/library/page.js` ahead of advanced search/filters, only in the appropriate Devotionals/Library discovery context. Keep existing chip selection as **View all** / accessible fallback, rather than deleting useful filtering.
- Keep `src/features/library/emotion-taxonomy.js` as the single source of truth; do not duplicate label/adjacency data or author a new taxonomy.
- Use shared Lane D V7 image/card components, tokens, app navigation and global route-state restoration.
- Keep rendered image-only examples out of the production semantic string catalog. The supplied chat-generated images are **prototypes** until actual, uniquely identifiable assets are exported and committed with metadata/rights.

## 7. Automated ship acceptance for this scoped requirement

1. At phone sizes 320/390/430px, the active card and neighboring preview are visibly identifiable; no unintended page overflow, clipped CTA, or bottom-nav collision.
2. Swipe left/right, keyboard Previous/Next and direct “View all” all reach the same canonical emotion/need options; no autoplay and no lost vertical scroll.
3. Choosing `anxious`, `joyful`, `sad` or `strength` produces exactly the expected discovery query **with the correct kind**, no client-side invention of results, and only approved published devotionals.
4. Back from results and from devotional/Scripture restores the previous Library card and context.
5. EN/TL/CEB/ILO labels and actions display in live text; 200% scaling, reduced-motion and keyboard focus pass.
6. Image loading/missing/offline/error/empty states are usable; low contrast backgrounds are automatically handled or rejected in image QA.
7. Tested responsive source selection and image loading remain within release performance/offline budgets; rights/provenance/fallback manifest is complete and auditable.
8. Existing `tests/v7/library-emotion-discovery-panel.test.mjs`, `library-emotion-taxonomy.test.mjs`, `library-emotion-discovery-page.test.mjs` and authenticated Library browser journeys continue to pass, plus deterministic deck interaction tests.
9. Verify this feature in the exact Lane D release-candidate automated UI/a11y/browser matrix before V7 ship.

## 8. Scope/ownership and handoff

Lane D owns component, design integration and browser acceptance. Lane A supplies diverse approved image assets/metadata and preserves devotional production targets. Lane B ensures image rights and content review are fail-closed. Lane C has no work for this specific discovery UX.

This specification extends the *already approved* 2026-10-08 V7 image-led Library/global-UX release requirement and should be tracked in Lane D's canonical issue #1303, not used to resurrect retired sublanes or create a fifth release lane. No code is claimed complete by this specification.
