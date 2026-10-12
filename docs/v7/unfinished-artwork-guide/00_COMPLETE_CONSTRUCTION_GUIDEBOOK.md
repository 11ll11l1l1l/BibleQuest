# BibleQuest V7 — Complete Unfinished Image Construction Guidebook
**Edition:** updated 2026-10-11 JST | **Branch scope:** `v7/development` | **Classification:** production art direction / QA prevention, **not** artwork approval.

> **Purpose.** Replace open-ended image prompts with an exact-ID, explicitly composed shot list. The producer chooses and creates the assigned scene, not its own generic metaphor. The QA reviewer checks produced pixels against this brief, against all existing approved and candidate files, and against Scripture/source rights before any production promotion. This book neither creates nor approves images.

> **2026-10-11 production/QA override:** [Mandatory five-agent automated QA and work ledger](../V7_AUTOMATED_IMAGE_QA_AND_LEDGER_20261011.md) supersedes the earlier producer-agent allocation, routine human image-approval step and aspirational resolution demands. Image pixels originate only in expressly invoked interactive ChatGPT chats. All five scheduled agents do QA only. Read the central ledger and open PRs before any new shot; QA FAIL deletes unapproved staged pixels, records a tombstone, and advances to the next candidate immediately. All stricter Scripture, rights, originality and exact-build gates remain mandatory.

## 0. Current owner-approved master-image and scene interpretation — 2026-10-11

**This section supersedes conflicting legacy variant-generation and exact-physical-action mandates below.** See [single CLEAN master + deterministic crop + five-role QA contract](../V7_SINGLE_MASTER_CROP_QA_CONTRACT_20261011.md) and [central ledger](../V7_AUTOMATED_IMAGE_QA_AND_LEDGER_20261011.md). The historical rows and detailed shot stories below remain **useful source-locked creative references**, but “create three separate real files per concept,” mandatory baked TYPE/THUMB and “reject unless that exact action occurred” are no longer instructions to the interactive image producer.

1. **ONE original modern scene/CLEAN per canonical content ID:** generate a unique photorealistic single-scene image, contemporary clothing/settings, appropriate central Scripture/devotional meaning. Use the chapter's specified characters/activity/camera as the preferred art direction. If another authentic everyday activity expresses the same central truth, explicitly label `THEMATIC_ALTERNATIVE` and record how visible content expresses the complete source, why the image is genuinely different from existing art, and which specific prescribed element changed. Not just the same mood. Unrelated/contradictory scenes still FAIL, and the source body or guide history must not be rewritten to hide deviation.
2. **Present CLEAN three ways without three creative generations:** (a) full source art; (b) same CLEAN with exact current localized title/reference as real accessible UI text, never generator-baked; (c) same CLEAN in fixed-ratio thumbnail box using audited `object-fit:cover` and `object-position` from per-master `focalPoint`, with optional deterministic small WebP/PNG derivative for payload/offline efficiency. The *same* source/box ratio needs no cut at all; a different box ratio changes crop. Do **not** cut up a collage or pretend one global fixed center makes every subject safe.
3. **Geometry stays family-specific:** Feeling CLEAN native >= 1024x1024 square; Need/devotional >= 768x960 portrait 4:5; Home >= 1536x864 wide 16:9. Real PNG/WebP max 10 MB, existing tolerance. Target thumb boxes historically 320x320 Feeling, 384x480 portrait, 640x360 hero. Fixed inputs + focal + output profile make a crop **deterministic**, but per-image positioning and visual browser QA remain essential. Validate 320/390/430/800 responsive windows, 100px thumbnail, translated long text, text contrast and source hash.
4. **Two distinct acceptance axes:** intrinsic source-art QA (meaning/Scripture, originality, rights, anatomy, binary) and independent **presentation QA** (crop composition, live text in all current locales, accessibility, served-byte and offline performance). Five QA-only agents inspect evidence; no user per-art gate and no agent-generated pixels. One rejected derivative/crop never triggers deletion of a valid accepted CLEAN.
5. **Mandatory migration HOLD:** legacy `scripts/v7-visual-assets-audit.mjs`, bundleStatus `complete_three_real_files`, Feeling/Need coverage and parts of the runtime still enforce stored TYPE/THUMB and may prefer baked text. This guide update **does not implement those changes**. Preserve that historical release gate until schema, runtime selection, tests, build-browser proof and exact-SHA release are migrated together. New clean-only Feeling/Need art receives `HOLD_POLICY_MIGRATION` pending integration; no fake production-ready status or deletion of existing released assets.

