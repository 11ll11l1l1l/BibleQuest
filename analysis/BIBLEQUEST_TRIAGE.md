# BibleQuest Agent Triage

This file is an analysis-only handoff for the primary BibleQuest development process.

It lives on the dedicated `agent-analysis` branch and must never be merged automatically into `main`.

## Rules

- Investigators are read-only and may not modify GitHub, Supabase, Cloudflare, workflows, branches, PRs, issues, or files.
- Only the firewall/triage agent may update this file, and only on `agent-analysis`.
- Current `main` is the observed implementation truth. Old agent instructions are evidence only and may be obsolete.
- Findings do not become development work merely because they exist.
- P3/P4 findings are suppressed from the active development queue.
- The current milestone remains higher priority than newly discovered P2/P3/P4 issues. Only P0/P1 may interrupt it.
- No test may be reported PASS unless it was actually executed.

## Priority definitions

- **P0 — Stop:** security/privacy/data corruption, materially dangerous doctrinal/content behavior, or core app unusable.
- **P1 — Release blocker:** a required core flow or explicit current acceptance criterion fails.
- **P2 — Important regression:** meaningful user-facing failure with material impact, but not a current release blocker.
- **P3 — Minor:** small bug, edge case, cosmetic issue, or workaround exists; record but do not interrupt development.
- **P4 — Observation:** cleanup, style, speculative improvement, theoretical risk, or non-impacting code issue; suppress.

## Impact gate

A finding can enter the actionable queue only if evidence shows at least one of the following:

1. Prevents a normal user from completing a current core BibleQuest journey.
2. Risks data loss/corruption, privacy, authentication, or security.
3. Produces materially incorrect Scripture/content/doctrinal behavior.
4. Violates an explicit current release acceptance criterion.
5. Is a demonstrated regression from previously verified behavior.
6. Affects a meaningful portion of normal users.
7. Blocks the current milestone.

If none apply, classify P3/P4 and suppress it from the active queue.

## Current actionable queue

### 1. P0 STOP — Existing-device cloud progress can overwrite newer cloud state

- **Evidence state:** STATIC FINDING, independently re-verified against exact current `main` this cycle.
- **Affected flow:** signed-in user using two or more previously registered devices/browsers.
- **Component:** `account.js` — `registerDevice()`, `restoreOrSync()`, `pushProgress()`.
- **Actual impact:** an already-registered device does not restore/compare the cloud snapshot before sync. It proceeds to `pushProgress()`, which upserts its local `PROGRESS_KEYS` snapshot over the single `bible_progress_snapshots` row. An older local device can therefore replace newer cloud progress.
- **Evidence:** current `registerDevice()` returns whether the browser/device is new. `restoreOrSync(isNewDevice)` restores the remote snapshot only when `isNewDevice && cloud`; otherwise it calls `pushProgress()`. `pushProgress()` unconditionally upserts the current local snapshot with a new `updated_at`. No cloud/local freshness comparison, merge, revision check, or conflict guard is present on this path.
- **Impact-gate reason:** direct data-loss/corruption risk for existing cloud progress. This meets the P0 definition even though destructive browser/database reproduction was intentionally not performed by investigators.
- **If deferred:** single-device users are largely unaffected, but a normal multi-device sign-in can silently replace newer Journey/Reader/streak/review/saved-passage and other synchronized progress with stale state. Subsequent device restores can propagate the stale snapshot.
- **Recommended future correction:** introduce deterministic conflict handling before any existing-device push (for example compare cloud/local revision timestamps or maintain per-key/revision metadata and merge only newer state). Preserve existing account/session architecture; do not solve by disabling sync.
- **Regression evidence needed before closure:** executable two-device sequence demonstrating Device A creates newer progress, Device B with older local state signs in/syncs, newer cloud state is not lost, and Device C/new device restores the correct final state. Include reload/sign-out/sign-in coverage.

No verified P1 release blocker is established. The narrow-mobile/PWA acceptance work remains **NOT EXECUTED**; current issue #6 explicitly states CSS presence alone is not acceptance evidence and requires browser validation at 320/360/390/412/430 px plus Android/installed-PWA behavior. An unexecuted criterion is an evidence gap, not a demonstrated failure.

## Deferred / suppressed findings

