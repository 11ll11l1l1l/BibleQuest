# BibleQuest v3 — final field-validation protocol

Updated: 2026-09-12 JST

This protocol is subordinate to the latest explicit user instruction, `DEVELOPMENT_PRIORITY_V3.md`, `RECONCILIATION_V3.md`, `DEVELOPMENT_HANDOFF_V3.md`, `DEVELOPMENT_STATUS_V3.md`, `RELEASE_OPERATOR_CHECKLIST_V3.md`, and `RELEASE_ACCEPTANCE_MATRIX_V3.md`. It does not redefine product architecture or add release scope. It makes the two remaining field-only release gates executable and auditable.

## Exact baseline and scope

Before each field run, re-check repository truth. At this protocol's creation:

- repository `main`: `2eb099a4eeb598c380521bc00e9c32040958904e` (documentation-only release reconciliation);
- exact-green product: `2c601b3289dba891f349801219f49804f85f63cc`;
- frozen product ref: `release/v3-phase-b-progress-artwork-20260912`;
- exact product regression run: `34633247237` — success;
- exact-green validation integration: `d0eab188479f20273cbd67cb5b796c74868dc5d4`;
- validation run: `34634460077` — success;
- independent two-host production verifier: run `34637203062`, job `103387887268` — success.

The remaining strict release evidence is:

1. Issue #68 real multi-account activity/isolation validation through actual product UI/auth/API/RLS/realtime paths.
2. Issue #6 physical Android Chrome/Brave at 100% zoom plus a genuinely installed-PWA device session.

Do not repeat already-green automated or two-host production gates unless product/runtime bytes change or new evidence invalidates them.

## Non-negotiable test safety

- Use real or dedicated test accounts through the normal product authentication flow.
- Refer to accounts in evidence as Account A/B/C (or similar aliases); do not record passwords, tokens, private email addresses, recovery codes, room secrets, or unrelated personal content.
- Use the production UI and its normal API/Edge Function/RLS paths. Do not insert database rows directly to manufacture PASS.
- Do not weaken authentication, RLS, Edge Function authorization, storage controls, validation, tests, or privacy boundaries.
- Do not use service-role/privileged database access to perform a user action that the UI/API is supposed to perform.
- Read-only database inspection may confirm rows created by the genuine UI run, but it is supporting evidence only; it cannot substitute for UI/session proof.
- Do not change product/runtime code during a field run unless a current-v3 defect has first been reproduced and captured.
- If product/runtime changes, the previous exact-product and production PASS do not transfer to the new SHA.

## Evidence record format

For every scenario record:

- timestamp in JST;
- production host used;
- account aliases and intended roles only;
- device/browser/PWA mode used;
- action performed through the product;
- expected result;
- actual result;
- PASS or FAIL;
- screenshot/video/log reference when useful, with secrets/private content excluded;
- optional read-only database aggregate/row-presence confirmation using IDs only when needed for disambiguation.

A PASS must be based on observed behavior, not code inspection or expected implementation.

## Gate A — Issue #68 multi-account field validation

### Account/session setup

Use at minimum:

- Account A: Congregation Admin or authorized Pastor/Leader able to create/manage the tested activity.
- Account B: Member in the same intended congregation and eligible for the tested group/team/couple/room path.
- Account C: unrelated member/account used for negative-isolation checks. Prefer a different congregation or otherwise outside the tested group/team/couple relationship.
- A second linked partner account where the couples workflow requires an explicit pair distinct from the A/B role arrangement.

Keep A and B signed into genuinely separate sessions. For Live Room and reconnect coverage, prefer separate physical devices or otherwise independent browser/PWA sessions so one cookie/session store cannot masquerade as multi-account behavior.

### A1 — congregation and Journey Group

1. Through UI, create or use the intended test congregation under the authorized account.
2. Through UI, create a Journey Group.
3. Have Account B join through the supported invite/join path.
4. Verify A sees the correct group/member state.
5. Verify B sees the correct joined state after navigation/reload.
6. Verify Account C cannot see private group state or perform group-owner/member-only mutations without legitimate membership.
7. Exercise an invalid invite and an expired/otherwise invalid invite state where supported; verify rejection is clear and does not create membership.
8. Reload and re-login A and B; verify membership and group state remain correct.

PASS requires genuine UI-created relationship state, correct persistence, and negative isolation.

