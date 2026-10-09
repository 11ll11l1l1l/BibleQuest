# BibleQuest V7 — 300 Devotional Cover Production Playbook

Version: 2026-10-09 JST. Scope: first-party V7 devotional-specific covers in **manual Lane Z**. This is a production instruction and grounded assignment roster, **not** a claim that images exist or are approved.

Canonical inputs: `content/v7/devotionals/*.json`; `scripts/v7-lane-z-devotional-cover-queue.mjs --all`; `data/v7/visual-assets/records/*.json`; `docs/v7/V7_VISUAL_ASSET_PRODUCTION_20261008.md`; `docs/v7/V7_MANUAL_ARTWORK_LANES_X_Y_Z_20261009.md`. If any prose, IDs, rights, or source revisions change, the current repository source prevails over this dated roster.

## 1. Master image-generation prompt — up to ten independent covers per batch

> You are the original artwork producer for **BibleQuest V7**, a premium contemporary Bible-reading and devotional application.
>
> The input is a batch of **up to 10 individually identified BibleQuest first-party devotionals**. Each assignment includes `devotionalId`, `revision`, canonical English `title`, source prose/body, canonical Scripture **reference(s)**, taxonomy hints, and source file path.
>
> **Generate one physically separate original 4:5 PORTRAIT image per devotional**. The output for 10 assignments must be TEN independently retrievable images with a one-to-one ID mapping; it is **never** a contact sheet, poster, collage, UI screenshot, mosaic, multi-panel design board or mockup. Do not put ten covers inside one picture. If the provider returns combined artwork rather than separate files, reject it and retry with fewer assignments or one image per call.
>
> Read the complete exact-revision devotional prose before deciding the concept. Translate the *specific spiritual/emotional situation and real-world action* into a credible human or symbolic story. Avoid a generic "Christian picture" unrelated to the devotional. Make every composition distinct in subject/action, place, angle, cast, props, lighting, color distribution, and emotional signal. Compare against the already accepted cover archive; an alternate crop or renamed copy does not count as unique.
>
> **Art direction:** original cinematic editorial realism; photographic/believable anatomy and skin, nuanced facial expressions, contemporary home/work/community/nature settings, natural plausible illumination, tasteful restrained color (earth, slate, teal, warm neutrals), mature and trustworthy atmosphere, compassionate rather than manipulative emotion. People of varied ages/backgrounds should be shown authentically, without stereotypes. An object-led still-life is valid when better connected to the prose.
>
> **Composition:** 4:5 master, ideally at least 1024×1280 px. Keep the main subject clearly recognizable at 320px phone-card width; reserve approximately the lower 30–35% or another explicitly documented quiet region for a **LIVE localized** heading overlay. Keep essential subjects away from the outer 10% safe margin, and maintain useful focal margins for an independent thumbnail. Do not sacrifice fidelity for a rigid byte target.
>
> **The clean master contains no text:** no title, verse, reference, caption, numbers, letters, fake lettering, book print, infographic, watermark, brand logo, interface controls or typography. Never invent or paraphrase Bible verses on artwork. Scripture claims live in the checked app content and are not validated by the image itself.
>
> **Reject:** malformed hands/eyes/objects; misleading gestures; absurd perspective; low-resolution upscales; copyright/protected characters; public-figure likenesses; stock-watermark look; repeated mountains, sunsets, glowing crosses, praying hands and generic open Bibles; text-like artifacts; emotional mismatch; near-duplicates.
>
> Return one image file per provided `devotionalId` plus an output receipt mapping every file to its exact ID, revision and source filename. If image generation cannot create a real separate file or only returns a combined grid, report the failed assignment and do not mark anything created. Never invent measurements or QA status.
>
> **Backups:** only after a primary fails the quality/diversity gate, generate a second *materially different* concept for that same devotional (change at least three of environment, subject count, angle, action, object, time/light, narrative framing). Label it `candidate-B`. Keep candidate A and B separate; select at most one primary accepted cover per devotional. Prioritize obtaining one good cover for all 300 before generating broad optional backups.

### Slot-specific append for each cover

```text
Assignment: {001..300}
devotionalId: {exact canonical ID}
sourcePath: {exact content/v7/devotionals/....json}
revision: {exact item revision}
title: {exact canonical English title}
body: {complete current sourceContent.body, not a guess or a summary}
approved Scripture reference(s): {as resolved from current item; do not fabricate}
taxonomy: {canonical emotion/need/topic IDs}
existing candidate / approved cover: {read current visual registry}
scene: {a unique, action-specific visual concept derived from BODY}
difference from neighboring covers: {concrete casting / setting / light / object / framing}
safe text region: {bottom|top|left|right}
render: one separate text-free 4:5 CLEAN image; optional B only when A fails QA
```

## 2. Hard requirements and acceptance rules

