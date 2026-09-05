# BibleQuest content-source strategy

BibleQuest prefers public-domain or openly licensed structured resources and keeps provenance visible in the product. Scripture is the primary teaching text; secondary study resources are aids rather than doctrinal authorities.

## Doctrinal authority order

1. **Scripture and passage context** — highest content authority.
2. **Official CAMACOP Statement of Faith** — primary denominational alignment for doctrine: https://sites.google.com/view/camacop/about-us
3. **Alliance World Fellowship Statement of Faith** — secondary Alliance reference where compatible with CAMACOP and where CAMACOP is silent: https://awf.world/statement-of-faith/
4. **Pastor-reviewed local teaching** — for local-church-specific interpretation and disputed topics.
5. **Secondary study resources** — unfoldingWord, STEPBible, OpenBible.info, Open Bible Stories, dictionaries, notes, and similar resources may inform learning activities but do not define BibleQuest doctrine by themselves.

The detailed enforcement policy is in `DOCTRINAL_SAFETY.md`.

## Current bundled sources

- **Berean Standard Bible (BSB)** — the English Bible text used by the offline/on-demand Bible Reader and verse-text games. The per-book Bible packs are treated as the canonical bundled Bible text source inside BibleQuest.
- **Tagalog Unlocked Literal Bible / banal na Bibliya** — CC BY-SA 4.0 Tagalog Scripture packs delivered on demand. The displayed Tagalog verse text stays separate from BibleQuest interface copy, explanations, and study annotations.
- **unfoldingWord Translation Questions v90** — CC BY-SA 4.0 structured questions, reference answers, and Scripture references used by Recall Decks and Open Smart Review. Translation Questions were designed as passage/translation-comprehension material, not as a CAMACOP catechism. Every imported per-book question is therefore screened by BibleQuest's doctrinal-safety layer before normal scored play. High-risk interpretive items are quarantined; sensitive descriptive items retain a context notice.
- **Open Bible Stories (OBS)** — CC BY-SA 4.0 narrative retellings and scene/question resources used by Story Journey and What Happens Next. OBS is explicitly labeled as a **Bible-story retelling, not a Bible translation**.
- **STEPBible Data** — CC BY 4.0 datasets available for people, place, name, and original-language learning surfaces.
- **OpenBible.info cross references** — cross-reference data available for Scripture connection games.
- **unfoldingWord Translation Notes** — contextual source material available for source-grounded context modes. Notes are secondary aids and are not treated as denominational doctrine.

## Reader translation choices

BibleQuest currently exposes these Reader choices:

- **BSB · Berean Standard Bible** — full in-app text from BibleQuest's on-demand per-book packs.
- **TGL · banal na Bibliya / Tagalog ULB** — full in-app Tagalog text from on-demand per-book packs under CC BY-SA 4.0.
- **JKO · 口語訳聖書 (1954/1955)** — requested chapter-by-chapter from GetBible's `japkougo` resource. The Japan Bible Society states that copyright protection for the 1955 edition has expired, while authors' moral rights remain and wording introduced by later corrections can still be protected. BibleQuest does not rewrite the fetched verse text: furigana, vocabulary explanations, and English learning glosses are rendered separately as learning annotations.
- **NLT · New Living Translation** — requested live from Tyndale's official NLT API. Tyndale's published anonymous API terms permit non-commercial web applications to request NLT text without a private key, with a maximum of 50 verses per request and 500 requests per day. BibleQuest therefore chunks long chapters into requests of at most 50 verses, keeps the returned passage only in memory for the current browser session, does not bundle or bulk-persist the NLT corpus, and falls back visibly to BSB or a licensed online reader if the API is unavailable. Any commercial deployment or higher-volume use requires the appropriate Tyndale permission/key arrangement.
- **ESV · English Standard Version** — selectable in the reader. BibleQuest links the selected chapter to ESV.org rather than publishing a shared ESV API key or bulk-caching ESV text.
- **NIV · New International Version** — selectable in the reader. Full digital-product use is subject to publisher licensing, so BibleQuest currently routes the selected passage to a licensed online reader rather than bundling NIV text.
- **AMP · Amplified Bible** — selectable in the reader. BibleQuest currently routes the selected passage to a licensed online reader rather than bulk-storing or redistributing the copyrighted text.

