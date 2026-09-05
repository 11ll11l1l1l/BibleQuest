# BibleQuest production-readiness plan — 2026-09-05

This is the current release-priority source of truth. Work from latest `main` on every run. Do not restore retired architectures merely because an old file, branch, PR, test, or comment still exists.

## Current integrated baseline

- **Guest access is the default first-run path.** A new visitor can enter BibleQuest without registering. Account creation/sign-in is optional. Signed-out auth surfaces provide “Continue without an account,” and sign-out returns to guest use.
- **Daily Journey is the primary daily experience everywhere that matters.** Continue My Journey → recall → context → learn → apply → reflect. Modern Home now opens `BQJourneyLoop` directly, reads real Journey completion/resume state, and uses local-calendar date logic. Legacy Daily 5 compatibility code may remain only as non-primary compatibility plumbing and must not compete visually or functionally.
- **Transform is an active standalone route**: Home → Grow → Transformation → `transform.html`. The main SPA does not execute retired Transform runtimes. Transform v2 contains the 20-item Big Five reflection, five thinking-pattern scenarios, action plan, and private local journal.
- **Account creation is immediate** through live `bq-signup` v8: email + password + password confirmation. No email-confirmation/SMTP dependency. Signed-out recovery uses the private rotating recovery code through `bq-password-reset`.
- **ICAC is the production default congregation for new registrations.** Signup resolves the active ICAC record server-side and creates real congregation membership. Owner/Admin correction tools exist for congregation and group membership.
- **Platform and ministry authority are separate.** Platform roles are owner/admin/member. Congregation roles are admin/pastor/leader/facilitator/member.
- **Reader source truth on current `main`:** BSB and Tagalog are delivered in-app; Japanese 口語訳 loads live with Japanese-learning/furigana support; NLT/ESV/NIV/AMP open licensed/official external readers. The open live-NLT PR is not production behavior.
- **Mobile baseline is four persistent bottom tabs.** Narrow-phone readability guards exist but real-device acceptance remains required.
- **PWA cache baseline is v67.** Required shell fetches abort after 8 seconds and remain fatal if unavailable; optional shell fetches abort after 12 seconds and remain non-fatal. Guest access is install-required and controller-change recovery matches the cache version.
- **Admin access discovery is bounded.** `admin-link.js` no longer uses permanent polling or a document-wide MutationObserver; unresolved client/access discovery retries for at most 20 × 500 ms and signed-out state settles immediately.
- **Release validation now covers all production entry documents** (`index.html`, `transform.html`, `psychometrics.html`, `admin.html`, `reset.html`), verifies local asset references/duplicates, auto-discovers `*-static*.mjs` feature guards, and separately runs the broader reliability smoke.
- **The release gate now fails explicitly on doctrinal policy mismatch.** Production pack manifest remains doctrinal policy v1 while runtime classifier is v2; this is a known release blocker, not an ignorable warning.
- **GitHub Actions remain manual-only (`workflow_dispatch`)**. No automatic Actions were restored.

## Corrections integrated by the comprehensive 2026-09-05 audit

1. Guest-first startup, optional account access, explicit guest exit, and logout-to-guest behavior.
2. Guest/auth regression guards and PWA install-required guest shell.
3. Standalone Transform status/documentation cleanup; stale disabled marker/test removed.
4. PWA optional install fetches bounded, then required install fetches bounded; final baseline v67.
5. PWA controller reload flag aligned to the current cache generation.
6. Stale Psychometrics exact-v55 regression assertion replaced with a capability minimum/current cache read.
7. Stale cold-start exact-v62 regression assertion replaced with current guest-first v66+ contract checking.
8. Admin access discovery changed from permanent interval + document-wide observer to bounded lifecycle-driven retries.
9. `modern-home.js` corrected from legacy Daily 5 primary behavior to the real `BQJourneyLoop` Daily Journey, including resume/completion state and local-day handling.
10. Modern Home Bible-source copy corrected to match current Reader behavior: NLT is licensed-link on `main`; Japanese 口語訳 is disclosed; unmerged live-NLT API claims removed.
11. Added Home product-contract regression guard.
12. `scripts/validate-release.mjs` expanded to five production HTML entry points, PWA v67/install contracts, auto-discovered cross-feature static tests, and explicit doctrinal policy-version alignment.
13. Manual validation workflow remains the execution path; this audit did not trigger GitHub Actions.

## Feature audit status

### Implemented and structurally covered

- Guest use, account sign-in/registration UI, recovery-code security, tutorial/onboarding.
- Daily Journey, adaptive review, progression/Bible World, seasons/support paths, avatars/achievements.
- Bible Reader, BSB, Tagalog, Japanese 口語訳 learning support, licensed translation links.
- Question/play modes, story/sequence/context/decks/review surfaces.
- Transform and separate Psychometrics Lab.
- Congregations, ministry roles, Journey Groups, assignments, Cloud Teams, Live Rooms, Play Together, challenges, leaderboards/badges, presence.
- Couple Journey, couple-shared state/challenges and Grow Together.
- Notes, highlights/bookmarks/workspace, cloud profile/progress/devices.
- Owner/Admin & Ministry controls and membership/group correction tooling.
- PWA manifest/service worker/offline shell architecture and narrow-phone static contracts.

Static/source presence is not equivalent to real-browser acceptance. The release validator now makes that distinction explicit rather than treating file existence as proof.

## P0 — release blockers

### 1. Doctrinal/content reconciliation

