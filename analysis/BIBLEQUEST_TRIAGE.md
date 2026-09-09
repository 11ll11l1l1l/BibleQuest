# BibleQuest Agent Triage

Analysis-only handoff on `agent-analysis`. Current `main` is implementation truth. Only verified P0/P1 may interrupt milestone work; P2 is deferred; P3/P4 are suppressed. No test is PASS unless executed. Actionable queue cap: 3.

## Current actionable queue

### 1. P0 STOP — Existing-device cloud progress can overwrite newer cloud state

- **Evidence:** STATIC FINDING, independently re-verified on current `main`.
- **Flow:** signed-in multi-device persistence/resume; ordinary Journey changes can reach the same broad progress push.
- **Files/components:** `account.js` (`PROGRESS_KEYS`, `registerDevice()`, `restoreOrSync()`, `pushProgress()`), `journey-cloud-sync.js` (`sync()`, `bq-journey-change`), `bible_progress_snapshots`.
- **Impact:** a previously registered device with stale local state can push that state over newer cloud progress. `restoreOrSync()` restores remote progress only for a newly registered device; otherwise it reaches `pushProgress()`, which upserts the full local snapshot with a fresh `updated_at` and no demonstrated remote freshness/revision/merge guard. The synchronized snapshot covers core state, Reader, Journey/story, Transformation, Growth, Couples, learning/review, and saved passages.
- **Reachability:** current `journey-cloud-sync.js` listens for `bq-journey-change`, schedules `sync()`, upserts daily Journey status, then calls `BQAccount.pushProgress()`. This is the same underlying persistence defect, not a separate architecture finding.
- **Impact gate:** direct data-loss/corruption risk affecting normal multi-device use.
- **If deferred:** newer synchronized progress can be silently rolled back and later restored to other devices.
- **Future correction:** add deterministic conflict handling before broad snapshot writes using revisions/timestamps or per-key merge rules; do not disable sync.
- **Closure evidence:** executable multi-device regression where Device A owns newer cloud state, stale registered Device B signs in/syncs and performs a normal Journey change, and the newer state is preserved or safely merged; verify reload and sign-out/sign-in behavior.

**Verified P1: 0.**

## Deferred / suppressed

- **No active P2 this cycle.** Investigator 2's persistence-ownership concern is the same P0 mechanism above and is de-duplicated rather than counted separately.
- **P3 suppressed:** password-reset completion has a source-level non-atomic edge after password change/claim if later recovery-code rotation fails. Current evidence indicates the new password generally remains usable and no practical lockout/release failure was demonstrated, so it does not interrupt the milestone.
- **UNKNOWN/P4:** deployed Supabase RLS/privacy enforcement was not live-verified; no cross-user exposure is demonstrated.
- **NOT EXECUTED:** core browser flows, required 320/360/390/412/430 px mobile matrix, installed-PWA behavior, deployed Supabase auth/RLS lifecycle, exhaustive Scripture/translation corpus integrity, and doctrinal/content audit. Evidence gaps are not failures.
- **P4 suppressed:** layered Home/navigation ownership, multiple guarded DOM observers, Modern Home legacy-selector bridging, Reader/translation layering, runtime-registry orchestration, service-worker/manifest observations, and similar architecture complexity with no separate demonstrated user/release failure.

## Current cycle — 2026-09-10 06:52 JST

- **Observed `main`:** `6d42c5445a582b55c81e8d925e6d2bc1b92659b9`.
- **Reports available:** Investigator 1, 2, 3, and 4; none missing.
- **Investigator 1:** no new executable core-flow FAIL; stale existing-device cloud overwrite remains its only demonstrated material functional risk. Startup/Home/navigation, Reader, Journey completion/resume, Transformation/Grow, games, and Community remain NOT EXECUTED.
- **Investigator 2:** independently frames overlapping persistence ownership as the same material corruption path: Journey-specific cloud writes are followed by the broad account snapshot push. Home/navigation layering, Reader/translation ownership, observers, and runtime registry have no demonstrated current failure and remain P4.
- **Investigator 3:** no demonstrated UI/mobile/PWA/route regression. Required 320/360/390/412/430 px responsive acceptance and installed-PWA/offline/recovery behavior remain NOT EXECUTED rather than failed; no material route defect was established.
- **Investigator 4:** independently confirms the stale-device overwrite as the only high-impact data/auth/content/safety issue. Password-reset completion has a limited non-atomic edge but is P3 on current evidence; recovery-code storage controls look restrictive in source, while live RLS enforcement, corpus integrity, and doctrinal audit remain UNKNOWN/NOT EXECUTED.
- **Independent verification:** exact `main` branch metadata was re-read. Current `account.js` still defines the broad progress snapshot, returns device-newness from `registerDevice()`, restores remote state only under `isNewDevice`, and otherwise calls an unconditional full snapshot `upsert` with a newly generated `updated_at`. Current `journey-cloud-sync.js` still listens for `bq-journey-change`, writes `bible_daily_journey_status`, then calls `BQAccount.pushProgress()`. No destructive browser/database test was performed.
- **Counterfactual:** deferring the cloud overwrite can silently destroy newer user progress, so it remains interrupting. Deferring the reset edge, architecture complexity, and verification gaps has no comparable demonstrated immediate milestone harm.
- **Firewall result:** **1 P0 STOP, 0 verified P1, 0 active P2.**

## Historical state

From 2026-09-09 09:50 through 2026-09-10 06:52 JST, triage has observed the same `main` SHA. The active queue has consistently remained one P0 stale-device cloud-progress corruption item; mobile/PWA and core browser paths remain NOT EXECUTED rather than failed, and no additional verified P1 has been established. Recovery/reset concerns have remained below the interruption threshold because current evidence does not demonstrate account lockout or material auth-integrity failure.