1. **Scope and identity.** Exactly **300 distinct first-party devotional IDs**, each with one separately generated and independently checked cover. Do not count source writing, an empty assignment, a source-sidecar, a concept board, an emotion-master fallback, a mocked image, or a pending PR as a cover. A devotional record must be type `devotional`, source `first_party`, rights `verified` with `display` + `modify` allowed.
2. **Capacity.** Plan **30 groups of ten distinct covers**. Use the maximum independent-output batch size **the actual generation interface supports**, up to ten. Do not assume a "10 images per chat" entitlement: tool quotas and batch size vary by provider/session. Fallback 10→5→1 if isolated files cannot be returned. Generated quantity is counted by real files, not call count.
3. **Source faithfulness.** For each item inspect current `sourceContent.title`, complete `body`, Scripture references, source revision and tags. Choose the scene only after that review; the roster's quick taxonomy labels are navigational hints, not sufficient source interpretation. Do not portray advice that contradicts the passage or implies a guarantee that the devotional does not make.
4. **Uniqueness.** Cover must be genuinely content-specific and visually distinctive across 300 IDs, including multiple entries within one emotion. Use difference logs and both exact SHA-256 and image-similarity review. No duplicates under alternate names. Stable number or topic alone is not evidence of uniqueness.
5. **One image = one file.** A source image must contain a single editorial scene, not four/ten/300 panels. Keep independently retrievable source image bytes and provenance. Reject generated contact sheets outright; do not crop small tiles from them.
6. **Master format.** Produce text-free **4:5 portrait** CLEAN at recommended 1024×1280 or 1536×1920; WebP is preferred. Target about 500 KB per ordinary card after quality-preserving optimization, not a hard limit if damaging. Record actual width, height, bytes, format and SHA-256.
7. **Variants.** Derive THUMB from the accepted CLEAN using a deliberate focal crop (e.g. 320×400 or 384×480). Optional English TYPE is a separate real file from the same image with the *exact approved* short label/reference, checked fonts and optical readability. The default BibleQuest image remains CLEAN/THUMB with DOM-rendered live multilingual text, not baked-in English. Do not require a TYPE to begin evaluating the CLEAN; do not falsely claim a complete 3-file bundle if a derivative is absent.
8. **Scripture and language.** No Bible text or verse references inside CLEAN/THUMB. For optional TYPE, only approved wording from the canonical source and licensed displayed font; verify book/chapter/verse and meaning against source text. Missing translation proof means English TYPE must not be used in Tagalog, Cebuano or Ilocano UI. Do not embed pseudo-Japanese/Ilocano words or AI-rendered gibberish.
9. **Visual QA (hard gates).** Subject/mood accurate; scene intelligible at 320px; natural anatomy/perspective; clean margins/crop; accessible live-text contrast with scrim; no watermarks, logos or fake text; no low-quality artifacts; professional visual consistency; no offensive/sexualized/graphic or manipulative imagery. A candidate failing any hard gate is rejected, not silently approved by an average aesthetic score.
10. **Technical QA.** Verify exact committed image bytes, dimensions, extension, hashes, unique ID and safe paths; confirm rights/provenance/alt text; compare against other accepted covers. Render as served by the built app at **320, 390 and 430 CSS px**, test crop and overflow, light/dark or relevant presentation, slow/offline fallback, localization and keyboard/screen-reader semantics. An isolated local preview is not a substitute for built-app QA.
11. **Provenance.** Record image-generation provider if actually known, prompt, concept, creation timestamp, source/revision, generation job/asset link if available, rights declaration and truthful review evidence. Never claim a specific model if it is not exposed. No borrowed third-party book covers or copyrighted stock image repackaging.
12. **Storage.** Save accepted CLEAN under `public/v7/images/devotional/bqv7-devotional-<stable-unique-slug>-01.webp` (or real source extension) with `data/v7/visual-assets/records/<asset-id>.json`. Preserve candidate alternate IDs, never overwrite existing art without revision. Agents may only write their new own files; no shared mutable manifest edits.
13. **Separate stages.** Status flow: `unstarted` → `candidate_generated` → `technical_verified` → `visual_qa_pass` → `built_app_qa_pass` → `production_ready`. Each transition needs real evidence; no actor may auto-approve its own unknown-rights or visually failed work. Merge/publish follows Lane A's canonical visual audit, Lane B's image rights/review policy, and Lane D's exact-HEAD image/CI/release certification.
14. **Backup selection.** Candidate B may be commissioned for poor quality, conflicting visual meaning or near-duplicate A, not merely to inflate file count. A and B share one devotional ID but have separate asset/candidate IDs. Record why B was needed and why the winning image was selected. A clear pass may be published without a B.
15. **Reporting.** Per run report: `requestedDistinct`, `independentFilesReturned`, `candidateA`, `candidateB`, `acceptedClean`, `rejectedWithReasons`, `awaitingTechnicalQA`, `awaitingVisualQA`, `awaitingBuiltAppQA`, `mergedProductionReady`, `stillUnassigned`. Counts must be deduplicated by devotional ID. Never write `300/300` from prompts, draft sidecars or marketing graphics.

### Batch and QA execution sequence

- Build fresh queue: `node scripts/v7-lane-z-devotional-cover-queue.mjs --all` (canonical queue order is sorted by devotional **ID**). Check `rightsEligible` and actual registered assets before selecting the next ten missing IDs.
- Prepare ten source-specific prompts from full bodies. Run one image per ID in a batch if supported; immediately map distinct output files to the corresponding IDs. Reject mosaics.
- Inspect candidates, reject failures quickly, create a materially different B only when needed; store content-specific prompt and provenance.
- Convert accepted CLEAN to optimized WebP and make thumbnail/optional verified TYPE separately. Calculate actual bytes, hashes/dimensions and metadata.
- Run canonical Node visual audits plus independent visual/crop review. On a candidate branch, run exact-head CI and built-app Chromium screenshot/hash checks at 320/390/430; only then advance the release sidecar and integration PR.
- At each milestone reconcile `300 - distinct published devotional IDs`, `300 - distinct generated CLEAN candidates`, and the different QA queues. Do not mix these counts.

**Important:** The V7 launch P0 artwork gate has separate thresholds for Feelings, Needs and Home; the 300 distinct devotional covers are a requested corpus-completion target and must not be misreported as an already fulfilled release gate.

## 3. Canonical 300-cover assignment roster

The numbered roster below follows **source batch order** (the ten devotional writing batches), grouped into thirty batches of ten image assignments for efficient image production. The canonical `Lane Z` command sorts by **devotional ID**; these are two valid but different presentation orders. Each row identifies the exact devotional ID, canonical English title, source-file path and revision, and primary taxonomy cue. All image-generation prompts MUST read the complete source text first; title/taxonomy alone are not scene approvals. Roster entries do not imply artwork exists.

