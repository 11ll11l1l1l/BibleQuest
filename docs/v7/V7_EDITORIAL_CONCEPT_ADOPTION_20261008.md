# V7 editorial artwork adoption — 2026-10-08

Status: **visual direction accepted / partial runtime integration; reference boards are not release imagery**.

## User-selected visual direction

The user liked the October 8 cinematic multi-surface concept boards. They represent editorial art direction for:
- Large Devotional and featured cards, Library categories (Books, Devotionals, Past Teachings, Small Group, ONE 2 ONE, Recommended), Feeling/Need discovery, and Bible/Prayer/Community content.
- Warm and cool photorealistic scenes, distinct emotions, restrained lighting, premium serif/display titles with limited expressive script, rounded edge-to-edge card presentations, focal-aware crops, and clean fallback masters.
- Three related outputs for each accepted *new* image: CLEAN, reviewed locale-specific TYPE, and THUMB, governed by `V7_IMAGE_FIRST_AND_PARALLEL_LANES_20261008.md`.

Four generated 1536×1024 source concept sheets and 26 small extracted design references were shared as **`bqv7_visual_concept_references_20261008.zip` in the original design conversation**. They are intentionally *not* copied into `public/v7/images` or the strict visual-assets registry: their extracted panels are low-resolution design crops, not independent master images, and some lettering/Scripture is unverified. Do not claim 53 archive files are 53 production-ready images. Workers should regenerate or create distinct full-resolution ORIGINAL imagery using these themes, never scale up a small crop and claim a new master.

## Approved interim devotional art reuse

The original V7 devotional batches target **300 first-party emotion-themed texts** (294 in batches 01–10, six backfill texts in batch 11). **Devotional texts and individual devotional cover images are different deliverables.** A published devotional may have no approved cover; a missing cover never blocks readable live text.

The Library resolver now checks an audited dedicated `devotional:<id>` cover first. Until one exists, a **recognized** ID of the form `devotional.biblequest.<queue-emotion>.<NN>` may borrow the same theme's audited CLEAN image from `emotion:<canonical ID>`. This is an intentional shared *thematic* image, not an official bespoke cover and not a separate new asset or additional production image counted in coverage. An unmatched, external, unpublished, unverified or malformed item uses the existing readable visual fallback; never guess emotional meaning from titles or tags.

The runtime card uses only an exact same-origin generated binary-audit registry (`/data/v7/visual-assets.json`); no direct raw sidecar/agent draft reads, no remote arbitrary URL, and no English TYPE variant substituted for localized copy. Devotional titles, descriptions and actions remain selectable live text. The approved clean art is decorative in this surface.

## Remaining image inventory

At the handoff there were **14 Feeling master records**, with **12 marked production-ready and 2 awaiting further QA**; there were no devotional-family or Need-family registered masters. Those are record-level facts and **not** a replacement for the exact checkout `node scripts/v7-visual-assets-audit.mjs` counts. Five agents retain disjoint P0 feeling / P1 Need queues under their existing schedule and asset ownership contract.

Prioritize:
1. Complete the 30 P0 Feeling concepts plus approved bundles and 19 canonical Needs, with distinct emotional staging.
2. Commission standalone 16:9 Home/Library hero and category art and 4:5 featured-devotional covers based on the approved cinematic samples.
3. Create dedicated, content-specific original covers for top featured devotionals and progressive broader catalog coverage. Reuse only within the exact same canonical emotion theme until dedicated covers exist.
4. Upgrade additional EN/TL/CEB/ILO TYPE variants with verified exact words; render all other locales using CLEAN and live localized text.

QA before releasing: measured dimensions, SHA-256, bytes, consent/provenance/rights, exact locale and Scripture if displayed, anatomy, mobile crops, long-title clipping, 320/390/430px and reduced-motion tests, and the V7 binary audit. Do not label reference crops as `production_ready`.
