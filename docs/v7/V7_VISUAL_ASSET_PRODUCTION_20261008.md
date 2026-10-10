# BibleQuest V7 Visual Asset Production System

> **HISTORICAL PRODUCER CONTRACT — OVERRIDDEN 2026-10-11:** Every instruction below directing scheduled agents to generate/regenerate/repair images is revoked. All agent runs now perform only QA. A user-invoked interactive ChatGPT chat is the sole source of new/revised image pixels, per [manual-chat-only artwork policy](V7_MANUAL_CHAT_ARTWORK_ONLY_20261011.md). All unchanged quality, technical, Scripture and rights requirements remain in force.


Updated: 2026-10-08 JST
Status: ACTIVE — production contract for the five V7 image agents
Parent UI authority: `docs/v7/V7_UI_UX_RELEASE_REQUIREMENTS_20261008.md`
Creative direction reference for unfilled Feeling/Need scenes: `docs/v7/V7_IMAGE_GENERATION_SCENE_BRIEFS_20261008.md` (source-of-ideas only; check live records and exact taxonomy first; no production artwork implied).

## Purpose

Create a large, coherent, production-usable visual library for BibleQuest V7 without turning the app into a collage of unrelated AI images. The five scheduled agents each generate exactly one new high-quality asset per run, self-QA it, add it to the repository, and write a machine-readable sidecar record so every image can be identified, audited, searched, replaced and wired into the UI.

The agents work directly from live `v7/development`. They may only touch their new uniquely named image file and its uniquely named metadata record. They must not rewrite shared manifests, app code, release status, devotionals, translations, or another agent's files.

## Global visual direction

BibleQuest V7 uses **cinematic editorial realism with quiet spiritual warmth**.

The visual language should feel:
- human, contemporary, calm, premium and trustworthy;
- photographic rather than icon-like for content discovery;
- emotionally specific without melodrama;
- inclusive across ages, genders and Asian/global contexts without tokenism;
- spiritual through atmosphere, meaning and human experience rather than constant church imagery;
- suitable for a mature Bible app, but original to BibleQuest rather than copying YouVersion or any other product.

### Preferred image qualities

- Natural or believable available light.
- Realistic skin, hands, eyes, fabrics and environments.
- Restrained depth of field; subject remains readable at card size.
- Natural color grade: warm neutrals, soft daylight, muted earth, blue/teal and restrained gold.
- One dominant visual idea per image.
- Authentic everyday settings: home, commute, work, family, solitude, outdoors, study, waiting, recovery, celebration, friendship and prayer.
- Symbolic nature/detail imagery is allowed when a human scene would feel forced.
- Favor emotional subtlety: a worried person by a window is better than exaggerated crying; hope can be morning light rather than a literal cross.

### Prohibited / avoid

- No baked-in titles, captions, Bible verses, typography or UI.
- No watermarks, signatures, brand marks, product logos or recognizable copyrighted characters.
- No imitation of YouVersion artwork, another app's branded art direction, or a living artist.
- No celebrity/public-figure likeness.
- Avoid repetitive Christian stock clichés: glowing Bible on every card, praying hands on every card, church silhouettes, cross imagery on unrelated topics.
- Avoid horror, graphic injury, sexualized imagery, political propaganda and emotionally manipulative suffering.
- Avoid uncanny anatomy, malformed hands/faces, floating objects, fake text and pseudo-logos.
- Do not use generated art as an "official cover" for a third-party book. Use `visualRole: thematic_art` unless BibleQuest owns or has rights to the actual cover.

## Surface families and aspect ratios

### 1. Feeling / emotion carousel
Use: horizontal swipe selector for "How are you feeling?"
Master aspect: **1:1**.
Target presentation: 88–132 CSS px tiles, horizontally scrollable.
Composition: one unmistakable emotional metaphor or human moment; strong central/upper focal point; low clutter; readable at thumbnail size.
Text: emotion label is live UI below/over the tile, never inside the image.

### 2. Devotional cards
Use: horizontally swipeable plans/cards and Library grids.
Master aspect: **4:5 portrait**.
Composition: clear subject; reserve a visually quiet lower 30–35% or one side for a live gradient/text layer; safe crop around the main subject.
Text: title/topic/duration/progress are live UI, not rasterized.
Default visual role: `devotional_cover`.

### 3. Home / featured hero
Master aspect: **16:9**.
Composition: wide environmental scene; safe region for live headline/CTA; focal point must survive 16:9 → ~2:1 responsive crop.
Default visual role: `hero`.

### 4. Past Teaching / series card
Master aspect: **16:9**.
Use speaker/teaching/series imagery only when rights are clear; otherwise generate original thematic editorial art.
Default visual role: `teaching_art`.

