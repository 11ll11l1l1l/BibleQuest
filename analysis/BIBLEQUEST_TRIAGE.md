# BibleQuest Agent Triage

Analysis-only handoff on `agent-analysis`. Current `main` is implementation truth. Only verified P0/P1 may interrupt milestone work; P2 is deferred; P3/P4 are suppressed. No test is PASS unless executed. Actionable queue cap: 3.

## Current actionable queue

### 1. P0 STOP — Existing-device cloud progress can overwrite newer cloud state

- **Evidence:** STATIC FINDING, independently re-verified on current `main`.
- **Flow:** signed-in multi-device persistence/resume; ordinary Journey changes can reach the same broad progress push.
- **Files/components:** `account.js` (`PROGRESS_KEYS`, `registerDevice()`, `restoreOrSync()`, `pushProgress()`), `journey-cloud-sync.js` (`sync()`, `bq-journey-change`), `bible_progress_snapshots`.
- **Impact:** a previously registered device with stale local state can push that state over newer cloud progress because restore behavior depends on device-newness and the push path has no demonstrated freshness/revision/merge guard. The synchronized snapshot covers core state, Reader, Journey/story, Transformation, Growth, Couples, learning/review, and saved passages.
- **Reachability:** current `journey-cloud-sync.js` handles `bq-journey-change`, schedules `sync()`, upserts daily Journey status, then calls `BQAccount.pushProgress()`; this is the same underlying persistence defect, not a separate finding.
- **Impact gate:** direct data-loss/corruption risk affecting normal multi-device use.
- **If deferred:** newer synchronized progress can be silently rolled back and later restored to other devices.
- **Future correction:** add deterministic conflict handling before broad snapshot writes using revisions/timestamps or per-key merge rules; do not disable sync.
- **Closure evidence:** executable multi-device regression test where Device A has newer cloud state, stale registered Device B syncs and performs a normal Journey change, and newer state is preserved/merged correctly; verify reload and sign-out/sign-in.

**Verified P1: 0.**

## Deferred / suppressed

- **No active P2 this cycle.** The previously carried recovery-code atomicity concern is demoted to **UNKNOWN/P4 historical observation** because the latest Investigator 4 review did not establish sufficient current-main evidence for a replayable, non-atomic, or otherwise unsafe recovery path. It must not interrupt development unless new current evidence demonstrates material auth-integrity impact.
- **NOT EXECUTED:** core browser flows, required 320/360/390/412/430 px mobile matrix, installed-PWA behavior, deployed Supabase RLS/auth lifecycle, exhaustive Scripture/translation corpus integrity, and doctrinal/content audit. Evidence gaps are not failures.
- **P4 suppressed:** layered observers, Modern Home orchestration, Reader local-state ownership, Journey summary persistence, Community compatibility wrappers, service-worker/manifest architecture observations, and similar complexity with no separate demonstrated user/release failure.

## Current cycle — 2026-09-10 05:49 JST

- **Observed `main`:** `6d42c5445a582b55c81e8d925e6d2bc1b92659b9`.
- **Reports available:** Investigator 1, 2, 3, and 4; none missing.
- **Investigator 1:** no new executable core-flow FAIL; stale existing-device cloud overwrite remains its only demonstrated material functional risk. Startup/Home/navigation, Reader, Journey completion/resume, Transformation/Grow, games, and Community remain NOT EXECUTED.
- **Investigator 2:** de-duplicates the same P0 and confirms ordinary Journey activity can reach `BQAccount.pushProgress()`. Other ownership/observer/compatibility observations remain P4 because no separate user or release failure is demonstrated.
- **Investigator 3:** no demonstrated UI/mobile/PWA/route regression. Required 320/360/390/412/430 px responsive acceptance and installed-PWA/offline/recovery behavior remain NOT EXECUTED rather than failed; source review found no material route defect.
- **Investigator 4:** independently identifies the same cloud overwrite risk as its only demonstrated material data/auth/content/safety issue. Recovery-code/reset atomicity and deployed RLS enforcement are UNKNOWN on current evidence; Scripture/reference/translation integrity and doctrinal/content safety remain NOT EXECUTED. No additional P0/P1 is established.
- **Independent verification:** exact `main` branch metadata was re-read. Current `account.js` still contains the broad `PROGRESS_KEYS` snapshot plus the existing-device registration/restore-or-sync structure reported by Investigators 1/2/4. Current `journey-cloud-sync.js` still listens for `bq-journey-change`, schedules `sync()`, upserts `bible_daily_journey_status`, and then calls `BQAccount.pushProgress()`. No destructive browser/database test was performed.
- **Counterfactual:** deferring the cloud overwrite can silently destroy newer user progress, so it remains interrupting. Deferring the other findings currently shows no comparable immediate harm.
- **Firewall result:** **1 P0 STOP, 0 verified P1, 0 active P2.**

## Historical state

From 2026-09-09 09:50 through 2026-09-10 05:49 JST, every triage cycle observed the same `main` SHA. The queue consistently remained one P0 stale-device cloud-progress corruption item; mobile/PWA and core browser paths remained NOT EXECUTED rather than failed; no additional verified P1 was established. A previously carried recovery-code atomicity P2 was demoted on 2026-09-10 05:49 JST after the latest Investigator 4 report found insufficient current-main evidence to sustain it above UNKNOWN/P4.
