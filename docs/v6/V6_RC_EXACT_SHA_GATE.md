# BibleQuest V6 exact-SHA RC automated gate

This gate advances the acceptance requirement that one exact V6 release-candidate SHA pass every applicable automated gate before promotion.

## Contract

Run `V6 RC Exact-SHA Automated Gate` with:

- one full 40-character candidate SHA that is still the exact current `v6/architecture-upgrade` head; and
- the exact Cloudflare Pages preview URL for that candidate.

The gate first proves that the integration ref still resolves to the candidate. It then dispatches all seven required component workflows against that same candidate and waits for each dispatched run to complete successfully:

- V6 Phase 1 Build Gate
- V6 Database CI
- V6 Client Artifact Security
- V6 Dependency Security
- V6 V4 Rollback Reference Guard
- BibleQuest inherited regression
- V6 Deployed Artifact Verification

The first six receive `candidate_sha`. The deployed-artifact verifier receives the same SHA as `expected_sha` plus the supplied preview URL. If integration advances before dispatch, a component fails, or the Cloudflare preview does not expose the exact `dist-v6` bytes, orchestration fails closed.

After the component runs succeed, the existing collector independently queries GitHub Actions and fails closed unless every required workflow has a completed `success` run whose GitHub `head_sha` exactly equals the candidate.

The gate retains both the dispatch/run record and the independently collected workflow evidence as JSON artifacts.

## Operating sequence

1. Freeze one V6 candidate at the exact current `v6/architecture-upgrade` head.
2. Obtain the matching Cloudflare Pages preview URL.
3. Run `V6 RC Exact-SHA Automated Gate` with that SHA and preview URL.
4. The gate re-checks the integration ref, dispatches the seven component workflows, and waits for their exact-head results.
5. The existing collector independently verifies the same exact SHA and uploads both evidence artifacts.
6. Attach the retained artifacts to the release evidence before any promotion decision.

The current Cloudflare Pages publish-root problem remains a legitimate blocker: orchestration becomes one bounded operation, but the RC gate must still fail while the deployed-artifact verifier cannot read the exact `dist-v6` metadata.

## Evidence boundary

This gate proves only that the named automated/deployed workflows succeeded on one exact SHA. It does not replace physical-device PWA/push evidence, manual accessibility evidence, production authorization, production promotion, or post-production smoke evidence.

The workflow uses repository `actions: write` only to dispatch the named component workflows. It retains `contents: read`, does not merge branches, and does not deploy production.
