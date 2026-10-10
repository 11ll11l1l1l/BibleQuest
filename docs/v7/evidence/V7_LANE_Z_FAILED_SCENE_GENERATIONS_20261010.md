# Lane Z — failed single-scene generation evidence (2026-10-10 JST)

**Source slot:** `devotional.biblequest.anger.01` — “Slow the reaction”, first-party `r1`, `content/v7/devotionals/biblequest-original-emotions-01b.json`, Scripture reference James 1:19–20.

**Locked shot:** `docs/v7/unfinished-artwork-guide/01-first-story-shots.md` and guidebook `00_COMPLETE_CONSTRUCTION_GUIDEBOOK.md` (scene: customer deliberately lowering a raised hand in a real neighborhood bicycle-repair workshop while mechanic listens, unfinished wheel foreground, diffuse overcast daylight, quiet title area on right). No writing on the image. The source and rights are verified, but the source devotional is pending editorial review.

Two standalone image-generation outputs were **rejected by source-scene inspection**:

| Actual output | Measured PNG dimensions | Bytes | SHA-256 | Rejection |
| --- | --- | ---: | --- | --- |
| Multi-panel devotional collage | 1122×1402 | 2,613,514 | `d2614b2bae7e88a36d35a4af2f96fdfc3002c398f5bafe30c41c9603d8598ea5` | 20 unrelated panels, not a single image, no bicycle customer/mechanic, repeated clichéd imagery |
| Mountain-prayer hiker | 1122×1402 | 2,588,654 | `9b75957118f7596d4b504d6503b80fdc1a32f804ec5903ec46513c66f997d474` | Hiker, cross, Bible and sunset in place of required listening/restraint at the repair workshop; repeats known prior rejected landscape imagery |

Measured from the original output files using native decoded dimensions, file byte lengths and SHA-256. Both satisfy approximate 4:5 geometry, **demonstrating why technical metadata alone cannot approve devotional cover art**.

Neither PNG was submitted to GitHub nor given an asset sidecar. Both are intentionally excluded from coverage/QA queues and must not be repurposed for other devotionals. Only their hashes and failure descriptions are retained to prevent accidental resubmission.

**Guard added:** `scripts/v7-visual-candidate-policy.mjs` registers both exact hashes. `scripts/v7-lane-z-cover-integrity.mjs` and `scripts/v7-lane-z-cover-evidence.mjs` check the **measured bytes**, while `scripts/v7-visual-assets-audit.mjs` already invokes the candidate policy for production-ready records. A different digest still requires independent semantic, visual, Scripture, rights and browser review.

**Status:** `anger.01` not generated/approved; five other standalone candidates still QA pending; zero editorial-approved devotional covers. No new art included in this PR, no new accepted coverage claimed. Correct next attempt must be one scene exactly as the locked shot and may not substitute generic religious imagery.
