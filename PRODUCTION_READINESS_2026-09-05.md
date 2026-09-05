# BibleQuest production-readiness plan — 2026-09-05

This is the current release-priority source of truth for the Spartan agents. Work from latest `main` on every run. Do not restore retired architectures merely because an old file, branch, PR, or comment still exists.

## Current integrated baseline

The following decisions are already integrated and must be preserved:

- **Daily Journey is the primary daily experience**: Continue My Journey → recall → context → learn → apply → reflect. One meaningful Bible activity can preserve the streak; full completion gives stronger progress evidence. Scripture itself is never locked behind XP.
- **Transform is a standalone route**: Home → Grow → Transformation → `transform.html`. The main SPA must not execute the retired Transform runtimes. Transform v2 contains the 20-item Big Five reflection, five thinking-pattern scenarios, action plan, and private local journal.
- **Account creation is immediate** through live `bq-signup` v8: email + password + password confirmation. No email-confirmation/SMTP dependency. Email is an unverified sign-in ID. Signed-out recovery uses the private rotating recovery code through `bq-password-reset`.
- **ICAC is the production default congregation for new registrations.** Signup resolves the active ICAC record at runtime, creates a real `bible_congregation_members` row as `member`, and fails closed if ICAC is not configured. The browser's free-text church field is not trusted by the signup backend.
- **Owner/Admin can repair membership mistakes.** Admin & Ministry can set/remove a user's congregation, assign congregation ministry roles, create/assign/remove small groups, set group leaders, and transfer small-group ownership. Membership moves protect congregation/group owners and are audit logged.
- **Platform and ministry authority are separate.** Platform roles are owner/admin/member. Congregation roles are admin/pastor/leader/facilitator/member. Pastor/Leader are congregation-scoped titles and never arise merely from profile church text.
- **Owner access is explicit.** The signed-in platform Owner gets visible OWNER / PLATFORM OWNER identity and direct Admin & Ministry access.
- **The registration/tutorial surface is intentionally English.** The tutorial now teaches Continue My Journey rather than legacy Daily 5 and can be reopened later.
- **Mobile baseline is v52+**. The persistent app shell has four bottom tabs; Transform is not a fifth persistent tab. Narrow-phone readability guards prevent the previous 6–10 px support text baseline.
- **Stale rollback markers were removed.** Old Transform-era source/history can remain for audit/history only when it is not production-loaded.
- **GitHub Actions are manual-only (`workflow_dispatch`)**. Autonomous agents must never trigger them or add automatic triggers.

## P0 — release blockers

### 1. Operational stability across every major entry point

Every Home/Play/Read/Grow/Together entry must either open correctly or show a recoverable visible error. No silent optional-chain no-ops, document-wide mutation feedback loops, permanent loaders, uncloseable overlays, or feature failure that kills the shell.

Transform acceptance is specifically the real user path: Home → Grow → Transformation → `/transform.html`. Verify close, Escape, return-to-Reader/Wisdom, saved assessment/reflection progress, browser Back behavior, reload, and offline fallback. Do not replace this with only direct JavaScript API tests.

Draft PR #57 contains the current Wave 2 runtime/mobile consolidation and is intentionally not merged until executable browser/PWA evidence is available. Its integration branch must remain reconciled with current `main` without overwriting newer Admin/auth/community work.

### 2. Mobile-first real-device acceptance

Issue #6 stays open until verified at 320/360/390/412/430 CSS-px widths at 100% browser zoom. Current code has corrected the four-column bottom navigation and raised critical support text sizes, but CSS inspection is not sufficient evidence.

Acceptance:
- no horizontal page overflow;
- no zoom-out required;
- Daily Journey remains visually dominant;
- Journey path scrolls rather than compressing all regions;
- supporting text is comfortably readable;
- primary controls are approximately 44 px or larger where practical;
- Android browser and installed-PWA behavior are both checked.

### 3. Immediate registration, ICAC membership, and recovery-code E2E

