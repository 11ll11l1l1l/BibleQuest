# BibleQuest V4 Official Active Status

Updated: 2026-09-13 JST
Execution model: one serialized development stream
Official active integration branch: `v4/modern-ui-overhaul`
Tracking issue: #124

## Authority and reading rule

**This file is the single authoritative source for current BibleQuest V4 phase state, release readiness, release path, and remaining blockers.**

Read this file first, then `V4_DOCUMENTATION_AUTHORITY.md`, then `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` and `RELEASE_FIELD_VALIDATION_V4.md` as needed. Repository branch/commit/CI/live-backend evidence overrides stale chat context. Historical certification files certify only their named scope/SHA.

## Current verified application checkpoint

The latest fully accumulated application tree remains:

- official integration line: `v4/modern-ui-overhaul`
- exact certified application SHA: `4f908ad8b53f3feb00f21ae27dd4707597b5aa14`
- full accumulated regression run `34711333244` — PASS
- V4 Section I security/privacy run `34711333231` — PASS
- V4 Section H responsive/accessibility/performance/PWA automation run `34711333240` — PASS
- V4 whole-app browser audit run `34711333234` — PASS
- Cloudflare exact-SHA preview check `103600570475` — SUCCESS

Later commits on the integration line are documentation/workflow/release-control only unless repository comparison proves otherwise. These commits do not invalidate the certified application bytes. Any later runtime/application-byte change requires new applicable exact-SHA evidence.

Verification-only PR #167 previously exercised the real future `main` target from `60e31b8d68832a40f4db44b26824b1865c539413` and passed all six automated promotion-path suites: accumulated regression `34713371772`, Section H `34713371784`, Section I `34713371795`, protected-page audit `34713371801`, Cloudflare exact-SHA preview smoke `34713371805`, and whole-app browser audit `34713371845`. The deployed smoke used `https://3284208e.mybiblequest.pages.dev` and passed the maintained 42-route 320/430 px deep-route audit, whole-app browser-state matrix, PWA install regression, offline shell, and operational recovery. PR #167 was closed without merge after evidence capture.

The release-control head later advanced to `844383495d3683e55470c334ad8ea5403a4cec64` through PR #169 without changing certified application bytes. Its authoritative `mybiblequest` branch preview also deployed successfully. A main-target verification PR then demonstrated that the field-evidence workflow fails closed while required field evidence is pending.

## Release-state decision

V4 is **not production-release-certified**. Do not freeze a new RC or promote V4 to `main`/Cloudflare production until all Phase 6 field gates are legitimate PASS records and server-side `main` protection/ruleset enforcement is enabled.

Frozen RC1 remains historical exact-SHA evidence only:

- branch: `release/v4-rc1`
- SHA: `cf58fa2e467f70f1c4a963b4ca50e33f11da9983`
- PR #151

Do not promote RC1 by default. Official development continued after RC1.

## Post-RC1 phase state

### Phase 1 — Assignment privacy tightening — IMPLEMENTED / LIVE RLS VERIFIED

Implemented and protected:

- ordinary members see only their own assignment response-presence state;
- `bible_assignment_response_presence` requires self OR verified ministry role;
- ordinary-member UI does not expose peer response presence;
- ministry review remains available;
- static/edge coverage protects the boundary.

Live deployed-database verification on 2026-09-13 showed two ordinary congregation members each saw only their own response-presence row, while the existing admin/ministry role saw both. No persistent test data was created. Browser account switching and true cross-congregation field isolation remain Phase 6 requirements.

### Phase 2 — Admin emergency user management — IMPLEMENTED / DEPLOYED / FIELD MATRIX OPEN

Implemented: suspend/reactivate, force sign-out, owner-only temporary-password action, owner-only email recovery/change, session-revocation attempts, owner protection, secret-safe audit logging, app-side authorization guards, severity/confirmation UX and dedicated contracts.

Production `bq-admin-ops` is deployed with repository contract `OPS_VERSION = 6`, including `change_email`; repository Section I and accumulated regressions are green. Read-only audit inspection on 2026-09-13 found no recorded real suspend/reactivate/force-sign-out/temp-password/email-change test events. Therefore the legitimate authenticated Owner + safe-target action/session-revocation/audit matrix remains release-blocking.

### Phase 3 — Privacy-safe 30-minute presence — IMPLEMENTED / LIVE VERIFIED

