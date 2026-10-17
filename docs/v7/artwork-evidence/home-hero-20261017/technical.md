# Home hero technical QA — 2026-10-17

Result: PASS for native raster size, encoding, and static asset inspection.

- Asset: `assets/bq-home-scripture-study-20261017.webp`
- Actual decoded dimensions: 1672 × 941 px, RGB WebP. Pillow decoded the complete image successfully.
- Size: 123,870 bytes.
- SHA-256: `e8cd85eab7d29366a11711a2940f31c4df617528ec79ceb75a296c6dc65f96bc`.
- Source PNG: `/workspace/scratch/d71d8b54c476/generated_images/exec-87e7207f-21c0-4230-a5af-e2b381a6322f.png`.
- Source actual dimensions: 1672 × 941 px, RGB PNG; complete decode successful. Size: 1,938,389 bytes.
- Source SHA-256: `8126e5aa800b597d5053f031904dcb1bc497d11e80f946befff01488ef689e76`.
- Both dimensions exceed the 1536 × 864 minimum. Output dimensions equal source dimensions: no enlargement occurred in this derivative. Generation provenance before the provided source is outside this inspection.
- Aspect ratio: 1.776833:1, approximately 16:9 with integer rounding (0.053% deviation). Rendering at 16:9 requires less than one pixel of height crop at native width.
- Visual inspection: continuous study scene, no embedded titles, button labels, watermark, or visible branding; broad dark quiet region on the left supports separate DOM copy. The open book and people are visible in the supplied full raster.

Scope: static technical asset QA only. This does not certify responsive crops, DOM text contrast, browser behavior, or physical phone rendering.
