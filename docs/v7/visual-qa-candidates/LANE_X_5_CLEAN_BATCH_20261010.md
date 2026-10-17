# Lane X — five CLEAN source candidates for QA (2026-10-10)

**Source identity:** guidebook blob `3e4fd5d15199d017fe535dc2394c17a693bec9fd`; generation base `v7/development` @ `0395b0237be9e22d6c81ecff17d21f2c7ec86060`; taxonomy blob `e64366970838d62c11ea602dd606e0acfe5b0cb2`.

**Status:** all five are separate single-scene raster CLEAN candidates; none is production approved. All use `candidate_qa_pending`. No TYPE or THUMB derivatives are included. Review each report and actual image diff. The Home hero was attempted twice but failed its native size minimum; see the separate failure note.

| Slot | Native size | Format | Future reference only |
|---|---:|---|---|
| `emotion:stressed` — Stressed | 1254 × 1254 | WebP | `John 14:27` |
| `emotion:overwhelmed` — Overwhelmed | 1254 × 1254 | WebP | `Matthew 11:28` |
| `emotion:tired` — Tired / weary | 1254 × 1254 | WebP | `Isaiah 40:31` |
| `need:comfort` — Comfort | 1122 × 1402 | WebP | `2 Corinthians 1:3-4` |
| `need:forgiveness` — Forgiveness | 1122 × 1402 | WebP | `1 John 1:9` |

## Required gates still open

- Human review of each actual image against the per-ID scene brief, anatomy, text-free status, title-safe area and all approved/in-flight/rejected comparisons.
- Image provenance/rights review; references are taxonomy-listed and context checked, but no Scripture text is baked.
- Official guidebook and asset audit, exact-head CI, and built-app served-byte checks.
- Future TYPE/THUMB work only after CLEAN acceptance. All variants for TL/CEB/ILO remain live localized text.
- A separate Home hero with native dimensions >=1920×1080 is still outstanding.
