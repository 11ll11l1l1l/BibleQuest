# BibleQuest Agent Triage

Analysis-only handoff on `agent-analysis`.

## CURRENTNESS WARNING — REVALIDATION REQUIRED

The findings below were last evaluated against historical `main` SHA `6d42c5445a582b55c81e8d925e6d2bc1b92659b9` on 2026-09-10. They predate the verified v3 production/post-release line and **must not be treated as current blockers without revalidation against the current exact product checkpoint**.

Current development task selection is controlled by the user's latest instruction and `DEVELOPMENT_PRIORITY_V3.md`, not by this historical triage file.

A historical finding may interrupt current Priority 1 work only after a current investigator/captain:

1. identifies the exact current product SHA inspected;
2. confirms the relevant code path still exists in materially equivalent form;
3. reproduces the defect or produces current concrete evidence;
4. confirms the user impact/severity still qualifies as P0/P1;
5. records the new evidence and recommended minimal correction.

Until that happens, the queue below is **HISTORICAL / UNREVALIDATED**, not an active P0 stop.

## Historical actionable queue

### Historical P0 candidate — Existing-device cloud progress can overwrite newer cloud state

- **Original evidence type:** static finding, independently reviewed on historical `main`.
- **Original inspected SHA:** `6d42c5445a582b55c81e8d925e6d2bc1b92659b9`.
- **Flow:** signed-in multi-device persistence/resume.
- **Historical files/components:** `account.js` (`PROGRESS_KEYS`, `registerDevice()`, `restoreOrSync()`, `pushProgress()`), `journey-cloud-sync.js`, `bible_progress_snapshots`.
- **Original concern:** a previously registered device with stale local state could overwrite newer cloud progress because the historical flow did not restore/compare the fetched remote snapshot before a broad local snapshot upsert.
- **Original reproduction model:** Device A advances and syncs; previously registered Device B retains older local progress; Device B returns; historical `restoreOrSync(false)` fetches remote state but proceeds to `pushProgress()`. Journey sync also invoked the same broad progress push.
- **Destructive live reproduction:** not executed.
- **Original severity rationale:** potential direct user progress loss/corruption in normal multi-device use.
- **Original proposed correction:** deterministic freshness/revision or safe merge arbitration before broad snapshot writes.
- **Required current closure/revalidation evidence:** executable/current-code evidence proving whether newer state can or cannot be overwritten by a stale device across sign-in, Journey activity, periodic/background sync and sign-out/sign-in.

**Current status of this historical finding: UNREVALIDATED AGAINST CURRENT EXACT PRODUCT SHA.**

## Historical deferred / suppressed items

- Recovery completion non-atomic edge: historical P3; no demonstrated normal account lockout.
- Deployed data-access enforcement: historical UNKNOWN/P4; no cross-user exposure demonstrated.
- Exact-SHA core browser flows, 320/360/390/412/430 px matrix, installed-PWA behavior, deployed auth/data-policy lifecycle, exhaustive Scripture/translation corpus integrity and doctrinal/content audit were not executed in that historical cycle.
- Journey dual persistence beyond the stale-device concern, layered navigation/Reader ownership, guarded DOM observers, test/runtime complexity and manual-only browser workflow status were historical P4 observations without separate demonstrated user failure.

## Historical cycle — 2026-09-10 11:50 JST

- Observed `main`: `6d42c5445a582b55c81e8d925e6d2bc1b92659b9`.
- Investigator reports available: 1, 2, 3 and 4.
- Investigator 1/2/4 converged on the same stale-device snapshot concern.
- Investigator 3 found no demonstrated UI/mobile/PWA/route failure in that cycle.
- Historical firewall result at that time: 1 P0 candidate, 0 verified P1, 0 active P2.

## Current triage rule

For current BibleQuest development:

- inspect the newest exact-green product checkpoint, not this historical SHA;
- deduplicate and suppress stale/already-fixed/speculative reports;
- P0/P1 can interrupt Priority 1 only with current evidence;
- P2 should be scheduled intelligently;
- P3/P4 must not derail higher-value work;
- no test is PASS unless actually executed;
- exact product SHA and evidence must be stated in every current finding.
