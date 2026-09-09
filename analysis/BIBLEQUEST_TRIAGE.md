# BibleQuest Agent Triage

This file is an analysis-only handoff for the primary BibleQuest development process. It lives on `agent-analysis` and must never be merged automatically into `main`.

## Firewall rules

- Current `main` is observed implementation truth; old prompts, branches, milestones, limits, and architecture rules are evidence only.
- Investigators are read-only. Only this triage file may be changed by the firewall agent.
- P3/P4 findings are suppressed from the active development queue.
- Current milestone work outranks P2/P3/P4 findings. Only verified P0/P1 may interrupt it.
- No test is PASS unless actually executed.
- Actionable queue is capped at 3 items and duplicates are consolidated.

## Current actionable queue

### 1. P0 STOP — Existing-device cloud progress can overwrite newer cloud state

- **Evidence state:** STATIC FINDING, independently re-verified against exact current `main` this cycle.
- **Affected user flow:** signed-in user using two or more previously registered devices/browsers.
- **Component/files:** `account.js` — `registerDevice()`, `restoreOrSync()`, `pushProgress()`; cloud table `bible_progress_snapshots`; synchronized keys listed in `PROGRESS_KEYS`.
- **Actual impact:** a previously registered device can retain stale local BibleQuest state and push it over a newer cloud snapshot because device-newness controls restore behavior and the existing-device path lacks a cloud/local freshness, revision, merge, or conflict guard.
- **Reproduction/evidence:** current `registerDevice()` checks whether the device already exists and returns device-newness. `restoreOrSync(isNewDevice)` restores the remote snapshot only when `isNewDevice` is true; otherwise it reaches `await pushProgress()`. `pushProgress()` then upserts the current local snapshot with a new `updated_at`. `PROGRESS_KEYS` spans core state, Reader, sequence/story Journey, Transformation, Growth, Couples, learning/review, and saved-passage state. Destructive multi-device/database reproduction was not performed.
- **Why it passes the impact gate:** direct data-loss/corruption risk affecting normal multi-device persistence/resume.
- **If deferred:** a stale known device can silently replace newer Journey/Reader/review/saved-passage and other synchronized progress; later restores can propagate the stale snapshot.
- **Recommended future correction:** add deterministic conflict handling before an existing-device push, such as cloud/local revision timestamps or per-key version metadata with merge rules. Preserve account/session architecture; do not solve by disabling sync.
- **Regression evidence needed before closure:** executable multi-device test: Device A creates newer progress; previously registered Device B with older state signs in/syncs; A's newer cloud state remains intact; Device C/new device restores the correct final state. Include reload and sign-out/sign-in coverage.

**Verified P1 count: 0.** Narrow-mobile/PWA acceptance remains **NOT EXECUTED**, not failed.

## Deferred / suppressed

- **P2 deferred — recovery-code replacement is non-atomic.** Investigator 4 reports separate retire/insert operations around replacement; password-reset progress may occur before fresh-code issuance completes. This is a meaningful auth-integrity failure-path risk but is narrower and does not outrank the P0 or current milestone. Future correction should make replacement transactional/recoverable and prove failure-injection behavior.
- **Acceptance evidence gap — core browser flows.** Daily Journey, Reader, games, Transformation/Grow, community/live routes and installed-PWA behavior remain partly or wholly NOT EXECUTED on current HEAD. They are not promoted without a reproduced failure.
- **Mobile/PWA evidence gap.** Investigator 3 reports that required 320/360/390/412/430 px and installed-PWA/browser validation is still NOT EXECUTED. Current mobile CSS, manifest, service worker and PWA runtime contain explicit protective behavior, but source inspection does not substitute for runtime acceptance.
- **Suppressed architecture observations (P4).** Investigator 2 found layered Home/UI observers, compatibility wrappers, Reader local state, and modern-Home orchestration, but no separate concrete user/release failure. These do not interrupt development.
- **Suppressed stale/resolved tracking (P4).** Old issue/PR descriptions and earlier Transform/Psychometrics concerns are not current blockers unless reproduced against current `main`.
- **Content/security.** Investigator 4 found no specific currently shipped unsafe Scripture item, broken reference, quarantine leak, or manifest inconsistency. Full doctrinal corpus and complete production auth lifecycle were NOT EXECUTED, so no broader pass is inferred.

## Current cycle — 2026-09-09 18:52 JST

- **Observed `main`:** `6d42c5445a582b55c81e8d925e6d2bc1b92659b9`.
- **Reports available:** Investigator 1, Investigator 2, Investigator 3, and Investigator 4 are all present in the current scheduled-task/conversation context; none is missing.
- **Investigator 1:** no new executable user-facing FAIL. Exact current SHA has successful Cloudflare deployment checks, but deployment success does not prove Home/Reader/Journey/browser behavior. Reconfirms the stale-device cloud overwrite as the only material source-level issue.
- **Investigator 2:** independently de-duplicates the same cloud-sync defect. Layered observers, Modern Home orchestration, Reader local-state ownership, and Community compatibility wrappers have no separate demonstrated user/release failure and remain P4/static observations. No new P1 architecture conflict is established.
- **Investigator 3:** required 320/360/390/412/430 px and installed-PWA/browser acceptance remains NOT EXECUTED. Current source includes mobile-width, four-column bottom-nav, touch-target, safe-area, manifest, service-worker and update protections. No verified UI/PWA regression is established, so this cannot become P1 merely because acceptance evidence is missing.
- **Investigator 4:** reconfirms the same cloud overwrite P0 candidate and recovery-code atomicity P2 candidate; no new material privacy, Scripture/content, or auth failure is established.
- **Independent verification:** exact `main` branch metadata was read this cycle. Current `account.js` was re-read from current main. `registerDevice()` returns whether the device was previously absent; `restoreOrSync(isNewDevice)` only applies the remote snapshot when `isNewDevice` is true and otherwise calls `pushProgress()`; `pushProgress()` unconditionally upserts collected local state. No freshness/version comparison exists in this path. No destructive database/browser test was performed.
- **De-duplication:** Investigators 1, 2 and 4 describe the same cloud-sync failure; it remains one P0 item. Investigator 3's mobile/PWA result is an evidence gap, not a P1. Recovery-code atomicity stays deferred P2.
- **Counterfactual:** deliberately doing nothing about the cloud overwrite until after the milestone can silently destroy newer synchronized user progress, so it remains interrupting. Deferring recovery-code partial-failure handling, mobile/PWA acceptance execution, observer layering, compatibility wrappers, and stale tracking does not present comparably demonstrated immediate harm.
- **Firewall result:** **1 P0 STOP, 0 verified P1, 0 active P2.** No P3/P4 finding may interrupt primary milestone work.

## Historical state retained

- **2026-09-09 09:50–18:52 JST:** every cycle observed the same `main` SHA `6d42c5445a582b55c81e8d925e6d2bc1b92659b9`. The actionable queue consistently remained one P0 stale-device cloud-progress corruption item. Recovery-code atomicity remained deferred P2. Mobile/PWA and core browser paths remained NOT EXECUTED rather than failed. Architecture-only and stale-tracking findings remained suppressed. No cycle established an additional verified P1.