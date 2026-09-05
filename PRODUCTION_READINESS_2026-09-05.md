# BibleQuest production-readiness plan — 2026-09-05

This is the current release-priority source of truth. Work from latest `main` on every run. Do not restore retired architectures merely because an old file, branch, PR, test, or comment still exists.

## Current integrated baseline

- **Guest access is the default first-run path.** A new visitor must be able to enter BibleQuest without registering. Account creation/sign-in is optional and remains available from the app. Registration should be prompted contextually when cloud/account-only features are useful, not used as a startup gate.
- **Daily Journey is the primary daily experience**: Continue My Journey → recall → context → learn → apply → reflect. One meaningful Bible activity can preserve the streak; full completion gives stronger progress evidence. Scripture itself is never locked behind XP.
- **Transform is an active standalone route**: Home → Grow → Transformation → `transform.html`. The main SPA does not execute the retired Transform runtimes. `transform.html` loads the isolated `transformation-v2.js` runtime and v2 styles. Transform v2 contains the 20-item Big Five reflection, five thinking-pattern scenarios, action plan, and private local journal. The former production quarantine is historical only.
- **Account creation is immediate** through live `bq-signup` v8: email + password + password confirmation. No email-confirmation/SMTP dependency. Email is an unverified sign-in ID. Signed-out recovery uses the private rotating recovery code through `bq-password-reset`.
- **ICAC is the production default congregation for new registrations.** Signup resolves the active ICAC record at runtime, creates a real `bible_congregation_members` row as `member`, and fails closed if ICAC is not configured. The browser's free-text church field is not trusted by the signup backend.
- **Owner/Admin can repair membership mistakes.** Admin & Ministry can set/remove a user's congregation, assign congregation ministry roles, create/assign/remove small groups, set group leaders, and transfer small-group ownership. Membership moves protect congregation/group owners and are audit logged.
- **Platform and ministry authority are separate.** Platform roles are owner/admin/member. Congregation roles are admin/pastor/leader/facilitator/member. Pastor/Leader are congregation-scoped titles and never arise merely from profile church text.
- **Owner access is explicit.** The signed-in platform Owner gets visible OWNER / PLATFORM OWNER identity and direct Admin & Ministry access.
- **The registration/tutorial surface is intentionally English.** The tutorial teaches Continue My Journey rather than legacy Daily 5 and can be reopened later.
- **Reader translations are intentionally mixed by licensing model.** BSB and Tagalog are delivered in-app; Japanese 口語訳 is loaded live with Japanese-learning/furigana support; NLT/ESV/NIV/AMP use truthful licensed-reader links unless explicit redistribution permission is available.
- **Mobile baseline is four persistent bottom tabs.** Transform is reached through Grow rather than as a fifth persistent tab. Narrow-phone readability guards exist but real-device acceptance remains required.
- **PWA cache baseline is v63** after the guest-access correction. Guest access is part of the install-required shell so installed-app updates do not restore the forced-registration behavior.
- **GitHub Actions are manual-only (`workflow_dispatch`)**. Autonomous work must never restore automatic push/pull-request/schedule triggers.

## Corrections integrated by the 2026-09-05 evening audit

1. Added `guest-access-hardening.js` so unauthenticated first-run users are not blocked by the account registration overlay.
2. Preserved an explicit optional account entry for guests so they can sign in or create an account when they choose.
3. Added guest-access regression assertions to `tests/auth-flow-static-smoke.mjs`.
4. Rotated the service-worker cache to v63 and made guest-access hardening install-required.
5. Removed the stale `transform-disabled.marker` and converted `TRANSFORM_QUARANTINE.md` to historical documentation.
6. Removed the obsolete Transform-quarantine static smoke test.
7. Aligned `scripts/validate-release.mjs` with the current external standalone `transformation-v2.js` architecture and the guest-access shell.

## P0 — release blockers

### 1. Operational stability across every major entry point

Every Home/Play/Read/Grow/Together entry must either open correctly or show a recoverable visible error. No silent optional-chain no-ops, document-wide mutation feedback loops, permanent loaders, uncloseable overlays, or feature failure that kills the shell.

Transform acceptance is the real user path: Home → Grow → Transformation → `/transform.html`. Verify close, Escape, return-to-Reader/Wisdom, saved assessment/reflection progress, browser Back behavior, reload, and offline fallback.

