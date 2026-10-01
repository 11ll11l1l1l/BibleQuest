#!/usr/bin/env bash
set -euo pipefail

node scripts/deploy-gate.mjs

# The deployment contract always produces the exact V6 artifact.
npm ci
npm run build:v6
test -f dist-v6/bq-build.json
test -f dist-v6/bq-artifact-integrity.json

# The existing Cloudflare Pages project publishes the repository root. Stage the
# certified output there for Pages, but keep GitHub regression worktrees intact
# so inherited source validators still inspect the source entry points.
if [[ "${GITHUB_ACTIONS:-}" != "true" ]]; then
  cp -a dist-v6/. .
  test -f bq-build.json
  test -f bq-artifact-integrity.json
fi
