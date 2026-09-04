#!/usr/bin/env python3
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
subprocess.run(['node', str(ROOT / 'scripts' / 'apply-doctrinal-safety.js')], cwd=ROOT, check=True)
