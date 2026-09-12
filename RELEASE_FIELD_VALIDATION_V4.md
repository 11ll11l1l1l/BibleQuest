# BibleQuest V4 — Phase 6 field-validation protocol

Updated: 2026-09-13 JST

This protocol is subordinate to `V4_ACTIVE_STATUS.md`, `V4_DOCUMENTATION_AUTHORITY.md`, and `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`. It does not redefine V4 scope, weaken a release gate, or authorize production. Its purpose is to make the remaining Phase 6 field-only gates executable, safe, and auditable.

## Exact baseline and scope

Before every field run, re-check repository truth. At this protocol's creation:

- official integration branch: `v4/modern-ui-overhaul`;
- integration head before this documentation-only protocol: `7c6ebff9f5953b91670eb284e5a4eb8966c6a2a7`;
- latest fully accumulated application checkpoint: `4f908ad8b53f3feb00f21ae27dd4707597b5aa14`;
- full accumulated regression `34711333244` — PASS;
- Section I security/privacy `34711333231` — PASS;
- Section H responsive/accessibility/performance/PWA automation `34711333240` — PASS;
- whole-app browser audit `34711333234` — PASS;
- Cloudflare exact-SHA preview check `103600570475` — SUCCESS;
- production `bq-admin-ops`: deployed with repository contract `OPS_VERSION = 6`;
- production topology observed on 2026-09-13: one active/populated congregation, so a true cross-congregation field scenario is not currently available.

Documentation-only commits do not change the certified application bytes. If runtime/application bytes change, establish and verify a new exact application SHA before transferring any prior automation evidence.

The remaining release-blocking field gates are:

1. real authenticated emergency-action matrix using a legitimate owner and designated safe target account;
2. real browser account switching / stale-state clearing using legitimate separate authenticated sessions;
3. true cross-congregation field isolation using a legitimate second populated congregation;
4. physical Android Chrome at 100% zoom;
5. physical Android Brave at 100% zoom;
6. physical Android installed-PWA acceptance;
7. inherited Issue #68 linked-activity field validation using legitimate separate authenticated accounts/sessions for Journey Groups, targeted assignments, Cloud Teams, linked couples, couples challenge semantics, Live Rooms, persistence and isolation.

Gate 7 restores an inherited release requirement that remained explicitly open in Issue #68 before V4 branched. V4 automation and database inspection protect these paths, but the project rules do not allow those forms of evidence to replace the required real multi-account field exercise.

Do not freeze RC2+ or promote to `main` until all applicable gates above are legitimately closed.

## Non-negotiable safety rules

- Use the normal production authentication and product UI/API/Edge Function/RLS paths.
- Use dedicated test accounts or explicitly designated safe accounts. Never select an arbitrary real member for destructive credential/session testing.
- Do not record passwords, temporary passwords, auth tokens, recovery links/codes, private email addresses, room secrets, or unrelated personal content in evidence.
- Use aliases such as Owner A, Target B, Member C, Member D.
- Do not use service-role access, direct database mutations, SQL role impersonation, or source inspection as a substitute for a user/session action that the field gate requires.
- Read-only database inspection may corroborate UI-created results, but it cannot manufacture a PASS.
- Do not weaken authentication, RLS, Edge authorization, storage controls, privacy boundaries, tests, or validators to make a scenario pass.
- Do not create a fake second production congregation solely to obtain a release PASS. The cross-congregation gate requires legitimate topology.
- Do not change a real member's email/password, suspend them, or revoke their sessions without explicit designation as the safe target.
- Physical-device requirements must run on a physical Android device. Headless/emulated browser evidence does not substitute.
- A failed field test is a release blocker until the demonstrated root cause is corrected, the required exact-SHA gates are rerun, and the affected field scenario passes.

## Evidence record

For every scenario, record:

- JST timestamp;
- exact application/candidate SHA and production/preview host used;
- account aliases and intended roles only;
- device model, Android version, browser and browser version where relevant;
- installed-PWA vs ordinary browser mode;
- action performed through the product;
- expected behavior;
- observed behavior;
- PASS or FAIL;
- sanitized screenshot/video/log reference when useful;
- optional read-only database confirmation limited to IDs/counts/timestamps/audit action names needed for disambiguation.

A PASS must be based on observed behavior. Code inspection, expected implementation, SQL impersonation, or automated emulation alone is not field evidence.

## Gate A — authenticated admin emergency-action matrix

### A0 — safe setup

Required:

