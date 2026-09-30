# V6 Cloudflare exact-SHA verification contract

Acceptance target: `Cloudflare exact-SHA deployment identity works from built artifacts.`

The certified `dist-v6` artifact already emits `bq-build.json` and `bq-artifact-integrity.json`. Deployment verification must fail closed unless the deployed `bq-build.json.sha` and `bq-artifact-integrity.json.sourceSha` equal the candidate commit SHA, and the deployed integrity manifest matches the certified artifact's `artifactSha256`, `fileCount`, `totalBytes`, and per-file SHA-256 inventory. A deployment URL or Cloudflare success status alone is insufficient evidence.

Repository-side automated verification should download the preview output into an isolated directory and compare every deployed file byte-for-byte against the certified integrity inventory. The verifier must run against the exact PR/candidate SHA and must not deploy or mutate production.

Current blocker: repository mutation policy prevented adding the executable verifier in this worker run. This document records the exact fail-closed contract so the next safe repository-side implementation can be reviewed without weakening deployment evidence.
