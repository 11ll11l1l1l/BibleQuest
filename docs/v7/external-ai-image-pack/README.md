# BibleQuest V7 — external AI artwork production pack (2026-10-11)

**Purpose:** one canonical, source-locked prompt per potentially needed CLEAN image, for use with an external image AI. This is an **artwork prompt catalog, NOT a claim that images were generated, rejected, accepted or published**.

## Open the tables

| File | Rows | Use |
| --- | ---: | --- |
| [QUICK_INDEX_350_ROWS.csv](QUICK_INDEX_350_ROWS.csv) | 350 | Start here; sortable work-status/ID/scene table |
| [MASTER_ALL_350_IMAGE_JOBS.csv](MASTER_ALL_350_IMAGE_JOBS.csv) | 350 | Complete cross-family data and **individual full ready-to-copy generation prompts** |
| [MASTER_300_DEVOTIONAL_PROMPTS.csv](MASTER_300_DEVOTIONAL_PROMPTS.csv) | 300 | Devotional-only full prompts plus exact English source body, scene, camera, lighting, text-safe and content checksum |
| [RELEASE_AND_NEEDS_50_ROWS.csv](RELEASE_AND_NEEDS_50_ROWS.csv) | 50 | 30 Feeling inventories, 19 Need images and one Home hero; HOLD/QA-only rows explicitly say **do not create** |
| [DERIVATIVE_REPAIR_QUEUE_13.csv](DERIVATIVE_REPAIR_QUEUE_13.csv) | 13 historical variant defects | Existing CLEAN → deterministic TYPE/THUMB fixes; **not** new AI-generated scenes |

The master CSV has **350 distinct canonical IDs**: **300** devotionals, **30** Feelings, **19** Needs, and **1** Home hero. In the 19 Needs, **five** (peace, hope, comfort, courage, strength) are immediate P1 launch targets, and fourteen are subsequent P5; Wisdom has a retained image. The eleven devotional chapter group counts are **30 + 30 + 30 + 30 + 24 + 30 + 30 + 30 + 30 + 30 + 6 = 300**; the six set-11 backfills replace missing set-05 entries, not an additional 306th–311th images. The 13 TYPE/THUMB repairs are separate and **not** 13 extra CLEAN images.

All 300 records were verified against the exact-source English devotional bodies in `content/v7/devotionals/**` and exact-scene chapters under `docs/v7/unfinished-artwork-guide/**`. Each includes a source SHA-256 and independent ID. The source snapshot is on `v7/development` as accessed 2026-10-11. Source-index JSON files in this folder are provenance snapshots, **not substitutes** for current canonical content. Source checksum drift invalidates a prompt until reconciled.

## How to use each prompt with an external AI

1. Open the [quick index](QUICK_INDEX_350_ROWS.csv). Sort by priority and the **CURRENT WORK GATE**. Never treat `CHECK_LIVE_LEDGER_AND_PRS` as proof the slot is free; check `data/v7/visual-assets/production-ledger.json`, approved/queued/rejected sidecars and all *open/unmerged* artwork PRs again before generating. Do not recreate existing good CLEANs merely to fix TYPE/THUMB.
2. In [the full 350-row CSV](MASTER_ALL_350_IMAGE_JOBS.csv), find **the exact same canonical ID**. Copy the value in **FULL READY-TO-PASTE GENERATION PROMPT** into a **fresh, isolated** AI image session. Copy **only one row's prompt**; never paste a whole batch, another row, this index or multiple scene examples together. The ID and title inside the prompt are metadata; **nothing is to be printed** in the image.
3. Generate **one uninterrupted real-life scene** matching the visible physical action and objects. All characters, environments and clothes must be contemporary. No ancient or biblical-era people, collages, triptychs, split screens, multiple time steps, repeated stock imagery, unrelated religious symbols, or synthetic labels/verse text.
4. Produce one independently retrievable **CLEAN PNG/WebP**. Final honest native-detail minimum: Feeling 1:1 **1024×1024**; Need/devotional 4:5 **768×960** (native 1024×1280 preferred); Home hero 16:9 **1536×864**. Maximum **10 MB**. A crop from a single larger native photo is acceptable only if it preserves all important actions and native detail. Do not crop a panel from a collage, distort people or upscale low-detail originals to fake resolution.
5. Before submitting, compare pixels against **mandatory scene**, full source, guide, all approved/pending/rejected artworks and the declared quiet localized-title region. Check hands, anatomy, readable 320px focal action, one-scene geometry, no type/verse/signage, format, dimensions, byte count, SHA-256, rights to use the external AI output commercially, and image generation provenance. A generated file is not an approved image.
6. Submit only valid CLEAN bytes and sidecar to **the existing nonproduction GitHub candidate intake**, linked to one exact ID/attempt/source/shot revision; mark **QA_PENDING** and retain the GitHub PR/commit and original generation record. The existing five agents each perform independent QA (scene/Scripture, rights, technical, uniqueness, coordinator). Do not assign agents to generate art or mark PASS based on this spreadsheet. Respect P0 Scripture/rights/privacy and Lane D exact-SHA release gates.
7. After CLEAN passes, create **TYPE** only where needed by approved native raster typesetting, and **THUMB** by deterministic focal-aware export. Do not ask image AI to make three redraws of one scene or to print Bible verses.

## Existing work warning

P1 Feeling candidate PRs include #1489 (Angry), #1423 (Insecure), #1439 (Doubtful), #1504 (Overwhelmed/Stressed/Tired), #1398 (Frustrated), and #1452 (Numb). Launch Need items have #1421 (Peace; SVG problem), #1479 (Hope), #1504 (Comfort), #1525 (Courage), and **conflicting** Strength reservations #1527 and #1528. Home hero has claim #1526. The ledger already reserves five set-01 devotional candidates from #1476. The previously discussed `devotional.biblequest.confusion_uncertainty.01` has a locally produced CLEAN WebP; it is **not independently verified as submitted or QA passed**.

These references are a time-stamped collision warning, NOT guaranteed current PR truth. Check actual live PR status, binary identity and merged QA evidence before reusing any slot. Rows without a known PR are **not certified unclaimed**.

## Not included

Five thematic Past Teaching visuals are **conditional** on exact teaching source/rights and are not part of the 350 base targets. The eight external-link book entries are **not** permission to reproduce unlicensed book covers. Adding those requires a separate verified source/design scope.

**Validation performed on this prompt pack:** 350 unique master IDs, including all 300 unique devotional IDs; all 300 devotional rows have nonempty exact source body, guide-derived mandatory scene, checksum and detailed generation prompt. No file in this pack contains generated image pixels, and no passage has been approved by the five QA agents merely by inclusion.
