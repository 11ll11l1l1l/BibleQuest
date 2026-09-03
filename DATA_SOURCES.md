# BibleQuest content-source strategy

BibleQuest prefers public-domain or openly licensed structured resources and keeps provenance visible in the product.

## Current bundled sources

- **Berean Standard Bible (BSB)** — the English Bible text used by the Bible Reader and verse-text games. The per-book Bible packs are treated as the canonical displayed Bible text source inside BibleQuest.
- **unfoldingWord Translation Questions v90** — CC BY-SA 4.0 structured questions, reference answers, and Scripture references used by Recall Decks and Open Smart Review. A Translation Questions answer is labeled as a **source/reference answer**, not as a quotation from the BSB.
- **Open Bible Stories (OBS)** — CC BY-SA 4.0 narrative retellings and scene/question resources used by Story Journey and What Happens Next. OBS is explicitly labeled as a **Bible-story retelling, not a Bible translation**.
- **STEPBible Data** — CC BY 4.0 datasets available for future people, place, name, and original-language games.
- **OpenBible.info cross references** — cross-reference data available for Scripture connection games.
- **unfoldingWord Translation Notes** — contextual source material available for future source-grounded context modes.

## Planned / optional sources

- **World English Bible (WEB)** — public-domain fallback/alternate Bible translation if BibleQuest later adds translation switching.
- Additional openly licensed language resources may be added only when their license and provenance can remain clear in the interface.

## Product source rules

1. **Actual verse text must show its Bible version.** Current default: `BSB · Berean Standard Bible`.
2. A Scripture **reference** is not presented as though it were a quotation.
3. Imported questions and answers retain their source identity and license.
4. Open Bible Stories content is labeled OBS and never presented as a Bible translation.
5. BibleQuest-original reflection prompts (including Couples Growth and Transformation exercises) are labeled as reflection/application content and link back to Scripture references rather than claiming to be Scripture.
6. AI or game logic may transform verified source material into activities, but it must not silently invent the underlying biblical fact.
7. Content that depends on interpretation must be distinguished from direct textual recall.
8. ShareAlike material remains traceable and separable from BibleQuest-original code/content.
9. Bible translations with restrictive redistribution terms are not bundled without confirmed permission.

## Current delivery architecture

Large immutable resources are not loaded at app startup. BibleQuest uses small manifests and on-demand per-book/per-story packs. The service worker caches successfully opened resources on the device. This keeps the GitHub Pages app lightweight while still allowing a large source library without Supabase.