Implemented and verified:

- raw `bible_presence` SELECT restricted to ministry roles;
- ordinary signed-in users receive only a scoped aggregate count;
- privileged counting implementation lives in the non-exposed `private` schema;
- exposed `public.bible_presence_active_count(...)` is `SECURITY INVOKER`;
- anon/PUBLIC execution revoked;
- membership/bounded-window checks enforced;
- Home reuses the existing heartbeat owner.

Live member/ministry behavior and transactional privilege-loss were verified on 2026-09-13 and rolled back safely. Security Advisor no longer reports the V4 presence aggregate as an exposed-schema `SECURITY DEFINER` function.

### Phase 4 — Leader Center — OFFICIALLY SKIPPED

Leader Center expansion remains explicitly skipped by user instruction. It is not a V4 release blocker and must not be silently reintroduced.

### Phase 5 — Tutorial + Help Center — CLOSED / ACCUMULATED GREEN

The 9-step guided onboarding, Reader/Assignments/Play/install/Help coverage, trainer states, Help/Tutorial Center, Help route/visual and dedicated contracts are implemented. Exact application SHA `4f908ad8...` passed full accumulated regression, Sections H/I, whole-app browser audit and Cloudflare preview deployment.

### Phase 6 — Integrated field/security/release verification — ACTIVE / PARTIALLY CLOSED

Completed automated/live supporting evidence includes:

- Phase 1 live self-vs-ministry assignment-response RLS verification;
- Phase 3 live member-vs-ministry presence verification;
- transactional privilege-loss verification with rollback;
- production `bq-admin-ops` deployment verification;
- exact application SHA `4f908ad8...` complete accumulated static/security/edge/browser/mobile automation;
- whole-app deep-route/localization/state matrix;
- Cloudflare exact-SHA preview deployment;
- hardened presence/poll aggregate implementation and cleared relevant Security Advisor warnings;
- transaction-only poll aggregate verification with zero residual test rows.

Production topology rechecked on 2026-09-13: one active congregation, six active congregation memberships, seven active app-access rows and eight Auth users. There is no legitimate second populated congregation for Gate C.

`V4_PHASE6_FIELD_EVIDENCE.json` is the machine-readable evidence manifest. `scripts/validate-v4-phase6-field-evidence.mjs` rejects malformed or secret-bearing evidence and, in production-complete mode, must fail unless every required field gate is explicit PASS tied to the certified application SHA. `.github/workflows/v4-phase6-field-evidence.yml` validates schema/readiness on V4 integration PRs and requires production-complete evidence on PRs targeting `main`.

A release-control reconciliation on 2026-09-13 restored the inherited Issue #68 linked-activity field requirement as **Gate G**. Issue #124 explicitly carried Issue #68 safety forward into V4, while Issue #68 remained open because its real authenticated relationship/workflow scenarios had never been completed. Automated Section I coverage and database inspection remain supporting evidence only and do not replace those user/session paths. This reconciliation changes release control only; it does not change certified application bytes.

The seven Phase 6 field gates are:

1. **Gate A — authenticated emergency-action matrix:** legitimate Owner + designated safe target sessions must exercise authorization, force sign-out, suspend/reactivate, temporary password and email change, including real session revocation and secret-safe audit evidence.
2. **Gate B — browser account switching/stale-state clearing:** legitimate separate authenticated sessions must prove private state and privileged controls clear correctly across A→B→A switching, navigation and hard refresh.
3. **Gate C — true cross-congregation isolation:** requires at least two legitimate populated congregations. Current production has only one, so this gate cannot legitimately pass yet.
4. **Gate D — physical Android Chrome at 100% zoom.**
5. **Gate E — physical Android Brave at 100% zoom.**
6. **Gate F — genuinely installed Android PWA acceptance.**
7. **Gate G — inherited Issue #68 linked-activity multi-account field validation:** real authenticated product-path verification of Journey Group create/join/persistence; Journey Group-targeted assignment plus unrelated-account denial; Cloud Team lifecycle/assignment/unauthorized denial; legitimate couple linking/assignment/isolation; couples-challenge one shared pair-day plus correct individual progress/points; cross-session/device Live Room realtime/reconnect/isolation; reload/re-login persistence; and limited read-only post-run confirmation.

