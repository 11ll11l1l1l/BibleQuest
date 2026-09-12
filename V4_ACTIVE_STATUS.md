# BibleQuest V4 Official Active Status

Updated: 2026-09-13 JST
Execution model: one serialized development stream
Official active integration branch: `v4/modern-ui-overhaul`
Tracking issue: #124

## Authority and reading rule

**This file is the single authoritative source for the current BibleQuest V4 development status, current phase state, current release path, and current blockers.**

Before selecting or evaluating V4 work, read this file first, then `V4_DOCUMENTATION_AUTHORITY.md`, then `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` as needed. Repository branch/commit/CI/live-backend evidence overrides stale chat context. Historical certification documents remain evidence only for the exact SHA/scope they certified.

## Current integration checkpoint

Latest fully accumulated application checkpoint verified before this documentation-only reconciliation:

- official branch: `v4/modern-ui-overhaul`
- exact application SHA: `4f908ad8b53f3feb00f21ae27dd4707597b5aa14`
- full accumulated regression run `34711333244` — PASS
- V4 Section I security/privacy run `34711333231` — PASS
- V4 Section H responsive/accessibility/performance/PWA automation run `34711333240` — PASS
- V4 whole-app browser audit run `34711333234` — PASS
- Cloudflare exact-SHA preview check `103600570475` — SUCCESS

The release-control/CI head later advanced without changing certified application bytes. Verification-only PR #167 exercised the real future `main` target from exact head `60e31b8d68832a40f4db44b26824b1865c539413` and passed all six promotion-path suites:

- accumulated regression `34713371772` — PASS;
- V4 Section H `34713371784` — PASS;
- V4 Section I `34713371795` — PASS;
- protected-page audit `34713371801` — PASS;
- Cloudflare exact-SHA preview smoke `34713371805` — PASS;
- whole-app browser audit `34713371845` — PASS.

The exact Cloudflare preview used by that deployed smoke was `https://3284208e.mybiblequest.pages.dev`. The deployed run passed the maintained 42-route 320/430 px deep-route audit, whole-app browser-state matrix, PWA install regression, offline shell, and operational recovery. PR #167 was closed without merge after capturing the evidence; it was only a gate exercise and was not a production promotion path.

Application-byte certification remains tied to `4f908ad8...`; documentation/release-control-only commits do not invalidate the tested application tree, but a later runtime/application change requires new applicable evidence.

## Release-state decision

Frozen V4 RC1 remains historical only:

- branch: `release/v4-rc1`
- SHA: `cf58fa2e467f70f1c4a963b4ca50e33f11da9983`
- PR #151

Do not promote RC1 by default. Official post-RC1 development continued and the next production candidate must be a new exact RC only after the remaining Phase 6 field gates are legitimately closed.

## Post-RC1 development program

### Phase 1 — Assignment privacy tightening — IMPLEMENTED / LIVE RLS VERIFIED

Checkpoint: `release/v4-phase1-assignment-privacy`.

Implemented and protected:

- ordinary members see only their own assignment response-presence state;
- `bible_assignment_response_presence` requires self OR a verified ministry role;
- ordinary member UI does not expose peer response presence;
- ministry review remains available;
- static/edge coverage protects the boundary.

Live deployed-database verification on 2026-09-13:

- two different ordinary congregation members each saw exactly one response-presence row and only their own row;
- the existing admin/ministry role saw both response-presence rows;
- no persistent test data was created for this verification.

Remaining Phase-6 concerns for this family are browser/auth-session account-switching and true cross-congregation field topology; these must not be inferred from RLS inspection alone.

### Phase 2 — Admin emergency user management — IMPLEMENTED / DEPLOYED / AUTHENTICATED ACTION FIELD TESTS REMAIN

Checkpoint: `release/v4-phase2-admin-emergency`.

Implemented:

- suspend/reactivate account;
- force sign-out;
- owner-only temporary-password action with minimum length and self-target protection;
- owner-only account email recovery/change;
- session-revocation attempts after applicable credential/access changes;
- owner protection rules;
- audit logging without temporary-password value or old/new email values;
- app-side authorization/guard behavior;
- user-management card organization by identity, congregation/group membership, and security/access;
- safe/elevated/critical severity treatment;
- typed confirmation for destructive suspension, email-change, and deletion paths;
- dedicated static/browser contracts.

Live backend state:

