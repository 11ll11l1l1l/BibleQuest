# Production release procedure

Use the existing [exact-SHA gate contract](../docs/v6/V6_RC_EXACT_SHA_GATE.md); this procedure does not replace it.

1. Fetch the intended release branch and freeze one candidate SHA. Read only current unchecked acceptance rows and separate required automation, physical/human verification and post-production checks.
2. Run the existing minimum exact-SHA workflows required by the gate contract. Preserve run URLs and certificates. Fix actual failures only; a source fix establishes a new candidate.
3. Verify Cloudflare publishes `dist-v6` and deployed identity equals the candidate. Reuse `scripts/v6-deployment-verify.mjs` and its documented invocation; do not build a new verifier.
4. Record genuine physical evidence or an explicit owner waiver. Never convert a waiver to PASS. Confirm existing authorization for promotion.
5. Verify the production rollback ref. Promote the certified SHA through the existing production path without substituting a different build.
6. Run essential production smoke: exact SHA, site load, login/session, Reader, BSB Audio, navigation, PWA/service worker, assignments/notifications and protected routes. Reuse `scripts/v6-live-smoke.mjs` and existing browser checks; distinguish machine contracts from actual device/account observations.
7. Update release status, acceptance and sanitized evidence with actual results. Keep outstanding human checks visible and rollback identity intact.

Current release/rollback identities are maintained only in [backup manifest](../BACKUP_MANIFEST.md) and [V6 production status](../V6_ACTIVE_STATUS.md).

V7 preparation note: existing workflows allow exact-SHA dispatch, but their PR branch filters currently target older integration branches. Adopt the existing gates for V7 explicitly before relying on automatic V7 PR checks.
