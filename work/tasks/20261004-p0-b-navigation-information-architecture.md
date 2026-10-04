# Task: P0-B V7 navigation and information architecture

Owner: Lane B — UX and information architecture
Branch: `agent/v7-p0-b-ia-narrowed-20261004`
Exact task starting SHA: `cb484bc839f9874659f501a755d93ae78dbceed6`
Integrated against current development SHA: `00ecb3c3a46606a342b0c259d7ce97579dd9317d`
Status: COMPLETE — route/journey contract accepted in the serialized P0 freeze

## Scope

- Preserve the current V6 shell and all 50 registered page-route keys.
- Define minimum Library entry and browse/detail paths for Books, Devotionals, and Past Teachings.
- Define approved unique route keys and entry/return behavior for Library and ONE 2 ONE.
- Define mentor/mentee, Track → Module → Lesson, seven-step lesson flow, deep links/QR, and reuse of V6 pair messaging.
- Preserve Reader handoff, session/congregation context, and pair privacy.
- Defer Conversation Deck, new group chat/realtime sessions, central Drive media pipeline, full Ilocano rollout, and unrelated whole-app redesign to V8.
- Exclude runtime route changes, schema/migration work, security policy changes, feature implementation, and production deployment.

## Route contract

V7 adds the minimum proposed page-route keys: `library`, `library-item`, `one-to-one`, `one-to-one-pair`, `one-to-one-track`, `one-to-one-module`, `one-to-one-lesson`, and `one-to-one-thread`. They follow the current kebab-case route-key convention; P1 implements them through the existing router and validates all resource access through existing authorized services. No global shell key is renamed or reordered.

## Reconciliation

- Existing V6 routes and group behavior remain preserved under their existing owners; V7 adds no group prompt, deck, group-chat, or new media-storage route.
- Library and lesson Scripture handoffs use the shared V6 Reader.
- Pair messaging is restricted to the current active relationship and reuses the existing V6 communication capability.
- Locale-ready states cover the in-scope Library and ONE 2 ONE journeys; no full Ilocano rollout is claimed.
- P0-A/C/D contracts are reconciled in the same freeze. No runtime route IDs or implementation claims are considered complete until P1 evidence exists.
- No runtime tests apply to this documentation-only task.
