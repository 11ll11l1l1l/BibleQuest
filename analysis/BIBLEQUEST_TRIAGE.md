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

- **Evidence state:** STATIC FINDING, independently verified against current `main`.
- **Affected flow:** signed-in user using two or more previously registered devices/browsers.
- **Component:** `account.js` — `registerDevice()`, `restoreOrSync()`, `pushProgress()`.
- **Actual impact:** an already-registered device does not restore/compare the cloud snapshot before sync. It proceeds to `pushProgress()`, which upserts its local `PROGRESS_KEYS` snapshot over the single `bible_progress_snapshots` row. An older local device can therefore replace newer cloud progress.
- **Evidence:** current `restoreOrSync(isNewDevice)` restores cloud state only when `isNewDevice && cloud`; all other cases fall through to `await pushProgress()`. `pushProgress()` performs an unconditional upsert with a fresh `updated_at`. There is no last-write comparison, merge, version check, or conflict guard in this path.
- **Impact-gate reason:** direct data-loss/corruption risk for existing cloud progress. This meets the P0 definition even though browser reproduction was not executed.
- **If deferred:** single-device users are largely unaffected, but a normal multi-device sign-in can silently replace newer Journey/Reader/streak/review/saved-passage and other synchronized progress with stale state. Subsequent device restores can propagate the stale snapshot.
- **Recommended future correction:** introduce deterministic conflict handling before any existing-device push (for example compare cloud/local revision timestamps or maintain per-key/revision metadata and merge only newer state). Preserve existing account/session architecture; do not solve by disabling sync.
- **Regression evidence needed before closure:** executable two-device sequence demonstrating Device A creates newer progress, Device B with older local state signs in/syncs, newer cloud state is not lost, and Device C/new device restores the correct final state. Include reload/sign-out/sign-in coverage.

No verified P1 release blocker was established this cycle. The narrow-mobile/PWA acceptance work remains **NOT EXECUTED**, which is an evidence gap rather than a demonstrated failure.

## Deferred / suppressed findings

- **P2 deferred — Recovery-code rotation is non-atomic.** `bq-password-reset` retires existing unused codes before inserting the replacement. During reset, the code is consumed and password changed before the fresh-code insertion completes. A transient DB failure can leave no valid recovery code or return failure after the password actually changed. This passes the auth-integrity impact gate, but is an uncommon partial-failure path and does not outrank the current milestone while the P0 item above is unresolved. Future correction should make retirement/replacement transactional or otherwise recoverable and prove failure-injection behavior.
- **Acceptance evidence gap — mobile/PWA matrix:** Investigator 3 reports the explicit 320/360/390/412/430 px and installed-PWA/offline acceptance remains NOT EXECUTED. Current source contains narrow-mobile corrections, so this is not promoted to P1 without a demonstrated failure.
- **Suppressed P3/P4 architecture observations:** dynamic module recovery can re-execute scripts after partial initialization; several global MutationObservers remain active with convergence guards; Reader/translation and Community/cloud ownership are layered. No concrete current user failure was demonstrated, so these do not enter active development.
- **Suppressed resolved/static areas:** current main structurally guards the former Psychometrics mutation loop and Transform blank-start failure. No new executed regression was shown by Investigator 1.
- **Content/security:** Investigator 4 found no current shipped unsafe Scripture item and reported live RLS boundaries for core private/server-only tables as inspected. Full doctrinal corpus and complete auth lifecycle were NOT EXECUTED, so no pass is inferred beyond the specific inspected evidence.

## Triage history

### 2026-09-09 09:50 JST

- **Observed `main`:** `6d42c5445a582b55c81e8d925e6d2bc1b92659b9`
- **Reports available:** Investigator 1 present; Investigator 2 present; Investigator 3 present; Investigator 4 present.
- **Independent verification:** confirmed current `account.js` existing-device flow can fall through from `restoreOrSync(false)` to unconditional `pushProgress()` with no cloud/local conflict comparison. Confirmed recovery-code issuance/reset performs separate retire/insert operations rather than an atomic replacement.
- **De-duplication:** Psychometrics/Transform startup concerns from earlier reports were treated as corrected/static unless re-reproduced; mobile/PWA acceptance was consolidated as one NOT EXECUTED evidence gap; architecture-only duplication/observer concerns were suppressed.
- **Firewall result:** 1 actionable item exposed, 1 P2 deferred, remaining findings suppressed or retained only as verification gaps. Current milestone should be interrupted only for the P0 cloud-progress corruption risk.