Bible translations supply Scripture text; selecting a translation does not change BibleQuest's doctrinal authority order.

## Planned / optional sources

- **World English Bible (WEB)** — public-domain fallback/alternate Bible translation if BibleQuest later adds another fully bundled translation.
- Additional openly licensed language resources may be added only when their license and provenance can remain clear in the interface.
- ESV/NIV/AMP may move from licensed-reader links to direct in-app delivery only when BibleQuest has appropriate API/licensing permission. NLT already has a limited anonymous non-commercial web API path; any use beyond those published limits must obtain the appropriate Tyndale arrangement. Private credentials must stay off the public client.

## Product source rules

1. **Actual verse text must show its Bible version.** Bundled default: `BSB · Berean Standard Bible`.
2. A Scripture **reference** is not presented as though it were a quotation.
3. Imported questions and answers retain their source identity and license.
4. Imported Translation Questions must pass doctrinal-safety classification before normal play. A raw imported pack is never a trusted teaching surface.
5. Questions that can function as universal doctrinal claims are quarantined until rewritten with adequate context or explicitly pastor reviewed.
6. Sensitive but directly descriptive questions may remain only with passage framing and a doctrinal context notice when needed.
7. Open Bible Stories content is labeled OBS and never presented as a Bible translation.
8. BibleQuest-original reflection prompts (including Couples Growth and Transformation exercises) are labeled as reflection/application content and link back to Scripture references rather than claiming to be Scripture.
9. AI or game logic may transform verified source material into activities, but it must not silently invent the underlying biblical fact.
10. Content that depends on interpretation must be distinguished from direct textual recall.
11. Disputed topics are not settled through isolated scored questions. Pastor review is required before BibleQuest presents a local denominational conclusion as authoritative teaching.
12. ShareAlike material remains traceable and separable from BibleQuest-original code/content.
13. Bible translations with restrictive redistribution terms are not bundled without confirmed permission.
14. API credentials for copyrighted translations must never be committed to the public GitHub repository.
15. Live copyrighted Bible text must retain the publisher-required version label and copyright attribution.
16. Japanese learning aids must never replace or silently modify the displayed 口語訳 verse wording; annotations remain visually and structurally separate from Scripture text.
17. NLT live delivery must stay within Tyndale's published anonymous non-commercial limits: no more than 50 verses per request, no bulk corpus caching, and a visible recoverable failure state rather than relabeling another translation as NLT.

## Safety-sensitive topics

Additional screening applies to salvation and works, baptism, Communion, Holy Spirit baptism/filling, tongues and gifts, sanctification, healing, election/predestination, eternal security, end times, church office, marriage/sexuality, creation chronology, spiritual warfare, and giving/prosperity. The presence of one of these topics does not make a Bible passage unsafe; it changes how BibleQuest may frame and score the question.

## Current delivery architecture

Large immutable resources are not loaded at app startup. BibleQuest uses small manifests and on-demand per-book/per-story packs. The service worker caches successfully opened bundled resources on the device. This keeps the app lightweight while still allowing a large source library without Supabase.

Imported question packs are filtered at runtime before gameplay. The filter fails closed: if the doctrinal-safety policy cannot load or validate a pack, that imported pack is blocked rather than displayed raw. Content refresh jobs also run the pack sanitizer so future generated packs physically move quarantined questions into `data/quarantine/questions/` before publication.

Copyrighted live/API or linked translations are handled separately from the bundled cache so publisher-specific storage and redistribution rules can be respected. NLT API responses are kept only in an in-memory session cache by the translation module; the service worker does not intercept the cross-origin NLT API request.
