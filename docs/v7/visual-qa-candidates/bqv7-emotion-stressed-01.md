# Stressed — CLEAN candidate QA handoff

**Decision:** Candidate for user and independent visual QA only. Not production approved. No TYPE or THUMB derivative has been created.

- **Canonical slot:** `emotion:stressed` (Lane X queue `stress`)
- **Asset ID:** `bqv7-emotion-stressed-01`
- **Locked brief:** X-S1 / guidebook §5: an adult cafeteria cook pauses for a measured breath at a stainless service pass while one coworker arranges plain plates behind.
- **Construction source:** `docs/v7/unfinished-artwork-guide/00_COMPLETE_CONSTRUCTION_GUIDEBOOK.md` guide blob `3e4fd5d15199d017fe535dc2394c17a693bec9fd`; generation baseline `v7/development` @ `0395b0237be9e22d6c81ecff17d21f2c7ec86060`; Recomposes open PR #1501 after its upper-right region failed text-safe QA. The former source SHA-256 was 13e214e6c52855dceaab9ee5622c9338dc8f4c717a08f83d7473726cf77bc23f and is not reused.
- **Taxonomy source:** `src/features/library/emotion-taxonomy.js`, blob `e64366970838d62c11ea602dd606e0acfe5b0cb2`
- **Exact future English TYPE label:** `Stressed`
- **Proposed future Scripture reference only:** `John 14:27` — In John 14:27, Jesus speaks of the peace he gives his disciples in the farewell discourse; the reference fits a moment of strain without implying that work pressure disappears. No verse wording is embedded in this CLEAN.
- **Context source:** [ESV verse context](https://www.esv.org/verses/John%2014%3A27/)
- **Proposed alt text:** “A cafeteria cook pauses with relaxed hands at a service counter while a coworker continues arranging plain plates behind them.”

## Pixel and file checks

- Producer visual inspection: The image shows an adult cook left of center in a contemporary cafeteria, both hands open and resting on the counter, with one coworker arranging plates in the lower-right midground. The upper-right third is a broad, quiet backsplash with no person or equipment.
- Original ImageGen PNG: `generated_images/exec-fa49a5c0-d993-4a42-8bc1-e21082946213.png`, **1254 × 1254 px**, 1,881,679 bytes, SHA-256 `53b175779319eb4894a568c3cb84fe1d4a4d37018a9deb37d4b93b17b306aec7`.
- GitHub-bound CLEAN: `public/v7/images/emotion/bqv7-emotion-stressed-01.webp`, **1254 × 1254 px**, WebP, 163,296 bytes, SHA-256 `0a46606fa5c8652f83c23ae16f8cf742703badf396ef34fca3834cf7621a6cd4`.
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