- production `bq-admin-ops` is deployed at OPS_VERSION 6 and matches the repository action surface, including `change_email`;
- Supabase-side authorization/grant structure has been inspected;
- repository Section I and accumulated regressions are green.

Release blocker still open: suspend/reactivate/force-sign-out/temp-password/email-change and their resulting session revocation/audit records have **not** all been exercised through legitimate real authenticated owner + target sessions. Static tests, SQL role impersonation, or source inspection do not substitute for this requirement.

### Phase 3 — Privacy-safe 30-minute presence — IMPLEMENTED / LIVE VERIFIED

Checkpoint: `release/v4-phase3-presence`.

Implemented:

- raw `bible_presence` SELECT restricted to ministry roles;
- public signed-in count RPC returns only an aggregate;
- privileged counting implementation is now in the non-exposed `private` schema;
- exposed `public.bible_presence_active_count(...)` is `SECURITY INVOKER` and delegates to the private implementation;
- anon/PUBLIC execution is revoked;
- membership and bounded-window checks remain enforced;
- Home uses the privacy-safe recent-active count and reuses the existing heartbeat owner.

Live deployed-database verification on 2026-09-13:

- ordinary member: aggregate callable for own congregation while raw presence rows were hidden;
- ministry/admin role: intended raw presence rows visible;
- uncommitted role-demotion test: raw presence visibility dropped from 4 rows to 0 immediately; transaction rollback restored the real admin role;
- Supabase Security Advisor no longer reports the presence RPC as an exposed-schema `SECURITY DEFINER` function.

Phase 3 database/RLS verification is therefore closed. Real browser stale-session/account-switch behavior remains part of the broader Phase 6 field matrix.

### Phase 4 — Leader Center — OFFICIALLY SKIPPED

The Leader Center expansion remains explicitly skipped by user instruction. It is not a V4 release blocker and must not be silently reintroduced.

### Phase 5 — Tutorial + Help Center — CLOSED / ACCUMULATED REGRESSION GREEN

Implemented:

- guided onboarding expanded to 9 steps;
- Reader, Assignments, Play, installation and Help are covered;
- trainer states updated for the 9-step flow;
- `TUTORIAL_STEP_COUNT` is 9;
- always-available Help and Tutorial Center exists;
- Help visual/icon and More entry point are wired;
- Help route is wired;
- dedicated Phase 5 contract coverage exists;
- stale old-step smoke assumptions were corrected;
- Daily Journey tutorial action/navigation is on the correct step.

Closure evidence: exact application SHA `4f908ad8...` passed the full accumulated regression, Section H, Section I and whole-app browser audit, and deployed successfully to Cloudflare preview. Phase 5 is no longer an active implementation tranche.

### Phase 6 — Integrated security/backend/role-transition verification — ACTIVE / PARTIALLY CLOSED

Completed evidence:

- Phase 1 live self-vs-ministry assignment response-presence RLS verification;
- Phase 3 live member-vs-ministry presence verification;
- live role-demotion/privilege-loss database behavior verified transactionally and rolled back safely;
- production `bq-admin-ops` OPS_VERSION 6 deployed;
- pre-RC1 Section I isolation regression remains green;
- exact integrated application SHA `4f908ad8...` passed the complete accumulated static/security/edge/browser/mobile automation;
- whole-app deep-route/localization/state matrix is green;
- Cloudflare exact-SHA preview deployment is green;
- presence and poll privileged aggregate implementations were moved out of the exposed public schema and live Security Advisor warnings for these functions were cleared;
- transaction-only live poll aggregate test returned correct totals with zero residual test poll/vote rows.

Still release-blocking:

1. **Real authenticated emergency-action matrix** — owner + safe target account sessions must exercise suspend, reactivate, force sign-out, temporary-password and email-change behavior, including authorization boundaries, real session revocation and audit records without secret leakage.
2. **Real browser account switching / stale-state clearing** — automated isolation tests are green, but the field requirement for legitimate separate authenticated sessions remains open.
3. **True cross-congregation field isolation** — the connected production topology currently has only one populated congregation, so a legitimate second-congregation field scenario has not been demonstrated.
4. **Physical Android installed-PWA acceptance** — required on an actually installed PWA.
5. **Physical Android Chrome at 100% zoom** — required.
6. **Physical Android Brave at 100% zoom** — required.

These gates must not be replaced by headless/emulated browser evidence when the requirement explicitly calls for real authenticated sessions or a physical device.

### Phase 7 — New RC convergence and production release — BLOCKED BY PHASE 6 FIELD GATES

