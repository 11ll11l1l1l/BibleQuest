# BibleQuest V6 exact-SHA RC automated gate

This gate advances the acceptance requirement that one exact V6 release-candidate SHA pass every applicable automated gate before promotion.

## Contract

Run `V6 RC Exact-SHA Automated Gate` with one full 40-character candidate SHA.

The collector fails closed unless all of these workflow names have a completed `success` run whose GitHub `head_sha` exactly equals that candidate:

- V6 Phase 1 Build Gate
- V6 Database CI
- V6 Client Artifact Security
- V6 Dependency Security
- V6 Deployed Artifact Verification
- BibleQuest inherited regression

The gate records the exact workflow run IDs/URLs in `v6-rc-exact-sha-evidence.json` and uploads that JSON as a retained Actions artifact.

## Operating sequence

1. Freeze one V6 candidate SHA on the official V6 integration/release line.
2. Execute every required automated workflow on that exact SHA. Do not substitute a nearby PR or ancestor.
3. For `V6 Deployed Artifact Verification`, verify the exact candidate against the matching Cloudflare Pages preview/deployment.
4. Run `V6 RC Exact-SHA Automated Gate` for that same SHA.
5. Attach the resulting JSON artifact to the release evidence before any promotion decision.

The current Cloudflare Pages publish-root problem remains a legitimate blocker: the RC gate must not pass while the deployed-artifact verifier cannot read the exact `dist-v6` metadata.

## Evidence boundary

This gate proves only the automated/deployed workflows named above ran successfully on one exact SHA. It does **not** replace physical-device PWA/push evidence, manual accessibility evidence, production authorization, production promotion, or post-production smoke evidence.
