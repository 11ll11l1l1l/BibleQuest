# Comfort — CLEAN candidate QA handoff

**Decision:** Candidate for user and independent visual QA only. Not production approved. No TYPE or THUMB derivative has been created.

- **Canonical slot:** `need:comfort` (Lane X queue `comfort`)
- **Asset ID:** `bqv7-need-comfort-01`
- **Locked brief:** Guidebook §6: in an ordinary evening community center after difficult news, a close friend pulls up a chair and sits attentively beside another adult.
- **Construction source:** `docs/v7/unfinished-artwork-guide/00_COMPLETE_CONSTRUCTION_GUIDEBOOK.md` guide blob `3e4fd5d15199d017fe535dc2394c17a693bec9fd`; generation baseline `v7/development` @ `0395b0237be9e22d6c81ecff17d21f2c7ec86060`; Replaces open #1480’s SVG solo window/mug/Bible scene, wrong for the exact interpersonal action; that draft also used a non-taxonomy reference. New candidate contains no words or verse.
- **Taxonomy source:** `src/features/library/emotion-taxonomy.js`, blob `e64366970838d62c11ea602dd606e0acfe5b0cb2`
- **Exact future English TYPE label:** `Comfort`
- **Proposed future Scripture reference only:** `2 Corinthians 1:3-4` — Second Corinthians 1:3–4 describes God as the source of comfort in affliction and the comfort believers can share with others. It fits attentive presence without making a medical or instant-cure claim. No verse wording is embedded in this CLEAN.
- **Context source:** [ESV verse context](https://www.esv.org/verses/2%2BCorinthians%2B1%3A3%E2%80%934/)
- **Proposed alt text:** “A friend pulls a chair up and listens attentively beside another adult in an evening community center.”

## Pixel and file checks

- Producer visual inspection: The image shows two adults beside separate chairs in a community center; the supporting friend has just moved a chair close and keeps a hand on its back while sitting attentively. No forced hug or cure promise. Upper-right wall is quiet for later localized text.
- Original ImageGen PNG: `generated_images/exec-21f86137-41c8-460a-aa9d-64590311e895.png`, **1122 × 1402 px**, 2,331,004 bytes, SHA-256 `40ce21164184d54209f65ba90973f79787076ba534e4b09ad72361806c9d2477`.
- GitHub-bound CLEAN: `public/v7/images/need/bqv7-need-comfort-01.webp`, **1122 × 1402 px**, WebP, 299,928 bytes, SHA-256 `4b9ab4801217719e07d8b1a34c1c44b10a03a0123e5f6d0debcb8db93b7d96e8`.
- Size rule: Portrait 4:5, native CLEAN minimum 1024×1280; guide preference approximately 1536×1920. MEETS the required minimum; it is below the preferred target, recorded transparently.
- The raster was exported at the original pixel dimensions without upscaling. RGB WebP quality 94.
- CLEAN has no visible text, reference, logo, watermark, or UI on producer inspection.

## Still pending

- Independent pixel-level art, anatomy, originality/near-duplicate, crop and text-safe review.
- Confirm source/rights suitability under the project’s distribution policy.
- Run the official Node asset/guidebook checks and exact-head CI.
- Verify built-app/served bytes and responsive 320/390/430 previews; these are not claimed here.
- Only after independent CLEAN acceptance: separately produce and review exact-label TYPE and a text-free focal THUMB. Keep localized title live for TL/CEB/ILO.

The record remains `candidate_qa_pending`, excluded from production and release counts until all required gates are satisfied.
