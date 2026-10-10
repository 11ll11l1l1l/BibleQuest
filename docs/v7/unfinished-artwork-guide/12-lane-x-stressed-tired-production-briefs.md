# BibleQuest V7 — Lane X next two P1 Feeling image drafts

**Status: PREPRODUCTION ONLY, zero accepted images.** Derived from the binding [construction guide](00_COMPLETE_CONSTRUCTION_GUIDEBOOK.md), especially §§2–7. Work owner: Manual X. Real artwork must pass independent Visual QA, exact source/rights/Scripture checks and Lane D release certification. No images may be invented or approved from this document.

## Source identification and collision check

The canonical live taxonomy file is `src/features/library/emotion-taxonomy.js`. Relevant immutable *identifiers*, subject to exact new-HEAD recheck: `emotion:stressed`, EN `Stressed`, references `Matthew 6:34` or `John 14:27`; `emotion:tired`, EN `Tired / weary`, references `Matthew 11:28-30` or `Isaiah 40:31`. Review surrounding context before choosing a reference; NEVER ask image generation to render Scripture or cite an invented quote. Proposed sidecars `bqv7-emotion-stressed-01` / `bqv7-emotion-tired-01` require an open-PR plus integrated registry collision check just before creation. Current open Lane X drafts #1429 Home, #1434 Overwhelmed and #1480 Comfort already claim other slots; do not regenerate or replace them.

## X-S1 — Stressed

**Required photorealistic visual story:** Inside an ordinary working cafeteria kitchen at midday, an adult cook at a stainless-steel service pass pauses and takes a measured breath, hands relaxed at the counter, as one coworker continues arranging unbranded plates several feet behind. Workload should be intelligible from a few plain trays and a working counter, without any acute threat, medical distress, staged breakdown, chef celebrity or visible signage. The subject is tense yet dignified, with realistic hands, skin, uniform and subtle expression.

**Concrete shot plan:** 1:1 native master; photograph rather than illustration, ~1536×1536 or higher. Adult eye-level medium three-quarter 40mm documentary composition, subject on left; second person small in right midground; naturally quiet upper-right 35% backsplash for optional semantic live-language overlay. Honest diffuse neutral overhead kitchen and soft window side illumination, believable steel reflections; palette off-white/soft slate/sand. No pseudo-letters on menus, screens, aprons, packages or receipts. 10% external content/TYPE safe inset. TYPE only after exact taxonomy label and full-source contextual reference check, and THUMB only after CLEAN pixel acceptance. Default all non-English locales to CLEAN + live translated text.

**Ready-to-run one-image brief:**

> Make exactly ONE independently retrievable high-resolution square cinematic editorial **photograph** inside a realistic contemporary cafeteria kitchen. A pressured adult cook at a stainless service-pass counter pauses for one measured calming breath, clean hands lightly resting on the safe counter, as a coworker several feet behind continues arranging plain unlabeled food plates. Authentic workday tension but no danger or theatrics. Camera at adult eye level, medium three-quarter documentary view, 40mm equivalent; primary face and hands left of center and softly blurred coworker behind right, upper-right third calm neutral backsplash for a later live title. Neutral midday light, realistic skin, anatomy, stainless-steel surface and uniform. No mountain, hiker, cliff, sunset, landscape, prayer pose, cross, Bible, SVG, vector, contact sheet, grid, printed text, pseudo-lettering, logo, watermark, image collage or UI.

**Exact scene fingerprint:** `pause-during-work / cafeteria-kitchen / two-adults / stainless-service-pass / eye-level-left / midday-neutral`.
**Alt-text draft:** “A cafeteria cook pauses at the service counter while a coworker continues preparing dishes behind them.”

## X-S2 — Tired / weary

**Required photorealistic visual story:** One adult baker finishing an ordinary overnight shift sits safely upright on a sturdy wooden stool inside a quiet flour-dusted neighborhood bakery. One hand rests on a neatly folded unmarked apron, shoulders relaxed; a few plain baked loaves cool on racks behind, showing work completed. Neither emergency, unconscious collapse, injury, depression stereotype nor spiritual promise of bodily recovery.

**Concrete shot plan:** 1:1 independent raster CLEAN master >=1536×1536 preferred. Intimate 50mm waist-height three-quarter environmental portrait; single baker on right, naturally quiet upper-left brick/plaster wall/workbench for localized overlays. Overcast early morning window side-light (no dramatic visible sunrise), warm neutral wood/flour and muted blue-gray. No printed flour-sack names, menus, labels or brand names. Reference candidates only the canonical `Matthew 11:28-30` or `Isaiah 40:31` after a reviewer checks actual historical/reader context; default no baked Scripture.

**Ready-to-run one-image brief:**

> Create exactly ONE high-resolution square photographic editorial still **inside** a believable small neighborhood bakery just after a normal night shift. A single tired adult baker sits safely upright on a sturdy wooden stool beside a lightly flour-dusted workbench, hand on a neatly folded plain apron, with a few unbranded finished loaves on nearby cooling racks. Authentic quiet end-of-work recovery, human dignity, natural anatomy. Waist-height 50mm three-quarter documentary perspective, baker on right, blank natural wall and clean workbench create a calm upper-left third for separate translated live text. Soft overcast early-morning light entering a high window, restrained warm wood and cool ambient shade, believable realistic textures. No outdoor mountain/river/cliff/hiking scenery, sunrise vista, fake book or religious symbol, injury, collapse, SVG, vector, typography, readable labels, logo, UI, grid, collage or watermark.

**Exact scene fingerprint:** `rest-after-shift / quiet-bakery / one-adult / stool-and-folded-apron / waist-height-right / overcast-side-light`.
**Alt-text draft:** “After an overnight shift, a baker rests on a stool beside cooling loaves in a quiet bakery.”

## Uniqueness preflight

These two shots vary across six meaningful axes before pixel inspection: active vs completed work, cafeteria vs bakery, two adults vs one, steel pass/trays vs folded apron/stool/loaves, primary left vs primary right, overhead midday vs morning window sidelight. This written difference is **not** itself pixel QA: compare actual result with merged, open and rejected images.

## Actual generator rejection / stop condition (2026-10-10)

Two consecutive CLEAN attempts targeting X-S1 instead produced **unrelated single hikers on a mountainside at sunrise/golden hour**, violating the required cafeteria action/setting and being visually near-identical. Their verified local output fingerprints are:
- `7ed3dc8670887c812aa976360d822aaf934ebe5c1e1583fd474d2cd13564998c` — PNG 1122×1402, mountain hiker at sunrise, **REJECTED**.
- `1a0edd964070068100a4df5ee70139107fa060ed49475028d70f533bedf42a5e` — PNG 1122×1402, mountain hiker at golden hour, **REJECTED**.

Neither meets the intended 1:1 geometry, correct narrative or originality QA. No image from these attempts was committed, admitted to the asset registry, approved or counted; no TYPE/THUMB was made from them. Do not relabel, upscale, crop or use either as an image-generation reference. The production tool should stop after a second consecutive wrong-scene output and switch to a fresh source-bound single-scene prompt rather than report false progress. Do not regenerate other agents' assigned slots.

## Next actual acceptance

For each scene: verify current source/taxonomy and collision; generate **one** correct standalone original raster CLEAN; inspect pixels/uniqueness and full copyright/provenance; only then independently composite checked EN TYPE and export focal-aware text-free THUMB, record true per-variant SHA256/bytes/native geometry/font/source revision; test built mobile 320/390/430 plus 100px thumbnail; obtain independent Visual QA verdict and exact served-byte release evidence. Until all applicable gates pass, mark `qa_pending`, not `production_ready`.
