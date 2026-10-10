# V7 Lane Z — Cover evidence and truthful completion accounting

Lane Z remains **manual invocation only**: 300 distinct source-matched devotional portraits; X owns missing Feelings/Needs/Home hero, Y owns legacy variant repair and QA. Production source: 300 eligible first-party devotional IDs within 306 records in `content/v7/devotionals`.

`node scripts/v7-lane-z-cover-evidence.mjs --summary` reports measured cover binaries, candidates, unfilled items, and per-file mismatches. `node scripts/v7-lane-z-cover-evidence.mjs` gives all individual assignments. The tool uses real image bytes and checks SHA-256, byte count, encoded dimensions, 4:5 geometry, minimum 800×1000, original-art rights metadata, source-revision/path identity, alt text, content-ID binding, and duplicate binary reuse across different devotionals.

Only `public/v7/images/devotional/**` files with matching sidecar `contentType: devotional`, `visualRole: devotional_cover`, `family: devotional`, `status: production_ready` and an actual matching binary can increment **publishedBinaryVerified**. The `candidateFilesVerified` number is separate. No Feeling/Need stock image or contact sheet is credited toward the 300 devotional covers.

**A binary-verified asset is NOT automatically a good or accepted cover**. This mechanical check does not prove pixel decode in Chromium, artwork semantics, distinctness beyond exact duplicate bytes, originality, copyright/license adequacy, title legibility, Bible quotation accuracy, translation, editorial quality, built-app acceptance, or deployment. Therefore `editorialApproved` and `releaseCertified` stay 0 here; their evidence must arrive separately through A/B visual/content review and D exact-SHA built-browser release certification. Never interpret a `production_ready` sidecar as final artistic approval.

An eligible artwork record should preserve the source:
- `contentId`: exact first-party devotional ID, e.g. `devotional.biblequest.anxiety_worry.01`;
- `sourcePath`: exact JSON catalog path, e.g. `content/v7/devotionals/biblequest-original-emotions-01a.json`;
- `sourceRevision`: source `revision`, currently `r1`;
- `family: devotional`, `visualRole: devotional_cover`, `contentType: devotional`;
- original verified rights, descriptive alt text, actual hashed 4:5 image and distinct ID.

No images have been added by this PR. The first two later generation attempts also returned highly similar sunrise-hiker cliff vistas, which did **not** implement the intended devotional-specific kitchen-table scene or the no-clichés requirement, so both remain rejected; do not upload or credit them. This script makes the project ready to correctly measure future individual image commits. Run with `node --test tests/v7/lane-z-cover-evidence.test.mjs`.
