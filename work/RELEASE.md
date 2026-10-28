# Production release procedure

Apply [rulebook sections 8–9](RULEBOOK.md) and use the existing [exact-SHA gate contract](../docs/v6/V6_RC_EXACT_SHA_GATE.md); this procedure does not replace it.

1. Fetch the intended release branch and freeze one candidate SHA. Read only current unchecked acceptance rows and separate required automation, physical/human verification and post-production checks.
2. Run the existing minimum exact-SHA workflows required by the gate contract. Preserve run URLs and certificates. Fix actual failures only; a source fix establishes a new candidate.
3. Verify Cloudflare publishes `dist-v6` and deployed identity equals the candidate. Reuse `scripts/v6-deployment-verify.mjs` and its documented invocation; do not build a new verifier.
4. Record genuine physical evidence or an explicit owner waiver. Never convert a waiver to PASS. Confirm existing authorization for promotion.
5. Verify the production rollback ref. Promote the certified SHA through the existing production path without substituting a different build.
6. Run essential production smoke: exact SHA, site load, login/session, Reader, BSB Audio, navigation, PWA/service worker, assignments/notifications and protected routes. Reuse `scripts/v6-live-smoke.mjs` and existing browser checks; distinguish machine contracts from actual device/account observations.
7. Update release status, acceptance and sanitized evidence with actual results. Keep outstanding human checks visible and rollback identity intact.

Current release evidence is linked from [V7_ACTIVE_STATUS.md](../V7_ACTIVE_STATUS.md); frozen rollback identities remain in [BACKUP_MANIFEST.md](../BACKUP_MANIFEST.md). V6 status describes its historical release. V7.1 uses the existing strict V7 convergence workflow in addition to inherited gates; inspect live branch/path filters for the intended task rather than assuming older preparation notes describe current CI.
