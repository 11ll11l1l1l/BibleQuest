# BibleQuest V6 exact-SHA RC automated gate

This gate advances the acceptance requirement that one exact V6 release-candidate SHA pass every applicable automated gate before promotion.

## Contract

Run `V6 RC Exact-SHA Automated Gate` with one full 40-character candidate SHA.

The collector fails closed unless all of these workflow names have a completed `success` run whose GitHub `head_sha` exactly equals that candidate:

- V6 Phase 1 Build Gate
- V6 Database CI
- V6 Client Artifact Security
- V6 Dependency Security
- V6 PR Serialization Guard
- V6 Cloudflare Exact-SHA Preview Verification
- V6 Deployed Artifact Verification
- V6 V4 Rollback Reference Guard
- BibleQuest inherited regression

The gate records the exact workflow run IDs/URLs in `v6-rc-exact-sha-evidence.json` and uploads that JSON as a retained Actions artifact. The deployment-certification assembler independently validates that the pre-deployment evidence uses the canonical `predeploy` profile and contains the complete required workflow set, so a partial same-SHA JSON file cannot be substituted.

## Candidate cut contract

Do not mix final feature work into the RC-certification PR. First integrate every intended V6 change. From that exact live `v6/architecture-upgrade` SHA, create a fresh branch and generate the sole candidate delta:

```bash
node scripts/v6-rc-candidate-marker.mjs --write <exact-integration-base-sha>
```

Commit only `docs/v6/RC_CANDIDATE.json` as one commit and open the RC PR to `v6/architecture-upgrade`. The candidate commit must have exactly one parent, that parent must be the SHA declared in the marker and must belong to the official `v6/architecture-upgrade` history, and a PR-triggered certification additionally requires that parent to equal the PR's exact base SHA. The only changed path may be the canonical generated marker. These same parent/marker checks also run for manual exact-SHA recertification, so a manually dispatched gate cannot certify an arbitrary neighboring SHA.

The commit containing the marker is the immutable candidate SHA; the marker deliberately does not self-reference its own SHA. Creating the marker fans out the candidate-sensitive V6 workflows through their existing PR path filters, while inherited regression runs on every V6 PR.

## Operating sequence

1. Finish integration and re-fetch the exact live `v6/architecture-upgrade` SHA.
2. Cut exactly one marker commit from that SHA as described above.
3. Let every required automated workflow execute on that exact marker commit. This includes serialization and the immutable Cloudflare exact-SHA preview verifier. Do not substitute a nearby PR or ancestor.
4. For `V6 Deployed Artifact Verification`, verify the exact candidate against the matching Cloudflare Pages preview/deployment.
5. Confirm `V6 V4 Rollback Reference Guard` succeeds on the same candidate so the immutable V4 fallback still exists at the recorded SHA.
6. Let `V6 RC Exact-SHA Automated Gate` collect the same-SHA SUCCESS runs and upload the retained evidence JSON.
7. Attach the resulting evidence/certification artifact to the release record before any promotion decision.

The current Cloudflare Pages publish-root problem remains a legitimate blocker: the RC gate must not pass while the deployed-artifact verifier cannot read the exact `dist-v6` metadata.

## Evidence boundary

This gate proves only the automated/deployed workflows named above ran successfully on one exact SHA. It does **not** replace physical-device PWA/push evidence, manual accessibility evidence, production authorization, production promotion, or post-production smoke evidence.