### A2 — Journey Group targeted assignment

1. From the authorized assignment owner, create/target an assignment to the Journey Group through the current Assignments UI.
2. Verify Account B, as a member of that group, receives/sees the assignment through the normal product surface.
3. Verify Account C, outside that group, does not receive/read/mutate the group-targeted assignment.
4. Have B open and complete/respond through the supported assignment workflow.
5. Verify the authorized owner sees only the permitted response/presence state under the current privacy contract.
6. Reload/re-login both sides and verify the expected assignment state persists.

PASS requires correct target visibility, completion path, persistence, and isolation.

### A3 — Cloud Team

1. Through Cloud Teams UI, have authorized Account A create a team.
2. Add Account B through the supported product flow.
3. Verify B sees appropriate team membership/state.
4. Remove and re-add B if the current supported workflow exposes both mutations; verify state transitions accurately.
5. Create/target an assignment to the team through UI.
6. Verify B receives/sees it while Account C outside the team does not.
7. Verify Account C cannot perform team-management mutations without authorization.
8. Reload/re-login A/B and confirm persistence.

PASS requires normal Edge Function/RLS-controlled team operations, correct assignment scope, and negative isolation.

### A4 — linked couple assignment

1. Link the intended two test accounts through the supported couple-link flow.
2. Verify both sides show the active pair relationship after reload/re-login.
3. Create/target or launch a couples assignment through the current supported UI path.
4. Verify it opens the linked Couple Journey/cloud owner rather than an unrelated local-only module.
5. Verify an unrelated Account C cannot read or mutate the couple's private relationship/activity data.
6. Verify unlink/relink behavior only if it is an explicitly supported production action needed for acceptance; do not destructively alter real user relationships.

PASS requires the current linked-couple owner and privacy boundary to behave correctly across both accounts.

### A5 — couples-type congregation challenge

1. With a valid linked test pair, enter the supported couples-type congregation challenge through UI.
2. Complete the same applicable challenge day/activity as required by the current workflow.
3. Verify pair history records one shared pair day rather than duplicate pair-day entries.
4. Verify individual progress/points remain attributable to the individual accounts according to the product contract.
5. Reload/re-login and confirm pair-shared history plus personal progress remain consistent.
6. Verify unrelated Account C cannot read/mutate private couple state.

PASS requires one pair-shared day plus correct individual progression semantics, with duplicate protection and isolation.

### A6 — Live Room cross-session/device

1. Account A hosts a Live Room through the production UI.
2. Account B joins through the supported room-code/join flow from a separate session/device.
3. Verify both participants enter the same intended room/session and receive current room state.
4. Exercise the normal room question/interaction cycle sufficiently to prove repeated state propagation rather than a single lucky event; use the issue/current product's supported session length and do not invent a different game contract.
5. Verify B's responses/actions are visible only as allowed by the current room/privacy contract and that scoring/ranking/progression, where applicable, remains coherent across repeated rounds.
6. Refresh B mid-session; verify safe recovery/rejoin behavior.
7. Disconnect/reconnect network or close/reopen the browser/PWA as practical; verify the supported reconnect path does not duplicate membership/responses or corrupt room state.
8. Re-login if the current room flow supports retaining/rejoining an active session and verify behavior matches the product contract.
9. Attempt an invalid/expired room code and verify rejection without leaking private room data.
10. Verify unrelated Account C cannot access a private/unauthorized room state or mutate it except through the legitimate join path.

PASS requires cross-session/device realtime behavior, repeated interactions, correct reconnect semantics, and privacy/isolation.

### A7 — supporting read-only production confirmation

Only after the genuine UI flows above, read-only inspection may confirm expected activity in relevant tables such as:

- `bible_groups` / `bible_group_members`;
- `bible_teams` / `bible_team_members`;
- assignment targeting/response-presence owners under the current schema;
- active couple/pair challenge history owners;
- `bible_shared_sessions` / `bible_session_participants` / `bible_room_responses`.

Confirm only the rows/counts/timestamps/relationship IDs needed to prove the UI-created activity reached the intended owner. Do not expose response text, private content, tokens, emails, or secrets in release evidence.

Issue #68 may close only when all required current field scenarios pass. A partial run is evidence, not gate closure.

## Gate B — Issue #6 physical Android / installed-PWA validation