The chapters 01–11 remain the canonical library of **preferred** scene fingerprints and a uniqueness baseline. QA validates meaning-driven alternatives against full approved Scripture/source and keeps both the prescribed shot and accepted variation fingerprint on record.

## 1. Scope, current evidence and accounting

| Queue | Commitment | What the guide covers | Acceptance accounting |
| --- | ---: | --- | --- |
| **P1 Feeling cards** | 30 canonical concepts | All 30 checked below; reuse and finish already sound scenes first | Historical strict 9/30 three-file bundles; not a newly executed live audit |
| **P1 Needs** | Peace, Hope, Comfort, Courage, Strength | Exact reserved new scenes below and 14 later Needs | Historical 1/19 full bundles (Wisdom, not one of five launch Needs) |
| **P1 Home** | One hero | One fixed wide narrative and responsive crops | Historical 0/1 |
| **P1a legacy defects** | 13 identified files on Oct 9 | Variant-level repair work; **never** needlessly redraw approved CLEAN | #1470 Impatience TYPE since merged; #1468 Fear WebPs still awaiting merge/QA; recompute residual count from live evidence |
| **P4 standalone devotional covers** | 300 distinct ID-bound images | All **300** individually specified in chapters 01–11 | Five PNG candidates exist, still QA pending; **not** five editorially approved covers |
| **P5 expansion** | Remaining Needs, rights-clear teaching/book thematic art | Scene rules and conditional requirements; cannot invent rights-clear official book covers | Track outside launch quota |

The existing 300 devotional texts are **not** 300 accepted images. The 306 records in the source area include **300 eligible first-party** devotional IDs. Chapters 01–11 contain 30 + 30 + 30 + 30 + 24 + 30 + 30 + 30 + 30 + 30 + 6 = **300 story directions**, keyed by exact source ID and revision. The five covered source-PNG candidates are not classified as accepted merely by having a matching scene. Never count docs/briefs as generated bytes.

Authoritative sources: `docs/v7/V7_PRIORITIZED_MILESTONES_20261010.md`, `V7_EIGHT_STREAM_ARTWORK_EXECUTION_20261009.md`, `V7_IMAGE_FIRST_AND_PARALLEL_LANES_20261008.md`, `V7_VISUAL_ASSET_PRODUCTION_20261008.md`, `data/v7/visual-assets/README.md`, `src/features/library/emotion-taxonomy.js`, `content/v7/devotionals/**`, and exact-head audit tools. A status snapshot in this book never outranks live branch bytes and reviewer evidence.

## 2. Nonnegotiable design language

**Technical medium:** Final art MUST be true high-resolution raster **WebP or PNG**, not SVG, raster-inside-SVG wrappers, tiny contact-sheet crops, renamed extensions, rendered UI screenshots, or a generated collection grid. Keep an editable high-resolution intermediate internally if needed; only hash and publish the actual independently retrievable output images. No external fonts/scripts/network references in image payloads.

**Image families and geometry:** Feeling CLEAN 1:1 **at least 1024×1024**; Need and devotional CLEAN 4:5 **at least 768×960**, preferably 1024×1280 when natively available; Home hero CLEAN 16:9 at **least 1536×864** (native crop where necessary; 1920×1080 optional) with enough detail for responsive 2:1 crop; teaching thematic art 16:9; any rights-clear book *thematic* art 2:3. Target ratios are design targets; actual app geometry must determine exported TYPE/THUMB aspect and the verified source dimensions. Never stretch or rescale a flat tiny render as supposed high-resolution art. Legacy valid raster assets can remain and be backfilled rather than discarded solely for being smaller.

**Historical V2 required three-file concept (kept below for migration/legacy release compatibility) had:** (a) **CLEAN**, original fully text-free scene; (b) **TYPE**, independently raster-composited typography on the approved scene, using exact canonical EN taxonomy title and a **context-reviewed reference-only** Bible reference unless a separately licensed exact quote is explicitly cleared; (c) **THUMB**, separately exported, intentionally focused **text-free** crop. All 3 have distinct *real files*, not three URLs to one source; actual SHA-256, byte count, format, geometry, rights, provenance, alt/decorative state, local title-safe region, and crop focal points.

