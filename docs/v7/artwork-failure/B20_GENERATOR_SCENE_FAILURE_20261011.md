# BibleQuest V7 batch B20 — generator scene failures and rejected pixel ledger

**Date:** 2026-10-11 JST  
**Working PR:** #1520  
**Baseline:** `v7/development`; no app runtime, published art, other agent data, or production registry changed.

## Pre-generation collision checks
Read `AGENTS.md`, `work/RULEBOOK.md`, `V7_ACTIVE_STATUS.md`, `docs/v7/V7_AUTOMATED_IMAGE_QA_AND_LEDGER_20261011.md`, `docs/v7/unfinished-artwork-guide/00_COMPLETE_CONSTRUCTION_GUIDEBOOK.md`, the exact scene chapters `03-third-narrative-shots.md`, `06-faithful-action-shots.md`, `09-trustworthy-sharing-shots.md`, canonical source texts, active PR search, and ledger. Three unclaimed canonical IDs were reserved via commit `abae837a4728b072a9ec07a4387b674f865602ae`. The claim is discoverable in draft PR #1520, avoiding duplicate generation.

## Three attempts — all rejected before GitHub submission

| ID | Required source-locked shot | Generation ID | Actual size | PNG byte length | SHA-256 | Result |
| --- | --- | --- | --- | ---: | --- | --- |
| `devotional.biblequest.temptation.03` | Graduate student closes a distracting laptop, joins nearby accountability partners | `da611690-51be-4935-910e-b38781516fdc` | 1402 × 1122 | 2,194,141 | `9b5dd3ba57a02d421ace48a93af5d9df7634897ca75c0b29966d2a74535d38a3` | FAIL, unrelated three-panel collage |
| `devotional.biblequest.sadness.06` | Apartment gardener gently trims a healthy mint sprig in a worn kitchen | `e01ba0a2-bceb-4a21-a543-bb7876da9dbf` | 1122 × 1402 | 2,224,193 | `b6ea056456db617a915f57161e6e9321a5a347570f40476d2d257b6d300415fe` | FAIL, unrelated composite |
| `devotional.biblequest.love_connection.09` | Two adults repair a child's bicycle together, one listening to other without advice | `48d34e57-6add-4190-95e8-a30bcc734c31` | 1983 × 793 | 2,194,440 | `f00849c298c17d6822337b2c48813dc4b88234627bdf6d786cd9030edfcdd5c9` | FAIL, three-column triptych |

The image generator returned visually unrelated electronics-lab, study-mentor and fatigued-worker imagery resembling prior batch B19 rather than the unique source scenes. It made multi-scene panels instead of the required one scene per file. Tool output reported a different prompt than the source-locked context. This is **not** source/Scripture compliance. Preserve failure evidence but never reuse their pixels or their sceneRevision.

## Exact source identity
- `devotional.biblequest.temptation.03` / source `content/v7/devotionals/biblequest-original-emotions-03b.json` / revision `r1` / checksum `sha256:9be457c7a2692685a3306191e32f459a10d4503546e3a8626890d2a7fd77650a`.
- `devotional.biblequest.sadness.06` / source `content/v7/devotionals/biblequest-original-emotions-06a.json` / revision `r1` / checksum `sha256:e269c3ea988625828eb9293a80b846a8483c57c9a16a13d0e0024b39275823d2`.
- `devotional.biblequest.love_connection.09` / source `content/v7/devotionals/biblequest-original-emotions-09c.json` / revision `r1` / checksum `sha256:33f4809c3cac1ce8d78bbe6d701b74e1e9bf726fd7f4d3910d0344a6e3d6ec52`.

## Evidence and follow-up
- Actual PNG bytes for each were decoded and SHA-256 measured in the interactive producer environment, then **all three local files deleted**. No candidate image, duplicate derivative, TYPE, THUMB, or production binary was committed. No staging path exists for these attempts.
- `production-ledger.json` records the three attempt IDs as `rejected`, preserves SHA/size/generation IDs, and leaves no active claim. This status is on the PR branch until merged; reconcile ledger against fresh `v7/development` first.
- Valid artwork delivery count **0/3**; QA submission **0/3**; five-agent role reviews **not performed** and must not be inferred.
- Future producer: choose three verifiable free IDs or retry these IDs with **new** attempt IDs and **new scene revisions** only; obtain single-scene output, ensure exact art directions, dimensions at least 768x960 4:5, genuine PNG/WebP, and preflight before `submit`. Do not crop an existing collage into supposed independent original images.
- If the image tool keeps substituting old imagery or composing multiple panels, stop producing false assets and escalate the generator-control problem. Do not weaken BibleQuest V7's source/story identity gate.

No human artwork approval, safety waiver or release assertion is being requested.
