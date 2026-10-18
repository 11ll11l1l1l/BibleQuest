# Tired / weary — CLEAN candidate QA handoff

**Decision:** Candidate for user and independent visual QA only. Not production approved. No TYPE or THUMB derivative has been created.

- **Canonical slot:** `emotion:tired` (Lane X queue `tiredness_weariness`)
- **Asset ID:** `bqv7-emotion-tired-01`
- **Locked brief:** PR #1488 X-S2 / guidebook §5: one night-shift baker rests safely upright on a sturdy stool in a flour-dusted bakery, with a folded apron and plain cooling loaves.
- **Construction source:** `docs/v7/unfinished-artwork-guide/00_COMPLETE_CONSTRUCTION_GUIDEBOOK.md` guide blob `3e4fd5d15199d017fe535dc2394c17a693bec9fd`; generation baseline `v7/development` @ `0395b0237be9e22d6c81ecff17d21f2c7ec86060`; The first render placed a hand on the baker’s head instead of the folded apron and was discarded. This edited source fixes the pose. The earlier rejected hiker attempts are listed in #1488 and were not reused.
- **Taxonomy source:** `src/features/library/emotion-taxonomy.js`, blob `e64366970838d62c11ea602dd606e0acfe5b0cb2`
- **Exact future English TYPE label:** `Tired / weary`
- **Proposed future Scripture reference only:** `Isaiah 40:31` — Isaiah 40:31 addresses weary people and speaks of renewed strength for those who wait on the Lord. The reference is not a promise of instant bodily recovery. No verse wording is embedded in this CLEAN.
- **Context source:** [ESV verse context](https://www.esv.org/verses/Isa.%2040%3A31/)
- **Proposed alt text:** “After an overnight shift, a baker rests upright on a stool beside a folded apron and cooling loaves in a quiet bakery.”

## Pixel and file checks

- Producer visual inspection: The image shows one adult baker sitting upright on a stool, shoulders relaxed, a hand resting on folded apron fabric in the lap, with plain loaves on a rack behind. Quiet upper-left wall/workbench is free of faces and objects. It is not a collapse or medical scene.
- Original ImageGen PNG: `generated_images/exec-f0fcffe6-c553-49d4-9594-a2d813849d84.png`, **1254 × 1254 px**, 2,318,574 bytes, SHA-256 `c6122da705c7ada72bd803b5745bb93088077c0aaf1f1349dc3eb1bdf5d6251e`.
- GitHub-bound CLEAN: `public/v7/images/emotion/bqv7-emotion-tired-01.webp`, **1254 × 1254 px**, WebP, 318,452 bytes, SHA-256 `79c9ca6ecf640a14a21fe4becb78ddec6128efe7c646f67c17fdfffbd9e037ad`.
- Size rule: 1:1, native CLEAN minimum 1024×1024; guide preference approximately 1536×1536. MEETS the required minimum; it is below the preferred target, recorded transparently.
- The raster was exported at the original pixel dimensions without upscaling. RGB WebP quality 94.
- CLEAN has no visible text, reference, logo, watermark, or UI on producer inspection.

## Still pending

- Independent pixel-level art, anatomy, originality/near-duplicate, crop and text-safe review.
- Confirm source/rights suitability under the project’s distribution policy.
- Run the official Node asset/guidebook checks and exact-head CI.
- Verify built-app/served bytes and responsive 320/390/430 previews; these are not claimed here.
- Only after independent CLEAN acceptance: separately produce and review exact-label TYPE and a text-free focal THUMB. Keep localized title live for TL/CEB/ILO.

The record remains `candidate_qa_pending`, excluded from production and release counts until all required gates are satisfied.