**Text rule:** Image generators do not draw words, Scripture, Bible references, signs, notes, graphic UI, numerals, watermarks, or logos on CLEAN or THUMB. A separately typeset TYPE must bind to exact current `src/features/library/emotion-taxonomy.js` label and one listed reference, exact locale, Git blob SHA and reviewed meaning. Bible quotations are excluded by default. In app, TL/CEB/ILO always use CLEAN + live translated text until a separately verified exact-locale TYPE is independently accepted. Never expose baked English TYPE as translated artwork. Long Bible passages, buttons, durations and accessible reading text stay live.

**Premium visual system:** contemporary cinematic editorial photography, authentic skin/hands/rooms and subtle social context, observational expressions, varied ages/backgrounds, believable East/Southeast Asian and global everyday settings, dignity over spectacle. Avoid vector clip-art, glossy template stock, strong beauty retouch, blue/orange filter applied to every card, identical high-contrast silhouettes, staged public suffering, sensational religious displays, celebrities and copied third-party brand artwork. Images should communicate **one concrete moment in the source**, not generic “hope = sun”, “sad = rain”, “Christian = glowing Bible”.

**Safety/content:** no implied guaranteed physical/mental cure, suicide/self-harm depiction, visible injury, coercion or abuse romanticized as “forgiveness”, forced reconciliation of unsafe relationships, sacred figures portrayed as contemporary ordinary characters, identifiable real patient data, minors in peril, sexualized temptation, discriminatory stereotypes, or misleading promises presented as Scripture. A hard narrative conflict is a rejection, not an “art style disagreement”.

## 3. The anti-rejection production gate (all images, each variant)

**G0 — Identity/rights lock, before any image call.** Resolve canonical `contentType:id`, source file, source SHA/checksum and revision. Read the **entire actual devotional body** (not just title or taxonomy); for a Feeling/Need read exact current label, all listed references and the surrounding Bible context. Check open PRs plus all accepted, candidate and rejected image sidecars. If the shot is already under active ownership, do not create a rival. If text/rights are not verifiable, place a hold rather than invent them.

**G1 — Preapproved shot.** Use this book's exact narrative, action, setting, actors, lighting and negative exclusions. For completed sound CLEAN imagery, freeze scene and create only missing derivatives/QA evidence. Artist changes require an explicit `sceneRevision`, written reason and distinct alternative fingerprint; never silently substitute a mountain, empty road, sunset, open Bible, prayer hands, or some other remembered “previous definition”. Treat all prior rejected visual hashes as quarantined.

**G2 — Novelty registration before generation.** Save fingerprint fields `{contentId, narrativeAction, setting, focalObject, peopleCount, perspective, light, palette, metaphor, sourceRevision}`. Compare to every approved **and in-flight** asset, all other source briefs, and prior failed concepts. Reject scene-level duplication of the same main action + setting, or near-identical layout/casting/light/object even when ID/title changes. Target at least **three materially distinct axes** (action, setting, people count, focal object, viewpoint, light) relative to nearest image; three distinct axes is a **preflight heuristic, not automatic proof** of novelty. Check perceptual similarities and visually inspect paired contact comparisons; near matches fail regardless of binary hash difference.

**G3 — Produce one scene, not a collage.** Prompt the image tool to create ONE original 4:5, 1:1, or 16:9 composition, with no text/UI. Demand a photographic result with physiologically plausible human faces/hands, natural materials and a **reserved quiet title region**. No “10-up”, grids, marketing deck, app mockups, false chapter labels or baked Scripture. At image completion inspect the **actual source pixels** before moving to TYPE or THUMB. If it looks like the wrong topic or looks like a prior approved scene, immediately reject at this stage.

**G4 — Legacy V2 variant export and typography (only while old bundle release validator remains binding).** After accepted CLEAN, compose one TYPE from the **exact approved text and allowed reference**, using professional raster typesetting with licensed fonts, documented locale and source blob. Use no small floating lettering in the 10% edge margin. Export focal THUMB independently, not simply shrinking CLEAN. Keep **at least 10% meaningful-content and TYPE-title safety** from all sides unless device screenshots empirically prove more conservative constraints. Keep lower 30–35% or designated side visually quiet for live titles; no face/primary action in the planned overlay region.