| # | Devotional ID | Exact source title | Cue | Source / revision |
|---:|---|---|---|---|
| 001 | `devotional.biblequest.anger.01` | Slow the reaction | `emotion.anger` | `content/v7/devotionals/biblequest-original-emotions-01b.json @ r1` |
| 002 | `devotional.biblequest.anxiety_worry.01` | One concern at a time | `emotion.anxiety_worry` | `content/v7/devotionals/biblequest-original-emotions-01a.json @ r1` |
| 003 | `devotional.biblequest.confusion_uncertainty.01` | Ask for light, then choose faithfully | `emotion.confusion_uncertainty` | `content/v7/devotionals/biblequest-original-emotions-01c.json @ r1` |
| 004 | `devotional.biblequest.discouragement.01` | Faithfulness before results | `emotion.discouragement` | `content/v7/devotionals/biblequest-original-emotions-01c.json @ r1` |
| 005 | `devotional.biblequest.doubt.01` | Bring the question with you | `emotion.doubt` | `content/v7/devotionals/biblequest-original-emotions-01c.json @ r1` |
| 006 | `devotional.biblequest.excitement.01` | Turn excitement into faithful action | `emotion.excitement` | `content/v7/devotionals/biblequest-original-emotions-01f.json @ r1` |
| 007 | `devotional.biblequest.fear.01` | Courage for the next step | `emotion.fear` | `content/v7/devotionals/biblequest-original-emotions-01a.json @ r1` |
| 008 | `devotional.biblequest.frustration.01` | Separate the obstacle from the calling | `emotion.frustration` | `content/v7/devotionals/biblequest-original-emotions-01e.json @ r1` |
| 009 | `devotional.biblequest.gratitude.01` | Name the gift precisely | `emotion.gratitude` | `content/v7/devotionals/biblequest-original-emotions-01f.json @ r1` |
| 010 | `devotional.biblequest.grief_loss.01` | Love remembers | `emotion.grief_loss` | `content/v7/devotionals/biblequest-original-emotions-01a.json @ r1` |
| 011 | `devotional.biblequest.guilt.01` | Confess without hiding | `emotion.guilt` | `content/v7/devotionals/biblequest-original-emotions-01b.json @ r1` |
| 012 | `devotional.biblequest.hope.01` | Anchor beyond the forecast | `emotion.hope` | `content/v7/devotionals/biblequest-original-emotions-01f.json @ r1` |
| 013 | `devotional.biblequest.hopelessness.01` | Borrow hope from God’s character | `emotion.hopelessness` | `content/v7/devotionals/biblequest-original-emotions-01c.json @ r1` |
| 014 | `devotional.biblequest.hurt_betrayal.01` | Protect the wound without hardening | `emotion.hurt_betrayal` | `content/v7/devotionals/biblequest-original-emotions-01b.json @ r1` |
| 015 | `devotional.biblequest.impatience_waiting.01` | Do not waste the waiting | `emotion.impatience_waiting` | `content/v7/devotionals/biblequest-original-emotions-01e.json @ r1` |
| 016 | `devotional.biblequest.insecurity_unworthiness.01` | Receive your place | `emotion.insecurity_unworthiness` | `content/v7/devotionals/biblequest-original-emotions-01c.json @ r1` |
| 017 | `devotional.biblequest.jealousy_envy.01` | Bless without measuring yourself | `emotion.jealousy_envy` | `content/v7/devotionals/biblequest-original-emotions-01e.json @ r1` |
| 018 | `devotional.biblequest.joy.01` | Receive joy without apology | `emotion.joy` | `content/v7/devotionals/biblequest-original-emotions-01e.json @ r1` |
| 019 | `devotional.biblequest.loneliness.01` | Do not disappear | `emotion.loneliness` | `content/v7/devotionals/biblequest-original-emotions-01a.json @ r1` |
| 020 | `devotional.biblequest.love_connection.01` | Love in a concrete form | `emotion.love_connection` | `content/v7/devotionals/biblequest-original-emotions-01f.json @ r1` |
| 021 | `devotional.biblequest.numbness_emptiness.01` | Keep a small light on | `emotion.numbness_emptiness` | `content/v7/devotionals/biblequest-original-emotions-01e.json @ r1` |
| 022 | `devotional.biblequest.overwhelm.01` | Shrink the horizon | `emotion.overwhelm` | `content/v7/devotionals/biblequest-original-emotions-01d.json @ r1` |
| 023 | `devotional.biblequest.peace_contentment.01` | Enough for this moment | `emotion.peace_contentment` | `content/v7/devotionals/biblequest-original-emotions-01f.json @ r1` |
| 024 | `devotional.biblequest.rejection.01` | Rejected is not worthless | `emotion.rejection` | `content/v7/devotionals/biblequest-original-emotions-01b.json @ r1` |
| 025 | `devotional.biblequest.sadness.01` | Make room for sorrow | `emotion.sadness` | `content/v7/devotionals/biblequest-original-emotions-01a.json @ r1` |
| 026 | `devotional.biblequest.shame.01` | More than your worst moment | `emotion.shame` | `content/v7/devotionals/biblequest-original-emotions-01b.json @ r1` |
| 027 | `devotional.biblequest.spiritual_dryness_distance.01` | Stay near when feelings are quiet | `emotion.spiritual_dryness_distance` | `content/v7/devotionals/biblequest-original-emotions-01d.json @ r1` |
| 028 | `devotional.biblequest.stress.01` | Receive the invitation to rest | `emotion.stress` | `content/v7/devotionals/biblequest-original-emotions-01d.json @ r1` |
| 029 | `devotional.biblequest.temptation.01` | Make the faithful choice easier | `emotion.temptation` | `content/v7/devotionals/biblequest-original-emotions-01d.json @ r1` |
| 030 | `devotional.biblequest.tiredness_weariness.01` | Rest is part of faithfulness | `emotion.tiredness_weariness` | `content/v7/devotionals/biblequest-original-emotions-01d.json @ r1` |
| 031 | `devotional.biblequest.anger.02` | Lower the temperature | `emotion.anger` | `content/v7/devotionals/biblequest-original-emotions-02a.json @ r1` |
| 032 | `devotional.biblequest.anxiety_worry.02` | Return to what is true | `emotion.anxiety_worry` | `content/v7/devotionals/biblequest-original-emotions-02a.json @ r1` |
| 033 | `devotional.biblequest.confusion_uncertainty.02` | Do the clear next thing | `emotion.confusion_uncertainty` | `content/v7/devotionals/biblequest-original-emotions-02b.json @ r1` |
| 034 | `devotional.biblequest.discouragement.02` | Keep sowing before you see fruit | `emotion.discouragement` | `content/v7/devotionals/biblequest-original-emotions-02b.json @ r1` |
| 035 | `devotional.biblequest.doubt.02` | Keep the question in the room | `emotion.doubt` | `content/v7/devotionals/biblequest-original-emotions-02b.json @ r1` |
| 036 | `devotional.biblequest.excitement.02` | Steward the energy | `emotion.excitement` | `content/v7/devotionals/biblequest-original-emotions-02c.json @ r1` |
| 037 | `devotional.biblequest.fear.02` | Remember who is with you | `emotion.fear` | `content/v7/devotionals/biblequest-original-emotions-02a.json @ r1` |
| 038 | `devotional.biblequest.frustration.02` | Try another faithful way | `emotion.frustration` | `content/v7/devotionals/biblequest-original-emotions-02c.json @ r1` |
| 039 | `devotional.biblequest.gratitude.02` | Trace the gift to the Giver | `emotion.gratitude` | `content/v7/devotionals/biblequest-original-emotions-02c.json @ r1` |
| 040 | `devotional.biblequest.grief_loss.02` | Remember with hope | `emotion.grief_loss` | `content/v7/devotionals/biblequest-original-emotions-02a.json @ r1` |
| 041 | `devotional.biblequest.guilt.02` | Repair what you can | `emotion.guilt` | `content/v7/devotionals/biblequest-original-emotions-02a.json @ r1` |
| 042 | `devotional.biblequest.hope.02` | Hope has a horizon | `emotion.hope` | `content/v7/devotionals/biblequest-original-emotions-02c.json @ r1` |
| 043 | `devotional.biblequest.hopelessness.02` | Call to mind what remains true | `emotion.hopelessness` | `content/v7/devotionals/biblequest-original-emotions-02b.json @ r1` |
| 044 | `devotional.biblequest.hurt_betrayal.02` | Tell the truth without becoming cruel | `emotion.hurt_betrayal` | `content/v7/devotionals/biblequest-original-emotions-02a.json @ r1` |
| 045 | `devotional.biblequest.impatience_waiting.02` | Let waiting deepen trust | `emotion.impatience_waiting` | `content/v7/devotionals/biblequest-original-emotions-02c.json @ r1` |
| 046 | `devotional.biblequest.insecurity_unworthiness.02` | You are not an audition | `emotion.insecurity_unworthiness` | `content/v7/devotionals/biblequest-original-emotions-02b.json @ r1` |
| 047 | `devotional.biblequest.jealousy_envy.02` | Celebrate without comparison | `emotion.jealousy_envy` | `content/v7/devotionals/biblequest-original-emotions-02c.json @ r1` |
| 048 | `devotional.biblequest.joy.02` | Share the good | `emotion.joy` | `content/v7/devotionals/biblequest-original-emotions-02c.json @ r1` |
| 049 | `devotional.biblequest.loneliness.02` | Send the first message | `emotion.loneliness` | `content/v7/devotionals/biblequest-original-emotions-02a.json @ r1` |
| 050 | `devotional.biblequest.love_connection.02` | Make room to listen | `emotion.love_connection` | `content/v7/devotionals/biblequest-original-emotions-02c.json @ r1` |
| 051 | `devotional.biblequest.numbness_emptiness.02` | Stay connected to simple practices | `emotion.numbness_emptiness` | `content/v7/devotionals/biblequest-original-emotions-02c.json @ r1` |
| 052 | `devotional.biblequest.overwhelm.02` | Carry today's load | `emotion.overwhelm` | `content/v7/devotionals/biblequest-original-emotions-02b.json @ r1` |
| 053 | `devotional.biblequest.peace_contentment.02` | Practice enough | `emotion.peace_contentment` | `content/v7/devotionals/biblequest-original-emotions-02c.json @ r1` |
| 054 | `devotional.biblequest.rejection.02` | Approval is not your foundation | `emotion.rejection` | `content/v7/devotionals/biblequest-original-emotions-02a.json @ r1` |
| 055 | `devotional.biblequest.sadness.02` | Let sorrow become prayer | `emotion.sadness` | `content/v7/devotionals/biblequest-original-emotions-02a.json @ r1` |
| 056 | `devotional.biblequest.shame.02` | Approach grace instead of hiding | `emotion.shame` | `content/v7/devotionals/biblequest-original-emotions-02a.json @ r1` |
| 057 | `devotional.biblequest.spiritual_dryness_distance.02` | Pray the small prayer | `emotion.spiritual_dryness_distance` | `content/v7/devotionals/biblequest-original-emotions-02b.json @ r1` |
| 058 | `devotional.biblequest.stress.02` | Release borrowed pressure | `emotion.stress` | `content/v7/devotionals/biblequest-original-emotions-02b.json @ r1` |
| 059 | `devotional.biblequest.temptation.02` | Leave before you negotiate | `emotion.temptation` | `content/v7/devotionals/biblequest-original-emotions-02b.json @ r1` |
| 060 | `devotional.biblequest.tiredness_weariness.02` | Limits are not laziness | `emotion.tiredness_weariness` | `content/v7/devotionals/biblequest-original-emotions-02b.json @ r1` |
| 061 | `devotional.biblequest.anger.03` | Do not give anger a room overnight | `emotion.anger` | `content/v7/devotionals/biblequest-original-emotions-03a.json @ r1` |
| 062 | `devotional.biblequest.anxiety_worry.03` | Count consolations, not scenarios | `emotion.anxiety_worry` | `content/v7/devotionals/biblequest-original-emotions-03a.json @ r1` |
| 063 | `devotional.biblequest.confusion_uncertainty.03` | Use the lamp you have | `emotion.confusion_uncertainty` | `content/v7/devotionals/biblequest-original-emotions-03b.json @ r1` |
| 064 | `devotional.biblequest.discouragement.03` | Do not measure only what is wearing out | `emotion.discouragement` | `content/v7/devotionals/biblequest-original-emotions-03b.json @ r1` |
| 065 | `devotional.biblequest.doubt.03` | Turn doubt into careful examination | `emotion.doubt` | `content/v7/devotionals/biblequest-original-emotions-03b.json @ r1` |
| 066 | `devotional.biblequest.excitement.03` | Keep joy anchored deeper than success | `emotion.excitement` | `content/v7/devotionals/biblequest-original-emotions-03c.json @ r1` |
| 067 | `devotional.biblequest.fear.03` | Courage can move while fear remains | `emotion.fear` | `content/v7/devotionals/biblequest-original-emotions-03a.json @ r1` |
| 068 | `devotional.biblequest.frustration.03` | Let patience outlast irritation | `emotion.frustration` | `content/v7/devotionals/biblequest-original-emotions-03c.json @ r1` |
| 069 | `devotional.biblequest.gratitude.03` | Do not forget the benefits | `emotion.gratitude` | `content/v7/devotionals/biblequest-original-emotions-03c.json @ r1` |
| 070 | `devotional.biblequest.grief_loss.03` | Walk through, not around, the valley | `emotion.grief_loss` | `content/v7/devotionals/biblequest-original-emotions-03a.json @ r1` |
| 071 | `devotional.biblequest.guilt.03` | Confession ends hiding | `emotion.guilt` | `content/v7/devotionals/biblequest-original-emotions-03a.json @ r1` |
| 072 | `devotional.biblequest.hope.03` | Hope rooted in resurrection | `emotion.hope` | `content/v7/devotionals/biblequest-original-emotions-03c.json @ r1` |
| 073 | `devotional.biblequest.hopelessness.03` | Wait with patient hope | `emotion.hopelessness` | `content/v7/devotionals/biblequest-original-emotions-03b.json @ r1` |
| 074 | `devotional.biblequest.hurt_betrayal.03` | Grieve the broken trust honestly | `emotion.hurt_betrayal` | `content/v7/devotionals/biblequest-original-emotions-03a.json @ r1` |
| 075 | `devotional.biblequest.impatience_waiting.03` | Let patience have a practice | `emotion.impatience_waiting` | `content/v7/devotionals/biblequest-original-emotions-03c.json @ r1` |
| 076 | `devotional.biblequest.insecurity_unworthiness.03` | Your value is not scarce | `emotion.insecurity_unworthiness` | `content/v7/devotionals/biblequest-original-emotions-03b.json @ r1` |
| 077 | `devotional.biblequest.jealousy_envy.03` | Protect a peaceful heart | `emotion.jealousy_envy` | `content/v7/devotionals/biblequest-original-emotions-03c.json @ r1` |
| 078 | `devotional.biblequest.joy.03` | Let joy become strength | `emotion.joy` | `content/v7/devotionals/biblequest-original-emotions-03c.json @ r1` |
| 079 | `devotional.biblequest.loneliness.03` | Tell God the ache of being alone | `emotion.loneliness` | `content/v7/devotionals/biblequest-original-emotions-03a.json @ r1` |
| 080 | `devotional.biblequest.love_connection.03` | Choose the patient form of love | `emotion.love_connection` | `content/v7/devotionals/biblequest-original-emotions-03c.json @ r1` |
| 081 | `devotional.biblequest.numbness_emptiness.03` | Ask for a renewed heart | `emotion.numbness_emptiness` | `content/v7/devotionals/biblequest-original-emotions-03c.json @ r1` |
| 082 | `devotional.biblequest.overwhelm.03` | Share the load before it breaks you | `emotion.overwhelm` | `content/v7/devotionals/biblequest-original-emotions-03b.json @ r1` |
| 083 | `devotional.biblequest.peace_contentment.03` | Practice contentment with presence | `emotion.peace_contentment` | `content/v7/devotionals/biblequest-original-emotions-03c.json @ r1` |
| 084 | `devotional.biblequest.rejection.03` | A forsaken feeling is not a forsaken life | `emotion.rejection` | `content/v7/devotionals/biblequest-original-emotions-03a.json @ r1` |
| 085 | `devotional.biblequest.sadness.03` | Speak hope to your own soul | `emotion.sadness` | `content/v7/devotionals/biblequest-original-emotions-03a.json @ r1` |
| 086 | `devotional.biblequest.shame.03` | Lift your face again | `emotion.shame` | `content/v7/devotionals/biblequest-original-emotions-03a.json @ r1` |
| 087 | `devotional.biblequest.spiritual_dryness_distance.03` | Remain before you feel fruitful | `emotion.spiritual_dryness_distance` | `content/v7/devotionals/biblequest-original-emotions-03b.json @ r1` |
| 088 | `devotional.biblequest.stress.03` | Be still before solving | `emotion.stress` | `content/v7/devotionals/biblequest-original-emotions-03b.json @ r1` |
| 089 | `devotional.biblequest.temptation.03` | Watch before the test arrives | `emotion.temptation` | `content/v7/devotionals/biblequest-original-emotions-03b.json @ r1` |
| 090 | `devotional.biblequest.tiredness_weariness.03` | Receive strength instead of manufacturing it | `emotion.tiredness_weariness` | `content/v7/devotionals/biblequest-original-emotions-03b.json @ r1` |
| 091 | `devotional.biblequest.anger.04` | Make room for prayer and wisdom | `emotion.anger` | `content/v7/devotionals/biblequest-original-emotions-04a.json @ r1` |
| 092 | `devotional.biblequest.anxiety_worry.04` | Make room for prayer and wisdom | `emotion.anxiety_worry` | `content/v7/devotionals/biblequest-original-emotions-04a.json @ r1` |
| 093 | `devotional.biblequest.confusion_uncertainty.04` | Make room for prayer and wisdom | `emotion.confusion_uncertainty` | `content/v7/devotionals/biblequest-original-emotions-04b.json @ r1` |
| 094 | `devotional.biblequest.discouragement.04` | Make room for prayer and wisdom | `emotion.discouragement` | `content/v7/devotionals/biblequest-original-emotions-04b.json @ r1` |
| 095 | `devotional.biblequest.doubt.04` | Make room for prayer and wisdom | `emotion.doubt` | `content/v7/devotionals/biblequest-original-emotions-04b.json @ r1` |
| 096 | `devotional.biblequest.excitement.04` | Make room for prayer and wisdom | `emotion.excitement` | `content/v7/devotionals/biblequest-original-emotions-04c.json @ r1` |
| 097 | `devotional.biblequest.fear.04` | Make room for prayer and wisdom | `emotion.fear` | `content/v7/devotionals/biblequest-original-emotions-04a.json @ r1` |
| 098 | `devotional.biblequest.frustration.04` | Make room for prayer and wisdom | `emotion.frustration` | `content/v7/devotionals/biblequest-original-emotions-04c.json @ r1` |
| 099 | `devotional.biblequest.gratitude.04` | Make room for prayer and wisdom | `emotion.gratitude` | `content/v7/devotionals/biblequest-original-emotions-04c.json @ r1` |
| 100 | `devotional.biblequest.grief_loss.04` | Make room for prayer and wisdom | `emotion.grief_loss` | `content/v7/devotionals/biblequest-original-emotions-04a.json @ r1` |
| 101 | `devotional.biblequest.guilt.04` | Make room for prayer and wisdom | `emotion.guilt` | `content/v7/devotionals/biblequest-original-emotions-04a.json @ r1` |
| 102 | `devotional.biblequest.hope.04` | Make room for prayer and wisdom | `emotion.hope` | `content/v7/devotionals/biblequest-original-emotions-04c.json @ r1` |
| 103 | `devotional.biblequest.hopelessness.04` | Make room for prayer and wisdom | `emotion.hopelessness` | `content/v7/devotionals/biblequest-original-emotions-04b.json @ r1` |
| 104 | `devotional.biblequest.hurt_betrayal.04` | Make room for prayer and wisdom | `emotion.hurt_betrayal` | `content/v7/devotionals/biblequest-original-emotions-04a.json @ r1` |
| 105 | `devotional.biblequest.impatience_waiting.04` | Make room for prayer and wisdom | `emotion.impatience_waiting` | `content/v7/devotionals/biblequest-original-emotions-04c.json @ r1` |
| 106 | `devotional.biblequest.insecurity_unworthiness.04` | Make room for prayer and wisdom | `emotion.insecurity_unworthiness` | `content/v7/devotionals/biblequest-original-emotions-04b.json @ r1` |
| 107 | `devotional.biblequest.jealousy_envy.04` | Make room for prayer and wisdom | `emotion.jealousy_envy` | `content/v7/devotionals/biblequest-original-emotions-04c.json @ r1` |
| 108 | `devotional.biblequest.joy.04` | Make room for prayer and wisdom | `emotion.joy` | `content/v7/devotionals/biblequest-original-emotions-04c.json @ r1` |
| 109 | `devotional.biblequest.loneliness.04` | Make room for prayer and wisdom | `emotion.loneliness` | `content/v7/devotionals/biblequest-original-emotions-04a.json @ r1` |
| 110 | `devotional.biblequest.love_connection.04` | Make room for prayer and wisdom | `emotion.love_connection` | `content/v7/devotionals/biblequest-original-emotions-04c.json @ r1` |
| 111 | `devotional.biblequest.numbness_emptiness.04` | Make room for prayer and wisdom | `emotion.numbness_emptiness` | `content/v7/devotionals/biblequest-original-emotions-04c.json @ r1` |
| 112 | `devotional.biblequest.overwhelm.04` | Make room for prayer and wisdom | `emotion.overwhelm` | `content/v7/devotionals/biblequest-original-emotions-04b.json @ r1` |
| 113 | `devotional.biblequest.peace_contentment.04` | Make room for prayer and wisdom | `emotion.peace_contentment` | `content/v7/devotionals/biblequest-original-emotions-04c.json @ r1` |
| 114 | `devotional.biblequest.rejection.04` | Make room for prayer and wisdom | `emotion.rejection` | `content/v7/devotionals/biblequest-original-emotions-04a.json @ r1` |
| 115 | `devotional.biblequest.sadness.04` | Make room for prayer and wisdom | `emotion.sadness` | `content/v7/devotionals/biblequest-original-emotions-04a.json @ r1` |
| 116 | `devotional.biblequest.shame.04` | Make room for prayer and wisdom | `emotion.shame` | `content/v7/devotionals/biblequest-original-emotions-04a.json @ r1` |
| 117 | `devotional.biblequest.spiritual_dryness_distance.04` | Make room for prayer and wisdom | `emotion.spiritual_dryness_distance` | `content/v7/devotionals/biblequest-original-emotions-04b.json @ r1` |
| 118 | `devotional.biblequest.stress.04` | Make room for prayer and wisdom | `emotion.stress` | `content/v7/devotionals/biblequest-original-emotions-04b.json @ r1` |
| 119 | `devotional.biblequest.temptation.04` | Make room for prayer and wisdom | `emotion.temptation` | `content/v7/devotionals/biblequest-original-emotions-04b.json @ r1` |
| 120 | `devotional.biblequest.tiredness_weariness.04` | Make room for prayer and wisdom | `emotion.tiredness_weariness` | `content/v7/devotionals/biblequest-original-emotions-04b.json @ r1` |
| 121 | `devotional.biblequest.anger.05` | Return the next hour to God | `emotion.anger` | `content/v7/devotionals/biblequest-original-emotions-05a.json @ r1` |
| 122 | `devotional.biblequest.anxiety_worry.05` | Return the next hour to God | `emotion.anxiety_worry` | `content/v7/devotionals/biblequest-original-emotions-05a.json @ r1` |
| 123 | `devotional.biblequest.confusion_uncertainty.05` | Return the next hour to God | `emotion.confusion_uncertainty` | `content/v7/devotionals/biblequest-original-emotions-05b.json @ r1` |
| 124 | `devotional.biblequest.discouragement.05` | Return the next hour to God | `emotion.discouragement` | `content/v7/devotionals/biblequest-original-emotions-05b.json @ r1` |
| 125 | `devotional.biblequest.doubt.05` | Return the next hour to God | `emotion.doubt` | `content/v7/devotionals/biblequest-original-emotions-05b.json @ r1` |
| 126 | `devotional.biblequest.excitement.11` | Obey: Let joy become gratitude, not self-importance | `emotion.excitement` | `content/v7/devotionals/biblequest-original-emotions-11-backfill.json @ r1` |
| 127 | `devotional.biblequest.fear.05` | Return the next hour to God | `emotion.fear` | `content/v7/devotionals/biblequest-original-emotions-05a.json @ r1` |
| 128 | `devotional.biblequest.frustration.05` | Return the next hour to God | `emotion.frustration` | `content/v7/devotionals/biblequest-original-emotions-05c.json @ r1` |
| 129 | `devotional.biblequest.gratitude.05` | Return the next hour to God | `emotion.gratitude` | `content/v7/devotionals/biblequest-original-emotions-05c.json @ r1` |
| 130 | `devotional.biblequest.grief_loss.05` | Return the next hour to God | `emotion.grief_loss` | `content/v7/devotionals/biblequest-original-emotions-05a.json @ r1` |
| 131 | `devotional.biblequest.guilt.11` | Obey: Bring the wrong into the light | `emotion.guilt` | `content/v7/devotionals/biblequest-original-emotions-11-backfill.json @ r1` |
| 132 | `devotional.biblequest.hope.05` | Return the next hour to God | `emotion.hope` | `content/v7/devotionals/biblequest-original-emotions-05c.json @ r1` |
| 133 | `devotional.biblequest.hopelessness.05` | Return the next hour to God | `emotion.hopelessness` | `content/v7/devotionals/biblequest-original-emotions-05b.json @ r1` |
| 134 | `devotional.biblequest.hurt_betrayal.05` | Return the next hour to God | `emotion.hurt_betrayal` | `content/v7/devotionals/biblequest-original-emotions-05a.json @ r1` |
| 135 | `devotional.biblequest.impatience_waiting.05` | Return the next hour to God | `emotion.impatience_waiting` | `content/v7/devotionals/biblequest-original-emotions-05c.json @ r1` |
| 136 | `devotional.biblequest.insecurity_unworthiness.05` | Return the next hour to God | `emotion.insecurity_unworthiness` | `content/v7/devotionals/biblequest-original-emotions-05b.json @ r1` |
| 137 | `devotional.biblequest.jealousy_envy.05` | Return the next hour to God | `emotion.jealousy_envy` | `content/v7/devotionals/biblequest-original-emotions-05c.json @ r1` |
| 138 | `devotional.biblequest.joy.05` | Return the next hour to God | `emotion.joy` | `content/v7/devotionals/biblequest-original-emotions-05c.json @ r1` |
| 139 | `devotional.biblequest.loneliness.05` | Return the next hour to God | `emotion.loneliness` | `content/v7/devotionals/biblequest-original-emotions-05a.json @ r1` |
| 140 | `devotional.biblequest.love_connection.11` | Obey: Make love concrete in one relationship | `emotion.love_connection` | `content/v7/devotionals/biblequest-original-emotions-11-backfill.json @ r1` |
| 141 | `devotional.biblequest.numbness_emptiness.05` | Return the next hour to God | `emotion.numbness_emptiness` | `content/v7/devotionals/biblequest-original-emotions-05c.json @ r1` |
| 142 | `devotional.biblequest.overwhelm.05` | Return the next hour to God | `emotion.overwhelm` | `content/v7/devotionals/biblequest-original-emotions-05b.json @ r1` |
| 143 | `devotional.biblequest.peace_contentment.05` | Return the next hour to God | `emotion.peace_contentment` | `content/v7/devotionals/biblequest-original-emotions-05c.json @ r1` |
| 144 | `devotional.biblequest.rejection.05` | Return the next hour to God | `emotion.rejection` | `content/v7/devotionals/biblequest-original-emotions-05a.json @ r1` |
| 145 | `devotional.biblequest.sadness.05` | Return the next hour to God | `emotion.sadness` | `content/v7/devotionals/biblequest-original-emotions-05a.json @ r1` |
| 146 | `devotional.biblequest.shame.11` | Obey: Reject the label that shame assigns | `emotion.shame` | `content/v7/devotionals/biblequest-original-emotions-11-backfill.json @ r1` |
| 147 | `devotional.biblequest.spiritual_dryness_distance.11` | Obey: Stay when you feel nothing | `emotion.spiritual_dryness_distance` | `content/v7/devotionals/biblequest-original-emotions-11-backfill.json @ r1` |
| 148 | `devotional.biblequest.stress.05` | Return the next hour to God | `emotion.stress` | `content/v7/devotionals/biblequest-original-emotions-05b.json @ r1` |
| 149 | `devotional.biblequest.temptation.11` | Obey: Change the conditions before temptation returns | `emotion.temptation` | `content/v7/devotionals/biblequest-original-emotions-11-backfill.json @ r1` |
| 150 | `devotional.biblequest.tiredness_weariness.05` | Return the next hour to God | `emotion.tiredness_weariness` | `content/v7/devotionals/biblequest-original-emotions-05b.json @ r1` |
| 151 | `devotional.biblequest.anger.06` | Ask what faithfulness looks like now | `emotion.anger` | `content/v7/devotionals/biblequest-original-emotions-06a.json @ r1` |
| 152 | `devotional.biblequest.anxiety_worry.06` | Ask what faithfulness looks like now | `emotion.anxiety_worry` | `content/v7/devotionals/biblequest-original-emotions-06a.json @ r1` |
| 153 | `devotional.biblequest.confusion_uncertainty.06` | Turn attention toward what God has given | `emotion.confusion_uncertainty` | `content/v7/devotionals/biblequest-original-emotions-06b.json @ r1` |
| 154 | `devotional.biblequest.discouragement.06` | Let prayer interrupt the spiral | `emotion.discouragement` | `content/v7/devotionals/biblequest-original-emotions-06b.json @ r1` |
| 155 | `devotional.biblequest.doubt.06` | Take the next step without carrying tomorrow | `emotion.doubt` | `content/v7/devotionals/biblequest-original-emotions-06b.json @ r1` |
| 156 | `devotional.biblequest.excitement.06` | Let prayer interrupt the spiral | `emotion.excitement` | `content/v7/devotionals/biblequest-original-emotions-06c.json @ r1` |
| 157 | `devotional.biblequest.fear.06` | Take the next step without carrying tomorrow | `emotion.fear` | `content/v7/devotionals/biblequest-original-emotions-06a.json @ r1` |
| 158 | `devotional.biblequest.frustration.06` | Turn attention toward what God has given | `emotion.frustration` | `content/v7/devotionals/biblequest-original-emotions-06c.json @ r1` |
| 159 | `devotional.biblequest.gratitude.06` | Ask what faithfulness looks like now | `emotion.gratitude` | `content/v7/devotionals/biblequest-original-emotions-06c.json @ r1` |
| 160 | `devotional.biblequest.grief_loss.06` | Let prayer interrupt the spiral | `emotion.grief_loss` | `content/v7/devotionals/biblequest-original-emotions-06a.json @ r1` |
| 161 | `devotional.biblequest.guilt.06` | Let prayer interrupt the spiral | `emotion.guilt` | `content/v7/devotionals/biblequest-original-emotions-06a.json @ r1` |
| 162 | `devotional.biblequest.hope.06` | Turn attention toward what God has given | `emotion.hope` | `content/v7/devotionals/biblequest-original-emotions-06c.json @ r1` |
| 163 | `devotional.biblequest.hopelessness.06` | Make one choice that agrees with hope | `emotion.hopelessness` | `content/v7/devotionals/biblequest-original-emotions-06b.json @ r1` |
| 164 | `devotional.biblequest.hurt_betrayal.06` | Take the next step without carrying tomorrow | `emotion.hurt_betrayal` | `content/v7/devotionals/biblequest-original-emotions-06a.json @ r1` |
| 165 | `devotional.biblequest.impatience_waiting.06` | Ask what faithfulness looks like now | `emotion.impatience_waiting` | `content/v7/devotionals/biblequest-original-emotions-06c.json @ r1` |
| 166 | `devotional.biblequest.insecurity_unworthiness.06` | Ask what faithfulness looks like now | `emotion.insecurity_unworthiness` | `content/v7/devotionals/biblequest-original-emotions-06b.json @ r1` |
| 167 | `devotional.biblequest.jealousy_envy.06` | Take the next step without carrying tomorrow | `emotion.jealousy_envy` | `content/v7/devotionals/biblequest-original-emotions-06c.json @ r1` |
| 168 | `devotional.biblequest.joy.06` | Make one choice that agrees with hope | `emotion.joy` | `content/v7/devotionals/biblequest-original-emotions-06c.json @ r1` |
| 169 | `devotional.biblequest.loneliness.06` | Make one choice that agrees with hope | `emotion.loneliness` | `content/v7/devotionals/biblequest-original-emotions-06a.json @ r1` |
| 170 | `devotional.biblequest.love_connection.06` | Make one choice that agrees with hope | `emotion.love_connection` | `content/v7/devotionals/biblequest-original-emotions-06c.json @ r1` |
| 171 | `devotional.biblequest.numbness_emptiness.06` | Let prayer interrupt the spiral | `emotion.numbness_emptiness` | `content/v7/devotionals/biblequest-original-emotions-06c.json @ r1` |
| 172 | `devotional.biblequest.overwhelm.06` | Ask what faithfulness looks like now | `emotion.overwhelm` | `content/v7/devotionals/biblequest-original-emotions-06b.json @ r1` |
| 173 | `devotional.biblequest.peace_contentment.06` | Take the next step without carrying tomorrow | `emotion.peace_contentment` | `content/v7/devotionals/biblequest-original-emotions-06c.json @ r1` |
| 174 | `devotional.biblequest.rejection.06` | Turn attention toward what God has given | `emotion.rejection` | `content/v7/devotionals/biblequest-original-emotions-06a.json @ r1` |
| 175 | `devotional.biblequest.sadness.06` | Turn attention toward what God has given | `emotion.sadness` | `content/v7/devotionals/biblequest-original-emotions-06a.json @ r1` |
| 176 | `devotional.biblequest.shame.06` | Make one choice that agrees with hope | `emotion.shame` | `content/v7/devotionals/biblequest-original-emotions-06a.json @ r1` |
| 177 | `devotional.biblequest.spiritual_dryness_distance.06` | Let prayer interrupt the spiral | `emotion.spiritual_dryness_distance` | `content/v7/devotionals/biblequest-original-emotions-06b.json @ r1` |
| 178 | `devotional.biblequest.stress.06` | Take the next step without carrying tomorrow | `emotion.stress` | `content/v7/devotionals/biblequest-original-emotions-06b.json @ r1` |
| 179 | `devotional.biblequest.temptation.06` | Make one choice that agrees with hope | `emotion.temptation` | `content/v7/devotionals/biblequest-original-emotions-06b.json @ r1` |
| 180 | `devotional.biblequest.tiredness_weariness.06` | Turn attention toward what God has given | `emotion.tiredness_weariness` | `content/v7/devotionals/biblequest-original-emotions-06b.json @ r1` |
| 181 | `devotional.biblequest.anger.07` | Practice: Ask what faithfulness looks like now | `emotion.anger` | `content/v7/devotionals/biblequest-original-emotions-07a.json @ r1` |
| 182 | `devotional.biblequest.anxiety_worry.07` | Practice: Ask what faithfulness looks like now | `emotion.anxiety_worry` | `content/v7/devotionals/biblequest-original-emotions-07a.json @ r1` |
| 183 | `devotional.biblequest.confusion_uncertainty.07` | Practice: Turn attention toward what God has given | `emotion.confusion_uncertainty` | `content/v7/devotionals/biblequest-original-emotions-07b.json @ r1` |
| 184 | `devotional.biblequest.discouragement.07` | Practice: Let prayer interrupt the spiral | `emotion.discouragement` | `content/v7/devotionals/biblequest-original-emotions-07b.json @ r1` |
| 185 | `devotional.biblequest.doubt.07` | Practice: Take the next step without carrying tomorrow | `emotion.doubt` | `content/v7/devotionals/biblequest-original-emotions-07b.json @ r1` |
| 186 | `devotional.biblequest.excitement.07` | Practice: Let prayer interrupt the spiral | `emotion.excitement` | `content/v7/devotionals/biblequest-original-emotions-07c.json @ r1` |
| 187 | `devotional.biblequest.fear.07` | Practice: Take the next step without carrying tomorrow | `emotion.fear` | `content/v7/devotionals/biblequest-original-emotions-07a.json @ r1` |
| 188 | `devotional.biblequest.frustration.07` | Practice: Turn attention toward what God has given | `emotion.frustration` | `content/v7/devotionals/biblequest-original-emotions-07c.json @ r1` |
| 189 | `devotional.biblequest.gratitude.07` | Practice: Ask what faithfulness looks like now | `emotion.gratitude` | `content/v7/devotionals/biblequest-original-emotions-07c.json @ r1` |
| 190 | `devotional.biblequest.grief_loss.07` | Practice: Let prayer interrupt the spiral | `emotion.grief_loss` | `content/v7/devotionals/biblequest-original-emotions-07a.json @ r1` |
| 191 | `devotional.biblequest.guilt.07` | Practice: Let prayer interrupt the spiral | `emotion.guilt` | `content/v7/devotionals/biblequest-original-emotions-07a.json @ r1` |
| 192 | `devotional.biblequest.hope.07` | Practice: Turn attention toward what God has given | `emotion.hope` | `content/v7/devotionals/biblequest-original-emotions-07c.json @ r1` |
| 193 | `devotional.biblequest.hopelessness.07` | Practice: Make one choice that agrees with hope | `emotion.hopelessness` | `content/v7/devotionals/biblequest-original-emotions-07b.json @ r1` |
| 194 | `devotional.biblequest.hurt_betrayal.07` | Practice: Take the next step without carrying tomorrow | `emotion.hurt_betrayal` | `content/v7/devotionals/biblequest-original-emotions-07a.json @ r1` |
| 195 | `devotional.biblequest.impatience_waiting.07` | Practice: Ask what faithfulness looks like now | `emotion.impatience_waiting` | `content/v7/devotionals/biblequest-original-emotions-07c.json @ r1` |
| 196 | `devotional.biblequest.insecurity_unworthiness.07` | Practice: Ask what faithfulness looks like now | `emotion.insecurity_unworthiness` | `content/v7/devotionals/biblequest-original-emotions-07b.json @ r1` |
| 197 | `devotional.biblequest.jealousy_envy.07` | Practice: Take the next step without carrying tomorrow | `emotion.jealousy_envy` | `content/v7/devotionals/biblequest-original-emotions-07c.json @ r1` |
| 198 | `devotional.biblequest.joy.07` | Practice: Make one choice that agrees with hope | `emotion.joy` | `content/v7/devotionals/biblequest-original-emotions-07c.json @ r1` |
| 199 | `devotional.biblequest.loneliness.07` | Practice: Make one choice that agrees with hope | `emotion.loneliness` | `content/v7/devotionals/biblequest-original-emotions-07a.json @ r1` |
| 200 | `devotional.biblequest.love_connection.07` | Practice: Make one choice that agrees with hope | `emotion.love_connection` | `content/v7/devotionals/biblequest-original-emotions-07c.json @ r1` |
| 201 | `devotional.biblequest.numbness_emptiness.07` | Practice: Let prayer interrupt the spiral | `emotion.numbness_emptiness` | `content/v7/devotionals/biblequest-original-emotions-07c.json @ r1` |
| 202 | `devotional.biblequest.overwhelm.07` | Practice: Ask what faithfulness looks like now | `emotion.overwhelm` | `content/v7/devotionals/biblequest-original-emotions-07b.json @ r1` |
| 203 | `devotional.biblequest.peace_contentment.07` | Practice: Take the next step without carrying tomorrow | `emotion.peace_contentment` | `content/v7/devotionals/biblequest-original-emotions-07c.json @ r1` |
| 204 | `devotional.biblequest.rejection.07` | Practice: Turn attention toward what God has given | `emotion.rejection` | `content/v7/devotionals/biblequest-original-emotions-07a.json @ r1` |
| 205 | `devotional.biblequest.sadness.07` | Practice: Turn attention toward what God has given | `emotion.sadness` | `content/v7/devotionals/biblequest-original-emotions-07a.json @ r1` |
| 206 | `devotional.biblequest.shame.07` | Practice: Make one choice that agrees with hope | `emotion.shame` | `content/v7/devotionals/biblequest-original-emotions-07a.json @ r1` |
| 207 | `devotional.biblequest.spiritual_dryness_distance.07` | Practice: Let prayer interrupt the spiral | `emotion.spiritual_dryness_distance` | `content/v7/devotionals/biblequest-original-emotions-07b.json @ r1` |
| 208 | `devotional.biblequest.stress.07` | Practice: Take the next step without carrying tomorrow | `emotion.stress` | `content/v7/devotionals/biblequest-original-emotions-07b.json @ r1` |
| 209 | `devotional.biblequest.temptation.07` | Practice: Make one choice that agrees with hope | `emotion.temptation` | `content/v7/devotionals/biblequest-original-emotions-07b.json @ r1` |
| 210 | `devotional.biblequest.tiredness_weariness.07` | Practice: Turn attention toward what God has given | `emotion.tiredness_weariness` | `content/v7/devotionals/biblequest-original-emotions-07b.json @ r1` |
