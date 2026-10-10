# Overwhelmed — CLEAN candidate QA handoff

**Decision:** Candidate for user and independent visual QA only. Not production approved. No TYPE or THUMB derivative has been created.

- **Canonical slot:** `emotion:overwhelmed` (Lane X queue `overwhelm`)
- **Asset ID:** `bqv7-emotion-overwhelm-01`
- **Locked brief:** Guidebook §5: a school-festival organizer delegates coiled extension cables and folded chairs to colleagues in a safe community hall.
- **Construction source:** `docs/v7/unfinished-artwork-guide/00_COMPLETE_CONSTRUCTION_GUIDEBOOK.md` guide blob `3e4fd5d15199d017fe535dc2394c17a693bec9fd`; generation baseline `v7/development` @ `0395b0237be9e22d6c81ecff17d21f2c7ec86060`; Replaces the open #1434 SVG/vector domestic-laundry scene that contradicted the locked school-festival delegation action. No prior rejected hiker pixels were reused.
- **Taxonomy source:** `src/features/library/emotion-taxonomy.js`, blob `e64366970838d62c11ea602dd606e0acfe5b0cb2`
- **Exact future English TYPE label:** `Overwhelmed`
- **Proposed future Scripture reference only:** `Matthew 11:28` — Matthew 11:28 is Jesus’ invitation to the weary; the surrounding verses 28–30 describe learning from him. It does not promise that practical tasks or responsibilities vanish. No verse wording is embedded in this CLEAN.
- **Context source:** [ESV verse context](https://www.esv.org/verses/Matt.%2011%3A28-30/)
- **Proposed alt text:** “A school-festival organizer delegates coiled cables and folded chairs to two colleagues in a community hall.”

## Pixel and file checks

- Producer visual inspection: The image shows three adults in a community hall: the organizer gestures while two colleagues take on the coiled cables and folded chairs. Cables are safely coiled; no one is endangered. A quiet wall in the upper-left is available for later live localized text.
- Original ImageGen PNG: `generated_images/exec-a2d9c33b-3359-4b3a-a92c-6fc4d04d96ab.png`, **1254 × 1254 px**, 2,192,456 bytes, SHA-256 `55aa53b46b3dee0fd223550bd80b8ad99dd02c516b1b7733651ffa5537dc3d3a`.
- GitHub-bound CLEAN: `public/v7/images/emotion/bqv7-emotion-overwhelm-01.webp`, **1254 × 1254 px**, WebP, 299,768 bytes, SHA-256 `1cf2dd8bde10a376bb76edcb1b8cee8306b1bcdc5088137e1c087c599325d03f`.
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