**G5 — Actual proof.** Decode every committed file and measure native pixels, ratio, bytes, SHA-256 and Git blob; 320/390/430 CSS-pixel device review (100px for Feeling/THUMB), plus 800 tablet and 200% live text; verify no clipping, pseudo-letters, distorted face/hand, duplicated scene, accidental insignia, fake official cover or deceptive religious symbol. Compare TYPE text **character by character** to exact taxonomy/Scripture revision, and review surrounding passage meaning (speaker, addressee, condition, scope, historical setting). Confirm rights to image, typography and source wording separately.

**G6 — Independent sign-off and deployment identity.** Producer self-inspection never equals independent QA. Independent visual/content reviewer records distinct outcomes for originality, scene meaning, Scripture context, typography, source rights and device pixel quality. Run exact-head canonical binary registry audit and the built-app Chromium served-byte SHA/crop checks; keep proof links and exact commit. D alone certifies full exact-SHA integration and final production. A green source-level script or `production_ready` string without proof is NOT authorization to publish.

**Failure routing:** text mistake → re-export TYPE only; crop error → regenerate THUMB only; safe-area defect → replace TYPE/THUMB only as appropriate; rights/meaning/duplicate/uncanny-source failure → source scene REJECTED and regenerate a substantially different CLEAN; stale checksum → refresh complete source brief before any image. No QA flags may be toggled to bypass rejection. Use the supported accessible CLEAN + live-text fallback until acceptance.

## 4. Executable generation prompt template

> Create **one** high-resolution original photorealistic cinematic editorial still image for **BibleQuest V7**, asset ID `{assetId}`, content `{contentId}`, exact source title `{title}` and revision `{sourceRevision}`. Follow this **required observable story without reinterpretation**: `{shot.scene}`. Show `{shot.actors}` doing `{shot.action}` in `{shot.setting}`; the person’s visible posture and objects must communicate `{themeSpecificMeaning}` rather than a generic feeling. Use `{shot.camera}`, `{shot.lighting}`, believable material/hand anatomy, natural restrained expression and the planned `{shot.textSafeRegion}` quiet space. Compose at `{familyAspect}`, final raster target `{familyDimensions}`; preserve sufficient framing for a separate crop. The final generated CLEAN image contains **no** captions, text, Scripture, references, book-page writing, fake signage, UI, icons, borders, logos, signatures or watermarks. Do not reproduce any known rejected scene, existing approved image, aesthetic of another app or visible public figure. No mountains/sunrise hikers as generic replacement. Render only this complete single image.

**TYPE is a separate deterministic design operation**, never part of the generation prompt. **THUMB is a separate crop/export operation** after both scene and focal position are confirmed. A rejected source MUST NOT be rescued by adding decorative type or a new file name.

## 5. P1 Feelings: unique concepts and exact remaining action

Statuses below are **2026-10-10 record/PR snapshot**, not a fresh execution of the full canonical audit. “Triple” means 3 listed real variant entries on a production-ready record, still subject to independent art/built-app verification. “CLEAN retained” means **do not** recreate it.

