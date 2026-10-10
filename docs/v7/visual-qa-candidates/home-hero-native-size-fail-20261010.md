# Home hero — native-size generation failure (2026-10-10)

**Source identity:** guidebook blob `3e4fd5d15199d017fe535dc2394c17a693bec9fd`; generation base `v7/development` @ `0395b0237be9e22d6c81ecff17d21f2c7ec86060`.

**Result:** no Home hero candidate is being submitted. The locked guide requires a native 16:9 CLEAN raster of at least **1920 × 1080 px**. Two generated scenes matched the required learning-hall composition and quiet left text region but both returned only **1672 × 941 px**. Neither was upscaled or added to the asset registry.

| Attempt | Native pixels | Bytes | SHA-256 | Result |
|---|---:|---:|---|---|
| `exec-984b8f10-e234-4ab9-bda5-d3b0b13cc30d.png` | 1672 × 941 | 2,017,244 | `743d57e59097dc7bf02d0b923fa8e1f3cd4a9d9565b511fc66e4f6a794fb60d8` | Reject: below 1920 × 1080 minimum |
| `exec-d32e6564-782a-40d9-8bb1-79b95ceb9858.png` | 1672 × 941 | 2,012,645 | `887a22e4f7a0bb36ba4ebd5c3d2b86f0d8b5c618274671cfb922722a2b49c2ba` | Reject: below 1920 × 1080 minimum |

The target story was the required contemporary neighborhood learning/community hall: adult and school-age child entering with bags, two adults at a shared reading/project table, left 36–40% quiet. The image generation service returned the same subminimum native geometry on a second explicit 2048 × 1152 request. These hashes are failed outputs, not candidates. Future work needs a native export meeting the guide's minimum; do not resample these files to claim compliance.

The current open Home draft #1429 also contains a guide-rejected scene and must not be counted or merged. This failure note records only the new undersized attempts; it does not certify or replace the old draft.
