# V5 genuine push-provider invalidation evidence — 2026-09-18

Evidence source head: `618ce3cde7730925a3c3373a484e88987470d380`.

GitHub Actions run: `35288009361`.
Job: `push-provider-e2e` / `105424531705`.

This record contains no real user email address, credential, access/refresh token, API key, real browser push endpoint, subscription secret, or VAPID private material.

## Topology

The run used a fresh Supabase CLI stack on loopback inside an ephemeral GitHub Actions runner and the exact checked-in `bq-push-delivery` candidate.

The sender used a disposable VAPID keypair generated only inside the runner. The private key was written to a mode-0600 temporary file and deleted during cleanup.

The persisted target subscription used:

- a randomized HTTPS endpoint under Mozilla's genuine Autopush Web Push host;
- fresh valid P-256 `p256dh` key material;
- a fresh 16-byte authentication secret; and
- the `assignment` category.

The randomized opaque endpoint token could not belong to a real user. A second disposable `calendar` subscription acted as a control row.

## Real provider execution

The exact candidate sender generated and posted a signed/encrypted Web Push request to Mozilla Autopush.

Mozilla Autopush documents HTTP 404 as an invalid endpoint that must not be reused and HTTP 410 as a no-longer-valid endpoint. The BibleQuest sender treats either terminal response as permanent invalidation and deletes the matching stored subscription.

Observed PASS conditions:

- exactly one matching-category subscription was attempted;
- the invalid endpoint was not counted as delivered;
- the genuine provider terminal response caused exactly one subscription removal;
- the terminal invalidation was not counted as a sender failure;
- the fresh request was not skipped by idempotency;
- the invalid assignment subscription row was absent after delivery;
- the unrelated calendar control subscription remained present;
- the exact candidate source remained clean after the run; and
- the isolated local stack and temporary VAPID material were removed.

The retained CI log records:

`PASS: genuine Mozilla Autopush invalid-endpoint response removed exactly one matching persisted subscription.`

## Evidence class

**BACKEND-E2E PASS** for the Phase 4 requirement that invalid/unsubscribed endpoints are cleaned safely on appropriate real push-service responses.

This proof does **not** satisfy either remaining DEVICE/FIELD requirement:

- app closed + push enabled receives/opens a real notification; or
- push disabled preserves pre-push behavior.

Automatic assignment-triggered production fanout remains outside this evidence and should stay off until the DEVICE/FIELD gates are resolved.
