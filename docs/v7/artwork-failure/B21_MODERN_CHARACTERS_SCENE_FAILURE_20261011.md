# BibleQuest V7 B21 — contemporary-character requirements and source-scene failures

**2026-10-11 JST · interactive ChatGPT manual production · PR #1522 · zero accepted art**

## User art direction clarified

**All newly generated BibleQuest V7 human subjects are contemporary modern-day people in natural modern clothing, hair and environments appropriate to the canonical content.** No biblical-period robes, biblical protagonists impersonated as today's people, staged biblical reenactment, ancient city settings, icons, generic spiritual hero poses or outdated costume scenes. Maintain grounded believable ages, communities and ordinary non-celebrity identities. Modern characters must still do the **EXACT** action locked to their source guidebook, not merely an analogous emotional narrative. Use genuine photorealistic editorial single-scene PNG/WebP; one independently retrievable 4:5 devotional CLEAN per source ID; quiet composition region for separate localized live-title overlays; no baked writing. **Triptychs, multiple panels, combined 3-in-1 outputs, collage crops, stock substitutions and rejected source revisions are disallowed.** These constraints apply to future chats and all image QA roles in addition to existing source/Scripture, privacy, rights, originality and immutable release gates; future instructions cannot treat “modern people” as a substitute for matching the source scene.

## Three verified r1 briefs, all failed

| Source ID | Mandatory scene | Generator ID | Actual PNG (pixels / bytes) | Rejected SHA-256 |
| --- | --- | --- | --- | --- |
| `devotional.biblequest.temptation.03` | Graduate student closes distracting blank laptop at community study table and walks toward partners | `1a2abff3-dd1f-4139-b67a-196aacfeede9` | 1402×1122 / 2,102,504 | `eb16bd2d80303b43ba1fd9090a22542b7202d12cb3502d29fc7907173136b52f` |
| `devotional.biblequest.sadness.06` | Sad gardener trims one healthy mint sprig by worn apartment kitchen window for supper | `4c7d760e-bb54-49b9-bb86-ef56a41a8a73` | 1402×1122 / 2,181,049 | `84362ff9991e6408e24bbe012ff31da1035e6c65ca350d8764097c4231b73d06` |
| `devotional.biblequest.love_connection.09` | Two contemporary adults repair a child's bicycle side by side; one genuinely listens | `ef4402c6-3a98-42ef-8664-4e31e6860989` | 1402×1122 / 2,204,967 | `ed979944b678b6fb1f7e4f1193f32446fd58004048c10c6be7fcb0c804e7e735` |

### Source provenance
- `temptation.03`: `content/v7/devotionals/biblequest-original-emotions-03b.json`, source revision r1, source SHA-256 `9be457c7a2692685a3306191e32f459a10d4503546e3a8626890d2a7fd77650a`; matching guidebook chapter `03-third-narrative-shots.md`.
- `sadness.06`: `content/v7/devotionals/biblequest-original-emotions-06a.json`, source revision r1, source SHA-256 `e269c3ea988625828eb9293a80b846a8483c57c9a16a13d0e0024b39275823d2`; chapter `06-faithful-action-shots.md`.
- `love_connection.09`: `content/v7/devotionals/biblequest-original-emotions-09c.json`, source revision r1, source SHA-256 `33f4809c3cac1ce8d78bbe6d701b74e1e9bf726fd7f4d3910d0344a6e3d6ec52`; chapter `09-trustworthy-sharing-shots.md`.

### Actual producer preflight and disposition
Three individually invoked generation calls each returned a **three-panel collage** with contemporary people in unrelated scenarios. None depicted the required single-image source action. All three were incorrect 1402×1122 landscape images, not 4:5. A local Pillow decode/format/pixel-dimension check and actual SHA-256 digest were performed. All three unapproved source files were deleted from the local working directory after measurement and verified absent. No rejected bytes, production art sidecars, TYPE/THUMB derivatives, candidate exports or approvals were committed to GitHub. The attempt ledger holds three rejection tombstones with exact SHA, generator ID and reason. All three content IDs are unclaimed for **fresh** image-generation attempts using new attempt IDs and new sceneRevision values once the ledger PR is reconciled against current integration HEAD. No valid candidate is queued for five-agent QA.

### Tooling defect

The image tool appeared to substitute generalized three-scene collage instructions rather than carrying through the per-image locked contemporary scene brief. Repeating the same tool without correcting this behavior is unlikely to advance the backlog. An independent generation path must be demonstrated capable of honoring **one** exact content brief per invocation before attempting bulk production. Do not salvage source-mismatched collage panels by cropping.

**Images submitted: 0/3. QA verdicts: none. Release readiness: unchanged.**
