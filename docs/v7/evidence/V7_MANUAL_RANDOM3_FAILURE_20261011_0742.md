# V7 manual random three-cover batch — rejected producer renders (2026-10-11 JST)

**Delivered 0/3 compliant CLEAN images.** Existing open artwork and manual PRs were checked before choosing three distinct source-r1 P4 devotional slots and reserving them via the committed ledger on this branch. All three renders were wrong-scene multi-panel collages of the *previous* manual image batch (drill/tool library, STEM bridge, tablet/book), instead of the new content IDs' required narrative. All image bytes were deleted locally and none was uploaded. Neither producer-side success nor five-agent QA is claimed.

| Canonical content ID | Attempt ID | Generator ID | PNG size | SHA-256 | Rejection reason |
|---|---|---|---|---|---|
| devotional.biblequest.peace_contentment.03 | `manual-z-20261011-0742-peace03-r1` | `78463e93-7e7a-4b38-a1d1-f16d61587d4a` | 1402×1122; 2175923 bytes | `a82c1631c81fabffbbd385de1ebc96adc213991a9687025a590c0e683d3ed45c` | Output is a three-panel collage of drill handoff, STEM bridge model and tablet/book scene; missing the single requested adult repairing existing reading lamp |
| devotional.biblequest.hurt_betrayal.07 | `manual-z-20261011-0742-hurt07-r1` | `3d3362b6-0ba4-4908-9ee0-61e1215eece3` | 1402×1122; 2204589 bytes | `728f6021978ce53fc616f7aa938a9c9efdcd8f42c1fac3e74c102529e92143ea` | Output is three-panel collage of previous drill/bridge/tablet scenes; missing canal walk and transfer of blank boundary reminder card into coat pocket |
| devotional.biblequest.discouragement.10 | `manual-z-20261011-0742-discouragement10-r1` | `d5445810-dabe-4a68-8ead-aeaae67bac7b` | 1402×1122; 2215273 bytes | `34ee7194e0818301612ebfb4238f3ce0dcdea7bf93351d92d199686a68852247` | Output is three-panel collage of previous drill/bridge/tablet scenes; missing young mason fixing smooth tile to partially completed wall |

Final image target for all three: single text-free 4:5 original editorial photograph, native minimum 768×960, PNG/WebP, max 10 MB; no collage, no SVG, separate image per devotional. These outputs are 1402×1122 landscape and violate both source narrative and aspect requirement. They cannot be salvaged with cropping. No TYPE or THUMB made.

Exact guide/source provenance is in each row of `data/v7/visual-assets/production-ledger.json`. Sources: `content/v7/devotionals/biblequest-original-emotions-03c.json`, `07a.json`, and `10b.json`; chapters `03-third-narrative-shots.md`, `07-reflection-practice-shots.md`, and `10-remembrance-cue-shots.md`. All three first-party r1 source records were read in full, including Scripture reference and rights status; no biblical quotes were rendered.

All three attempts are `rejected` tombstones with SHA-256 digests, original generator IDs, failure reasons, and positive local deletion records. **Zero active claims remain from this batch**, so separate user-invoked generation chats may retry these exact IDs with **new scene revisions and attempt IDs**, after checking current ledger, sidecars and open PRs. No five-agent review is required for already rejected pixels and the QA-only agents must not treat this PR as pending artwork. Production, release registry, and branch main unchanged.

## Repeated generator issue

Here the generator ignored source-specific scene locks and produced the *prior* session's three unrelated subjects together as a triptych on **all three** calls. Retrying the same text during the same context did not change the result. Recommend treating this as an image-generator-context routing blocker; use a genuinely new explicit source-locked image request context before repeating generation. Do not lower scene or crop acceptance gates to count collages as art.
