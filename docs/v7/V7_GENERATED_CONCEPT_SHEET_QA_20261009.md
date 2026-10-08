# V7 generated visual concept sheets — independent QA (2026-10-09)

Status: **REFERENCE ONLY — NOT PRODUCTION IMAGERY**.
This reviews two generated multi-card PNG concept sheets shared in the active design conversation, **not** the independently submitted real WebP/PNG/SVG emotion image-agent bundles. Neither sheet was checked into the runtime, release registry or asset records by this audit.

## Source identity and limitation

| Source | Generator output | Dimensions | SHA-256 | QA disposition |
|---|---|---|---|---|
| Sheet A, design-system cards | `59e6ea39-787e-4476-b017-6b90272eb30d` | 1536×1024 PNG | `1d5bc5c0eb748434a36d16c6463fe44750acdd4a61c1806515f1d9868445331f` | Reference only |
| Sheet B, app feature/topic collage | `8c9e342e-9b58-4db4-a624-4ee5e1f861ee` | 1536×1024 PNG | `ceeb887a936b7b2e165f95e5ed716192560bebe6a9634724afa9dd656bf159ab` | Quarantine Bible-text overlays |

The SHA identifies the **whole composite**. Its many tiny card panels are not standalone full-resolution CLEAN masters; cropping/scaling panels and declaring them new production art would misrepresent quality and provenance. No TYPE/THUMB bundle, per-card SHA, taxonomy revision evidence or 320/390/430 built-browser evidence was produced. This is an editorial/reference QA, not automatic verification of arbitrary generated image text.

## Specific visual + Scripture findings

1. **Sheet B / Bible Reader / 2 Timothy 3:16 — FAIL for BSB**. Image displays wording close to “useful for teaching, rebuking, correcting…”, whereas BSB uses “useful for instruction, for conviction, for correction…”. Do not publish as a BSB quotation. Source: https://biblehub.com/2_timothy/3-16.htm .
2. **Sheet B / Prayer / Philippians 4:6 — FAIL for BSB**. Image begins “Do not be anxious about anything, but in every situation…”, which is not BSB's “Be anxious for nothing, but in everything…”. It must not be presented as a BSB quotation. Source: https://biblehub.com/philippians/4-6.htm .
3. **Sheet B / Small Group / Matthew 18:20 — NOT VERIFIED EXACT**. Image omits “together” from the BSB line and should be marked excerpt/paraphrase or replaced with an exact, source-verified rendering. Source: https://biblehub.com/matthew/18-20.htm .
4. **Sheet B / Library / 2 Peter 3:18 — TRUNCATED**. Starts at “Grow in the grace…” instead of the full BSB sentence starting “But grow…”. Explicit excerpt labeling is required if reused; this is not a full-verse image. Source: https://biblehub.com/2_peter/3-18.htm .
5. **Sheet A / Purpose / Jeremiah 29:11 — CONTEXT REVIEW**. Do not use the promise as an unqualified guarantee of each viewer's career, financial success or predetermined plan. The original addressees and exile context require reviewer notes before publication.
6. **Sheet A / Strength / Philippians 4:13 — CONTEXT REVIEW**. An athletic-climbing visual may imply guaranteed success rather than the strength to endure all circumstances (Philippians 4:10–13). Require devotional-context review.
7. **Both sheets — ARTWORK/UX**. Mixed cinematic/illustrative styles, some strongly repetitive sunsets, and miniature verse captions that are illegible when each card is reduced to a mobile tile. The whimsical Games/Quizzes castle aesthetic conflicts with V7's premium editorial direction.

These findings concern the **generated mockups alone**, not the real independently audited image agents' files. Exact byte/hash source checks, provenance, accessible alt text and real browser screenshots must be completed on those files separately.

## Required production workflow

- Use full-resolution, **individually generated** single-scene CLEAN images with no baked text. Never convert the composite board's small cropped panels into claimed masters.
- Produce a distinct TYPE derived from the corresponding CLEAN, with the **exact canonical localized label** plus approved Scripture **reference only**; no Bible prose until exact translation/revision/text rights/context contract is reviewed.
- Produce an independently focal-cropped THUMB. Record actual image bytes, dimensions, sha256, alt text, focal region, generation provenance, and matching canonical Feeling/Need ID and revision.
- Run source-integrity audit, draft-browser image inspection at 320/390/430, then exact-published-HTTP byte/hash/decode gate for approved assets. Review visual composition, image text transcription, context, contrast and crop manually; test EN/TL/CEB/ILO live-text fallbacks.
- Never equate machine-readable metadata or green technical CI with human visual/Bible-content certification. A failed or incomplete item stays out of the release registry.
- Existing implementation references: #1407 (draft built-browser QA), #1415 (draft universal Scripture audit), #1416 (release gate), #1417 (Sad-only published-image certification). Keep #1415 draft until per-TYPE/locale SHA and actual rendered wording are independently bound; see the QA review on that PR.

## Next priority

Complete 30 distinct Feeling CLEAN/TYPE/THUMB bundles, at least five Need bundles, and one Home hero for V7's P0 art deck. Do not multiply the 300 devotional text count into a requirement for 300 original images; approved thematic reuse with metadata is allowed. Track candidate and release-ready coverage separately.
