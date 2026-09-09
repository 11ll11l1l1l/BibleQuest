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

- **P2 deferred:** recovery-code replacement is non-atomic; failure between retirement and replacement can leave recovery unavailable. Important auth-integrity failure path, but not an interrupting blocker while the P0 remains.
- **NOT EXECUTED:** core browser flows, required 320/360/390/412/430 px mobile matrix, installed-PWA behavior, deployed Supabase RLS/auth lifecycle, and exhaustive doctrinal/content audit. Evidence gaps are not failures.
- **P4 suppressed:** layered observers, Modern Home orchestration, Reader local-state ownership, Journey summary persistence, Community compatibility wrappers, and similar architecture complexity with no separate demonstrated user/release failure.

## Current cycle — 2026-09-10 01:52 JST

- **Observed `main`:** `6d42c5445a582b55c81e8d925e6d2bc1b92659b9`.
- **Reports available:** Investigator 1, 2, 3, and 4; none missing.
- **Investigator 1:** latest report reproduces no executable core-flow FAIL; it again identifies only the source-confirmed stale existing-device cloud overwrite as material. Deployment checks succeeded for this SHA but do not establish browser-flow correctness.
- **Investigator 2:** latest report de-duplicates the same P0 and confirms normal Journey changes can reach `BQAccount.pushProgress()`. Other architecture/ownership observations remain P4 because no separate user/release failure is demonstrated.
- **Investigator 3:** mobile/PWA acceptance remains NOT EXECUTED, not failed; no verified UI/PWA regression.
- **Investigator 4:** same cloud overwrite plus deferred recovery-code atomicity concern; no new material privacy, Scripture/content, or auth failure established.
- **Independent verification:** exact `main` branch metadata was re-read. Current `account.js` still returns `!existing.data` from `registerDevice()`, restores remote snapshot only when `isNewDevice` is true, otherwise calls `pushProgress()`, and `pushProgress()` upserts the collected broad snapshot with a new `updated_at` and no visible conflict/freshness arbitration. Current `journey-cloud-sync.js` still invokes `BQAccount.pushProgress()` after normal Journey-status sync. No destructive browser/database test was performed.
- **Counterfactual:** deferring the cloud overwrite can silently destroy newer user progress, so it remains interrupting. Deferring the other findings does not show comparable immediate harm.
- **Firewall result:** **1 P0 STOP, 0 verified P1, 0 active P2.**

## Historical state

From 2026-09-09 09:50 through 2026-09-10 01:52 JST, every triage cycle observed the same `main` SHA. The queue consistently remained one P0 stale-device cloud-progress corruption item; recovery-code atomicity stayed deferred P2; mobile/PWA and core browser paths remained NOT EXECUTED rather than failed; no additional verified P1 was established.