- Owner A: legitimate active owner account permitted to perform the operation;
- Target B: dedicated or explicitly designated safe non-owner target account whose credentials/sessions may be invalidated during the run;
- at least two genuinely independent Target B authenticated sessions when testing session revocation;
- a controlled recovery email address for the email-change scenario that is safe to use and can receive/authenticate as needed.

Before the test, confirm Target B contains no production-only personal data or relationship state that would make suspension/credential replacement unsafe.

### A1 — authorization boundaries

1. Sign in as Owner A through the normal product flow.
2. Open the supported Admin user-management surface and select Target B.
3. Confirm emergency controls are available only at the intended privilege level.
4. Verify self-target protections prevent prohibited destructive owner actions where specified.
5. If a lower-privileged legitimate admin/member test session is available, confirm it cannot invoke owner-only temporary-password or email-change actions.
6. Confirm failed/forbidden actions do not mutate Target B.

PASS requires UI and backend authorization to agree; frontend hiding alone is insufficient.

### A2 — force sign-out

1. Keep Target B signed in to two independent sessions.
2. From Owner A, execute Force Sign-Out through the product.
3. Observe both Target B sessions without manually clearing storage first.
4. Verify protected data/actions cease to be available according to the normal auth/session refresh behavior and reauthentication is required.
5. Confirm the audit record identifies the operation/actor/target without token or secret leakage.

PASS requires real session effect, not merely a successful admin response toast.

### A3 — suspend / reactivate

1. With Target B active and signed in, suspend Target B through Owner A's product UI.
2. Verify Target B cannot continue protected use or establish a normal authenticated session while suspended.
3. Verify Owner A still retains access and owner protection rules remain intact.
4. Reactivate Target B through the supported UI.
5. Verify Target B can again authenticate normally after the expected product/auth refresh path.
6. Confirm suspension/reactivation audit records contain no secrets.

PASS requires both enforcement and successful supported recovery.

### A4 — temporary password

1. With Target B explicitly designated safe, use Owner A's temporary-password operation through the product.
2. Verify the UI enforces the current minimum-length/confirmation rules.
3. Verify existing Target B sessions are revoked/invalidated according to the implemented contract.
4. Verify the old credential no longer authenticates if the platform operation is intended to replace it.
5. Verify the temporary credential authenticates only as intended and does not expose the value in audit/log surfaces.
6. Restore Target B to its intended controlled test credential/state through the supported path after evidence is captured.

Do not place the temporary password itself in release evidence.

### A5 — email change/recovery

1. Use only the controlled recovery address designated for Target B.
2. From Owner A, execute the supported email-change/recovery operation through the product.
3. Verify existing sessions are revoked/invalidated according to the implemented contract.
4. Verify the intended new email identity is used for subsequent normal authentication/recovery behavior.
5. Verify audit/log surfaces identify the operation but do not contain old/new email values when the product contract intentionally redacts them.
6. Restore Target B's intended controlled test identity through the supported path when required.

Do not use a real unrelated person's email address.

### A6 — supporting read-only production verification

After genuine UI/auth runs, read-only inspection may confirm:

- expected emergency action names and timestamps exist in the admin audit surface/table;
- actor/target identifiers correspond to the designated aliases;
- no temporary-password value, auth token, recovery secret, or intentionally redacted email value is stored in the audited payload;
- access/status state after reactivate is correct.

Read-only inspection cannot substitute for session behavior observed in A2–A5.

Gate A closes only when all required supported actions and authorization/session-revocation behaviors pass with legitimate sessions.

## Gate B — real browser account switching / stale-state clearing

Use two legitimate ordinary accounts in separate sessions. Where practical, use one ordinary account plus the designated owner/ministry account to exercise role differences without sharing browser storage.

1. Sign in as Account A and visit release-critical authenticated surfaces including Home assignment/status, Assignments, congregation/community state, presence-dependent Home state, and other stateful surfaces touched by Phase 1–3.
2. Record only non-sensitive state necessary to recognize Account A's ownership/context.
3. Sign out through the product; do not manually wipe browser storage to hide a stale-state defect.
4. Sign in as Account B through the normal product flow.
5. Verify Account A's private assignment/response-presence, congregation/member-specific state, cached controls, role-only actions, and private identifiers do not remain rendered or actionable.
6. Navigate away/back, hard-refresh, and exercise the normal session refresh path.
7. Sign out B and return to A; verify A's correct state returns without B leakage.
8. Where supported, repeat once across an independent browser/profile/device to distinguish a shared-storage artifact from backend isolation.

