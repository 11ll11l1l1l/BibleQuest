# BibleQuest v3 — Final Release Acceptance Matrix

Updated: 2026-09-12 JST after independent current-production verification.

This matrix separates product verification, independent live-production proof, provider-internal metadata and real field validation. A PASS in one evidence class must not be transferred to another.

## Exact product baseline

- current exact-green product: `2c601b3289dba891f349801219f49804f85f63cc`
- frozen product ref: `release/v3-phase-b-progress-artwork-20260912`
- exact accumulated product run: `34633247237` — success
- exact-green validation integration: `d0eab188479f20273cbd67cb5b796c74868dc5d4`
- validation run: `34634460077` — success
- repository `main` during live-production verification: `452e84cdbe1a63dc86d4079ff3bf0f6a9edc8f8b`
- production verifier: run `34637203062`, job `103387887268` — success

A docs/validation-only HEAD is not automatically a new product SHA.

## Automated exact-candidate gates

| Gate | Required evidence | Current status |
|---|---|---|
| Cloudflare deployment build gate | `bash build.sh` / `scripts/deploy-gate.mjs` validates JS syntax, production entry assets and deployment/runtime guards | **PASS** — accumulated validation run `34634460077`; repeated successfully by production run `34637203062` |
| Architecture / ownership | Complete accumulated architecture validators | **PASS** — run `34634460077` |
| Edge / security / privacy | Complete accumulated edge/security/static suite | **PASS** — run `34634460077` |
| Browser / functional | Complete accumulated browser/mobile suite | **PASS** — run `34634460077` |
| Explicit phone widths | 320 / 360 / 390 / 412 / 430 px against current v3 shell and primary routes | **PASS** — run `34634460077`; hosted production repetition also passed in run `34637203062` |
| Current primary navigation | Five current v3 routes: Home / Learn / Play / Grow / More; equal usable columns, no clipping | **PASS** |
| Home priority | Daily Journey surface/CTA discoverable and practical touch target | **PASS** |
| Mobile text floor | Critical body/support text avoids tiny unreadable values | **PASS** |
| PWA install contract | Relative manifest, standalone display, install icons, browser install event, safe mobile install UI | **PASS in automated coverage**; real installed-device field proof remains Issue #6 |
| Offline shell | Offline/service-worker/cache behavior | **PASS** in accumulated and hosted production coverage |
| Accessibility | Keyboard/readability/preferences/reduced-motion-sensitive regressions | **PASS** in accumulated suite; live-host smoke also passed |
| Visual assets | Same-origin committed artwork, fallbacks and no console/page errors | **PASS** through accepted Phase B; checked assets/styles byte-match on both live hosts |

## Independent production gate

Run `34637203062` provides fresh current-product production proof:

1. repository `main` was asserted at `452e84cdbe1a63dc86d4079ff3bf0f6a9edc8f8b` for the verification;
2. `bash build.sh` passed;
3. selected current release files were fetched from both production hosts and compared byte-for-byte against the repository checkout;
4. checked files included current shell/runtime plus Account, Avatar Vault, Calendar, Mission, More and Progress Phase-B CSS/assets;
5. `https://mybiblequest.pages.dev/` passed current shell, explicit five-width, Reader, Phase-B surfaces, Assignments, Ministry Hub, Workspace, accessibility and offline-shell browser smoke;
6. `https://biblequest-7th.pages.dev/` passed the same hosted browser/mobile suite.

**Independent two-host production-content/browser verification: PASS.**

The connected repository tooling does not expose the Cloudflare-internal deployment object/ID. That provider-internal metadata is a separate evidence class and is not inferred from the successful content/browser proof.

## Issue #6 reconciliation

Issue #6 was written against an older BibleQuest shell that had four bottom tabs and a Home world/path layout with nine squeezed nodes. Current v3 intentionally has five primary destinations in `src/ui/shell.js`: Home, Learn, Play, Grow and More. Bible World is now a separate feature route.

Automated and hosted headless acceptance prove:

- no zoom-out required in the test viewport matrix at 320–430 px;
- no horizontal page overflow;
- readable primary/supporting text under the maintained contract;
- Daily Journey remains obvious and usable;
- header and account/progress controls fit without overlap;
- all five current nav destinations are equal and usable;
- practical touch targets remain approximately 44 px or larger where applicable;
- PWA/offline behavior remains regression-protected.

Real Android Chrome/Brave at 100% zoom and a truly installed-PWA **device session remain FIELD VALIDATION REQUIRED**. They must not be claimed from headless Chromium.

## Multi-account field gate — Issue #68

This remains **FIELD VALIDATION REQUIRED**. Use multiple real/test accounts that exercise Member, Pastor/Leader and Congregation Admin boundaries without bypassing authentication or RLS.

Required field evidence:

- create/join congregation and Journey Group from UI;
- create Cloud Team, add/remove members, target assignment to team;
- target assignment to Journey Group and prove only that group receives it;
- link two couple accounts and launch a couples assignment;
- run couples-type congregation challenge and verify one pair-shared day plus individual progress/points;
- host/join Live Room across devices;
- refresh/reconnect/close-reopen PWA/re-login;
- verify expected database rows and realtime behavior;
- verify unrelated congregation/group/couple cannot read or mutate data;
- verify empty/error states and expired/invalid invite codes.

Static or hosted headless regressions do not close this gate.

## Provider metadata gate

Current live content identity is now proven against the intended repository product state. If release policy additionally requires the **Cloudflare-internal deployment object/ID**, obtain it only through an authorized provider connection that exposes that metadata. Do not infer an internal ID from GitHub or manufacture it from content verification.

Absence of that internal metadata in the current toolset is not evidence of deployment failure.

## Visual Phase B gate — Issue #94

Accepted exact-green bounded checkpoints include More, Calendar, Personal Mission, Avatar Vault, Account and Progress/Grow. Current checked visual assets/styles are proven live on both production hosts by run `34637203062`.

Additional visual changes are required only when current investigator/tree/field evidence identifies a material remaining placeholder, generic or inconsistent user-facing surface. Do not create visual work simply to extend tranche count.

## Remaining release evidence

At this point the substantive unclosed evidence is:

1. Issue #68 real multi-account field validation.
2. Issue #6 physical Android Chrome/Brave + genuinely installed-PWA device validation.
3. Cloudflare-internal deployment metadata only if policy strictly requires the provider's internal object/ID beyond already-proven live content identity.

Any product/runtime correction invalidates the corresponding exact-product/live PASS and requires the appropriate complete re-verification. Never transfer PASS.
