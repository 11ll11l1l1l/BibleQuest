#!/usr/bin/env python3
import json
import re
import shutil
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LIB = ROOT / "data" / "library"
PACKS = ROOT / "data" / "packs"
STORY_DIR = PACKS / "stories"
STORY_DIR.mkdir(parents=True, exist_ok=True)
for old in STORY_DIR.glob("*.json"):
    old.unlink()


def read_jsonl(path):
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                yield json.loads(line)


def strip_inline(text):
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    text = re.sub(r"[*_]{1,3}", "", text)
    text = re.sub(r"<[^>]+>", "", text)
    return re.sub(r"\s+", " ", text).strip()


def parse_story(row):
    sid = str(row.get("id", "")).zfill(2)
    if not sid.isdigit() or not (1 <= int(sid) <= 50):
        return None
    md = row.get("markdown", "")
    title = re.sub(r"^\d+\.\s*", "", row.get("title", "")).strip() or f"Story {int(sid)}"
    source_ref = ""
    ref_match = re.search(r"_A Bible story from:\s*([^_]+)_", md, re.I)
    if ref_match:
        source_ref = strip_inline(ref_match.group(1))

    pattern = re.compile(r"!\[OBS Image\]\(([^)]+)\)\s*\n+(.+?)(?=\n+!\[OBS Image\]|\n+_A Bible story from:|\Z)", re.S)
    scenes = []
    for idx, m in enumerate(pattern.finditer(md), 1):
        image = m.group(1).strip()
        body = strip_inline(m.group(2))
        if body:
            scenes.append({"n": idx, "image": image, "text": body})

    if not scenes:
        body = re.sub(r"^#.*$", "", md, flags=re.M)
        body = re.sub(r"!\[[^\]]*\]\([^\)]+\)", "", body)
        body = re.sub(r"_A Bible story from:.*?_", "", body, flags=re.I | re.S)
        paras = [strip_inline(p) for p in re.split(r"\n\s*\n", body) if strip_inline(p)]
        scenes = [{"n": i + 1, "image": "", "text": p} for i, p in enumerate(paras)]

    return {
        "id": sid,
        "title": title,
        "reference": source_ref,
        "scenes": scenes,
        "source_file": row.get("source_file", ""),
    }


def question_story_id(row):
    ref = str(row.get("reference", "")).strip()
    m = re.match(r"^(\d{1,2})(?=[:.])", ref)
    if not m:
        return None
    n = int(m.group(1))
    return f"{n:02d}" if 1 <= n <= 50 else None


def question_scene(ref):
    m = re.match(r"^\d{1,2}[:.](\d{1,2})", str(ref).strip())
    return int(m.group(1)) if m else None


def main():
    story_file = LIB / "open_bible_stories.jsonl"
    q_file = LIB / "open_bible_story_questions.jsonl"
    manifest_file = PACKS / "manifest.json"
    if not story_file.exists() or not q_file.exists() or not manifest_file.exists():
        raise SystemExit("Required normalized story resources are missing")

    questions = defaultdict(list)
    for row in read_jsonl(q_file):
        sid = question_story_id(row)
        if not sid:
            continue
        questions[sid].append({
            "id": row.get("id", ""),
            "scene": question_scene(row.get("reference", "")),
            "reference": row.get("reference", ""),
            "question": row.get("question", ""),
            "answer": row.get("answer", ""),
        })

    entries = []
    for row in read_jsonl(story_file):
        story = parse_story(row)
        if not story:
            continue
        story["questions"] = questions.get(story["id"], [])
        out = STORY_DIR / f"{story['id']}.json"
        out.write_text(json.dumps(story, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
        entries.append({
            "id": story["id"],
            "title": story["title"],
            "reference": story["reference"],
            "scenes": len(story["scenes"]),
            "questions": len(story["questions"]),
            "path": f"data/packs/stories/{story['id']}.json",
        })

    entries.sort(key=lambda x: int(x["id"]))
    manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
    manifest["stories"] = entries
    manifest["story_source"] = "Open Bible Stories v9 + OBS Translation Questions v10 / CC BY-SA 4.0"
    manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

    (STORY_DIR / "ATTRIBUTION.md").write_text(
        "# BibleQuest Open Bible Story packs\n\n"
        "Generated from Open Bible Stories v9 and Open Bible Stories Translation Questions v10 by unfoldingWord / Door43. "
        "Licensed CC BY-SA 4.0. Story illustration URLs remain upstream Door43 CDN assets and are fetched only for the scene being viewed.\n",
        encoding="utf-8",
    )
    print(json.dumps({"stories": len(entries), "questions": sum(x["questions"] for x in entries), "scenes": sum(x["scenes"] for x in entries)}, indent=2))
    if len(entries) != 50:
        raise RuntimeError(f"Expected 50 canonical Open Bible Stories, generated {len(entries)}")


if __name__ == "__main__":
    main()