- **P2 deferred — Recovery-code rotation is non-atomic.** Investigator 4 found separate retire/insert operations around recovery-code replacement, with password reset capable of progressing before fresh-code issuance completes. This passes the auth-integrity impact gate, but remains a partial-failure edge case and does not outrank the P0 cloud-progress risk or current milestone. Future correction should make replacement transactional/recoverable and prove failure-injection behavior.
- **Acceptance evidence gap — core browser flows:** Daily Journey, Reader, games, Transformation, community/live paths and installed-PWA behavior remain partly or wholly NOT EXECUTED on current HEAD. They are not promoted without a reproduced failure.
- **Suppressed P3/P4 architecture observations:** dynamic module recovery can re-execute scripts after partial initialization; several global MutationObservers remain active with convergence guards; Reader/translation and Community/cloud ownership are layered. No concrete current user failure was demonstrated.
- **Suppressed resolved/static areas:** current main structurally guards the former Psychometrics mutation loop and Transform blank-start failure. Investigator 1's latest report did not reproduce either regression.
- **Suppressed stale tracking:** Investigator 1's latest report notes issue #82 describes a recovery-code event exposure already corrected in current `account.js`, and several old PR descriptions reference obsolete SHAs/architecture. These are tracking/documentation observations, not current development work.
- **Content/security:** Investigator 4 found no specific currently shipped unsafe Scripture item and reported live RLS boundaries for core private/server-only tables as inspected. Full doctrinal corpus and complete production auth lifecycle were NOT EXECUTED, so no broader pass is inferred.

## Triage history

### 2026-09-09 11:47 JST

- **Observed `main`:** `6d42c5445a582b55c81e8d925e6d2bc1b92659b9`
- **Reports available:** Investigator 1 present and superseded by a newer rerun; Investigator 2 present; Investigator 3 present; Investigator 4 present.
- **Change since prior cycle:** `main` SHA remains unchanged. Latest Investigator 1 independently reconfirmed the stale-device cloud overwrite and added only P4 stale-issue/old-PR observations; no new P0/P1 candidate emerged.
- **Independent verification:** read current branch metadata and exact current `account.js`. `restoreOrSync()` still restores cloud state only for a new device and otherwise calls unconditional `pushProgress()`. Read current open issue #6; it still states browser evidence is required before mobile acceptance can close.
- **De-duplication / impact gate:** cloud overwrite remains the single interrupting finding. Mobile/PWA and core-flow gaps remain NOT EXECUTED, not failed. Transform/Psychometrics findings remain structurally corrected unless re-reproduced. Architecture-only concerns remain theoretical.
- **Firewall result:** actionable queue remains exactly 1 P0 item, 0 P1 items. P2 recovery-code atomicity remains deferred. No P3/P4 item may interrupt primary milestone work.

### 2026-09-09 10:52 JST

- **Observed `main`:** `6d42c5445a582b55c81e8d925e6d2bc1b92659b9`
- **Reports available:** Investigator 1 present; Investigator 2 present; Investigator 3 present; Investigator 4 present.
- **Change since prior cycle:** `main` SHA is unchanged. No new investigator report superseded the four reports already in context, so unchanged findings were not treated as new work.
- **Independent verification:** re-read current `main` branch metadata and current `account.js`; `registerDevice()` still identifies existing devices and the previously verified existing-device sync path remains applicable because the implementation SHA is unchanged. No executable browser/database mutation was performed.
- **De-duplication / impact gate:** no new P0/P1 candidates emerged. Mobile/PWA remains NOT EXECUTED rather than failed; Transform/Psychometrics concerns remain structurally corrected/static; architecture observations remain theoretical without demonstrated user failure.
- **Firewall result:** actionable queue unchanged at 1 P0 item. No P1 item. P2 recovery-code atomicity remains deferred. Primary milestone should not be interrupted by any other reported finding.

### 2026-09-09 09:50 JST

- **Observed `main`:** `6d42c5445a582b55c81e8d925e6d2bc1b92659b9`
- **Reports available:** Investigator 1 present; Investigator 2 present; Investigator 3 present; Investigator 4 present.
- **Independent verification:** confirmed current `account.js` existing-device flow can fall through from `restoreOrSync(false)` to unconditional `pushProgress()` with no cloud/local conflict comparison. Confirmed recovery-code issuance/reset performs separate retire/insert operations rather than an atomic replacement.
- **De-duplication:** Psychometrics/Transform startup concerns from earlier reports were treated as corrected/static unless re-reproduced; mobile/PWA acceptance was consolidated as one NOT EXECUTED evidence gap; architecture-only duplication/observer concerns were suppressed.
- **Firewall result:** 1 actionable item exposed, 1 P2 deferred, remaining findings suppressed or retained only as verification gaps. Current milestone should be interrupted only for the P0 cloud-progress corruption risk.
