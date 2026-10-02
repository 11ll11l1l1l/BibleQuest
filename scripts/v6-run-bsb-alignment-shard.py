#!/usr/bin/env python3
"""Run one BibleQuest BSB alignment worklist while loading MMS_FA only once."""

import argparse
import importlib.util
import json
import shutil
import subprocess
import sys
from pathlib import Path


def fail(message: str) -> None:
    raise RuntimeError(message)


def load_aligner(aligner_dir: Path):
    module_path = aligner_dir / "align_book.py"
    if not module_path.is_file():
        fail(f"Pinned align_book.py is missing: {module_path}")
    sys.path.insert(0, str(aligner_dir))
    spec = importlib.util.spec_from_file_location("bq_pinned_bsb_align_book", module_path)
    if spec is None or spec.loader is None:
        fail("Could not load pinned align_book.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def install_ffmpeg_loader(aligner) -> None:
    """Keep the pinned aligner logic but bypass torchaudio's optional MP3 backends."""
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        fail("ffmpeg is required for deterministic MP3 decoding but was not found.")

    torch = aligner.torch

    def load_audio(audio_path: Path, bundle, device):
        command = [
            ffmpeg,
            "-nostdin",
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(audio_path),
            "-vn",
            "-ac",
            "1",
            "-ar",
            str(bundle.sample_rate),
            "-f",
            "f32le",
            "pipe:1",
        ]
        result = subprocess.run(command, check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if result.returncode != 0:
            detail = result.stderr.decode("utf-8", errors="replace").strip()
            fail(f"ffmpeg failed to decode {audio_path.name}: {detail}")
        if not result.stdout or len(result.stdout) % 4 != 0:
            fail(f"ffmpeg returned an invalid float32 stream for {audio_path.name}.")
        waveform = torch.frombuffer(memoryview(result.stdout), dtype=torch.float32).clone().unsqueeze(0)
        if waveform.numel() == 0 or not torch.isfinite(waveform).all():
            fail(f"Decoded audio is empty or non-finite for {audio_path.name}.")
        return waveform.to(device)

    aligner.load_audio = load_audio


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--aligner-dir", required=True, type=Path)
    parser.add_argument("--audio-dir", required=True, type=Path)
    parser.add_argument("--text-dir", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--worklist", required=True, type=Path)
    args = parser.parse_args()

    worklist = json.loads(args.worklist.read_text(encoding="utf-8"))
    chapters = worklist.get("chapters")
    if worklist.get("translationId") != "bsb" or not isinstance(chapters, list) or not chapters:
        fail("A non-empty BSB alignment worklist is required.")

    aligner = load_aligner(args.aligner_dir)
    install_ffmpeg_loader(aligner)
    bundle, model, tokenizer, mms_aligner, uroman, device = aligner.load_mms()

    total_aligned = 0
    total_failed = 0
    processed = []
    for item in chapters:
        book = str(item.get("book", "")).upper()
        chapter = int(item.get("chapter", 0))
        if not book or chapter < 1:
            fail(f"Invalid worklist chapter: {item!r}")
        aligned, failed = aligner.process_book(
            book,
            args.text_dir,
            args.audio_dir,
            args.output_dir,
            chapter,
            None,
            False,
            False,
            bundle,
            model,
            tokenizer,
            mms_aligner,
            uroman,
            device,
        )
        if aligned != 1 or failed != 0:
            fail(f"Alignment did not produce exactly one successful output for {book}-{chapter}: aligned={aligned}, failed={failed}")
        total_aligned += aligned
        total_failed += failed
        processed.append({"book": book, "chapter": chapter})

    summary = {
        "schemaVersion": 1,
        "translationId": "bsb",
        "shard": worklist.get("shard"),
        "shardCount": worklist.get("shardCount"),
        "expectedChapters": len(chapters),
        "alignedChapters": total_aligned,
        "failedChapters": total_failed,
        "audioInventorySha256": worklist.get("audioInventorySha256"),
        "audioContentVersion": worklist.get("audioContentVersion"),
        "processed": processed,
    }
    print(json.dumps(summary, separators=(",", ":")))


if __name__ == "__main__":
    main()