Do not freeze RC2 or promote to `main` yet.

Release-control enforcement finding (2026-09-13): repository `main` is currently unprotected and the repository has no GitHub ruleset. The six main-target workflow suites have been proven green through verification-only PR #167, but GitHub does not currently require those checks server-side before a direct `main` update. **Before any real V4 production promotion, a repository administrator must enable branch protection or an equivalent repository ruleset for `main` that requires PR-based changes and the applicable promotion checks. Direct `main` updates remain prohibited by the V4 release process until that enforcement is active.** The current development connector does not expose GitHub repository-administration writes, so this setting cannot be closed by application code or by weakening CI.

Once all Phase 6 blockers above are legitimately closed and the `main` enforcement requirement above is active:

1. reconcile this file and `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` against the final integration head;
2. freeze a new exact candidate from `v4/modern-ui-overhaul` (normally `release/v4-rc2` or later);
3. run build, architecture, complete accumulated static/security/edge/browser/mobile, Section H, Section I, protected-page, whole-app and PWA automation on that exact candidate/application tree;
4. deploy the exact candidate to the authoritative `mybiblequest` Cloudflare preview/staging path and verify build identity;
5. run critical-route/runtime/offline/reconnect staging smoke;
6. attach/record the completed real-session and physical-device field evidence;
7. promote only the exact certified candidate to protected `main` through the required PR path;
8. verify the authoritative `mybiblequest` Cloudflare production build identity/bytes and production browser behavior;
9. preserve the known-good V3 rollback reference until post-promotion acceptance is complete.

The repository currently also reports a legacy/secondary Cloudflare Pages check named `Cloudflare Pages: biblequest` on some commits. It is **not** V4 release authority. The V4 promotion workflow and candidate identity gate use `Cloudflare Pages: mybiblequest`; production acceptance must verify that authoritative project explicitly so a successful legacy check cannot be mistaken for release evidence.

## Current status summary

- Phase 1: implemented and live RLS-verified; browser account-switch/cross-congregation field cases remain under Phase 6.
- Phase 2: implemented and deployed; real authenticated destructive/recovery/session-revocation field matrix remains.
- Phase 3: implemented and live database/RLS verified.
- Phase 4: intentionally skipped.
- Phase 5: closed; accumulated exact-head automation green.
- Phase 6: active; automated/in-database portions substantially closed, but authenticated-session, cross-congregation and physical-device gates remain.
- New RC freeze: blocked.
- Production `main`/Cloudflare promotion: blocked by Phase 6 and by missing server-side `main` protection/ruleset enforcement.
- V4 is **not yet production-release-certified**.

## Supabase security-advisor note

After the V4 aggregate hardening, no exposed-schema `SECURITY DEFINER` warning remains for the V4 presence/poll RPCs. Remaining advisor items observed on 2026-09-13 are:

- informational RLS-enabled tables with no client policies (intentionally inaccessible surfaces require separate scope review before any change);
- leaked-password protection disabled in Supabase Auth (pre-existing account-hardening setting, not silently changed during this V4 release stream).

Do not broaden release scope by changing unrelated production Auth policy without explicit product/security review.

## Historical RC1 evidence — preserved, not current

- full accumulated RC1 regression `34694787827` — PASS;
- Section I RC1 security/privacy `34694787800` — PASS;
- Section H RC1 responsive/accessibility/performance/PWA automation `34694787772` — PASS;
- RC1 whole-app browser audit `34694787823` — PASS;
- Cloudflare exact-RC1 deployment check `103560676216` — SUCCESS;
- remote RC1 staging smoke `34697229965` — PASS.

## Rollback reference

Preserve until final V4 production acceptance:

- branch: `release/v3.71-japanese-furigana`
- SHA: `c631bea8d5177a9a2ff68139cb104b6fbf26015b`

## Development safety rules

- Keep one serialized integration stream; avoid concurrent uncoordinated runtime ownership changes.
- Repository/CI/live-environment evidence overrides stale chat summaries.
- Do not weaken a valid test to obtain green status.
- Preserve single-owner architecture and privacy/isolation contracts.
- Do not claim static/emulated evidence satisfies a specifically live/physical gate.
- Historical checkpoint documents certify only their exact scope/SHA.
- Any document using “current”, “feature-complete”, “release-ready”, “final candidate”, or “remaining blockers” must defer to this file for current V4 meaning.
- When phase status, blockers, scope or RC identity materially changes, update this file in the same serialized development stream.