| Feeling (canonical art key) | Art producer | Required next work / scene lock |
| --- | --- | --- |
| anxiety_worry | Manual Y | CLEAN retained; repair quarantined THUMB derivative; TYPE evidence and cross-locale fallback; do not redraw anxiety master |
| fear | Manual Y | CLEAN retained; 2 real TYPE/THUMB WebPs proposed #1468; **pending PR/independent QA**, do not re-export a second competing pair |
| sadness | Producer 1 | Triple production record exists; QA/crop/source and exact-run evidence only |
| grief_loss | Producer 1 | Triple candidate pending; evaluate original-source provenance before accepting; if source fails, use **one adult folding an old scarf beside a coat hook**, not prior generic hikers |
| loneliness | Producer 1 | Triple production record exists; maintain current approved scene, no redundant re-generation |
| anger | Producer 1 | **Missing merged master**; original scene: two neighbors at a community sports-club equipment shed after disagreement, one deliberately releasing a tightly gripped towel while the other speaks; no violence |
| hurt_betrayal | Manual Y | CLEAN retained; invalid TYPE+THUMB embedded-raster SVG derivatives; replace only those as genuine WebPs and certify |
| rejection | Manual Y | CLEAN retained; invalid TYPE+THUMB derivatives; no new excluded/sad-person stock scene |
| guilt | Manual Y | Triple production record exists; old derivative sidecar must be reconciled without overwriting verified bytes |
| shame | Producer 2 | Triple production record exists; verify intentional text region and exact reference |
| insecurity_unworthiness | Producer 2 | **Missing merged master**; the existing PR #1423 has rejected specific TYPE pixels; if source also fails novelty, new visual: learner joining a community orchestra rehearsal with their own instrument, no mirror/podium scene |
| doubt | Producer 2 | **Missing merged master**; own PR #1439 has rejected TYPE safe-area pixels; if CLEAN valid, keep it; otherwise a thoughtful adult asking a museum archive volunteer about two unmarked historical objects, no forked path |
| confusion_uncertainty | Manual X (legacy Agent 3 already done) | Triple production record exists; use existing layout, exact revision and only QA as necessary |
| discouragement | Manual X (legacy Agent 3 already done) | Triple production record exists; preserve art and complete exact release proofs |
| hopelessness | Manual X (legacy Agent 3 already done) | Triple production record exists; preserve art and complete exact release proofs |
| overwhelm | Manual X | **Missing merged master**; a school-festival organizer delegates coiled extension cables and folding chairs to colleagues in a safe community hall; not one overloaded mother surrounded by laundry |
| stress | Manual X | **Missing merged master**; a busy cafeteria cook takes a controlled breath at a safe service-pass counter while a colleague continues work; no train-platform blur |
| tiredness_weariness | Manual X | **Missing merged master**; a night-shift baker rests on a stable stool after work in a flour-dusted empty bakery at dawn; no collapse or hospital logo |
| spiritual_dryness_distance | Manual Y | CLEAN retained; replace invalid TYPE+THUMB embedded-raster SVG candidates, remove stray heading |
| temptation | Manual Y | CLEAN retained; corrected TYPE candidate still invalid embedded-raster SVG; re-export TYPE only after text/source checks |
| impatience_waiting | Manual Y | Existing TYPE layout corrected in merged #1470; verify independent browser/served SHA before counting, keep CLEAN/THUMB |
| jealousy_envy | Producer 4 | Triple candidate pending; QA the revised TYPE without new source if CLEAN is sound |
| frustration | Producer 4 | **Missing merged master**; new original: potter pauses a collapsing clay vessel, sets down the cutting wire and reconsiders support, no bike chain or generic failed gear |
| numbness_emptiness | Producer 4 | **Missing merged master**, own birthday-scene PR candidate pending; reject forced smiling/social caricature if inconsistent, else keep and audit; alternative an expressionless worker pauses amid an otherwise lively shared lunchroom |
| joy | Manual Y | CLEAN retained; replace TYPE+THUMB SVG-internal-raster derivatives with true independent rasters |
| gratitude | Manual Y | CLEAN retained; reconcile derivative-candidate sidecar and independent QA before declaring complete, avoid regenerating good master |
| peace_contentment | Producer 5 | Triple SVG candidate requires actual photorealism, rights and browser pixel approval; raster-source image preferable, no cookie-cutter sunset |
| hope | Producer 5 | Triple SVG candidate pending; existing Hopeful TYPE SHA-rejected; DO NOT copy the Need Hope planting scene |
| excitement | Producer 5 | Triple production record exists; preserve genuine files and verify suitability |
| love_connection | Producer 5 | Triple production record exists; preserve genuine files and verify suitability |

**Canonical IDs differ from some asset slugs** (for example `anxiety_worry → anxious`, `anger → angry`, `doubt → doubtful`, `hope → hopeful`, `joy → joyful`). The runtime taxonomy and asset registry decide exact lookup identity, not artist-invented synonyms. **No new asset for an already completed source solely because it lacks localized baked TYPE.** Localized live text remains authoritative.

## 6. P1 + P5 Needs: fixed nonoverlapping scenes and reference guardrails

**Launch priority:** Peace, Hope, Comfort, Courage, Strength (all five individually required), then other Needs. `wisdom` already has one merged three-variant record but should not be used to substitute for a missing launch Need. Canonical English TYPE and references are read from the taxonomy at time of export, never hardcoded based on these examples.

