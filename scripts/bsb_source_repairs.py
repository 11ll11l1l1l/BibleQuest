"""Source-bound delivery repair; never infer text or verse numbers from gaps."""
import hashlib
import json
from pathlib import Path


def apply_bsb_source_repairs(rows, root):
    directory = Path(root) / 'data/source-repairs/bsb-psalm-127'
    source = json.loads((directory / 'SOURCE.json').read_text())
    raw = (directory / 'PSA_127_BSB.txt').read_bytes()
    license_bytes = (directory / 'LICENSE-CC0.md').read_bytes()
    if hashlib.sha256(raw).hexdigest() != source['sourceSha256'] or hashlib.sha256(license_bytes).hexdigest() != source['licenseSha256']:
        raise ValueError('BSB repair source/license checksum mismatch')
    if source['upstreamCommit'] != '1f6fe37c8997a173182c78205695790d8b440b74' or source['repair'] != {'book': 'PSA', 'chapter': 127, 'verse': 1, 'sourceLine': 1}:
        raise ValueError('BSB repair source identity mismatch')
    lines = raw.decode('utf-8').splitlines()
    if len(lines) != 5 or any(not line.strip() for line in lines):
        raise ValueError('BSB repair requires exact five-line source chapter')
    chapter = [row for row in rows if row['b'] == 'PSA' and row['c'] == 127]
    if len(chapter) not in (4, 5) or {row['v'] for row in chapter} not in ({2, 3, 4, 5}, {1, 2, 3, 4, 5}):
        raise ValueError('BSB repair chapter coverage mismatch')
    if any(row['t'] != lines[row['v'] - 1] for row in chapter):
        raise ValueError('BSB repair chapter differs from pinned plain text')
    if any(row['v'] == 1 for row in chapter):
        return list(rows)
    result = list(rows)
    offset = next(i for i, row in enumerate(result) if row['b'] == 'PSA' and row['c'] == 127)
    result.insert(offset, {'id': 'PSA.127.1', 'b': 'PSA', 'c': 127, 'v': 1, 't': lines[0], 's': []})
    return result
