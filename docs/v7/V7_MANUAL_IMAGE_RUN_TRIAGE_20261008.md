# V7 Lane A — Manual Image Run Triage

Updated 2026-10-08. Scope: image-content production and verification only; no Library or Home UI changes.

## Reusable source vs design-only contact sheet

**Independent source art with a sidecar:** The manually generated bqv7-emotion-jealousy-envy-01 CLEAN WebP, English TYPE WebP, and THUMB WebP exist as separate files. They may be candidates for release, but require exact binary, rights, typography, browser, crop and release-registry QA. No candidate is approved solely because its metadata says it looks good.

**Flattened sample image boards:** BibleQuest Devotional Image Pack.png, BibleQuest V7 Faith Asset Sheet.png, and BibleQuest App Asset Board.png show attractive card concepts and three-variant presentation layouts. Each is one composited design sheet with miniature subpanels, rather than separately exported full-resolution CLEAN/TYPE/THUMB binaries. Do not crop tiny board panels and report them as high-resolution production assets or falsely record three different approved sources.

Reusable visual ideas include Prayer, Faith, Peace, Guidance, Strength, Love, Forgiveness, Joy, Courage, Hope, Bible Reading, Family, Youth, Library, Audio Bible and Games. Favor warm natural cinematic/editorial photography, carefully spaced scripted accents, deliberately framed subjects, and recognizable category identities. **Avoid imitating the repetitive golden-sunset-and-mountain composition from the samples.** Prefer distinct human and everyday situations where that conveys the assigned Feeling/Need better.

No embedded Bible passage or verse-like phrase from the sample sheet may be considered verified wording. Use exact permitted source/revision and typography QA; otherwise reference-only TYPE, or CLEAN with live localized text. Do not fabricate third-party book covers.

## Independent artwork promotion checklist

1. Bind artwork to a canonical eligible content ID, source revision and requested locale.
2. Produce and store independently exportable CLEAN, typeset TYPE, and focal-aware THUMB at the production dimensions for the actual surface. The sheet itself is not the master.
3. Independently measure each stored file's actual bytes, SHA-256, format and dimensions; record original art/font/Scripture rights, generation provenance, focal point and accessible alternative.
4. Run manual-candidate technical verification: node scripts/v7-manual-candidate-integrity.mjs <asset-id>. This proves technical file integrity only, not publication approval.
5. Run the canonical V7 visual-assets audit, actual built-app Chromium rendering and mobile screens at 320/390/430 CSS pixels; separately review real typography pixels and crop intent.
6. Keep every unverified variant in non-production status. Show CLEAN plus semantic translated live labels in Tagalog, Cebuano, Ilocano or any locale without a correct TYPE file.

## Lane boundaries

Lane A owns the candidate/source/bundle metadata and image files. Lane B owns Library cards/approval, Lane C owns ONE 2 ONE runtime, and Lane D owns shared shell/release/browser convergence. Transfer audited asset IDs and immutable records; do not edit another lane's components for a manual candidate.