| Need | Owner | Exact recommended scene; differentiation safeguard |
| --- | --- | --- |
| **peace — P1** | Agent 1 | At a crowded housing-office waiting room, an adult steadies their breath and calmly listens to a child's question; settled presence **amid noise**, not a bare tea cup or empty sea |
| **hope — P1** | Agent 2 | Neighbors fit the last timber slat into a repaired public bus shelter after rough weather; visible useful future, **NO gardener/seedling**, which collided with Hopeful art |
| **comfort — P1** | Manual X | In an ordinary evening community center after difficult news, a close friend pulls up a chair and sits attentively beside another adult; no forced embrace, cure promise, or flat vector window scene |
| **courage — P1** | Agent 4 | An anxious adult steps into a modest neighborhood adult-learning workshop, safety gear properly worn, ready to try a first task; no cliff or heroic warrior pose |
| **strength — P1** | Agent 5 | Three community members stabilize a heavy wooden door on a repair jig so a fourth can align hinges; realistic coordinated hands, not the earlier garden planter lifting image |
| wisdom — existing | Agent 1 | Existing approved CLEAN/TYPE/THUMB record takes precedence; **do not** recreate a second intergenerational kitchen talk scene |
| guidance | Agent 2 | A local volunteer shows an unmarked transit map to a traveler at a covered bus terminal, pointing out one clear safe next step; no woodland fork |
| forgiveness | Manual X | A neighbor who harmed another's belongings arrives with a repaired plain household lamp at a front entry; uncertain response and honest responsibility, **not** an instant hug |
| grace_identity | Agent 4 | A newcomer is invited to take an open seat at a small printmaking studio worktable; belonging through respectful inclusion, no written self-worth quotes |
| healing | Agent 5 | An adult carefully mends a family heirloom quilt alongside a trusted sibling at home; symbolic gradual repair, no unsupported bodily cure claim |
| rest | Agent 1 | After an ordinary late shift, a tired restaurant worker rests naturally on a covered home porch while evening light falls across work shoes; **not** the rejected low-detail SVG hammock/rest mockup |
| renewal | Agent 2 | A renter restores a worn wooden hallway bench using sandpaper and fresh natural oil in a small breezy workspace; new function, not repainted windowsill |
| patience | Manual X | A bakery apprentice observes proofing dough from outside an oven and chooses not to open the door prematurely; distinct from repeated seedling/sunrise |
| perseverance | Agent 4 | An older quiltmaker steadily stitches another segment of a large community quilt across several visible panels; continuation rather than runner-in-drizzle |
| connection | Agent 5 | Intergenerational neighbors exchange tools while repairing a small bicycle at a local repair café, true dialogue not another communal garden |
| self_control | Agent 1 | Before sending a difficult reply, an adult closes the unlit laptop and takes a brief pause beside an everyday kitchen sink; no fake screen text |
| encouragement | Agent 2 | An experienced chess-club volunteer calmly reassures a beginner after a lost match, pointing to a blank wooden board; not a repeat 5K finish line |
| trust | Manual X | A new apprentice hands a fragile clean glass component to a patient mentor at a safe craft bench, watching the handoff; no dangerous creek crossing |
| celebration | Agent 4 | A small group of repair volunteers smile over a restored vintage radio in a workshop, modest shared achievement not a repeat family dinner |

**Reference sanity checks, not final Scripture approval:** Peace has `John 14:27`; Hope `Romans 15:13`; Comfort taxonomy lists `2 Corinthians 1:3-4` and `Psalm 23:4`; Courage `Joshua 1:9`; Strength `Isaiah 40:31`. Notably the **draft Comfort PR #1480 says `Matthew 11:28`**, which belongs to another theme and is **not a listed Comfort taxonomy reference** in the checked source. Do not approve its current TYPE as compliant without correcting source binding and re-QA. Verse meaning is reviewed in context, not merely by matching the numeric reference.

## 7. Exactly one Home hero — fixed hero direction

**ID target:** `hero:home`, stable unique asset ID only after live registry collision check. **Scene:** real first-party contemporary neighborhood learning/community hall in late-afternoon ordinary light, viewed wide from inside. Foreground: one adult and a school-age child entering side by side with their own bags, comfortable and safe; midground: two diverse adults helping at a shared reading/project table, the action of **continuing together** visible without staged worship or text. The corridor gives natural left-to-right forward movement; the **left 36–40%** of the frame stays relatively quiet for a live hero headline and Start/Continue action; no face, important hands, or primary task on that side. Camera waist height, restrained 35mm documentary perspective; natural amber/neutral light without golden halo, accurate skin tones, believable architecture and accessibility. One original continuous photographic scene, **not** an app UI mockup, dashboard, mountain overlook, floating Bible, wallpaper, graphic collage or vector illustration.

