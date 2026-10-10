# Stressed — CLEAN source candidate for visual QA

**State:** one-file review candidate only. This is not independent approval, a complete three-file bundle, or a production-ready asset. The minimal sidecar uses `candidate_qa_pending`, so it is excluded from production and release counts.

- Content: `emotion:stressed`
- Asset ID: `bqv7-emotion-stressed-01`
- Image path: `public/v7/images/emotion/bqv7-emotion-stressed-01.webp`
- Construction source: `docs/v7/unfinished-artwork-guide/00_COMPLETE_CONSTRUCTION_GUIDEBOOK.md`, §3–5; exact Lane X shot lock in PR #1488.
- Taxonomy source: `src/features/library/emotion-taxonomy.js`, blob `e64366970838d62c11ea602dd606e0acfe5b0cb2`
- Exact future EN label: `Stressed`
- Proposed reference for a future TYPE variant: `John 14:27` (reference only; no verse quotation). This is an allowed current-taxonomy choice. Context check: Jesus speaks to his disciples about the peace he gives and tells them not to be troubled or afraid. The image does not imply that work pressure or practical duties disappear. Reference text checked at [ESV.org](https://www.esv.org/verses/John%2B14%3A27/).
- Proposed alt text: “A cafeteria cook pauses at the service counter while a coworker continues preparing dishes behind them.”

## Source image checks

- Decoded as WebP RGB; native size **1254 × 1254 px**, square 1:1.
- File size: **276,790 bytes**.
- SHA-256: `13e214e6c52855dceaab9ee5622c9338dc8f4c717a08f83d7473726cf77bc23f`.
- Generated as one photorealistic cafeteria scene. The pixels show an adult cook pausing with hands on a safe stainless counter, a coworker arranging plates behind, and a quiet upper-right backsplash. No visible words, Scripture, logos, or UI were found on visual inspection.
- Scene matches the locked cafeteria/service-pass action and is distinct from the rejected mountain-hiker attempts recorded in #1488.
- The brief prefers approximately 1536 × 1536 or higher; the generator returned 1254 × 1254. This is recorded for reviewer judgment. No artificial resize was used.
- Existing PR/collision check found no committed Stressed image in the current queue; #1488 documents prior rejected attempts and states that none was committed.

## Still pending

- User/independent pixel-level visual and originality review against all approved, candidate, and rejected imagery.
- Resolution preference decision.
- After CLEAN is accepted: separately typeset TYPE with exact `Stressed` / `John 14:27`, then independently crop text-free THUMB. No derivatives were made from this pending master.
- Exact-head browser/device checks, registry audit, rights/provenance confirmation, and Lane D certification remain outstanding.

The candidate record remains `candidate_qa_pending` and must stay out of publication/release counts until every required gate passes.
