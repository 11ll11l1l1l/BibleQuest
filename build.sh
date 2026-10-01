#!/usr/bin/env bash
set -euo pipefail

node scripts/deploy-gate.mjs

if [[ "${CF_PAGES:-}" == "1" ]]; then
  npm ci
  npm run build:v6
  test -f dist-v6/bq-build.json
  test -f dist-v6/bq-artifact-integrity.json

  # Exact-SHA Pages contract: the existing project publishes the repository root.\n  # Stage the\n  # certified V6 output into that root without changing the Git working tree.
  cp -a dist-v6/. .
  test -f bq-build.json
  test -f bq-artifact-integrity.json
fi