PASS requires no stale private UI state, no stale privileged controls, and correct backend authorization after each switch. A visual clear with backend authorization leakage is FAIL; correct backend denial with stale private rendering is also FAIL.

## Gate C — true cross-congregation field isolation

Current production topology has only one active/populated congregation. This gate remains BLOCKED until a legitimate second populated congregation exists through normal product use or an explicitly authorized test topology.

When legitimate topology exists, use separate sessions for Congregation 1 and Congregation 2 accounts and exercise release-critical congregation-scoped surfaces through normal UI flows:

1. assignments/assignment response-presence;
2. raw-vs-aggregate presence behavior according to role;
3. groups/teams/couples/live-room or other private congregation-scoped surfaces in the current release contract;
4. navigation/reload/relogin behavior.

For each surface verify:

- Congregation 1 cannot read or mutate Congregation 2 private/scoped state without a legitimate relationship;
- Congregation 2 cannot read or mutate Congregation 1 private/scoped state;
- IDs/invite codes/deep links do not bypass eligibility when such inputs exist;
- aggregate/publicly intended data remains limited to its defined contract and does not reveal raw private rows;
- stale browser state does not preserve the prior congregation's private data after switching accounts.

PASS requires genuine distinct populated-congregation topology. SQL-created stand-ins or role impersonation are supporting diagnostics only and do not close this field gate.

## Gate D — physical Android Chrome at 100% zoom

On a physical Android device using current Chrome at normal browser zoom:

1. Open the exact candidate preview/staging host during RC certification; repeat the critical smoke on canonical production after promotion.
2. Verify no document-level horizontal scrolling at the device's normal zoom.
3. Verify safe-area/header/account controls and all five primary destinations — Home, Learn, Play, Grow, More — remain visible and usable.
4. Verify Home Daily Journey, assignment/status card, shortcut rail, recent-active aggregate, and Help entry remain usable without clipping/overlap.
5. Verify Reader, Assignments, Calendar, Daily Journey, Progress/Grow, Help/Tutorial Center, Account and at least one representative Community surface.
6. Verify interactive controls have usable touch targets and no required control is hidden behind browser/system UI.
7. Rotate portrait/landscape once where supported and return to portrait; verify the layout recovers correctly.
8. Exercise sign-in/sign-out/reload on the device if a safe test account is available.
9. Record browser/device versions and sanitized failure evidence.

PASS must be from a physical device at normal zoom; zooming out to make a broken layout fit is FAIL.

## Gate E — physical Android Brave at 100% zoom

Repeat Gate D in current Brave on the same or equivalent physical Android device. Chrome PASS cannot be transferred to Brave.

Pay particular attention to installability/PWA prompts, storage/session behavior, viewport/safe-area behavior, offline/reconnect behavior, and any default privacy/shields behavior that changes required first-party resources. Record the exact default setting before changing browser configuration.

## Gate F — genuinely installed Android PWA

On a physical Android device:

1. Install BibleQuest through a supported browser install flow from the exact candidate preview/staging host if installable there; otherwise use the documented candidate/production install path without changing application bytes.
2. Launch from the installed app icon, not an ordinary browser tab.
3. Confirm expected standalone/app presentation.
4. Verify Home and Home/Learn/Play/Grow/More navigation at 100% scale with no document overflow.
5. Open Reader, Assignments, Calendar, Daily Journey, Help/Tutorial Center and a representative authenticated surface.
6. With the shell previously loaded, disconnect network and exercise only the behavior promised by the current offline contract. Verify the app fails safely for network-required private data and does not expose another account's cached private state.
7. Restore network and verify reconnect/recovery without reinstalling.
8. Close the installed app fully and relaunch; verify coherent navigation/session state.
9. If a service-worker/update prompt appears under the current contract, use the normal user flow and verify the app returns to a usable current shell.
10. Repeat the relevant account-switch/stale-state observation if two legitimate test accounts are safely available on the device.

PASS requires a genuinely installed PWA session. Browser installability checks or headless `display-mode: standalone` emulation are not substitutes.

## Gate G — inherited Issue #68 linked-activity multi-account field validation

This gate restores the release evidence explicitly left open by Issue #68 before V4 development branched. The existing v3 guarded harnesses and V4 Section I automation are supporting evidence only. Gate G requires actual separate authenticated accounts/sessions through normal product UI/API/RLS/realtime paths.

