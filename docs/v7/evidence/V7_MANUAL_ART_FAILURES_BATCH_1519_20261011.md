# BibleQuest V7 manual three-image batch — generator source-lock failures

Date: 2026-10-11 JST. PR #1519. Current state: **three generation attempts, zero compliant CLEAN deliverables**.

The user-invoked interactive generator rendered three standalone PNG files, each visually examined against an independently verified first-party r1 source and exact scene chapter. None matched. All bytes were measured using Pillow's image decode/verification and SHA-256, then the **three local source PNG files were deleted**. No file or sidecar was uploaded to GitHub; no production manifest was modified. Original source publication status was pending review.

| Canonical content ID | Source sha256 | Native image | Byte length | Actual image sha256 | Preflight result |
|---|---|---|---:|---|---|
| `devotional.biblequest.spiritual_dryness_distance.03` | `2a3583a6b3f06456b61341398ebc9705ebc9eff622428e7501e7cc1fceb4dd45` | PNG 1402×1122 | 2,175,388 | `22b53ab29335fc900da355b46c37c1205117dab5ac163b768b622d299b0e6b25` | **FAIL:** sunset mountain hiker; required woman watering neglected windowsill herb with unopened notebook |
| `devotional.biblequest.love_connection.06` | `270ba013e473c8979537c77bfcab4cac6e4a531cb4a8288be19682ff70ad8429` | PNG 1402×1122 | 2,290,269 | `5621ad39f90c0134a4b25d479ec7dfc9d0ee0745e60a27ea1daf90b0928b6daa` | **FAIL:** three-panel reflective/hiking/prayer collage; required parent sitting at child's puzzle table |
| `devotional.biblequest.anxiety_worry.10` | `edcb62b447e44a10ae5ec86aac024ff075e0e3ee0211cb18ac01b633e6d95c3e` | PNG 1402×1122 | 2,450,056 | `790557ad58df0f6fe6d92b40bc26e97aea3cb453064578b62ed19146c9d81abf` | **FAIL:** three-panel prayer/mountain collage; required bookbinder hanging an unlettered wooden reminder tag |

All three encoded outputs are **landscape 1402×1122**, not the required 4:5 portrait `>=768×960`. Cropping or simply reassigning these images to different IDs would violate semantic scene identity and the one-scene rule. The latter two outputs are also explicitly prohibited triptychs. This is a **producer preflight rejection**, *not* five independent QA agent reviews or a human acceptance decision.

## Sources and scene identity

- Exact central guide: `docs/v7/unfinished-artwork-guide/00_COMPLETE_CONSTRUCTION_GUIDEBOOK.md` Git blob `1f3b158542468f17d940a3aaca01f4ff743e6629`.
- Scene `.03`: `03-third-narrative-shots.md`, source `content/v7/devotionals/biblequest-original-emotions-03b.json`.
- Scene `.06`: `06-faithful-action-shots.md`, source `content/v7/devotionals/biblequest-original-emotions-06c.json`.
- Scene `.10`: `10-remembrance-cue-shots.md`, source `content/v7/devotionals/biblequest-original-emotions-10a.json`.
- All exact content source bodies were read and matched the source metadata; the scenes are prescribed in the guide chapters, not free-form symbolism.

## Collision safety and follow-up

All three claimed slots in `production-ledger.json` now have `status: rejected`, unique attempt IDs, the measured image SHA-256/geometry, bounded reasons, and no candidate file. There are **no remaining active claims from PR #1519**; subsequent manual chats may try those same IDs only with a **new attempt ID and a distinct scene revision**. Existing finished/pending images in unrelated slots are unchanged.

**No PR merge, CI PASS or production approval is represented by this evidence branch.** Reconcile with latest integrated ledger prior to merging because other chats are editing the same shared ledger. A generator that follows the exact single-scene prompt is needed before further attempts can yield compliant imagery; do not submit mountain-collage substitutes as progress.