The historical Issue #6 body contains obsolete four-tab/nine-node wording. Test the current v3 five-destination shell: Home, Learn, Play, Grow, More. Bible World is a separate feature route.

### B1 — Android Chrome at 100% zoom

On a physical Android device using current Chrome:

1. Open the canonical production host at normal browser zoom (100%; do not zoom out to make layout fit).
2. Verify Home loads with no document-level horizontal scrolling.
3. Verify header/account controls fit without overlap or clipped required controls.
4. Verify Daily Journey remains immediately discoverable and tappable.
5. Verify critical body/support text is readable without browser zoom.
6. Verify all five bottom-navigation destinations are visible, usable, and not clipped.
7. Open Home, Learn, Play, Grow and More; verify primary content stays inside the viewport and controls remain usable.
8. Open Reader plus at least one accepted Phase-B surface (for example Calendar, Account, Progress/Grow, Avatar Vault, or Mission) and verify no artwork/control clipping blocks use.
9. Rotate once if device orientation behavior is supported; verify returning to portrait restores a usable layout.
10. Record PASS/FAIL and sanitized screenshots for any failure.

### B2 — Android Brave at 100% zoom

Repeat B1 in current Brave on the same or equivalent physical Android device. This is a distinct field check; Chrome PASS must not be transferred to Brave.

### B3 — genuinely installed PWA device session

1. Install BibleQuest using the browser's supported PWA/install flow from the canonical production host.
2. Launch BibleQuest from the installed app icon, not from an ordinary browser tab.
3. Verify it opens in the expected standalone/app presentation.
4. Verify Home and all five primary destinations remain usable with no required zoom-out or horizontal page scrolling.
5. Verify at least Reader and the release-critical accepted surfaces used in B1 can be opened from the installed app.
6. With the app previously loaded, exercise the supported offline-shell path by making the device offline and relaunching/navigating only to the extent the current offline contract promises. Verify the shell fails safely where network data is required rather than becoming unusable or exposing stale/private data incorrectly.
7. Restore network and verify recovery without reinstalling.
8. Close the installed app completely, relaunch it, and verify navigation/session behavior remains coherent.
9. If an update/reload prompt appears under the current PWA contract, exercise the normal user path and verify the app returns to a usable current shell.

PASS requires a real installed-device session. Browser installability checks or headless standalone emulation do not substitute for this evidence.

## Failure handling and development route

If any field step fails:

1. Mark that exact scenario FAIL and preserve the smallest reproducible sequence plus sanitized evidence.
2. Determine whether the failure is reproducible on the current exact production product rather than assuming a stale issue description still applies.
3. Identify the true architectural owner from current v3 architecture and feature documentation.
4. Reject patch-arounds: speculative global CSS, uncontrolled `!important`, duplicate DOM/components/feature owners, wrong-owner JavaScript shims, copied legacy implementations, catch-all exception swallowing, auth/RLS/storage bypasses, direct backend mutation to hide a frontend defect, weakened/skipped tests, or validator changes made only to obtain green.
5. Correct only the demonstrated root cause in the correct owner.
6. Establish the new exact candidate SHA.
7. Run the complete required exact-SHA release cycle again: Cloudflare build/deploy gate, architecture/static validators, edge/security/privacy regressions, accumulated browser/mobile tests, explicit phone widths, accessibility/reduced motion, PWA/offline, visual asset/fallback checks, functional smoke, and console/page-error checks.
8. Promote only the exact changed SHA that passes the required gates.
9. Re-run independent live-production proof for changed runtime/product bytes.
10. Re-run the affected physical/multi-account field scenario; do not transfer the old PASS.

If a failure is only an outdated acceptance statement rather than a product defect, reconcile the documentation explicitly; do not change the current architecture to recreate obsolete behavior.

## Final release decision

Under the current strict release matrix, official release completion requires:

- Issue #68 field matrix passed or an explicit user-approved release waiver documented;
- Issue #6 Android Chrome, Brave, and installed-PWA device checks passed or an explicit user-approved release waiver documented;
- current automated exact-candidate gates remain valid for the exact product;
- independent two-host production proof remains valid for the exact product;
- no reproduced release-blocking defect remains open;
- Cloudflare-internal provider metadata is required only if release policy explicitly demands that separate evidence class.

Do not call BibleQuest bug-free. Do not close a field gate from static code review, headless emulation, database inspection alone, or expected behavior.