# BibleQuest production-readiness plan — 2026-09-05

This file is the current release-priority source of truth for the Spartan agents. Work from latest `main` on every run. Do not restore retired architectures merely because an old file or PR still exists.

## Product direction

BibleQuest should feel like one coherent Bible-learning journey rather than a collection of unrelated modes. The primary daily path is **Continue My Journey** with five steps: **recall → context → learn → apply → reflect**. One meaningful Bible activity can preserve the streak; completing the full journey gives stronger progress evidence. Scripture itself is never locked behind XP.

Transform remains an important personal-development/reflection area. It is intentionally isolated as `transform.html` because the previous same-page Transform implementations repeatedly destabilized Android. Keep the standalone architecture until real-device evidence justifies changing it.

## P0 — release blockers

1. **Operational stability across every major entry point**
   - Every Home/Play/Read/Grow/Together entry must either open or show a recoverable visible error.
   - No silent optional-chain no-ops, document-wide observer loops, permanent loaders, uncloseable overlays, or feature failure that kills the shell.
   - Real user path for Transform is Home → Grow → Transformation → `/transform.html`.
   - Test close, Escape, return-to-Reader/Wisdom, saved Transform progress, and offline fallback.

2. **Mobile-first acceptance**
   - Issue #6 stays open until verified on 320/360/390/412/430 CSS-px widths at 100% browser zoom.
   - Current audit found the base app has four bottom tabs while `mobile-production.css` still declared a five-column grid and several 6–10 px labels. `mobile-readability.css` corrects the four-column nav and raises critical narrow-phone text sizes; verify it visually rather than assuming CSS is sufficient.
   - No horizontal page overflow. Daily Journey must remain the obvious primary action. Touch targets should be about 44 px or larger where practical.

3. **Immediate registration and recovery-code E2E**
   - Registration: email + password + password confirmation → immediate account → recovery code → English tutorial → Home.
   - Logout/login must work.
   - Forgotten password must require email + recovery code + new password confirmation, rotate the code on success, and lock repeated bad attempts.
   - Signed-in users must be able to issue a fresh recovery code.
   - Never restore SMTP/email-confirmation/reset-link dependency.
   - Public Edge Functions must return client-safe errors only. Live `bq-signup` v7 already contains the safe unexpected-error response; repository source must remain in parity.

4. **Doctrinal/content reconciliation**
   - PR #18 must not be merged as scripts-only work.
   - Run the current classifier across active + quarantined imported questions, review the recovered/quarantined diff, update the manifest to the live policy version, and run all doctrinal/content audits.
   - Release must fail if recoverable questions remain stranded or high-risk items leak into normal play.

5. **Onboarding must teach the actual product**
   - Current production tutorial still describes legacy `Daily 5` in several places. PR #39 contains the intended correction but conflicts with newer `main` and must be rebased/reapplied cleanly.
   - Tutorial must teach Continue My Journey, the five-step flow, one-meaningful-activity streak rule, Bible World, Reader, group/live features, account recovery, and how to reopen the tutorial.

## P1 — complete before broad public promotion

6. **Reader and translation resilience**
   - Verify representative OT/NT chapters for BSB and Tagalog packs.
   - Verify Japanese 口語訳, furigana modes, tokenizer/CDN failure recovery, and narrow-phone layout.
   - Verify NLT connected loading and clear network-failure state.
   - Keep ESV/NIV/AMP on legal licensed-link/live paths unless redistribution permission is explicit.
   - Scripture text, context notes, interpretation, and application must remain visually/data-wise distinct.

7. **Daily Journey consolidation**
   - Legacy `Daily 5` still exists in the older app shell and some modern-home/tutorial surfaces. It should not compete with the production Daily Journey.
   - Route legacy daily CTAs into `BQJourneyLoop` where safe or make them clearly secondary/internal. Remove contradictory copy once compatibility risk is resolved.
   - Daily Journey resume/completion/cloud sync must be idempotent and survive refresh/offline transitions.

8. **Bible World / progression correctness**
   - Users must always understand: current region, completed regions, next unlock, and why progress advanced.
   - Test avatar/world unlock persistence locally and in cloud state.
   - Avoid implying spiritual maturity from XP/progression.

9. **Community feature field validation**
   - Congregation, roster/roles, Journey Groups, assignments, Live Rooms, Play Together, challenges, couples, leaderboards, badges, and presence have broad code coverage but limited real usage.
   - Validate at least two accounts and two roles where applicable. Confirm cross-congregation/couple/group isolation and graceful empty states.

10. **PWA/update/offline reliability**
    - Current cache baseline is v52+ after the mobile readability correction.
    - Verify fresh install, installed-PWA reload, upgrade from an older cache, offline Home, offline Transform, cached Scripture, and network recovery.
    - Large Bible/context libraries must remain on-demand rather than blocking startup/precache.

## P2 — hardening and cleanup

11. **Repository cleanup after stability is proven**
    - Remove obsolete rollback marker files and retired Transform-era documentation only after the standalone v2 route is accepted on real Android.
    - Keep old source/history out of the production execution path.
    - Consolidate layered CSS/JS overrides gradually; do not perform a risky big-bang rewrite before release.

12. **Security hardening**
    - Supabase security advisors currently report intentional server-only BibleQuest tables with RLS but no client policies; keep their anon/authenticated grants closed.
    - Supabase leaked-password protection is still disabled. Treat enabling it as a recommended platform hardening action, not a reason to weaken the custom signup/recovery architecture.
    - Never expose service-role credentials or recovery codes in browser logs/analytics.

13. **Performance and observability**
    - Ignore unused-index INFO notices until real query/load evidence warrants deletion; premature index cleanup can harm future community usage.
    - Capture user-visible error states without logging private reflection/recovery content.
    - Watch startup payload, long tasks, memory pressure, and repeated DOM observers on Android.

14. **Release governance**
    - GitHub Actions remain manual-only (`workflow_dispatch`) and must never be triggered by autonomous agents.
    - Cloudflare Git deployment is the normal deployment path.
    - `main` currently has no branch protection. After the sprint, add lightweight protection/review rules that do not require paid/automatic Actions.
    - Agent 5 is the integration/release gatekeeper. Agents 1–4 should prefer isolated PRs and must not overwrite newer `main`.

## Release acceptance checklist

Do not call BibleQuest production-ready until all P0 items pass with evidence. Minimum acceptance:

- Current Cloudflare SHA matches intended `main`.
- 360–430 px phone layout works at 100% zoom with no horizontal overflow.
- Daily Journey starts, resumes, completes, preserves streak after one meaningful activity, and syncs safely.
- Transform standalone route opens from Grow, remains responsive, persists assessment/reflection state, and returns cleanly.
- New account → recovery code → tutorial → login → password recovery works end to end.
- Reader works across BSB/Tagalog/Japanese plus connected/failure paths.
- Doctrinal manifest/classifier/quarantine are reconciled and audits pass.
- PWA install/update/offline/recovery paths work.
- Major community/admin privilege boundaries are verified.
- No obvious runtime crash, silent no-op, permanent loader, broken link, exposed secret, stale SMTP copy, or dummy production content remains.