Run a clean production cycle on a new test account:
1. register with email + password + password confirmation;
2. confirm the new account is automatically assigned to the live ICAC congregation as an active `member`;
3. receive the private recovery code;
4. complete the protected English tutorial;
5. reach Home;
6. logout/login;
7. recover password using email + recovery code + new password confirmation;
8. confirm the old code is invalidated and a new recovery code is issued;
9. verify repeated bad recovery codes lock out safely;
10. while signed in, issue a new recovery code from Account → Security;
11. from an Owner/Admin account, correct the test user's congregation and small-group assignment, then verify the user's effective community context follows the corrected membership.

Public Edge Functions must return client-safe errors only. Live `bq-signup` v8 resolves ICAC server-side and live `bq-admin` v7 contains the protected membership/group actions. Repository/live source parity must remain exact. Never restore `auth.signUp`, email-confirmation copy, SMTP reset links, or `resetPasswordForEmail`.

### 4. Doctrinal/content reconciliation

Draft PR #53 supersedes closed/unmerged PR #18 and is the current content-correctness blocker. It must not be merged as scripts-only work.

Required sequence:
- run the current doctrinal classifier across the union of active imported packs and quarantined questions;
- allow currently safe/context-framed questions to return to normal learning;
- keep hard-risk material quarantined;
- review the generated recovered/quarantined diff rather than hand-editing imported Scripture study answers;
- update the pack manifest to the current policy version;
- run doctrinal safety, content audit, source/reference, and release validation scripts locally;
- commit the regenerated pack/quarantine/manifest output before merge.

Release must fail if recoverable items remain stranded or high-risk items leak into normal play.

### 5. PWA/update/offline release validation

Current merged production service-worker cache baseline remains v59. Draft Wave 2 PR #57 rotates the intended next shell to v60, but v60 is not production until that PR passes its executable acceptance gate and is merged.

Verify:
- fresh install;
- ordinary browser reload;
- upgrade from an older service-worker cache;
- installed-PWA reload;
- offline Home;
- offline standalone Transform;
- cached Scripture content already opened on the device;
- network recovery after offline/failed CDN state;
- no stale release after a Cloudflare deployment.

Large Bible/context libraries must remain on-demand rather than blocking startup or being indiscriminately precached.

**Deployment evidence note:** GitHub `main` and the live Supabase function versions can be verified from the development environment. Direct DNS/web access to `mybiblequest.pages.dev` is currently unavailable from that environment, so static Cloudflare propagation must be independently verified before release acceptance. Do not infer deployment success from a GitHub merge alone.

## P1 — complete before broad public promotion

### 6. Reader and translation resilience

Verify representative OT and NT chapters across the actual user flows:
- BSB bundled/on-demand packs;
- Tagalog packs;
- Japanese 口語訳;
- difficult-word/all-furigana/off modes;
- tokenizer/CDN failure and retry;
- narrow-phone Reader layout;
- NLT connected/licensed-link behavior and clear network-failure state;
- ESV/NIV/AMP remain on legal licensed-link/live paths unless redistribution permission is explicit.

Scripture text, context notes, interpretation, and application must remain visibly and structurally distinct.

### 7. Daily Journey consolidation

Legacy Daily 5 code still exists for compatibility and older game paths. It must not compete with the production Daily Journey.

- Route legacy daily CTAs to `BQJourneyLoop` where safe or label them clearly as secondary game/review modes.
- Remove contradictory user-facing copy when compatibility risk is understood.
- Daily Journey resume/completion/cloud sync must be idempotent and survive refresh/offline transitions.
- Wrong answers should feed useful review without making the user feel progression was lost.

Draft Wave 2 PR #57 contains the next consolidation step but remains gated on executable browser/PWA validation.

### 8. Bible World / progression correctness

Users must always understand:
- current region;
- completed regions;
- next unlock;
- why progress advanced;
- what action to take next.

Test avatar/world unlock persistence locally and in cloud state. Never imply spiritual maturity, holiness, or faith level from XP/progression.

### 9. Community/Admin feature field validation

Congregation, roster/roles, small groups, Journey Groups, assignments, Live Rooms, Play Together, challenges, couples, leaderboards, badges, and presence have broad implementation coverage but limited real usage.

