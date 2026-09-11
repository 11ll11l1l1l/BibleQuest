# BibleQuest v3 — Historical Cumulative Release Closeout

Date: 2026-09-11 JST
Status: **historical released/live-verified checkpoint; superseded as current final-release truth**

This document records a valid earlier cumulative production checkpoint. It must not be used as the current final-release identity after later v3 product work. Current release authority is `DEVELOPMENT_PRIORITY_V3.md`, `RECONCILIATION_V3.md`, `DEVELOPMENT_STATUS_V3.md`, and `RELEASE_ACCEPTANCE_MATRIX_V3.md`.

## Historical release identity

- exact-green cumulative product SHA: `cf17f36f9f041aee4715271eaebbe8581fc2c067`
- product verifier: `34610903807` — success
- docs checkpoint: `675c6181ecc4dc36a47ba410feab142605eba913`
- docs contract: `34612119469` — success
- promoted `main` / deployed release commit: `04bd51bfc4ff16a3b42d13e47e95e637999b4880`
- release branch: `release/v3-cumulative-20260911-r1`
- production verifier: `34612873935` — success
- previous rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

That checkpoint's runtime/product tree came from its cumulative verified product state. Its PASS remains valid **for that historical state only** and must not be transferred to later product changes.

## Historical released scope

The cumulative checkpoint reconciled and released:

- Assignment Private Responses;
- Workspace/Cloud Notes deployed-schema compatibility;
- Visual tranche 18;
- Avatar Vault v2;
- Calendar v1.5.

The former Line A / Line B divergence was closed at that checkpoint.

## Historical production hosts

Production verifier `34612873935` independently confirmed byte-for-byte promoted product files plus browser/mobile smoke at that time on:

- `https://mybiblequest.pages.dev/`
- `https://biblequest-7th.pages.dev/`

Covered live smoke included shell, Assignments, Workspace, Avatar Vault, Calendar, accessibility and offline shell.

## Current superseding release truth

Later accepted work advanced the exact-green product beyond this historical checkpoint.

Current authoritative identities as of 2026-09-12:

- exact-green product: `2c601b3289dba891f349801219f49804f85f63cc`, run `34633247237` success;
- exact-green validation integration: `d0eab188479f20273cbd67cb5b796c74868dc5d4`, run `34634460077` success;
- repository `main` during fresh live verification: `452e84cdbe1a63dc86d4079ff3bf0f6a9edc8f8b`;
- fresh production verifier: run `34637203062`, job `103387887268` success.

Run `34637203062` independently proved selected current release files byte-for-byte on both Cloudflare Pages hosts and successfully ran the current hosted browser/mobile suite on both, including explicit 320/360/390/412/430 widths and accepted current Phase-B surfaces.

Therefore the historical `cf17f36...` / `04bd51b...` live PASS is not needed as transferred evidence for the later product: fresh current-production evidence now exists.

## Supabase release closeout retained

Production project: `zkfmgezvzugchcwppreq`.

Applied + live verified migrations remain:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Do not reapply them. Later product/validation/live-verification work did not mutate these production migrations merely to refresh release evidence.

## Current remaining release evidence

This historical document no longer declares the **current final release gate** closed.

Current unclosed evidence is tracked by the authority documents and consists of:

1. Issue #68 real multi-account field validation.
2. Issue #6 physical Android Chrome/Brave + genuinely installed-PWA device validation.
3. Cloudflare-internal deployment metadata only if release policy strictly requires the provider's internal deployment object/ID beyond the already-proven live product content identity.

No current-v3 P0/P1 product/security/privacy/data-loss defect is presently reproduced. This does not claim the application is bug-free.
