# BibleQuest V7 Visual Asset Production System

Updated: 2026-10-08 JST
Status: ACTIVE — production contract for the five V7 image agents
Parent UI authority: `docs/v7/V7_UI_UX_RELEASE_REQUIREMENTS_20261008.md`

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
