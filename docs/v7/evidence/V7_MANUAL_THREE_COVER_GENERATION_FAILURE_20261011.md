# BibleQuest V7: source-locked three-cover batch — rejected generation evidence (2026-10-11 JST)

No conforming artwork was delivered in this attempt. **Produced valid CLEAN: 0/3; QA submitted: 0/3.** Every attempt was rejected in producer preflight and its unapproved bytes were deleted. This is **not** an image-acceptance or release PR.

This interactive manual image-generation session targeted three different first-party r1 devotional content IDs because release-critical P1 art was already claimed in open PRs (notably #1504, #1509, #1510). The scene locks, source checksum, guide chapter and timestamps are in `production-ledger.json`.

| Attempt | Content ID | Render SHA-256 | Generator ID | Measured native PNG | Why producer rejected |
| --- | --- | --- | --- | --- | --- |
| manual-z-20261011-gratitude-06-r1 | devotional.biblequest.gratitude.06 | `9264cec8eb4dd0e91c9c49592d487c86958674608a539ab90a0ff3d1fafa657f` | `72bba0c5-1eb2-4dc1-86c1-aa3c22ecdf31` | 1536×1024 | unrelated mountain sunset prayer scene |
| manual-z-20261011-gratitude-06-r2 | devotional.biblequest.gratitude.06 | `cb1e4ced9b1a1b82e9c3703db285d905b0aae915e6ac2183199452e62a10dc84` | `11552018-eac9-4f95-9d64-1a75b6855fbd` | 1536×1024 | three-panel ancient biblical collage, not borrower returning drill |
| manual-z-20261011-frustration-09-r1 | devotional.biblequest.frustration.09 | `df802c87a2907cdf85d3bc7df9fc258ff3877d7a19662d8458968128b1634949` | `537cead4-6fa2-4fc4-99b3-16f80cfe500c` | 1536×1024 | ancient comfort scene, not two makers at STEM club |
| manual-z-20261011-temptation-11-r1 | devotional.biblequest.temptation.11 | `db5845ce323ebab1bf01250d611ab8f281a45826148879afbc41dbdfb02ad4fc` | `21b299de-29ff-46e5-b7e8-fe1f8f581743` | 1536×1024 | ancient hillside helper scene, not student removing tablet |

All four actually decoded as PNG. Portrait CLEAN target is **at least 768×960 at 4:5 ±2.5%**, maximum 10 MB, and exact required contemporary scene. Each 1536×1024 output has 3:2 landscape ratio, and the wrong narrative cannot be recovered by cropping. No TYPE, THUMB, candidate sidecar, production registry or release state was created or altered. There are no image bytes retained in this PR.

**Source locks:** 
- `gratitude.06`: `content/v7/devotionals/biblequest-original-emotions-06c.json` — Psalms 103:2; borrower's tool cleaning and return in tool library, side-profile, overcast daylight, left title space.
- `frustration.09`: `content/v7/devotionals/biblequest-original-emotions-09c.json` — Ecclesiastes 7:8–9; two makers discussing broken wooden model bridge at STEM club, morning light, right title space.
- `temptation.11`: `content/v7/devotionals/biblequest-original-emotions-11-backfill.json` — Matthew 26:41; student intentionally moves blank-screen tablet into shared charging drawer, three-quarter view, left title space.

All four file digests were measured from real bytes before local deletion. Local deletion of all four originals was verified. Their original exact image bytes are not included in Git history. Both failure hashes and precise shot revisions are persisted as ledger tombstones; **no active `claimed` entries remain from this batch**. Other chats may attempt these content slots only using new unique attempt IDs and new shot revisions, after checking the live PR union. A future generator must demonstrate scene-adherent individual native portrait output before opening QA intake.

Image tooling here repeatedly rendered unrelated biblical scenes despite explicit source-bound visual instructions. This is an observed generator-control blocker, not a scene interpretation or QA-agent failure. Preserve the original exact scene rules; do not relax them to accept decorative biblical visuals. The five QA-only agents have nothing from this batch to approve.

**Integration:** commit/review this small rejected-hash ledger evidence if useful; it does not count toward the V7 300-cover tally or any P1 quota.