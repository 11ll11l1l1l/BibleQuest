#!/usr/bin/env python3
"""Fail-closed technical preflight for BibleQuest Lane X single-scene CLEAN rasters.

This checks physical files, aspect/resolution, and strong white multi-panel dividers.
It cannot confirm semantic scene fidelity, copyright, typography, or originality.
Those require independent image inspection and downstream browser/release checks.
Requires Pillow (pip install Pillow).
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, UnidentifiedImageError

TARGETS = {
    "emotion": {"ratio": 1.0, "min_width": 1024, "min_height": 1024},
    "need": {"ratio": 4/5, "min_width": 1024, "min_height": 1280},
    "hero": {"ratio": 16/9, "min_width": 1920, "min_height": 1080},
}


def runs(values: list[float], cutoff: float, low: int, high: int, min_len: int = 2) -> list[tuple[int,int]]:
    """Return internal contiguous high-support runs, excluding edge borders."""
    result = []
    start = None
    for i in range(low, high):
        active = values[i] >= cutoff
        if active and start is None:
            start = i
        if not active and start is not None:
            if i-start >= min_len:
                result.append((start, i-1))
            start = None
    if start is not None and high-start >= min_len:
        result.append((start, high-1))
    return result


def gutter_evidence(img: Image.Image) -> dict:
    """Find exceptionally pale, neutral divider stripes spanning most of the other axis.

    Uses a 600 px maximum axis preview; no generative/artistic acceptance inference.
    """
    thumb = img.copy().convert('RGB')
    thumb.thumbnail((600, 600), Image.Resampling.BILINEAR)
    w, h = thumb.size
    pixels = thumb.load()
    col = [0]*w
    row = [0]*h
    for y in range(h):
        for x in range(w):
            r,g,b = pixels[x,y]
            if min(r,g,b) >= 224 and max(r,g,b)-min(r,g,b) <= 24:
                col[x] += 1
                row[y] += 1
    c = [v/h for v in col]
    r = [v/w for v in row]
    cols = runs(c, .88, max(1,round(.035*w)), min(w,round(.965*w)), 2)
    rows = runs(r, .88, max(1,round(.035*h)), min(h,round(.965*h)), 2)
    # Require repeated dividers or clear 2D panel grid. Simple bright windows
    # and light furniture must not be interpreted as multiple image cards.
    flagged = len(cols)>=3 or len(rows)>=3 or (len(cols)>=2 and len(rows)>=1) or (len(rows)>=2 and len(cols)>=1)
    return {"preview": [w,h], "interiorBrightVerticalDividers": cols,
            "interiorBrightHorizontalDividers": rows,
            "likelyMultiPanelGrid": flagged,
            "heuristicNotArtisticApproval": True}


def inspect_image(path: Path, family: str) -> dict:
    checks = TARGETS[family]
    out = {"path": str(path), "family": family, "status": "REJECT", "reasons": []}
    if not path.is_file():
        out["reasons"].append("file_not_found")
        return out
    content = path.read_bytes()
    out["sha256"] = hashlib.sha256(content).hexdigest()
    out["fileBytes"] = len(content)
    try:
        with Image.open(path) as src:
            src.verify()
        with Image.open(path) as src:
            src.load()
            fmt = src.format
            w,h = src.size
            out.update({"decodedFormat": fmt, "width": w, "height": h})
            if fmt not in ("PNG", "WEBP"):
                out["reasons"].append("only_real_png_or_webp_allowed")
            if w<checks["min_width"] or h<checks["min_height"]:
                out["reasons"].append("insufficient_original_raster_resolution")
            out["actualAspectRatio"] = round(w/h,5)
            if abs((w/h)/checks["ratio"]-1)>.035:
                out["reasons"].append("wrong_original_scene_aspect_ratio")
            out["gutterEvidence"] = gutter_evidence(src)
            if out["gutterEvidence"]["likelyMultiPanelGrid"]:
                out["reasons"].append("suspected_multi_panel_collage_or_contact_sheet")
    except (OSError, ValueError, UnidentifiedImageError, Image.DecompressionBombError) as error:
        out["reasons"].append("raster_decode_failure: "+str(error)[:180])
    if not out["reasons"]:
        out["status"] = "TECHNICAL_PREFLIGHT_PASS_VISUAL_QA_REQUIRED"
    return out


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('image', type=Path)
    parser.add_argument('--family', choices=tuple(TARGETS), required=True)
    parser.add_argument('--output', type=Path, help='Write JSON report to a separate file')
    a=parser.parse_args()
    report=inspect_image(a.image,a.family)
    encoded=json.dumps(report,indent=2,sort_keys=True)
    if a.output:
        a.output.parent.mkdir(parents=True,exist_ok=True)
        a.output.write_text(encoded+'\n',encoding='utf8')
    print(encoded)
    raise SystemExit(0 if not report['reasons'] else 2)

if __name__=='__main__':
    main()
