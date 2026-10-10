# V7 manual image batch results — 2026-10-11

Three P4 cover slots were selected from current source and guide chapters, claimed on a separate draft PR, and attempted with the manual ChatGPT image generator.

Result: **0 valid images out of 3**.

| Content ID | PNG geometry | SHA-256 | Generator ID | Producer outcome |
| --- | --- | --- | --- | --- |
| devotional.biblequest.peace_contentment.03 | 1402x1122 | a82c1631c81fabffbbd385de1ebc96adc213991a9687025a590c0e683d3ed45c | 78463e93-7e7a-4b38-a1d1-f16d61587d4a | REJECTED: returned an unrelated three-scene collage instead of lamp repair |
| devotional.biblequest.hurt_betrayal.07 | 1402x1122 | 728f6021978ce53fc616f7aa938a9c9efdcd8f42c1fac3e74c102529e92143ea | 3d3362b6-0ba4-4908-9ee0-61e1215eece3 | REJECTED: returned unrelated collage instead of canal reminder card |
| devotional.biblequest.discouragement.10 | 1402x1122 | 34ee7194e0818301612ebfb4238f3ce0dcdea7bf93351d92d199686a68852247 | d5445810-dabe-4a68-8ead-aeaae67bac7b | REJECTED: returned unrelated collage instead of mason placing tile |

Each image was a decodable PNG, but the original required scene was absent and its landscape ratio was wrong for a portrait 4:5 CLEAN. Their pixels cannot be reused or cropped to meet the mandatory scene. Every unapproved local temporary file has been deleted; no image was uploaded as a QA candidate.

Source provenance and exact guide chapters for the three IDs are included in `data/v7/visual-assets/production-ledger.json`. The three entries now have status `rejected`, preserving individual hashes, generator identifiers, failure reasons, and local-deletion flags. **No active claims remain**. Future image attempts require new IDs and scene revisions.

The five QA agents remain QA-only. This evidence PR does not supply a QA-ready image or permit a production release. Do not count three attempts as three covers. The generator appeared to reuse scenes from an earlier batch, and source-specific corrections did not affect this session's results.
