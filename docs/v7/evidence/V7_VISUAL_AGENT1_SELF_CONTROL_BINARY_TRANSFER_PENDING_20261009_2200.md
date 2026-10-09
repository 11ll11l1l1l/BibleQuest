# V7 Visual Agent 1 — Self-control candidate, binary transfer pending

Created 2026-10-09 22:00 JST from exact `v7/development` `ac4b6c1568931272698b8823522f558c1375b102`. Owner: Visual Producer 1. This is evidence ONLY, not a complete production submission; no manifest changes.

Scene: original standalone indoor editorial photo, young person places distracting smartphone face-down and turns to a sketchbook by a window. OpenAI image generation ID `4d415523-9fcb-4b81-b1b9-92baf6fe8c8d`; specific model unexposed. Source `a_cozy_realistic_softly_lit_indoor_study_creativ.png` 1122×1402. No third-party source supplied. The source and all variants are held in the run's candidate ZIP, not yet in this Git branch.

Physical candidate binaries independently decoded and measured locally:

| Variant | Local file | Dimensions | Bytes | SHA256 | Git blob SHA (locally computed, not yet uploaded) |
|---|---|---:|---:|---|---|
| CLEAN | `bqv7-need-self-control-01.webp` | 1024×1280 | 148110 | `21dc2a27704e126e81c1b9d36af8e522b1c9a493b0d77558881e3f40b7596e1f` | `a8a9c6a50f7174a432e2dbe0c65604b6ff832998` |
| TYPE | `bqv7-need-self-control-01-with-text-en.webp` | 1024×1280 | 170026 | `4001a52d236c0fbfb0b3a02385a69c5f4b3687c44a0ffa93abb9d789b3d77947` | `a9ea683931c386c40d8412320d834ef6c8762027` |
| THUMB | `bqv7-need-self-control-01-thumbnail.webp` | 384×480 | 37094 | `bce73968813af484c1f703d1c35c1606daf09832486ec8e0dbf075e5507358de` | `2d422f4a745360971ccc0d9fc1594089b007fcb0` |

TYPE contains **Self-control** and **Galatians 5:22-23** only, no Bible prose. Exact taxonomy source blob `e64366970838d62c11ea602dd606e0acfe5b0cb2`. Passage context: fruit of the Spirit (Galatians 5:16–26), not self-sufficient achievement. Noto Serif fonts under SIL OFL-1.1; no font binaries redistributed. For TL/CEB/ILO, use CLEAN plus live localized label/reference; never reuse EN TYPE. THUMB is a deliberate 4:5 focal crop retaining face, phone, and creative work. Alt text and full provenance are in the candidate JSON sidecar.

Local Pillow decode/metrics and visual inspection passed. Chromium local HTTP attempts at 320, 390, 430 pixels for all three variants **FAILED TO EXECUTE** due to `ERR_BLOCKED_BY_ADMINISTRATOR`; 0/9 passed. No actual built-app HTTP SHA, official Node audit, independent Visual QA or exact-head CI was completed. Status: `candidate_built_app_qa_pending`; **productionReady=false**. Do not merge or count toward release.

Next: binary-safe upload of the three WebPs and sidecar under own `public/v7/images/need/` and `data/v7/visual-assets/records/`, verify Git blob identities, open bounded draft PR, run exact-head CI and independent QA. Do not duplicate Grief #1435, Angry #1438, Wisdom #1450, Peace #1421 or Lane X Rest #1445.