No Gate A–G PASS may be manufactured with direct SQL writes, service-role bypass, source inspection, headless emulation where a physical device is required, or fabricated topology. Partial field evidence keeps the applicable gate open.

### Phase 7 — New RC convergence and production release — BLOCKED

Do not freeze RC2+ or promote to `main` yet.

Repository governance finding: `main` is currently unprotected and the repository has no GitHub ruleset. The promotion workflows are tested, but GitHub does not require them server-side before a direct `main` update. Before any real V4 production promotion, a repository administrator must enable branch protection or an equivalent ruleset for `main` requiring PR-based changes and the applicable promotion checks, including the Phase 6 field-evidence gate. Direct `main` updates remain prohibited by the V4 release process until this enforcement is active. The current development connector does not expose repository-administration writes, so this cannot be closed by application code or by weakening CI.

Only after Gates A–G and `main` enforcement are closed:

1. reconcile this file and the acceptance checklist against the final integration head and complete `V4_PHASE6_FIELD_EVIDENCE.json` with sanitized PASS evidence for A–G;
2. freeze a new exact candidate from `v4/modern-ui-overhaul` (normally `release/v4-rc2` or later);
3. run build, architecture, accumulated static/security/edge/browser/mobile, Section H, Section I, protected-page, whole-app, PWA and field-evidence automation on the exact candidate/application tree;
4. deploy that exact candidate to the authoritative `mybiblequest` Cloudflare preview/staging path and verify build identity;
5. run critical-route/runtime/offline/reconnect staging smoke;
6. bind the completed real-session/topology/physical-device evidence to the candidate;
7. promote only that exact certified candidate to protected `main` through the required PR path;
8. verify authoritative `Cloudflare Pages: mybiblequest` production build identity/bytes and production browser behavior;
9. preserve the V3 rollback reference until post-promotion V4 acceptance is complete.

The legacy/secondary `Cloudflare Pages: biblequest` check is not V4 release authority. V4 production acceptance must verify `Cloudflare Pages: mybiblequest` explicitly.

## Current status summary

- Phase 1: implemented/live RLS-verified; session switching/cross-congregation cases remain under Phase 6.
- Phase 2: implemented/deployed; authenticated destructive/recovery/session-revocation field matrix remains.
- Phase 3: implemented/live database/RLS verified.
- Phase 4: intentionally skipped.
- Phase 5: closed; accumulated exact-application automation green.
- Phase 6: active; automated/in-database evidence is strong, but seven real-session/topology/physical-device gates A–G are not all PASS.
- New RC freeze: blocked.
- Production `main`/Cloudflare promotion: blocked by Phase 6 and missing server-side `main` enforcement.
- V4 is **not yet production-release-certified**.

## Supabase security-advisor note

After V4 aggregate hardening, no exposed-schema `SECURITY DEFINER` warning remains for the V4 presence/poll RPCs. Remaining items observed on 2026-09-13 include informational RLS-enabled tables with no client policies and leaked-password protection disabled in Supabase Auth. These are not being silently changed as part of this release-control reconciliation; unrelated production Auth policy must not be broadened without explicit product/security review.

## Historical RC1 evidence — preserved, not current

- accumulated RC1 regression `34694787827` — PASS
- Section I RC1 `34694787800` — PASS
- Section H RC1 `34694787772` — PASS
- RC1 whole-app browser audit `34694787823` — PASS
- Cloudflare RC1 check `103560676216` — SUCCESS
- remote RC1 staging smoke `34697229965` — PASS

## Rollback reference

Preserve until final V4 production acceptance:

- branch: `release/v3.71-japanese-furigana`
- SHA: `c631bea8d5177a9a2ff68139cb104b6fbf26015b`

## Development safety rules

- Keep one serialized integration stream; avoid concurrent uncoordinated runtime ownership changes.
- Repository/CI/live-environment evidence overrides stale chat summaries.
- Do not weaken a valid test or field requirement to obtain green status.
- Preserve single-owner architecture and privacy/isolation contracts.
- Do not claim static/emulated evidence satisfies a specifically live/physical gate.
- Historical checkpoint documents certify only their exact scope/SHA.
- Any document using “current”, “feature-complete”, “release-ready”, “final candidate”, or “remaining blockers” must defer to this file.
- When phase status, blockers, scope or RC identity materially changes, update this file in the same serialized development stream.
