#!/usr/bin/env bash
set -euo pipefail

node scripts/deploy-gate.mjs

# Cloudflare Pages and the inherited deployment gate use this script as the
# deploy contract. Always produce the exact V6 artifact instead of depending
# on provider-specific environment detection.
npm ci
npm run build:v6
test -f dist-v6/bq-build.json
test -f dist-v6/bq-artifact-integrity.json

# The existing Pages project publishes the repository root. Stage the certified
# V6 output into that root after the exact commit is built.
cp -a dist-v6/. .
test -f bq-build.json
test -f bq-artifact-integrity.json
