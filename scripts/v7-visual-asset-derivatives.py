#!/usr/bin/env python3
"""Generate independently verifiable text and thumbnail variants of a V7 image.

Requires Pillow in the artist's environment; not a build/runtime dependency.
A no-text source stays untouched. Output is a metadata snippet to merge into the
master's unique sidecar record before the V7 visual audit can approve it.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont, ImageOps
except ImportError as exc:
    raise SystemExit("Pillow is required for asset production: python -m pip install Pillow") from exc


def font_for(size, font_path):
    if font_path:
        return ImageFont.truetype(font_path, size)
    for name in ("DejaVuSans-Bold.ttf", "NotoSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    raise SystemExit("No supported Unicode font found. Supply --font /path/to/licensed-font.ttf.")


def lines_for(text, font, draw, max_width):
    words = text.split()
    lines = []
    line = ""
    for word in words:
        proposed = (line + " " + word).strip()
        if draw.textbbox((0, 0), proposed, font=font)[2] > max_width and line:
            lines.append(line)
            line = word
        else:
            line = proposed
    if line:
        lines.append(line)
    return lines


def metadata(path, root, kind, **extra):
    data = path.read_bytes()
    with Image.open(path) as img:
        width, height = img.size
    return {
        "kind": kind,
        "imagePath": "/" + str(path.relative_to(root)).replace("\\", "/"),
        "format": "webp",
        "width": width,
        "height": height,
        "fileBytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        **extra,
    }


def render(master, output_dir, asset_id, family, title, locale, font_path, thumbnail_size):
    if not re.fullmatch(r"bqv7-[a-z0-9]+-[a-z0-9-]+-[0-9]{2,}", asset_id):
        raise ValueError("Invalid asset ID")
    if not re.fullmatch(r"[a-z]{2,3}(?:-[a-z]{2})?", locale, flags=re.I):
        raise ValueError("Invalid locale")
    if not title.strip():
        raise ValueError("Typography title must not be blank")
    if len(title) > 180:
        raise ValueError("Typography title is too long for a card")
    if not 128 <= thumbnail_size <= 640:
        raise ValueError("Thumbnail size must be 128..640")
    if not master.exists():
        raise FileNotFoundError(master)
    output_dir.mkdir(parents=True, exist_ok=True)

    text_path = output_dir / f"{asset_id}-with-text-{locale.lower()}.webp"
    thumb_path = output_dir / f"{asset_id}-thumbnail.webp"
    if text_path.exists() or thumb_path.exists():
        raise FileExistsError("Version outputs already exist: increment asset ID or remove rejected draft files")

    with Image.open(master) as source:
        source = ImageOps.exif_transpose(source).convert("RGB")
        width, height = source.size
        # Preserve a reproducible crop for the small, swipeable card, independently
        # of the text-overlay variant. No title or other UI information is rasterized.
        thumbnail = ImageOps.fit(source, (thumbnail_size, thumbnail_size), method=Image.Resampling.LANCZOS,
                                 centering=(0.5, 0.5))
        thumbnail.save(thumb_path, "WEBP", quality=86, method=6)

        text_image = source.copy()
        draw = ImageDraw.Draw(text_image, "RGBA")
        # Subtle gradient improves legibility while keeping the primary subject visible.
        top = int(height * 0.38)
        for y in range(top, height):
            fraction = (y - top) / max(1, height - top)
            alpha = round(20 + 185 * fraction * fraction)
            draw.line([(0, y), (width, y)], fill=(5, 13, 27, alpha), width=1)
        max_line_width = int(width * 0.80)
        best = None
        for point_size in range(max(18, round(width * 0.083)), max(17, round(width * 0.029)), -2):
            face = font_for(point_size, font_path)
            rows = lines_for(title.strip(), face, draw, max_line_width)
            if len(rows) <= 4 and all(draw.textbbox((0, 0), row, font=face)[2] <= max_line_width for row in rows):
                best = (face, rows, point_size)
                break
        if best is None:
            raise ValueError("Title does not fit; shorten text or generate a new visual composition")
        face, rows, point_size = best
        line_height = round(point_size * 1.26)
        total_height = line_height * len(rows)
        start_y = max(top, round(height * 0.75) - total_height // 2)
        if start_y + total_height > round(height * 0.95):
            raise ValueError("Title cannot safely fit in text-safe area")
        for index, row in enumerate(rows):
            draw.text((width // 2, start_y + index * line_height), row, font=face,
                      fill=(255, 255, 255, 255), anchor="mt",
                      stroke_width=max(1, round(point_size * 0.025)),
                      stroke_fill=(0, 0, 0, 180))
        text_image.save(text_path, "WEBP", quality=88, method=6)

    # root is the public/ directory so emitted imagePath matches V7 URL paths.
    return [
        metadata(text_path, output_dir.parent.parent, "with_text", locale=locale.lower(), text=title.strip()),
        metadata(thumb_path, output_dir.parent.parent, "thumbnail"),
    ]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--master", type=Path, required=True)
    parser.add_argument("--asset-id", required=True)
    parser.add_argument("--family", required=True)
    parser.add_argument("--title", required=True, help="Reviewed display title, not generated or guessed")
    parser.add_argument("--locale", default="en")
    parser.add_argument("--font", help="Licensed Unicode font file installed in the generation environment")
    parser.add_argument("--thumbnail-size", type=int, default=320)
    parser.add_argument("--public-root", type=Path, default=Path("public"))
    args = parser.parse_args()
    output_dir = args.public_root / "v7" / "images" / args.family
    if args.master.resolve().parent != output_dir.resolve():
        parser.error("Master must already be in public/v7/images/<family>")
    if args.master.stem != args.asset_id:
        parser.error("Master filename must exactly match --asset-id")
    try:
        with_text, thumbnail = render(args.master, output_dir, args.asset_id,
                                      args.family, args.title, args.locale,
                                      args.font, args.thumbnail_size)
    except Exception as exc:
        parser.exit(1, "Derivative production failed: " + str(exc) + "\n")
    print(json.dumps({"assetId": args.asset_id, "variants": [with_text, thumbnail]}, indent=2))


if __name__ == "__main__":
    main()