Draft PR #57 remains the current Wave 2 runtime/mobile consolidation. It is intentionally not merged until executable browser/PWA evidence is available and must be reconciled with newer `main` rather than overwriting guest/auth/admin/community work.

### 2. Mobile-first real-device acceptance

Issue #6 stays open until verified at 320/360/390/412/430 CSS-px widths at 100% browser zoom.

Acceptance:
- no horizontal page overflow;
- no zoom-out required;
- Daily Journey remains visually dominant;
- Journey path scrolls rather than compressing all regions;
- supporting text is comfortably readable;
- primary controls are approximately 44 px or larger where practical;
- Android browser and installed-PWA behavior are both checked.

### 3. Guest entry + registration + ICAC membership + recovery-code E2E

Run a clean production cycle on a new device/browser profile:
1. open BibleQuest with no account/session and confirm Home is usable without registration;
2. open the optional account entry and create an account with email + password + password confirmation;
3. confirm the new account is automatically assigned to the live ICAC congregation as an active `member`;
4. receive and save the private recovery code;
5. complete the protected English tutorial and reach Home;
6. logout and confirm the app remains usable as a guest rather than forcing registration;
7. login again and confirm cloud profile/progress restoration;
8. recover password using email + recovery code + new password confirmation;
9. confirm the old recovery code is invalidated and a new recovery code is issued;
10. verify repeated bad recovery codes lock out safely;
11. while signed in, issue a new recovery code from Account → Security;
12. from an Owner/Admin account, correct the test user's congregation and small-group assignment, then verify effective community context follows the corrected membership.

Public Edge Functions must return client-safe errors only. Live `bq-signup` v8 resolves ICAC server-side and live `bq-admin` contains protected membership/group actions. Never restore browser `auth.signUp`, email-confirmation copy, SMTP reset links, or `resetPasswordForEmail`.

### 4. Doctrinal/content reconciliation

Draft PR #53 remains the current content-correctness blocker. The generated production manifest is still on doctrinal policy v1 while the runtime policy is v2.

Required sequence:
- reconcile PR #53 with latest `main` without overwriting guest/PWA/auth changes;
- run the current doctrinal classifier across the union of active imported packs and quarantined questions;
- recover currently safe/context-framed questions;
- keep hard-risk material quarantined;
- review the generated recovered/quarantined diff rather than hand-editing imported Scripture-study answers;
- regenerate pack/quarantine/manifest output to the current policy version;
- run doctrinal safety, content audit, source/reference, and release validation locally before merge.

Release must fail if recoverable items remain stranded or high-risk items leak into normal play.

### 5. PWA/update/offline release validation

Current merged service-worker cache baseline is v63.

Verify:
- fresh install;
- ordinary browser reload;
- guest first-run while online;
- guest first-run/update in installed-PWA state;
- upgrade from an older service-worker cache;
- installed-PWA reload;
- offline Home;
- offline standalone Transform after its assets have been cached;
- cached Scripture content already opened on the device;
- network recovery after failed CDN/API state;
- no stale release after Cloudflare deployment.

Large Bible/context libraries must remain on-demand rather than blocking startup or being indiscriminately precached.

**Deployment evidence:** a GitHub `main` commit is not proof that Cloudflare has propagated the same SHA. Static deployment propagation must be independently verified before release acceptance.

## P1 — complete before broad public promotion

### 6. Reader and translation resilience

Implemented architecture:
- BSB bundled/on-demand packs;
- Tagalog local packs;
- Japanese 口語訳 live loading with Japanese learning/furigana support;
- NLT connected/licensed reader behavior;
- ESV/NIV/AMP licensed external-reader paths.

Still verify representative OT and NT chapters, tokenizer/CDN/API failure and retry, narrow-phone Reader layout, and Japanese learning modes. Scripture text, context notes, interpretation, and application must remain visibly and structurally distinct.

### 7. Daily Journey consolidation

Daily Journey is integrated and is the intended primary daily surface. Legacy Daily 5 compatibility code still exists and must not compete with it.

Verify resume/completion/cloud sync idempotency across refresh/offline transitions. Wrong answers should feed useful review without making the user feel progression was lost. Draft PR #57 contains further consolidation but remains browser/PWA-gated.