Generated `data/packs/manifest.json` currently reports doctrinal policy v1 while `data/doctrinal-safety.js` is runtime policy v2. Current corpus: 11,462 questions with 581 quarantined under the generated manifest.

Required:
- reconcile draft PR #53 with current `main` without overwriting guest/PWA/Home/admin changes;
- execute the full current classifier against active + quarantined question union;
- recover safe/context-framed items and keep hard-risk material quarantined;
- regenerate pack/quarantine/manifest outputs at policy v2;
- run release validation, doctrinal safety, content and reference audits before merge.

The canonical release validator now fails until generated/runtime policy versions match.

### 2. Real mobile/browser acceptance

Issue #6 remains open until verified at 320/360/390/412/430 CSS px at 100% zoom on Android browser and installed PWA.

Verify no horizontal page overflow, Daily Journey dominance, readable support text, scrollable Journey path, practical touch targets, header stability, modal/sheet close behavior, Reader, Together, Transform and account surfaces.

### 3. Guest → account → ICAC → recovery E2E

On a clean browser/device profile verify:
1. guest Home opens with no blocking account layer;
2. optional account screen opens and exits cleanly;
3. new v8 signup succeeds;
4. ICAC active membership is created;
5. recovery code is issued/saved;
6. tutorial completes;
7. logout returns to guest mode;
8. login restores profile/progress;
9. recovery-code password reset rotates the code and rejects/locks repeated bad attempts;
10. Owner/Admin correction of congregation/group membership changes effective community context.

Live backend functions/tables exist and earlier signup/login events are present, but this exact post-v8 clean cycle still needs current-build execution evidence.

### 4. Multi-account community field validation

Use multiple real accounts/roles to verify congregation isolation, Pastor/Leader/Facilitator boundaries, Journey Group targeting/capacity, Cloud Team membership, assignments, Live Room reconnect/lifecycle, couple isolation/relink, pair-shared challenges, presence, roster/leaderboard/badges and expired/invalid invite/error states.

### 5. Transform/Android operational acceptance

Verify real Grow → Transformation route, Escape/close, browser Back, Reader/Wisdom return action, reload, progress persistence and offline fallback on Android. Transform is implemented and enabled but not yet physically Android-release-verified.

### 6. PWA/update/offline acceptance

Current merged cache baseline is v67.

Verify fresh install, upgrade from old cache, controller-change reload, slow/stalled network handling, guest first-run, installed-PWA reload, offline Home, cached Reader content, offline Transform after caching, and recovery after network returns.

Required shell failures must fail installation rather than leave an incomplete active worker; stalled required fetches must abort after 8 s; optional failures must settle independently after 12 s.

### 7. Cloudflare deployment identity

A GitHub `main` commit is not proof that Cloudflare has propagated the same SHA. Confirm the deployed static build corresponds to the intended final `main` before release signoff.

## P1 — important hardening before broad promotion

### Runtime/code-sprawl consolidation

`index.html` still boots more than 50 feature scripts. Broad MutationObservers remain in some high-traffic compatibility/enhancement modules (for example Reader translation enhancement and Home compatibility layers). Continue PR #57-style incremental consolidation only with regression evidence; do not big-bang rewrite.

### Reader resilience

Verify representative OT/NT chapters across BSB/Tagalog/Japanese plus licensed-link behavior; test Japanese upstream/CDN failure and retry, Reader narrow-phone layout and offline previously loaded packs. Keep Scripture, context notes, interpretation and application visually distinct.

### Daily Journey cleanup

Primary Home behavior is corrected, but retire obsolete Daily 5 compatibility selectors/copy at source once browser evidence confirms no old entry depends on them. Verify Journey resume/completion/cloud idempotency after refresh/offline transitions.

### Community/Couples

No new surface area until the existing large feature set is field-validated. Prioritize reliability, isolation, role boundaries and clear recoverable errors over adding another mode.

### Security

Browser configuration uses only the Supabase publishable key. Server-only tables with RLS/no browser policies remain intentionally inaccessible. Supabase currently reports leaked-password protection disabled; enable it when available/appropriate for the project plan. Never expose service-role credentials, recovery codes or private reflection data.

### Performance

Continue removing permanent observers/polling from modules where targeted lifecycle events can replace them. Measure startup payload, long tasks, Android memory pressure, Reader pack loading and service-worker update latency before deleting useful backend indexes based only on low-traffic “unused index” advisor notices.

## Release acceptance checklist

Do not call BibleQuest production-ready until all P0 items pass with evidence:

- final Cloudflare build matches intended `main`;
- guest startup/account exit/logout-to-guest works on a clean device;
- current v8 registration → ICAC → recovery → tutorial → logout → login → recovery reset passes end to end;
- Daily Journey starts/resumes/completes and remains the obvious primary action;
- 320–430 px mobile layout passes at 100% zoom;
- Transform passes real Android route/persistence/return/offline checks;
- Reader passes BSB/Tagalog/Japanese and licensed/failure paths;
- generated doctrinal policy equals runtime policy v2 and content audits pass;
- PWA v67 install/update/offline/recovery paths pass under normal and degraded network conditions;
- congregation/groups/teams/rooms/couples/admin privilege boundaries pass multi-account testing;
- all auto-discovered static guards and repository-owned release validation pass;
- no obvious runtime crash, silent no-op, permanent loader, broken local asset reference, stale source claim, forced-registration gate, exposed secret, stale Transform quarantine, competing Daily 5 primary CTA or dummy production content remains.
