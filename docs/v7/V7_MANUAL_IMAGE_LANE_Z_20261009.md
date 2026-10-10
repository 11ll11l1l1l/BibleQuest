# Manual BibleQuest V7 Lane Z — distinct original devotional-cover factory
**Trigger in a separate chat:** `Continue BibleQuest V7 Lane Z`.
Read `docs/v7/V7_EIGHT_STREAM_ARTWORK_EXECUTION_20261009.md`, current launch content, `scripts/v7-devotional-visual-queue.mjs`, live art audit, and open PRs before each batch. Lane Z **exclusively owns all first-party devotional-cover assets**; scheduled agents and X/Y must not create or edit `contentType: devotional` visual covers.

## Deterministic content identity and slot assignment
Discover eligible first-party devotional IDs from `content/v7/devotionals/*.json` with `item.type === 'devotional'`, verified `source.kind === 'first_party'`, verified rights, and allowed `display`+ `modify`. Preserve `item.id`, title, title locale, revision and actual body; content IDs, not guessed emotion names, determine coverage. The current approved goal is **300 distinct devotional cover scenes**, separate from the launch-reusable Feeling fallbacks.
- Lane Z owns **every** eligible `devotional:<id>` cover, and no other family. Do not follow historical `visual-agent-[1-5]` devotional assignments in the queue script; this 2026-10-09 override supersedes them.
- For each eligible ID choose a unique original 4:5 scene grounded in that devotional's *actual* narrative/body, not merely the shared emotion tag. Vary season, location, casting, composition and color to prevent near-duplicates. An emotion master already reused as a fallback does **not** count as that devotional's unique cover.
- Stable ID: `bqv7-devotional-<sanitized-stable-id>-01` only if uniqueness is verified against live registry; hash-suffix if sanitized IDs collide. Add immutable source ID/revision, original work/rights, content-specific cover mapping `byContent['devotional:<id>']` according to canonical audited schema.
- Require 3 genuine files: CLEAN image only, artistically typeset exact-source English TYPE, and focal-aware THUMB; generate source art once and derive lettering/crop deterministically where quality allows. Never bake unverified Bible quotation: label/short context-checked reference only. Non-English: CLEAN with live localized text unless separately verified locale TYPE.
- Independently measure all stored bytes/dimensions/hashes and inspect pixels, source provenance, licensed fonts, caption/Scripture context, accessibility alt, 320/390/430 layout and served HTTP hash. Draft until independent QA and exact-head CI.
- Each manual run complete a bounded batch of **new cover IDs** and open PR on exact `v7/development` where possible. Never change devotional text to fit generated art. If a source isn't eligible, skip with rights reason and move to next eligible item. Report *unique* eligible / completed / QA pending / still uncreated cover IDs; 300 is a content target, not already 300 images.
- Highest priority after any core launch blocker: featured/current Library devotionals first, then systematically exhaust uncovered eligible IDs (stable lexical order). Do not alter agent-owned Need/Feeling assets, X Home or Y legacy items; Lane D owns app integration and final release.

## 2026-10-10 source-grounded first-30 production briefs

The first 30 original BibleQuest devotionals now have 30 editorially distinct, rights-bound story concepts in `data/v7/visual-assets/lane-z-initial-30-source-briefs.json`. Each brief is tied to the exact devotional ID, `r1` revision, title, and source-body anchor and specifies the observable human action, setting, composition, lighting, text-safe region, draft alt text, and visual fingerprint. This is **art direction, not generated artwork, QA or approval**. Do not count it toward the 300 cover binaries.

Get **one** source-specific brief at a time (default CLI intentionally returns one to prevent contact sheets):

```bash
node scripts/v7-lane-z-devotional-cover-queue.mjs
node scripts/v7-lane-z-devotional-cover-queue.mjs --id=devotional.biblequest.anxiety_worry.01
node scripts/v7-lane-z-cover-integrity.mjs
```

The second command must show the apartment kitchen-paper scene for “One concern at a time,” not a hiker at a mountain sunset. Do not make text-containing dashboards, repeated scenic views, or generic peace images and assign them to unrelated devotionals. Two attempted 4:5 mountaintop hikers (2026-10-10 JST) were rejected as source-mismatched and near-duplicates; they are not committed or verified.

The other 270 entries retain deterministic *fallback* prompts; their `artDirectionSource` is explicitly `deterministic_fallback_needs_editorial_review`. A fallback is an assignment placeholder, not approved creative direction. Before generating a future ID, inspect its entire devotional and replace that fallback with a distinct story-specific brief using the same source-binding guard.

Image intake requires matching bytes, format, dimensions, SHA256 and source identity in addition to **independent visual inspection**. Neither the queue nor the integrity checker can certify that image pixels match the devotional or contain no fake Scripture text. Maintain accurate `0/300` accepted coverage until genuine source-bound portrait binaries pass these independent steps.
