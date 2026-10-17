# Lane X rejected raster output evidence — 2026-10-10

Scope: P1 `emotion:stressed` (not P4 covers). Canonical guide: `docs/v7/unfinished-artwork-guide/00_COMPLETE_CONSTRUCTION_GUIDEBOOK.md`, G0–G6, Stressed scene.

**Required source scene:** One cafeteria cook taking a controlled breath at a safe service-pass counter while a colleague continues working. High-resolution single-scene photorealistic cinematic image, square emotion master; no captions, Scripture prose, UI, logo, contact sheet, mountains or train-platform scene.

Two generation calls returned unsupported composite grids. Both were visually rejected. Neither is a BibleQuest master, valid COVER, derivative, approved artwork, or ready-for-app image. Do not isolate a panel from them or promote them through a metadata edit.

| Attempt | Local unshipped file | Measured SHA-256 | Measured dimensions | Reasons |
| --- | --- | --- | --- | --- |
| 1 | `a_clean_high_quality_collage_grid_poster_layout_w.png` | `77bbffbf7adaeee876097aafd5930b0268913473ced2e8c84f25e3678e48c3b8` | 1134 × 1387 | Wrong square aspect; four-row collage. 3 internal horizontal light gutters detected. |
| 2 | `a_wide_collage_grid_of_ten_cinematic_high_quality.png` | `958a1e308b14aa8691c55a86d2b31af3090115d691a4a979db909b63bbcdeeec` | 1983 × 793 | Wrong square aspect, insufficient square height, 10-up collage, four internal vertical gutters plus one horizontal. |

Hashes come from the actual locally generated PNG bytes. The rejected PNG files are not committed, and no asset sidecar claims accepted art. Record them in the rejected-image source inventory if another agent encounters identical bytes.

## New technical preflight

`scripts/v7_lane_x_raster_preflight.py` actually decodes image bytes using Pillow, computes SHA-256/bytes, validates family aspect and source dimensions, and looks for repeated neutral-white full-width/height panel gutters. A detected multi-panel image, undersized source, wrong-aspect source, renamed SVG or unreadable binary returns failure (exit 2). Its passing status is `TECHNICAL_PREFLIGHT_PASS_VISUAL_QA_REQUIRED`, **not** approval.

`tests/v7/test_lane_x_raster_preflight.py` contains seven tests. The suite passed locally using Pillow and Python before submitting this PR, including high-resolution synthetic 4/5-column contact sheets and single-scene positive controls.

`.github/workflows/v7-lane-x-raster-preflight.yml` additionally tests every newly added CLEAN art file in `public/v7/images/{emotion,need,hero}` on PRs against `v7/development`. Only newly added files are checked so valid legacy image masters are not casually invalidated. This does **not** replace the global binary/source/Scripture/rights QA, content reviews or Lane D release checks.

Commands:

```sh
PYTHONPATH=. python -m unittest discover -s tests/v7 -p 'test_lane_x_raster_preflight.py' -v
python scripts/v7_lane_x_raster_preflight.py /path/to/original-clean.webp --family emotion
```

The divider heuristic catches obvious light-gutter contact sheets, not every possible mosaic; it may conservatively flag light architectural grids for independent review. Passing the check cannot verify the person's action, composition, source rights, originality, Bible-context relevance, exact locale TYPE or end-to-end app behavior.