Use at least three legitimate authenticated account aliases (A/B/C) as needed to prove allowed relationships and unrelated-account denial. Do not record credentials, emails, invite/room secrets, or tokens.

Required scenarios:

1. **Congregation + Journey Group create/join and persistence.** Create/join through the product, verify expected membership state, then reload/re-login and confirm persistence.
2. **Journey Group-targeted assignment.** Verify intended member visibility/completion plus denial for an unrelated authenticated account.
3. **Cloud Team lifecycle + assignment.** Exercise supported create/add/remove/re-add operations, team-targeted assignment behavior, and unauthorized-management denial.
4. **Linked-couple workflow.** Complete/accept a legitimate test couple link through the product, verify linked-couple assignment ownership, and verify unrelated-account isolation.
5. **Couples congregation challenge semantics.** Verify exactly one pair-shared day while personal progress/points remain correctly individual, including persistence.
6. **Cross-session/device Live Room.** Verify host/join, participant/end propagation, route/hard-refresh reconnect/rejoin without duplicate membership or stale state, ended/unknown-code rejection, close/reopen or real network reconnect where practical, and privacy/isolation. No room question/scoring loop is required unless the current product actually exposes one.
7. **Reload/re-login persistence.** Repeat the applicable relationship/workflow state after normal reload and reauthentication.
8. **Read-only post-run confirmation.** After UI-created activity, use only limited read-only inspection to confirm the minimum row counts/relationship IDs/timestamps needed to prove the intended owners received the activity. Direct database writes never count as field evidence.

Gate G PASS requires all eight scenarios to pass using normal product paths and real authenticated sessions. A partial run is evidence but keeps Gate G open. If topology blocks one scenario, record it as pending rather than manufacturing a PASS.

## Failure handling

If any field step fails:

1. Mark that exact scenario FAIL and preserve the smallest reproducible sequence with sanitized evidence.
2. Reproduce against the current exact candidate/application bytes before treating historical issue text as authoritative.
3. Identify the true architecture/feature owner from current V4 documentation.
4. Fix the demonstrated root cause only; do not add duplicate owners, catch-all shims, global CSS patchwork, auth/RLS bypasses, direct DB mutation workarounds, skipped tests, or validator weakening.
5. Establish the new exact application/candidate SHA.
6. Re-run all applicable exact-SHA automated release gates: build/deployment, architecture/static validation, full accumulated regression, Section H, Section I, protected-page checks, whole-app browser audit, phone widths/accessibility/reduced motion/PWA/offline, and Cloudflare preview identity/smoke.
7. Re-run every field scenario affected by the changed bytes. Do not transfer an old PASS across a relevant runtime change.
8. Keep the V3 rollback ref intact until V4 production acceptance is complete.

If the failure is an obsolete acceptance statement rather than a product defect, reconcile documentation explicitly through the serialized V4 integration stream; do not distort the architecture to recreate obsolete behavior.

## Phase 6 completion record

Do not mark Phase 6 closed until the evidence record contains explicit PASS entries for:

- [ ] Gate A — authenticated emergency-action matrix;
- [ ] Gate B — account switching / stale-state clearing;
- [ ] Gate C — true cross-congregation field isolation;
- [ ] Gate D — Android Chrome 100%;
- [ ] Gate E — Android Brave 100%;
- [ ] Gate F — installed Android PWA;
- [ ] Gate G — Issue #68 linked-activity multi-account field validation.

When all seven are closed, update `V4_ACTIVE_STATUS.md` and `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` in the same serialized stream, then enter Phase 7. Do not infer closure from this protocol itself.

## Phase 7 handoff after field PASS

Only after Phase 6 is legitimately closed:

1. freeze a new exact candidate from `v4/modern-ui-overhaul` (normally `release/v4-rc2` or later);
2. run all required automated/security/privacy/browser/PWA gates against that exact candidate;
3. deploy that exact candidate to Cloudflare preview/staging and verify identity;
4. run critical-route/runtime/offline/reconnect staging smoke;
5. attach the Phase 6 field evidence to the candidate record;
6. promote only that exact certified candidate to `main`;
7. verify Cloudflare production build identity/bytes;
8. run production critical-route/browser smoke after propagation;
9. keep `release/v3.71-japanese-furigana` @ `c631bea8d5177a9a2ff68139cb104b6fbf26015b` available until final post-promotion acceptance.

V4 must not be described as production-release-certified before this sequence completes.
