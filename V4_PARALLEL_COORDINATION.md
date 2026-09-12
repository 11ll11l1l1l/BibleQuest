# BibleQuest V4 Parallel Development Coordination

## Purpose

This file is the communication contract for concurrent BibleQuest V4 development. It supplements `V4_MODERN_UI_DEVELOPMENT_PLAN.md` and `V4_REPORT_INDEX.md`; it does not replace either one.

The goal is to let two AI development lanes work at the same time without editing the same tranche, invalidating each other's checkpoints, or turning the V4 branch into an ambiguous multi-parent integration stream.

## Integration authority

- The user / human-chat captain remains the sole integration authority.
- Parallel lanes may prepare and verify work independently.
- Integration into `v4/modern-ui-overhaul` remains serialized.
- A lane must never assume that another lane's unintegrated branch is part of the active V4 baseline.
- Repository evidence overrides chat summaries.

## Current lane split

Coordination baseline when this file was created:

- Active V4 branch: `v4/modern-ui-overhaul`
- Baseline SHA: `cd5d16215236ab0f3541eac7029b10a336e2bdd2`
- Baseline activity: Games + Avatar Vault static contract registration.

### Lane A — TOP-DOWN

The existing parallel AI owns the remaining queue from the top downward:

1. current Reader/Games + Avatar Vault completion/certification as applicable;
2. More hub;
3. Ministry + Assignments + Workspace + Notifications;
4. Bible World + Progress + Personal Mission + Calendar;
5. Study family.

Lane A must not begin tranche 11 (`Account + Notes + Transform + Psychometrics + Accessibility`) while Lane B owns it unless the captain explicitly reassigns ownership.

### Lane B — BOTTOM-UP

Branch: `v4/bottom-up-tranches`

Lane B works in reverse order to maximize separation from Lane A:

1. **Tranche 13 first:** Admin + Content Review + Congregation + diagnostics/recovery;
2. **Tranche 12 second:** Community + Couples + Journey Groups + Live Rooms + Media/Recordings + Encouragements;
3. **Tranche 11 third:** Account + Notes + Transform + Psychometrics + Accessibility.

Lane B must not edit Lane A's active Reader, Games/Avatar, More, Ministry/Assignments, Journey/Calendar, or Study-family tranche files unless the captain explicitly reassigns ownership.

## Shared-file lock

The following files/areas are integration-owned unless a lane has explicit captain approval to modify them:

- `V4_MODERN_UI_DEVELOPMENT_PLAN.md`
- `V4_REPORT_INDEX.md`
- this coordination file after initial setup
- `.github/workflows/**`
- global app/bootstrap ownership
- global routing/state/service ownership
- `src/ui/v4-foundation.css`
- shared icon primitives such as `src/ui/icons.js`
- shared shell/navigation files
- other files proven by repository inspection to be touched by both lanes

If a lane needs a shared-file change, it must record the requested change in its lane status/handoff instead of silently editing the shared file. The captain applies or delegates the integration change after reviewing both lanes.

## Lane status communication

Each lane maintains its own status/handoff file to avoid both AIs editing one shared status document concurrently.

Lane B uses `V4_BOTTOM_UP_STATUS.md` on `v4/bottom-up-tranches`.

A lane status update must include:

- lane name and tranche;
- exact base SHA;
- exact candidate/current SHA;
- state: `PLANNING`, `IMPLEMENTING`, `TESTING`, `READY_FOR_INTEGRATION`, `BLOCKED`, or `INTEGRATED`;
- files intentionally owned/touched;
- files deliberately not touched;
- test/validator evidence actually executed;
- unresolved failures or unavailable checks;
- shared-file changes requested from the captain;
- known overlap risk with the other lane.

Do not mark a tranche complete merely because code was committed. V4 certification still requires the governing plan's regression/browser/accessibility evidence against the exact candidate SHA.

## Before starting every tranche

Each AI must:

1. fetch the current `v4/modern-ui-overhaul` HEAD;
2. read `V4_MODERN_UI_DEVELOPMENT_PLAN.md`;
3. read `V4_REPORT_INDEX.md`;
4. read this file;
5. read its own lane status file;
6. compare the active branch against its lane base to detect newly overlapping files;
7. confirm the intended tranche is still owned by its lane.

If repository evidence shows that the other lane has already entered or modified the intended tranche, stop implementation and record `BLOCKED — OWNERSHIP COLLISION` rather than racing it.

## During implementation

- Keep changes tranche-local.
- Do not opportunistically clean unrelated code.
- Do not modify another lane's files to make a local test easier.
- Preserve V3 service/state owners and all existing behavior contracts unless the tranche has an explicitly isolated Class C requirement.
- Add tranche-specific regression/static tests on the lane branch.
- If workflow registration would touch `.github/workflows/**`, prepare the test file but leave workflow registration as an integration request unless explicitly authorized.
- Record any new cross-cutting requirement instead of implementing it through a hidden shared-file change.

## Handoff / communication message format

When a lane reaches a meaningful checkpoint, its status file must contain a compact handoff with this structure:

```text
LANE: A | B
TRANCHE: <name>
BASE: <sha>
CANDIDATE: <sha>
STATE: <state>
OWNED FILES: <paths>
TESTS EXECUTED: <actual evidence>
OPEN FAILURES: <none or list>
SHARED-FILE REQUESTS: <none or list>
OVERLAP RISK: <none / paths / explanation>
NEXT SAFE ACTION: <one action>
```

The other AI should read this handoff before entering an adjacent tranche.

## Integration protocol

1. A lane reaches `READY_FOR_INTEGRATION` with an exact candidate SHA and evidence.
2. The captain fetches the latest active V4 HEAD.
3. Compare lane candidate against both its original base and current active HEAD.
4. Resolve shared-file requests separately.
5. Rebase/cherry-pick/merge only after overlap review; do not force-move `v4/modern-ui-overhaul` over unrelated work.
6. Run the full applicable V4 regression/browser gate on the integrated exact SHA.
7. Only after that passes may the captain create/update the corresponding `release/v4-*` checkpoint and synchronize `V4_REPORT_INDEX.md`.
8. The next tranche starts from the newly accepted integration baseline where practical.

## Collision and meeting-point rule

Parallel work is allowed only while ownership remains disjoint.

- If both lanes need the same runtime file, the lane that reached the file second records a blocker and leaves the file untouched.
- If both lanes need only a shared foundation/workflow/documentation file, both prepare requests and the captain performs the shared integration edit once.
- When Lane A reaches tranche 10 and Lane B reaches tranche 11, reassess overlap before either advances further because Study, accessibility, shared Reader/learning controls, Account/Notes, and global accessibility primitives may converge.
- Once the two lanes become adjacent or overlapping, return to serialized integration rather than continuing parallel runtime edits.

## Current captain instruction

Proceed concurrently under this split until the captain changes it. Lane A works from the top; Lane B works from the bottom. Neither AI may silently expand its ownership into the other lane's assigned tranches.
