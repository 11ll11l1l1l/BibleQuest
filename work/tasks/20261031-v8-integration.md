# V8 combined integration — 2026-10-31

Branch: `v8/integration-20261031`. Integrates practices head `0952a4911531e048d96077ed06741c0cb704937e` (#1557) and media head `9a5971ef43498d9b39523869050aedfbcfb5b7ae` (#1556). Both inherit Library/group #1555 and cleanup #1554. Current main `87cb9dd4c3b60b9679e0acecda519300194b6d55` is an ancestor; no production snapshot was replaced. Source PRs remain open as provenance; this integration draft is the combined review candidate, not a production promotion.

## Integration changes

Resolved the V8 roadmap's only merge conflict by retaining the latest practice scope and media implementation/configuration distinction. Both bootstrap routes and shared API boundaries auto-merged; no runtime conflict was discarded. Added `media-files` to the Groups primary-nav owner, matching its Community parent.

The existing main-target release convergence workflow now runs `unit:v8` alongside `unit:v7` and responds to `tests/v8` edits. No existing gate or baseline failure is removed. Updated the V6 toolchain policy's exact aggregate-script assertion to require the added V8 command and script definition.

## Combined evidence

- V7: 759/759 PASS, plus 31-attempt existing image-ledger audit PASS.
- V8 media: 9/9 PASS.
- Typecheck, production build, existing lint/format policies and changed-file whitespace PASS on Node 24.22.1. This is not pinned Node 22.23.2 release certification.
- Aggregate `npm run unit` first stopped in V6 with 9 failures. One was the stale exact aggregate-command expectation corrected above. Final V6 result: 872/880 pass, eight fail. A separate detached worktree at pre-integration practices head has 872/880 pass and the same eight failing test locations. No whole-suite PASS or waiver is claimed.

Initial V6 failing locations (reconciled in the follow-up below):
- `tests/v6/bootstrap-account-resume-cutover.test.ts:8`
- `tests/v6/integrated-acceptance-certification.test.ts:182`
- `tests/v6/push-device-field-harness.test.ts:120`
- `tests/v6/pwa-content-version-upgrade.test.ts:85`
- `tests/v6/pwa-content-version-upgrade.test.ts:97`
- `tests/v6/route-lazy-splitting-contract.test.ts:8`
- `tests/v6/ui-modern-foundation.test.ts:35`
- `tests/v6/ui-phase2-core-experience.test.ts:33`

Full browser/device/offline/backend/Drive QA remains open. The previously attempted Chromium download was truncated. Existing release CI is the next source of exact-head combined evidence; remote checks have not been called PASS in advance.

## Remaining work

Follow DEVELOPMENT_PLAN_V8.md for accepted scope: practice localization/reminders/managed offline/optional cues, broader media management/provider configuration, Ilocano source/license/provider/UI, content/Couples/discovery expansion, then existing exact-candidate integrated release. The eight legacy checks are reconciled by the follow-up below; exact-head remote certification is still required. No production migration, provider write, upload, real-user message/notification, release or deployment occurred in this integration step. Central media remains disabled by default; its provider configuration is untouched.


## Follow-up: inherited Reader gate and V6 contract reconciliation

On candidate `5a84248208264c12e4f292a46b94d48c3cbac4bd`, 10/11 remote workflows passed: release convergence, build/PWA, security/privacy, protected-page and whole-app browser audits, field/release gates, Cloudflare preview smoke, push lifecycle and serialization. Inherited regression stopped because Japanese vocabulary/furigana source validators require `reader,vocabulary,furigana,audioStore` to remain adjacent. Reordered the added meditation callback after existing options; no behavior or validator was removed. Both affected validators and the complete inherited static composite then PASS locally.

Reconciled the eight stale V6 assertions against accepted current behavior: preserve full navigation query on account resume; require the existing filtered compatibility copy; assert the secret-redaction pattern and exercise rejection of a sample secret; derive the active worker cache version while retaining stale-cache/client reload tests; count and require current lazy routes plus the deliberate conversation-deck factory alias; check the current five navigation destinations; check narrow Reader audio layout/tap targets and safe-area padding in the foundation owner. No runtime cache, auth, privacy, CSS or denial behavior was weakened.

Final local aggregate `npm run unit`: V6 880/880, V7 759/759 and V8 9/9 PASS (1,648 total), plus 31-attempt ledger audit PASS. Typecheck, lint/format, build and whitespace PASS. These checks run on Node 24.22.1; new exact-head remote/pinned results must be collected after publication, and the prior green candidate is not silently transferred. The earlier full-suite failure record above is historical evidence, not current unresolved failures.
