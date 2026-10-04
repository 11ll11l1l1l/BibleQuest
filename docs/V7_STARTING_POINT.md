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

## Phase model

- P0: scope/contracts — four parallel lanes.
- P1: shared foundation — four parallel implementation lanes.
- P2: Library MVP — four parallel lanes.
- P3: ONE 2 ONE MVP — at least four lanes, five where useful.
- P4: integrated hardening — four independent evidence lanes.
- P5: exact-SHA release certification — four evidence lanes followed by one serialized candidate/release owner.

P2 and P3 may overlap after P1 contracts are frozen when ownership is genuinely independent. All shared writes and integration remain serialized under the rulebook.

## Preserved contracts

- Production Cloudflare project: `mybiblequest`; `npm run build:v6` → `dist-v6` until an intentional V7 build/release change is accepted.
- Existing exact-SHA gates, deployment verifier, inherited regression suites and migrations.
- V5 rollback: `rollback/v5-pre-v6-production-20261003` at `1cab2110cd15285e9ee388f7889b9fd284823274`.
- V6 release: `release/v6-rc-final-20261003` at the production SHA.
- V6 owner-waived physical/manual evidence remains recorded in its original authority and is not converted to PASS by V7 planning.

## Fast-start rules

Use the pinned Node version and lockfile. Read `V7_ACTIVE_STATUS.md`, the task-relevant part of `DEVELOPMENT_PLAN_V7.md`, and only the rulebook sections relevant to the assigned lane. Inspect the smallest relevant implementation surface and reuse existing checks/evidence.

Before parallel writes, every lane must have one concrete outcome, exact starting SHA, owned files/surface, exclusions, affected checks and handoff destination. Shared schema/migrations/generated data contracts, global router/navigation, service worker/deployment configuration and canonical status edits have one owner or are sequenced explicitly.

Do not begin a V7 task with another broad V1–V6 audit. Do not reopen completed BSB/security/release work unless the V7 change affects it. Do not implement V8 systems merely because V7 leaves an extension point.

## Release inheritance

Existing exact-SHA workflows remain available through `workflow_dispatch` with a candidate SHA. V7 implementation must ensure relevant branch/path filters actually cover V7 before relying on automatic checks. Required release evidence must belong to one exact candidate. Static evidence does not substitute for browser/backend/device evidence where the requirement calls for those layers.
