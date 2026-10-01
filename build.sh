#!/usr/bin/env bash
set -euo pipefail

node scripts/deploy-gate.mjs

if [[ -n "${CF_PAGES_COMMIT_SHA:-}" ]]; then
  npm ci
  npm run build:v6
  test -f dist-v6/bq-build.json
  test -f dist-v6/bq-artifact-integrity.json

  # Exact-SHA Pages contract: the existing project publishes the repository root.
  # Stage the certified V6 output into that root after the exact commit is built.
  cp -a dist-v6/. .
  test -f bq-build.json
  test -f bq-artifact-integrity.json
fi