### 5. Books
If an official cover is not owned/licensed, do not fabricate one. Generate **2:3 thematic art** and label it `visualRole: thematic_art`. The UI must distinguish thematic art from an official cover.

## Cropping and text-safe rules

- Keep meaningful content at least 10% away from all edges.
- Record `focalPoint` as normalized x/y coordinates.
- Record `textSafeRegion` as one of: `bottom`, `left`, `right`, `top`, `none`.
- For cards that will carry live overlay text, ensure the safe region has low visual complexity.
- The image itself does not need to guarantee text contrast. The UI supplies a tested scrim/gradient. However, avoid placing faces or the primary focal subject in the intended text-safe region.

## Production format

Repository path:
`public/v7/images/<family>/<asset-id>.webp`

Metadata path:
`data/v7/visual-assets/records/<asset-id>.json`

Use production WebP when conversion is available. Recommended longest edge: 1536 px for card assets and 1920 px for hero/teaching assets. Use visually high quality while targeting approximately <= 500 KB per ordinary card asset and <= 850 KB per hero. Never destroy quality just to meet the target; record actual bytes.

If the image tool only returns PNG/JPEG and conversion is not available, commit the high-quality source as PNG/JPEG and record the real format. Do not falsely claim WebP.

## Asset ID

`bqv7-<family>-<concept-slug>-<NN>`

Examples:
- `bqv7-emotion-anxiety-worry-01`
- `bqv7-devotional-waiting-with-hope-01`
- `bqv7-hero-continue-your-journey-01`

Never overwrite an existing asset ID. A materially different retry increments `NN`.

## Metadata sidecar contract

Every image must have one JSON sidecar:

```json
{
  "schemaVersion": 1,
  "assetId": "bqv7-emotion-anxiety-worry-01",
  "agentId": "visual-agent-1",
  "createdAt": "2026-10-08T09:00:00+09:00",
  "status": "production_ready",
  "imagePath": "/v7/images/emotion/bqv7-emotion-anxiety-worry-01.webp",
  "family": "emotion",
  "visualRole": "emotion_tile",
  "contentType": "emotion",
  "contentId": "anxiety_worry",
  "concept": "quiet anxiety before surrender",
  "usage": ["feelings_carousel", "devotional_discovery"],
  "format": "webp",
  "width": 1536,
  "height": 1536,
  "aspectRatio": "1:1",
  "fileBytes": 0,
  "sha256": "",
  "focalPoint": {"x": 0.52, "y": 0.42},
  "textSafeRegion": "bottom",
  "generation": {
    "provider": "OpenAI image generation",
    "prompt": "...",
    "notes": "original generated asset; no third-party artwork"
  },
  "rights": {
    "sourceType": "generated",
    "thirdPartyAsset": false,
    "attributionRequired": false,
    "notes": "Original generated visual for BibleQuest."
  },
  "accessibility": {
    "decorative": false,
    "altText": "A person sitting quietly beside a rainy window, hands relaxed, reflecting in soft morning light."
  },
  "qc": {
    "noBakedText": true,
    "noLogo": true,
    "anatomyAcceptable": true,
    "subjectReadableAtThumbnail": true,
    "cropSafe": true,
    "matchesVisualSystem": true,
    "duplicateChecked": true
  }
}
```

Record actual dimensions, bytes and SHA-256 when tools make those values available. Do not fabricate fields. If a value cannot be measured, use `null`.

## Self-QA gate

An agent must reject and regenerate before commit if any hard failure is present:
- visible fake text, logo or watermark;
- obvious anatomy defect;
- duplicated or near-duplicated existing asset;
- image communicates the wrong emotion/topic;
- composition cannot survive its intended crop;
- subject is unreadable at card size;
- image clashes strongly with the visual system;
- third-party rights are unclear.

The agent may adjust the prompt and regenerate during the same run. Only one final accepted image is committed per run.

## Five-agent partition

### visual-agent-1 — Distress / fear
Initial emotion queue:
`anxiety_worry`, `fear`, `sadness`, `grief_loss`, `loneliness`, `anger`.

### visual-agent-2 — Relational wounds / self-worth
Initial emotion queue:
`hurt_betrayal`, `rejection`, `guilt`, `shame`, `insecurity_unworthiness`, `doubt`.

### visual-agent-3 — Uncertainty / pressure
Initial emotion queue:
`confusion_uncertainty`, `discouragement`, `hopelessness`, `overwhelm`, `stress`, `tiredness_weariness`.

### visual-agent-4 — Spiritual struggle / waiting
Initial emotion queue:
`spiritual_dryness_distance`, `temptation`, `impatience_waiting`, `jealousy_envy`, `frustration`, `numbness_emptiness`.