Current production governance to preserve:
- all new registrations default to the live ICAC congregation as `member`;
- Owner/Admin can directly repair congregation and small-group assignments;
- congregation roles are admin/pastor/leader/facilitator/member;
- group roles are member/leader, with explicit group ownership that must be transferred before the owner can be removed/moved;
- platform Owner/Admin authority remains separate from ministry roles;
- password/recovery secrets remain user-controlled.

Use at least two test accounts and multiple roles. Verify:
- default ICAC signup membership;
- Owner/Admin correction of an intentionally wrong congregation/group assignment;
- pastor/leader/facilitator capability boundaries;
- group ownership transfer and capacity enforcement;
- cross-congregation/couple/group isolation;
- room lifecycle, empty states, reconnect behavior, and graceful cloud failure.

Do not add more community features until the existing ones are field-validated.

### 10. Transform quality after stability

Transform is important and must stay available, but reliability comes before expanding its scope.

Current v2 requirements to preserve:
- 20-item IPIP-style Big Five reflection with reverse-key scoring;
- no claim that scores are moral, spiritual, clinical, or employment judgments;
- five thinking-pattern scenarios;
- reflection/action plan;
- private journal stored on device by default;
- Scripture references kept separate from psychological interpretation.

Only after stable Android evidence should Transform add optional cloud synchronization. Personality/reflection data must never be uploaded by default without explicit user choice.

## P2 — hardening and cleanup

### 11. Startup architecture / code-sprawl reduction

The main page currently loads a large number of feature scripts and styles. This increases interaction risk, startup work, and the chance of global event-handler collisions.

Do not perform a big-bang rewrite. Instead:
- inventory which modules are truly required at boot;
- lazy-load feature-specific modules when their hub/feature opens;
- eliminate duplicate global listeners and stale compatibility shims only with regression evidence;
- keep app-shell, auth, Daily Journey, navigation, recovery, and Admin access stable during consolidation.

### 12. Security hardening

Supabase security advisors may report BibleQuest tables with RLS enabled but no policy. These are intentionally server-only only if anon/authenticated table grants remain closed; verify rather than adding permissive policies.

Supabase leaked-password protection is still disabled. Enabling it is recommended platform hardening and is independent of the custom immediate-signup/recovery architecture.

Never expose service-role credentials, recovery codes, private reflection text, or sensitive profile data in browser logs/analytics.

### 13. Performance and observability

Unused-index notices are informational until actual usage data justifies index deletion. Do not remove community/auth indexes merely to make the advisor list shorter.

Priorities:
- startup payload and long tasks;
- Android memory pressure;
- repeated DOM observers/listeners;
- Reader/large-pack loading;
- service-worker update latency;
- user-visible failure states without collecting private reflection/recovery content.

### 14. Release governance

`main` still lacks branch protection. After the sprint, add lightweight protection/review rules that do not depend on paid or automatic Actions.

Agent rules:
- Agents 1–4 work on isolated owned problems and re-fetch current main before every write.
- Agent 5 is the release/integration gatekeeper.
- Do not merge stale PRs blindly.
- Do not overwrite newer commits.
- Prefer one proven release improvement per run over feature churn.
- No autonomous GitHub Actions runs.

## Release acceptance checklist

Do not call BibleQuest production-ready until all P0 items pass with evidence:

- Current Cloudflare SHA/static deployment matches intended `main`.
- 320–430 px phone layout works at 100% zoom with no horizontal overflow.
- Daily Journey starts, resumes, completes, preserves streak after one meaningful activity, and syncs safely.
- Transform opens through the real Grow route, remains responsive, persists progress, and returns cleanly.
- New account → automatic ICAC membership → recovery code → English tutorial → login → password recovery works end to end.
- Owner/Admin can correct congregation/small-group membership and role boundaries work with multiple accounts.
- Reader works across BSB/Tagalog/Japanese plus connected/failure paths.
- Doctrinal manifest/classifier/quarantine are reconciled and audits pass.
- PWA install/update/offline/recovery paths work.
- Major community/admin privilege boundaries are verified with multiple accounts/roles.
- No obvious runtime crash, silent no-op, permanent loader, broken link, exposed secret, stale SMTP copy, contradictory Daily 5 onboarding, or dummy production content remains.
