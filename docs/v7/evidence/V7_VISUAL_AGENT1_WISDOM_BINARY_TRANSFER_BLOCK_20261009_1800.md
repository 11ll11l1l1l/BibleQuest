# Visual Producer 1 — Wisdom source and three-file local evidence (quarantined)

Date: 2026-10-09 18:00 JST. Exact source branch: `v7/development` commit `d061418560e524429f33979efa0a0b269a1d0b44`. Taxonomy blob: `e64366970838d62c11ea602dd606e0acfe5b0cb2`.

**Status: LOCAL CANDIDATE ONLY — no binary uploaded, no sidecar published, no production-ready or built-app QA claim.** This evidence-only PR records a genuine standalone original image and real separately measured local derivatives; the connector's GitHub upload interface cannot currently access the image binaries generated in the container. Do not merge as artwork publication.

## Original generation
- Scene: a thoughtful young Asian adult at a sunlit home study desk, open book and notebooks, warm documentary editorial photography. Distinct from Grief/Angry and other producers.
- Image generation ID: `bbce49d8-6c09-4be3-8ef5-1214b3a67159`; provider: OpenAI image generation; **underlying model not exposed**.
- Original source filename: `a_warm_cozy_realistic_indoor_study_workspace_sce.png`; PNG 1402×1122; 2,094,868 bytes; SHA256 `59127d9834c3e6eee490332a43da42b0f3c26e03210395c3a9f7b110dedf16dd`.
- Original portrait crop rect: (350,0) to (1248,1122), Lanczos resized to 1024×1280. Source and original source generation record retained in the originating ChatGPT run.
- No external reference image supplied; OpenAI output subject to applicable terms. TYPE uses Noto Serif under SIL OFL 1.1 (local `/usr/share/doc/fonts-noto-core/copyright`); no font binaries redistributed.

## Local physical candidate bundle (not in GitHub yet)
| Variant | Local filename | Dimensions | Bytes | SHA256 | Git blob SHA (computed locally, not GitHub-verified) |
| --- | --- | --- | ---: | --- | --- |
| CLEAN | `bqv7-need-wisdom-01.webp` | 1024×1280 | 129266 | `ec43fda9c132b475214ebe55e24096b651e7926aeaef65d9db13d3684898ec1e` | `b6602ae5c09e20d98ed966e1b6550e29bcaf0048` |
| TYPE | `bqv7-need-wisdom-01-with-text-en.webp` | 1024×1280 | 115722 | `29bedc484e83ba06b165733d1f47f6ed25ffc87cee903052853fedc4dc59c055` | `2a50b31503233e6046045222946e23053222c2ec` |
| THUMB | `bqv7-need-wisdom-01-thumbnail.webp` | 384×480 | 32516 | `098f157bb0241abae11650d7a7422e06f1420e2aeab75db1a746ab872e9a7bd4` | `fbd41d2bc02103a0b385e7df1a6b612a740ecbe4` |

- TYPE only `Wisdom` and `James 1:5`, no Bible prose. James 1:2–8 addresses wisdom for believers in trials; no generalized prosperity promise.
- THUMB focal-aware crop of CLEAN (100,100) to (900,1100), resized to 384×480; face, thoughtful gesture and open book retained.
- Alt CLEAN: A thoughtful young man studies an open book at a sunlit home desk, pausing to reflect beside notebooks and plants.
- Alt TYPE: A young man thoughtfully studies at a sunlit desk; English artwork text reads Wisdom and James 1:5.
- Alt THUMB: Close crop of a young man considering an open book at a sunlit wooden desk.
- Non-English: CLEAN plus live taxonomy label TL `Karunungan`, CEB `Kaalam`, ILO `Sirib`; do not serve English TYPE as localized.
- Local Pillow decoded each of the three independent WebP binaries and measured all dimensions/bytes/SHA256. Human visual inspection of TYPE and THUMB was performed.
- Standalone local HTTP bytes for CLEAN matched the source hash. **Chromium navigation was blocked by `net::ERR_BLOCKED_BY_ADMINISTRATOR`** before any 320/390/430 browser test; therefore all browser checks remain unpassed. Built BibleQuest HTTP image SHA, canonical Node audit and exact-head CI have **not** run for these binaries.
- Independent Visual QA and Lane D release certification remain mandatory.

## Recovery
Transfer the exact three WebP binaries and JSON sidecar from the originating run's `/mnt/data/bqv7-agent1-wisdom-01/` into the designated `public/v7/images/need/` and `data/v7/visual-assets/records/` paths using a binary-safe transport. Check actual remote Git blob SHA against locally computed values above. Then run canonical Node audit and built-app exact-head 320/390/430 HTTP SHA CI. Keep the sidecar `candidate_built_app_qa_pending`; independent Visual QA must approve before any production promotion. If binary transport remains unavailable, preserve quarantine and resume the next owned concept without inventing an upload.
