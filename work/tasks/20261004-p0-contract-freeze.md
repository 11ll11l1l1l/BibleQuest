# V7 P0 contract freeze

Owner: Lane A integration coordinator
Integration branch: `v7/p0-contract-freeze-20261004`
Exact starting SHA: `00ecb3c3a46606a342b0c259d7ce97579dd9317d`
Status: COMPLETE on this branch; P1 activation takes effect when this change reaches `v7/development`

## Accepted scope

V7 is Library plus structured ONE 2 ONE discipleship: Books, Devotionals, Past Teachings; mentor/mentee pairing; Track → Module → Lesson; the seven-step lesson flow; progress/private response handling; deep links/QR; and pair communication using existing V6 capability.

V8 holds Conversation Decks and new group chat/realtime sessions, central Drive media ingest/storage/full moderation, full Ilocano Bible/UI rollout, bulk content ingestion, Couples expansion, advanced recommendations beyond MVP, and unrelated whole-app redesign.

## Integrated contracts

- P0-A: `docs/v7/V7_DATA_ARCHITECTURE.md` — Library revisions/provenance, curriculum, pair lifecycle, assignments, progress, private responses/sharing, and pair thread context.
- P0-B: `docs/v7/P0_B_NAVIGATION_INFORMATION_ARCHITECTURE.md` — preserves all 50 V6 page routes and shell keys; defines eight V7 route keys with canonical entry/return behavior.
- P0-C: `docs/v7/V7_SECURITY_TENANCY_CONTRACT.md` — server authority, tenant scoping, pair/message access, private learner responses, and fail-closed deep links.
- P0-D: `docs/v7/V7_ACCEPTANCE_AND_CONTENT_CONTRACT.md` — acceptance/evidence rows, licensing/provenance requirements, localization readiness, and V8 transfer manifest.

## Reconciliation decisions

- Route IDs: accept the eight P0-B proposed keys; P1 adds them through the current router and performs resource authorization through existing services.
- Pair messaging: reuse V6 communication; it is restricted to the current pair. No new group chat or transport.
- Private lesson responses: learner-owned by default; any sharing is per item to a named recipient under P0-C.
- Existing V6 groups, media references, Reader, assignments, and authorization remain under their current owners. V7 does not add the V8 media/group systems.
- Corrected P0-B acceptance wording so no group prompt/card or group messaging feature enters V7.
- Corrected a literal escaped newline in P0-C; no behavioral contract changed by this formatting fix.

## P0 exit assessment

All P0 exit criteria are met by this integrated set:
- narrowed V7/V8 scope is consistent across the roadmap and four contracts;
- domain/data/security ownership is explicit;
- routes and journeys are mapped to unique keys, canonical entries, and return behavior;
- acceptance and evidence expectations precede implementation;
- no V7 work depends on the deferred V8 media or realtime-group systems.

Runtime implementation, schema, policy migration, user-path testing, content acceptance, and release evidence remain future P1+ work and are not claimed as PASS here.

## Verification

- Base recorded before integration: `00ecb3c3a46606a342b0c259d7ce97579dd9317d`.
- Documentation-only cross-lane reconciliation; no runtime checks apply.
- Run whitespace/link checks on all changed Markdown before merge; update canonical status in the same integration.
- No runtime, migration, workflow, production, V6 evidence, or user data changed.