### visual-agent-5 — Positive / restorative
Initial emotion queue:
`joy`, `gratitude`, `peace_contentment`, `hope`, `excitement`, `love_connection`.

After each agent completes all six initial emotion tiles, it moves to V7 content coverage. It scans current release-ready devotional records and claims the first item without a suitable visual whose zero-based sorted index modulo 5 equals the agent number minus one. When devotional coverage is sufficient, the same partition applies to Past Teachings, thematic book art, then Home/featured discovery imagery.

## Continuous-work rule

Every scheduled run:
1. read this contract and the current visual asset records;
2. choose the next unfilled assignment in that agent's partition;
3. generate one high-quality image;
4. self-QA; regenerate if needed;
5. convert/optimize if available;
6. commit the image plus unique metadata sidecar to live `v7/development`;
7. if the branch moved, refresh and rebuild the commit safely; never overwrite newer work;
8. report asset ID, concept, paths, dimensions/bytes if known, and commit SHA.

Never spend a run only re-planning when an eligible image remains. Never generate a duplicate just to satisfy the schedule. If full coverage is reached, identify the lowest-quality or least-versatile production-ready asset in the agent's partition and create a clearly versioned replacement candidate instead of random filler.

## Failure recovery, concept diversity and task liveness (2026-10-08)

This section is mandatory for all five hourly scheduled agents. Rejecting an image is **not** a reason to pause the agent, disable its automation, or declare the production queue blocked. A successful image-generation call is not the same as an accepted, committed image; count production only after both binary and sidecar exist on the live branch.

### Concept pivot protocol

1. Before generation, compare the selected concept against **all** existing image records, including other agents' outputs, especially location, perspective, subject count, lighting, colors, gesture, metaphor, and emotion. A different label on a similar sunset/overlook is still a near-duplicate.
2. For each queued emotion, first name the observable emotional **signal** (expression, gesture or relationship) and a distinct everyday **scene**. The primary subject must communicate the concept even at a roughly 100px crop.
3. If the first image fails QA, reject it without committing and change **at least three** of: setting (indoor/outdoor), number of people, camera distance/angle, interaction/action, time of day and lighting, focal object, composition. Do not merely rephrase the same prompt.
4. Allow up to **three genuinely different candidates per run**, where the image tool and run budget permit. Prefer expressive human scenes and meaningful interactions to generic scenic landscapes. Avoid cliffside, lake, mountain and gold-sunset compositions for the initial emotion queue unless the assignment distinctly requires them.
5. If no candidate passes, report the assignment, number of attempts, each QA reason, the concrete distinct next-scene concept, and the exact capability or execution blocker. **Do not commit placeholders or a failed QA asset.** Keep the same assignment for the next scheduled run; there is no human-approval dependency. A provider limit/timeout or unavailable image tool means retry next run.
6. If generation succeeds but GitHub conversion/commit fails, preserve the asset for a safe retry within the run where possible. Re-fetch live branch, ensure unique asset ID, use binary-safe GitHub operations, and retry; do not claim saved until the binary and matching JSON are verifiably present. If a real external limit prevents committing, report it and continue next hour.
7. Do not degrade QC, fabricate metadata, or switch to downloading stock imagery to inflate the output count.

### Initial-queue scene guardrails

- Agent 1: anxiety/fear/sadness/grief/loneliness/anger should use recognizable and distinguishable human expressions or situations, not six solitary silhouette landscapes.
- Agent 2: guilt should show responsibility or regret after a concrete, non-graphic mistake; distinguish it from rejection (exclusion) and shame (self-conscious hiding). Change actor, framing, setting and action between these concepts.
- Agent 3: confusion should show someone faced with genuinely conflicting choices/information in a realistic context; discouragement and overwhelm must have different actions and focal cues.
- Agent 4: temptation should depict a meaningful choice with two competing actions/objects, not generalized wistfulness or sunset light. For spiritual dryness, waiting, envy, frustration and numbness, use distinct scenes and signals.
- Agent 5: gratitude should depict a specific thankful response to a person or helpful act, unlike joy's smile. Peace, hope, excitement and connection should have distinct contexts, compositions and body language.

### Non-stop automation and mutual liveness checks

The authorized recurring schedule is hourly in Asia/Tokyo for Visual Agents 1–5 at minute **00, 02, 04, 06, 08** respectively. All five should remain enabled. Each run should check its own scheduler state and, when available, the other four known visual-agent schedules before doing image work. If a scheduler control is available and a task was unintentionally disabled/changed, restore the authorized schedule; **never override an explicit instruction from the user to pause or stop a task**. If scheduler inspection or repair is unavailable, report the limitation and carry on with image work.

