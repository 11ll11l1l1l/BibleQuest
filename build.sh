#!/usr/bin/env bash
set -euo pipefail

node scripts/deploy-gate.mjs

if [[ "${CF_PAGES:-}" == "1" ]]; then
  npm ci
  npm run build:v6
  test -f dist-v6/bq-build.json
  test -f dist-v6/bq-artifact-integrity.json
fi