Export CLEAN 16:9 real raster **at least 1536×864** (1920×1080 optional when genuine native pixels exist), responsive focal-aware portrait/2:1 THUMB adapted to actual widget, and TYPE **only** if the exact current Home headline/locale has a verifiable source identity and is needed for that surface. Prefer CLEAN + accessible live localizable title/CTA; no invented Home verse. QA at 320/390/430/800 and reduced-motion/static; typography/call to action remains semantic UI. This is **one** release hero asset; do not submit multiple competing heroes to inflate count.

## 8. P1a exact derivative-repair queue (snapshot, deduplicate against merged PRs)

| Asset | Bad file(s), Oct 9 evidence | Remedy, no scene replacement |
| --- | --- | --- |
| Fear | TYPE and THUMB (2) | #1468 contains actual WebP replacements but is unmerged and independent/browser QA pending; verify same hashes/current head before promoting |
| Joy | TYPE and THUMB (2) | render real high-res WebPs from preserved clean image, not a `data:image/webp` SVG wrapper |
| Anxiety/worry | THUMB (1) | original focal-aware raster crop from retained CLEAN; TYPE subject/source check separately |
| Hurt/betrayal | TYPE and THUMB (2) | replace embedded-raster SVGs; preserve legitimate master |
| Rejection | TYPE and THUMB (2) | ditto; keep current imagery and adjust crops only |
| Spiritual dryness | TYPE and THUMB (2) | ditto, plus ensure no accidental second heading |
| Temptation | corrected TYPE (1) | actual raster English label/reference, no old wrong pointer |
| Impatience/waiting | TYPE (1) | corrected real WebP merged in #1470, **still independent QA/exact-head publish proof required** |

Total **historically 13** bad derivative files. The **remaining** number after #1470, #1468 and any later merges must be mechanically reconciled by unique `contentType:contentId:variant` rather than assumed as 13 again. Run `scripts/v7-visual-candidate-policy.mjs` reject SHA guard and the regular audit. Never republish the unsafe SVG bytes or relabel an old SHA to production-ready.

## 9. All 300 devotional images — page-by-page exact shot lists

Each chapter's `### devotional.biblequest.<emotion>.<sequence>` section is an **independent image assignment** specifying canonical ID, exact title/source revision/checksum (or source-body anchor for inherited briefs), explicit observable scene, camera, lighting, safe-zone and collision rule. Source references are not instructions to draw Bible figures or words. **Read the complete body for sets 01–02 before production**, as these inherited records carry a shorter body anchor. For 03–11, the full source body is present in the respective page.

| Sequence | Entries | Scene guide |
| --- | ---: | --- |
| 01 — first narrative | 30 | [01-first-story-shots.md](01-first-story-shots.md) |
| 02 — second narrative | 30 | [02-second-story-shots.md](02-second-story-shots.md) — originated in unmerged #1471, rebase/reconcile first |
| 03 — third narrative | 30 | [03-third-narrative-shots.md](03-third-narrative-shots.md) |
| 04 — pray / seek wisdom | 30 | [04-prayer-wisdom-shots.md](04-prayer-wisdom-shots.md) |
| 05 — next hour | 24 | [05-next-hour-action-shots.md](05-next-hour-action-shots.md) |
| 06 — action patterns | 30 | [06-faithful-action-shots.md](06-faithful-action-shots.md) |
| 07 — private practice | 30 | [07-reflection-practice-shots.md](07-reflection-practice-shots.md) |
| 08 — personal prayer | 30 | [08-prayer-moments-shots.md](08-prayer-moments-shots.md) |
| 09 — respectful sharing | 30 | [09-trustworthy-sharing-shots.md](09-trustworthy-sharing-shots.md) |
| 10 — remembrance cues | 30 | [10-remembrance-cue-shots.md](10-remembrance-cue-shots.md) |
| 11 — source-specific backfills | 6 | [11-original-backfill-shots.md](11-original-backfill-shots.md) |
| **Total** | **300** | **300 different content-ID slots, not 300 approved binaries** |

**Cover output:** each P4 target needs at minimum one standalone, original **4:5, `>=768×960`** encoded portrait CLEAN with verified source ID/revision, SHA-256, bytes and rights. Prefer native 1024×1280 when available; do not reject good 768×960 source solely because the generator cannot yield 1536×1920. TYPE/THUMB are optional enhancements **for the base P4 300-CLEAN count**, counted separately and never faked. Do not register a Feeling illustration repurposed for a devotional as a distinct P4 cover.

