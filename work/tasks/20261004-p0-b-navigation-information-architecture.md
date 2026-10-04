# Task: P0-B V7 navigation and information architecture

Owner: P0-B executor
Branch: `agent/v7-p0-b-ia-narrowed-20261004`
Starting SHA: `cb484bc839f9874659f501a755d93ae78dbceed6`
Status: IN PROGRESS — narrowed-scope route and journey proposal ready for serialized P0 review

## Scope

- Preserve the current V6 shell and all 50 registered page-route keys.
- Define minimum Library entry and browse/detail paths for Books, Devotionals, and Past Teachings; propose stable route keys `library` and `library-item`.
- Define route keys and ONE 2 ONE pairing, Track → Module → Lesson, the seven-step lesson flow, deep links/QR, and reuse of V6 pair messaging.
- Preserve Reader handoff, session/congregation context, and pair privacy.
- Mark Conversation Deck, new group chat/realtime sessions, central Drive media pipeline, full Ilocano rollout, and unrelated whole-app redesign as V8.
- Exclusions: runtime route changes, schema/migration work, security policy changes, feature implementation, and production deployment.

## Execution and evidence

- Deliverable: `docs/v7/P0_B_NAVIGATION_INFORMATION_ARCHITECTURE.md`.
- Route basis: `src/ui/shell.js` and `src/app/bootstrap.js` at the exact starting SHA; inventory records 5 shell keys and 50 page-route keys.
- Scope matches `V7_ACTIVE_STATUS.md`, `DEVELOPMENT_PLAN_V7.md`, and current P0-A/C/D contracts.
- New route IDs are not invented. Existing routes remain supported; proposed keys `one-to-one`, `one-to-one-pair`, `one-to-one-track`, `one-to-one-module`, `one-to-one-lesson`, and `one-to-one-thread` are subject to P0 ratification and P1 implementation through the existing router.
- Documentation-only. No runtime behavior changed; no runtime tests apply.
- PR: replacement draft based on live development head; prior PR #1124 is superseded by this narrowed-scope refresh.

## Handoff

- Refreshed branch is based on `v7/development` at `cb484bc839f9874659f501a755d93ae78dbceed6`.
- Remaining action: integration owner ratifies the minimum Library/ONE 2 ONE placements and accepts the combined A/B/C/D contracts before P1. No production impact.