**Do not self-disable, pause, delete, change to one-time, or set COUNT/UNTIL on any visual-agent task** because a generation failed, image was rejected, rate limit/timeout occurred, git write failed, output queue was temporarily empty, or a run budget was exhausted. A skipped/failed run must keep its hourly future schedule. At the start of a later run, resume from the first missing production-ready asset in the deterministic partition.

For auditability every run reports: agent ID, next assignment, generated/rejected candidate count and reasons, production-ready asset ID if any, image and sidecar paths, committed SHA (only if verified), peer/scheduler liveness findings, and next-run recovery instructions. This is a best-effort peer watchdog; scheduler controls may be unavailable inside some runs, and prompts alone cannot guarantee platform liveness.


## Three-output visual bundle (2026-10-08 user requirement)

This section supersedes this document's older **"no baked-in titles" rule for the optional typography variant only**. The clean master remains text-free and is the default in-app asset. A completed bundle contains:

1. **Clean master:** \`<asset-id>.webp\` (or the actual source format), linked through the existing top-level \`imagePath\`. No rasterized title or label.
2. **Typography artwork:** \`<asset-id>-with-text-<locale>.webp\`. A deliberate, editorial title treatment using the exact reviewed text, not invented Scripture or pseudo-letters. Record the actual locale and text. Additional locales may have separate variants; never present a baked-English version as localized content.
3. **Cropped thumbnail:** \`<asset-id>-thumbnail.webp\`. Clean/no text, focal-aware crop optimized for the swipe carousel. Do not crop off the emotion/subject.

The clean master is the accessible, localized app default with live text. The with-text image is optional for editorial features, social/share artwork and explicitly appropriate branded cards. It **must not replace live localized text or be used as the sole place critical information exists**, consistent with the V7 UI/UX acceptance requirements. Small UI tiles should usually use the clean thumbnail. The original production quality and rights gates apply to **all three** outputs.

A new image record may include a \`variants\` array:
\`\`\`json
[
  {
    "kind": "with_text",
    "locale": "en",
    "text": "Courage for Today",
    "imagePath": "/v7/images/emotion/bqv7-emotion-fear-01-with-text-en.webp",
    "format": "webp",
    "width": 1024,
    "height": 1024,
    "fileBytes": 0,
    "sha256": "exact-64-character-sha256"
  },
  {
    "kind": "thumbnail",
    "imagePath": "/v7/images/emotion/bqv7-emotion-fear-01-thumbnail.webp",
    "format": "webp",
    "width": 320,
    "height": 320,
    "fileBytes": 0,
    "sha256": "exact-64-character-sha256"
  }
]
\`\`\`

The zeros and hash strings above are schema illustrations, **not valid production measurements**. Record real measured values only. Run \`node scripts/v7-visual-assets-audit.mjs\` before publishing; if a declared derivative is missing, altered, mislabeled, or duplicates an existing binary, the audit fails closed. Existing accepted records without variants remain valid until derivatives can be produced and independently QA'd.

For a master already inside \`public/v7/images/<family>/\`, production workers with Pillow available may produce the two derivatives through:
\`\`\`bash
python scripts/v7-visual-asset-derivatives.py \
  --master public/v7/images/emotion/bqv7-emotion-fear-01.webp \
  --asset-id bqv7-emotion-fear-01 --family emotion \
  --locale en --title "Courage for Today"
\`\`\`

This outputs the two derivative images and a JSON \`variants\` snippet. Add the snippet to the asset's matching sidecar only after reviewing actual typography, font glyphs, crop, localized semantics, readability at card size, and source revision. The script preserves the master. Do not claim a bundle is complete if only the master was committed. Workers should aim for one complete three-output bundle per run when conversion/typography tools are available, rather than three unrelated images. If derivative tooling fails, preserve and commit a **valid clean master and truthful original sidecar**, report partial-bundle status, and retry derivatives in a later run; do not fabricate derivative sidecars.

Do not have parallel workers edit a shared asset manifest. \`scripts/v7-visual-assets-audit.mjs --write <output>\` deterministically emits the combined manifest after validating every present binary. Lane D retains runtime wiring and release gate ownership.

## Mandatory construction source for all chats and agents

Every V7 visual generation, variant repair, approval and release step MUST first read `docs/v7/unfinished-artwork-guide/00_COMPLETE_CONSTRUCTION_GUIDEBOOK.md`, its exact-ID scene chapter and `AGENTS.md`. The new guide defines the required human action, location, framing, lighting, original high-resolution raster medium, QA rejection criteria, and checks against accepted, draft and rejected art. It supersedes older generic scene prompts, but not release/rights/Scripture gates or exclusive lane ownership. Until PR #1481 integrates, obtain it from `docs/v7-complete-artwork-construction-guide-20261010`. Preserve an existing verified CLEAN master when correcting only TYPE/THUMB, and do not publish any image solely because a sidecar or structural check claims success.
