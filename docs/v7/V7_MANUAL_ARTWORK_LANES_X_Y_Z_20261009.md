# BibleQuest V7 — Manual Image Lanes X, Y, Z

Authoritative scope correction — 2026-10-09 JST. Manual lanes run **only when explicitly invoked**; they are not recurring autonomous jobs. They supplement canonical A–D. Do not reassign them as Scripture QA or rewrite shared A–D files.

| Manual lane | Assignment | Exclusions |
| --- | --- | --- |
| **X** | Create missing original Feeling, Need, and Home hero artwork | Not devotional-specific 300-cover corpus |
| **Y** | Repair existing image variants and specific QA defects | Not new cover-volume production |
| **Z** | Create **300 individually distinct devotional covers**, one per original first-party V7 devotional | Not Feeling/Need replacements; not retrofitting existing image QA |

## Z production scope

Canonical source is every `content/v7/devotionals/*.json` record with type `devotional`, source kind `first_party`, and verified rights for display/modify; external/public-domain sample literature remains separately rights-gated. Do **not** infer cover identity solely from shared feeling taxonomy: multiple devotionals in the same emotion require distinct scenes, their own content IDs and independent image bytes.

Run `node scripts/v7-lane-z-devotional-cover-queue.mjs --limit=10` for the next ten source-bound briefs or `--all` for the full ledger. The queue is stable by sorted devotional ID and encodes source path, source revision, title, taxonomy hints, source-body excerpt, unique assignment number, scene, composition, lighting, palette, a single-output text-free generation brief and a noncolliding expected path. It is **planning only**, not publication approval. Existing art records are surfaced as requiring independent hash/visual audit, never silently credited as complete.

**Per invocation:** create a *single standalone portrait 4:5 cover* (or a bounded set of individually authored files). Choose a subject/action that communicates the actual devotional, keep a visually safe area for **live localized** title and Scripture reference, and never ask image generation to fabricate Bible verses, titles, UI, contact sheets or status progress. The visual style must remain premium cinematic/editorial and genuinely varied: changes of subject, setting, viewpoint, color, and object/action, not the same hillside sunset reused 300 times. Review subject relevance, copyright/rights, uniqueness against already-produced covers, 320/390/430 phone legibility, crop behavior, lack of malformed symbols, and actual binary SHA256/dimensions. A TYPE derivative, if later made, requires verified edition and exact lettering; CLEAN+live multilingual text is the universal fallback.

Store the actual committed CLEAN image under `public/v7/images/devotional/<unique-asset>.webp` (or accurately recorded source format), with an immutable unique sidecar under `data/v7/visual-assets/records/<asset-id>.json`. Existing A audit and B review must both pass; D verifies built-app and release SHA. The image is not “completed” if the binary or sidecar is missing, a contact sheet was generated, a local preview exists but GitHub lacks the file, or QA was not performed.

## 2026-10-09 attempt record

Three image-generation attempts returned large promotional/contact-sheet collages of unrelated thematic covers, including unreviewed biblical lines and one false **300/300** progress claim. **All three were rejected; none is a valid Z output or added to the project.** No individual devotional cover is counted from those images. The one-source-ID-at-a-time queue and GitHub issue #1430 allow future Z invocations to continue accurately, without fake completion or conflicting with X/Y.

Related: `scripts/v7-devotional-visual-queue.mjs` (existing A-agent handoff); `docs/v7/V7_IMAGE_FIRST_AND_PARALLEL_LANES_20261008.md` (general visual interface). The new Z queue avoids modifying the A team's artifacts.
