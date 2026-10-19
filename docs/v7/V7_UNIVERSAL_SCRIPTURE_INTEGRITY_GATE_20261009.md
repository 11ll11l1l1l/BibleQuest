# BibleQuest V7 — Universal Scripture and Image Text Verification Gate

Status: REQUIRED FOR ALL V7 ASSETS AND CONTENT; implementation and retrospective audit pending.
Scope: all five visual agents; all existing and future Feeling, Need, devotional, Home, Library, book thematic artwork, past teaching, Scripture highlight, translations and all TYPE variants.

## Mandatory checks before production approval

1. Inventory every image sidecar and every displayed Scripture reference or quotation, including text baked into TYPE binaries, runtime overlays, devotional body, captions, and translated versions. Record source file, asset ID, canonical content ID, locale and translation.
2. Resolve each reference to an authoritative Bible text source for the specified translation. Validate book, chapter, verse span, exact displayed words, punctuation, omissions, capitalization, translation name and text licensing. No fabricated Scripture, unattributed paraphrases or unsupported quotations.
3. Review the full paragraph/pericope and relevant surrounding chapter: author/speaker, audience, genre, historical/covenantal context, intended meaning and whether the application makes unsupported promises. Document the reasoning and source. Distinguish a Scripture quotation from a paraphrase or reflection.
4. For TYPE, inspect the actual persisted raster at intended card size and 320 CSS px; transcribe all embedded wording independently, compare exactly with the reviewed canonical label/reference/approved quotation, verify legibility and cropping. Metadata-only inspection is insufficient.
5. Record reviewer/evidence, exact translation edition, text source identifier, canonical taxonomy source blob SHA, image SHA256, result and review timestamp. A change to any source, text, reference or image invalidates prior approval.
6. For other locales, never reuse English TYPE; use CLEAN plus verified localized live text or separately verified locale-specific TYPE. Keep accessibility labels and selectable reader Scripture consistent.
7. On missing evidence, mismatch, theological-context concern, illegible TYPE or licensing uncertainty, mark `scripture_review_pending` or `scripture_review_failed`, quarantine TYPE and block production approval. CLEAN may be used with separately verified accessible live text.

## Execution

- First audit all current V7 image records and all existing Scripture-bearing content; do not grandfather prior `production_ready` records.
- Then run the same gate for every new asset and content change, with CI checks for deterministic fields and documented human/visual review evidence for semantic and baked-raster checks.
- Audit results must report total inventoried, verified, failed, pending, unreviewed, and exact file paths; never treat missing review as passed.
- Agent ownership remains disjoint: visual agents only edit their own binaries and sidecars. Lane D or a dedicated integration PR owns shared CI, application runtime and cross-repository audit.
- This document is a policy specification, not evidence that repository-wide checks have run or CI enforcement exists.

## Initial example

Lonely / Psalm 68:6: reference-only TYPE is not a verbatim Scripture quotation. Its context is God's care for vulnerable and isolated people (Psalm 68:5–6), not an unconditional promise of immediate marriage, companionship or a particular household. Exact image pixels, taxonomy version and production gate still require recorded evidence.