### 8. Bible World / progression correctness

Bible World navigation has been recovered and progression/world/avatar systems are present. Users must always understand current region, completed regions, next unlock, why progress advanced, and what action comes next.

Test avatar/world unlock persistence locally and in cloud state. Never imply spiritual maturity, holiness, or faith level from XP/progression.

### 9. Tutorial/onboarding

The English tutorial is integrated, teaches Daily Journey, account recovery, and the major app surfaces, and can be reopened from Account. Verify the trainer/avatar positioning and screenshots/callouts on actual narrow phones rather than considering file presence sufficient.

### 10. Community/Admin/Play Together field validation

Broad implementation exists for congregation membership, roster/roles, small groups, Journey Groups, assignments, Cloud Teams, Live Rooms, Play Together, challenges, couples, leaderboards, badges, and presence.

Recent hardening covers ICAC default membership, Owner/Admin correction tools, pastor/leader role parity, small-group ownership transfer, room score/write integrity, and scoped community writes. This area is **implemented but not sufficiently field-validated**.

Use at least two test accounts and multiple roles. Verify default ICAC signup membership, intentionally wrong membership correction, pastor/leader/facilitator boundaries, group ownership transfer/capacity enforcement, cross-congregation/couple/group isolation, room lifecycle/reconnect, and graceful cloud failure.

Do not add more community surface area until existing features are field-validated.

### 11. Couples

Couple Journey, shared pair state, cloud support, congregation-linked challenges, and visible cloud-read failure handling are implemented. Verify pair isolation, unlink/relink behavior, two-device consistency, and challenge history with real accounts.

### 12. Transform + Psychometrics

Transform is enabled through the standalone route and is no longer quarantined. Quick Transform v2 includes a 20-item Big Five reflection, five thinking-pattern scenarios, reflection/action plan, and private device-local journal. Psychometrics Lab is a separate deeper route.

Status remains **implemented but not Android-release-verified**. Do not add default cloud synchronization for private personality/reflection data. Real Android-browser reproduction testing is required before calling the feature stable.

## P2 — hardening and cleanup

### 13. Startup architecture / code-sprawl reduction

The main page still loads many feature scripts and styles. Reduce boot complexity incrementally through feature lazy-loading, duplicate-listener removal, and compatibility cleanup only with regression evidence. Do not perform a big-bang rewrite.

### 14. Security hardening

Keep Supabase server-only tables closed to browser roles where intended. Verify RLS/grants rather than adding permissive policies. Supabase leaked-password protection remains recommended platform hardening.

Never expose service-role credentials, recovery codes, private reflection text, or sensitive profile data in browser logs/analytics.

### 15. Performance and observability

Priorities are startup payload/long tasks, Android memory pressure, repeated DOM observers/listeners, Reader/large-pack loading, service-worker update latency, and user-visible failure states without collecting private reflection/recovery content.

### 16. Release governance

`main` still lacks lightweight branch protection. Add protection/review rules after the sprint without restoring automatic Actions usage.

## Release acceptance checklist

Do not call BibleQuest production-ready until all P0 items pass with evidence:

- Cloudflare static deployment matches the intended current `main` SHA.
- A completely new user can enter as a guest without registration or a blocking account overlay.
- 320–430 px phone layout works at 100% zoom with no horizontal overflow.
- Daily Journey starts, resumes, completes, preserves streak after one meaningful activity, and syncs safely.
- Transform opens through the real Grow route, remains responsive on Android, persists progress, and returns cleanly.
- Optional registration → automatic ICAC membership → recovery code → English tutorial → logout-to-guest → login → password recovery works end to end.
- Owner/Admin can correct congregation/small-group membership and role boundaries work with multiple accounts.
- Reader works across BSB/Tagalog/Japanese plus licensed/failure paths.
- Doctrinal manifest/classifier/quarantine are reconciled to the current policy and audits pass.
- PWA install/update/offline/recovery paths work, including the v63 guest-access shell.
- Major community/admin privilege boundaries are verified with multiple accounts/roles.
- No obvious runtime crash, silent no-op, permanent loader, broken link, exposed secret, stale quarantine marker, forced-registration startup gate, stale SMTP copy, contradictory Daily 5 onboarding, or dummy production content remains.