**Existing source-bound candidates** from #1476: `devotional.biblequest.anxiety_worry.01`, `fear.01`, `sadness.01`, `grief_loss.01`, `loneliness.01`. Their PNGs and sidecars are **candidate_qa_pending**; compare actual pixels to chapter 01 before any acceptance or regeneration. A failed source means a new explicitly differentiated scene revision, not just re-exporting the same crop.

**Repetitive source caveat:** later content records reuse titles and practice sentences. Story specificity therefore comes from the **full source plus associated canonical emotion**, the practice type and this prescribed lived moment; the art must never claim the devotional includes a fictional human narrative or divine promise. If a pictured action is outside the source's actual permissible meaning, the independent reviewer must reject/change the brief rather than pretend that matching IDs or taxonomy is semantic proof.

## 10. P5 teaching/book art and optional expansion

The five first-party Past Teachings can receive **one original 16:9 thematic** scene each only after verifying exact teaching ID, full text and rights in `data/v7/past-teachings/**` or its canonical referenced content source. Avoid invented portraits of pastors or real speakers, misleading historic events and pseudo-biblical quotes. The eight external-link-only book catalog entries are **not** licensed official-cover reproduction targets: either leave the book cover absent/text-first, or use clearly labeled, original **2:3 thematic artwork** only when the Library design requires it. Do **not** promise a new count or assign fictional books without a fresh source inventory. These are conditional extra tasks, not part of P1 or P4 acceptance numerators.

## 11. Per-asset record and approval checklist

No producer can claim QA by filling checkboxes. Five distinct scheduled QA roles record independently observable evidence in the central ledger; human image approval is not required. The existing strict rights/Scripture and release evidence gates remain enforced.

```text
assetId / contentType / canonicalContentId / owner / sourcePath / sourceRevision / sourceChecksum
sceneBriefId / sceneRevision / action / setting / peopleCount / perspective / focalObject / lighting
CLEAN: path, mime, decoded width×height, bytes, SHA-256, Git blob, rights evidence
TYPE: own path/hash/bytes/size, exact locale+embeddedWording, source-taxonomy blob,
      approved reference, actual typography/pixel/context review
THUMB: own path/hash/bytes/size, normalized focalPoint/crop, no text and 100px inspection
Rights: generated-original provenance, font rights, text rights, distribution/attribution
Pixel QA: anatomy, scene-specific relevance, no incidental lettering, edge margin,
          uniqueness pair comparison, 320/390/430 and tablet screenshots
Technical QA: exact branch SHA, strict audit, emitted manifest, built HTTP served bytes
Independent decision: accept / correct specified variant / reject source / hold rights
Release: exact integrated SHA, Cloudflare deployed identity and rollback readiness
```

**One failed rule = no promotion.** The guide’s descriptions are **preflight controls**, not absolute guarantees that a nondeterministic image-generation model will comply. Final independent agent pixel-level/contextual review stays mandatory; HOLD inaccessible pixels rather than guessing, and immediately review the next asset. Preserve original approved CLEANs and mark all drafted, incomplete or rejected images accurately.

## 12. Routing and sequence to minimize wasted renders

1. Refresh exact-head registry and **existing open PR claims**, identify missing variants, do not double count.
2. Complete independent QA for existing 9 triple Feeling records and approved Wisdom, subject to current live proofs. Resolve invalid/unsafe TYPE/THUMB legacy items without restarting CLEAN.
3. Generate/repair remaining **P1 8 absent merged Feeling masters**, 5 launch Needs and **one** Home hero according to the fixed per-ID shots.
4. Independently certify core launch image/UX/Scripture/privacy gates before Lane D release; P4 covers continue separately and cannot falsify the P3 release barrier.
5. Lane Z works through [chapters 01–11](01-first-story-shots.md) by unique content ID, first checking existing five QA-pending candidates. Generate one real CLEAN per eligible ID, collect hashes and pixel evidence, then consider variants. Needs 6–19 and optional teaching/book thematic scenes remain P5 and must not displace critical path.

**Guarded authority:** Lane A image records and assets; X missing special slots; Y exact older variants; Z dedicated devotional covers; scheduled producers handle their own disjoint Feeling/Need sets; five independent QA-only agents own visual QA and may each PASS their own check (all five required); no QA agent generates imagery; B checks Scripture/rights/publication; D verifies and releases exact built artifact. Draft docs may be merged into `v7/development` without granting themselves asset publication authority.
