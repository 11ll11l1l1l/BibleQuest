# BibleQuest V7 starting point

Updated: 2026-10-04 JST

## Baseline

Production V6: `7997d60e6069aa406ec005c32e33e46fee39bc12` on `main`.
Development branch: `v7/development`.
Current V7 roadmap: `DEVELOPMENT_PLAN_V7.md`.
Current progress authority: `V7_ACTIVE_STATUS.md`.
Operational rules: `work/RULEBOOK.md`.
Deferred future scope: `DEVELOPMENT_PLAN_V8.md`.

Development preparation includes V6 closeout evidence followed by repository documentation cleanup. Runtime, tests, deployment workflows, migrations, released build configuration and rollback references are preserved.

## V7 objective

**V7 is a focused Library + ONE 2 ONE discipleship release.**

Start new V7 work from the live `v7/development` head and use the exact starting SHA in each task handoff. Do not use the superseded full-product-overhaul interpretation of V7.

In scope:

- Library core and discovery;
- Books MVP;
- Devotionals MVP;
- Past Teachings MVP;
- categories/topics/tags/search;
- source/licensing/provenance handling;
- ONE 2 ONE mentor/mentee pairing;
- tracks/modules/lessons;
- canonical lesson flow: Scripture → Understand → Discuss → Reflect → Apply → Pray → Action;
- progress/reflection/prayer/action/completion state;
- QR/deep links and bounded reuse of existing V6 capabilities;
- minimum app-shell/content/media integration needed by those features;
- multilingual-ready contracts without a full Ilocano rollout.

Explicitly deferred to V8:

- Leader Conversation Deck and realtime participant broadcast;
- central Google Drive media pipeline and full moderation workflow;
- full Ilocano Bible/UI rollout;
- bulk devotional/Past Teachings/Books ingestion;
- Couples expansion;
- advanced recommendation/discovery;
- unrelated whole-app redesign.

`docs/v7/V7_FREE_MEDIA_FILE_STORAGE.md` is retained as historical planning input only. It is not an active V7 requirement.

## Phase-independent continuation command

You can start a fresh chat and issue only:

`Continue V7 lane A`

or the same command for lane B, C or D.

That command includes **implementation, affected verification, integration, phase-gate reconciliation and automatic same-lane continuation**. The user does not need to issue `integrate`, `merge`, `advance phase`, `promote lane`, or equivalent commands.

The executor must determine the live phase itself from `V7_ACTIVE_STATUS.md` and `DEVELOPMENT_PLAN_V7.md`. The user does not need to say `P0-A`, `P1-A`, `P5-A`, or otherwise track the phase number manually.

## Automatic integration behavior

Every lane integrates its own completed bounded work whenever it is safe to do so. `Ready for integration`, `waiting for merge`, or `integration needed` is not a valid stopping state by itself.

Before integration:

1. fetch the current `v7/development` HEAD;
2. refresh/rebase the lane if the integration head moved;
3. resolve conflicts inside that lane's owned surface;
4. rerun only checks affected by the refresh/conflict;
5. integrate without force-overwriting concurrent work;
6. verify the integrated result is reachable from the current integration head.

If the integration head changes during the operation, refresh/rebase and retry safely. Never replace a newer integration head with a stale branch simply to unblock progress.

**Lane A is the standing integration coordinator.** On every `Continue V7 lane A`, it first handles ready shared/cross-lane integration, shared router/schema/status reconciliation, phase-gate advancement and P5 release-candidate assembly before returning to its own lane-A assignment.

Lanes B–D integrate their own work. If they encounter a shared/cross-lane conflict that should not be solved inside their owned surface, they preserve the completed artifact and continue any safe eligible work. The next ordinary `Continue V7 lane A` automatically handles that integration responsibility. No special user command is needed.

## Continuation loop

For every `Continue V7 lane X` instruction:

1. fetch the live `v7/development` head;
2. read the current phase/eligibility state in `V7_ACTIVE_STATUS.md`;
3. map the requested persistent lane letter to the current phase using the roadmap table;
4. if X is A, first drain pending shared/cross-lane integration duties;
5. continue unfinished same-lane work immediately;
6. run the smallest affected verification;
7. integrate the lane's own completed bounded work automatically;
8. reconcile the phase exit gate when applicable;
9. if that assignment is complete and the next same-letter phase assignment is eligible, continue directly into it;
10. repeat across eligible phases until the execution window ends, a genuine external/human boundary is reached, or V7 is complete.

Finishing one task, reaching an integration boundary, or finishing a phase does not terminate a persistent lane. Lane A remains lane A from P0 through P5; only its phase-specific responsibility changes. The same is true for B, C and D. P3-E is an optional supplemental lane and does not alter A–D continuity.

The continuation command never authorizes V8 scope. Once V7 is complete, report that completion instead of beginning V8 automatically.

## Phase model

- P0: scope/contracts — four parallel lanes.
- P1: shared foundation — four parallel implementation lanes.
- P2: Library MVP — four parallel lanes.
- P3: ONE 2 ONE MVP — at least four lanes, five where useful.
- P4: integrated hardening — four independent evidence lanes.
- P5: exact-SHA release certification — four evidence lanes followed by one serialized candidate/release owner.

P2 and P3 may overlap after P1 contracts are frozen when ownership is genuinely independent. All shared writes and integration remain serialized by the live-head/retry protocol in `V7_ACTIVE_STATUS.md`.

## Preserved contracts

- Production Cloudflare project: `mybiblequest`; `npm run build:v6` → `dist-v6` until an intentional V7 build/release change is accepted.
- Existing exact-SHA gates, deployment verifier, inherited regression suites and migrations.
- V5 rollback: `rollback/v5-pre-v6-production-20261003` at `1cab2110cd15285e9ee388f7889b9fd284823274`.
- V6 release: `release/v6-rc-final-20261003` at the production SHA.
- V6 owner-waived physical/manual evidence remains recorded in its original authority and is not converted to PASS by V7 planning.

## Fast-start rules

Use the pinned Node version and lockfile. Read `V7_ACTIVE_STATUS.md`, the task-relevant part of `DEVELOPMENT_PLAN_V7.md`, and only the rulebook sections relevant to the assigned lane. Inspect the smallest relevant implementation surface and reuse existing checks/evidence.

Before parallel writes, every lane must have one concrete outcome, exact starting SHA, owned files/surface, exclusions, affected checks and handoff destination. Shared schema/migrations/generated data contracts, global router/navigation, service worker/deployment configuration and canonical status edits have one owner at a time or are sequenced explicitly.

The one-owner-at-a-time rule does **not** require a manual integration chat. Integration ownership is part of the continuation workflow. Each lane may integrate its own completed bounded work; Lane A coordinates shared/cross-lane integration and phase transitions.

Do not begin a V7 task with another broad V1–V6 audit. Do not reopen completed BSB/security/release work unless the V7 change affects it. Do not implement V8 systems merely because V7 leaves an extension point.

## Release inheritance

Existing exact-SHA workflows remain available through `workflow_dispatch` with a candidate SHA. V7 implementation must ensure relevant branch/path filters actually cover V7 before relying on automatic checks. Required release evidence must belong to one exact candidate. Static evidence does not substitute for browser/backend/device evidence where the requirement calls for those layers.