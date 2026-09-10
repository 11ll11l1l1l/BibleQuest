# BibleQuest Agent Triage

Analysis-only handoff on `agent-analysis`. Current `main` is implementation truth. Only verified P0/P1 may interrupt milestone work; P2 is deferred; P3/P4 are suppressed. No test is PASS unless executed. Actionable queue cap: 3.

## Current actionable queue

### 1. P0 STOP — Existing-device cloud progress can overwrite newer cloud state

- **Evidence:** STATIC FINDING, independently re-verified on current `main`.
- **Flow:** signed-in multi-device persistence/resume; ordinary Journey changes and normal account lifecycle events can reach the same broad progress push.
- **Files/components:** `account.js` (`PROGRESS_KEYS`, `registerDevice()`, `restoreOrSync()`, `pushProgress()`), `journey-cloud-sync.js` (`sync()`, `bq-journey-change`), `bible_progress_snapshots`.
- **Impact:** a previously registered device with stale local state can push that state over newer cloud progress. `restoreOrSync()` restores remote progress only for a newly registered device; otherwise it reaches `pushProgress()`, which upserts the full local snapshot with a fresh `updated_at` and no demonstrated remote freshness/revision/merge guard. The synchronized snapshot covers core state, Reader, Journey/story, Transformation, Growth, Couples, learning/review, and saved passages.
- **Reachability:** `account.js` establishes the mechanism directly: `registerDevice()` returns false for an existing remembered device, `restoreOrSync(false)` fetches remote `state,updated_at` but does not arbitrate freshness, then calls `pushProgress()`, which upserts collected local state with a new timestamp. Investigator reports also identify normal lifecycle and Journey-triggered calls into the same broad write path. These are manifestations of one persistence defect, not separate findings.
- **Impact gate:** direct data-loss/corruption risk affecting normal multi-device use.
- **If deferred:** newer synchronized progress can be silently rolled back and later restored to other devices.
- **Future correction:** add deterministic conflict handling before broad snapshot writes using revisions/timestamps or per-key merge rules; do not disable sync.
- **Closure evidence:** executable multi-device regression where Device A owns newer cloud state, stale registered Device B signs in/syncs and performs a normal Journey change, and the newer state is preserved or safely merged; verify reload, periodic/background sync, and sign-out/sign-in behavior.

**Verified P1: 0.**

## Deferred / suppressed

- **No active P2 this cycle.** Investigator 1, Investigator 2, and Investigator 4 persistence observations are the same P0 mechanism above and are de-duplicated rather than counted separately.
- **P3 suppressed:** password-reset completion has a source-level non-atomic edge after password change/claim if later recovery-code rotation fails. Current evidence indicates the new password generally remains usable and no practical lockout/release failure was demonstrated, so it does not interrupt the milestone.
- **UNKNOWN/P4:** deployed Supabase RLS/privacy enforcement was not live-verified; no cross-user exposure is demonstrated.
- **NOT EXECUTED:** core browser flows, required 320/360/390/412/430 px mobile matrix, installed-PWA behavior, deployed Supabase auth/RLS lifecycle, exhaustive Scripture/translation corpus integrity, and doctrinal/content audit. Evidence gaps are not failures.
- **P4 suppressed:** layered Home/navigation ownership, multiple guarded DOM observers, Modern Home legacy-selector bridging, Reader/translation layering, runtime-registry orchestration, cloud-smoke coverage limitations, manual-only browser workflow behavior, and similar architecture/test complexity with no separate demonstrated user/release failure.

## Current cycle — 2026-09-10 09:52 JST

- **Observed `main`:** `6d42c5445a582b55c81e8d925e6d2bc1b92659b9`.
- **Reports available in this run:** Investigator 1, Investigator 2, Investigator 3, and Investigator 4. **Missing: none.**
- **Investigator 1:** identifies the stale remembered-device broad snapshot overwrite as the sole source-demonstrated high-impact functional concern. Normal lifecycle writes increase reachability but are part of the same defect. Current exact-SHA browser/regression verification remains NOT EXECUTED.
- **Investigator 2:** overlapping persistence ownership resolves to the same stale-device corruption mechanism already in the queue. Home/navigation layering, Reader/translation ownership, multiple observers, and runtime registry remain P4 because no separate present failure was demonstrated.
- **Investigator 3:** no demonstrated UI/mobile/PWA/route regression. Representative 320/360/390/412/430 px layout checks and installed-PWA offline/recovery behavior remain NOT EXECUTED on this exact SHA. The manual-only workflow and presence of coverage are not defects.
- **Investigator 4:** stale-device overwrite remains the sole demonstrated high-impact data/auth/content/safety issue. Password-reset completion has a limited non-atomic edge but remains P3 on current evidence; live RLS/privacy, corpus integrity, and doctrinal/content safety remain UNKNOWN/NOT EXECUTED rather than failed.
- **Independent verification:** exact `main` branch metadata was re-read. Current `account.js` still has `registerDevice()` return whether the device is new; `restoreOrSync(isNewDevice)` restores cloud state only when `isNewDevice` is true, otherwise calls `pushProgress()`. `pushProgress()` upserts the entire collected local snapshot into `bible_progress_snapshots` with a fresh `updated_at` and no freshness/version comparison. No destructive browser/database test was performed.
- **Counterfactual:** deferring the cloud overwrite can silently destroy newer user progress, so it remains interrupting. Deferring the reset edge, architecture complexity, and verification gaps has no comparable demonstrated immediate milestone harm.
- **Firewall result:** **1 P0 STOP, 0 verified P1, 0 active P2.**

## Historical state

From 2026-09-09 09:50 through 2026-09-10 09:52 JST, triage has observed the same `main` SHA. The active queue has consistently remained one P0 stale-device cloud-progress corruption item; mobile/PWA and core browser paths remain NOT EXECUTED rather than failed, and no additional verified P1 has been established. Recovery/reset concerns have remained below the interruption threshold because current evidence does not demonstrate account lockout or material auth-integrity failure. One prior cycle lacked a directly available Investigator 1 report; current cycles have all four reports available.
