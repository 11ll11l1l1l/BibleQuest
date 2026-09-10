# A3 Architecture / Security — #42 Same-room Play Together

STATE / PROVENANCE
- Agent: `BQ-A3-ARCH-SECURITY`
- Inspected: 2026-09-11 JST
- Active canonical: `feature/v3-same-room-play-together` @ `3d0d3591e10abc45cb24687a6ecd32ca4951bd4d`
- Work candidate: none found under `agent/a1-work/042-*`
- Frozen base: `release/v3.65-reset-recovery` @ `ab3584906b3d017ea555416910f23e9414ed2ef8`
- Canonical is exactly one commit ahead of frozen base; frozen-to-canonical diff modifies only `src/app/games.js` (+48/-4).
- Risk assessment from inspected product change: NORMAL-RISK architecture/data/security scope. No schema, migration, RLS, grant, trusted Edge/RPC/server, dependency, workflow, global shell, or verified-owner replacement is present in the diff.

INSPECTED PRIMARY EVIDENCE
- Live refs for canonical, frozen base and `agent/a1-work/042-*`.
- Frozen-to-canonical exact compare.
- `FEATURE_INVENTORY_V3.md` at canonical SHA: #42 contract is `2–6 players; rotating turns; scoreboard; finish`; #43 Live Rooms is separate.
- `DEVELOPMENT_HANDOFF_V3.md` at canonical SHA: #42 follows v3.65 and must not absorb #43.
- `src/app/games.js` at canonical SHA.
- Actions runs scoped to `feature/v3-same-room-play-together`: none found.
- TRIAGE was read only after provisional findings were formed.

FACT — REQUIRED OWNER / COMPOSITION
- `createGameLauncherService` remains the single Games application-service owner and still requires the verified Progress, Storage and Recall Pack owners, with optional verified Content Moderation composition.
- #42 adds same-room state and methods inside that existing Games owner: `getSameRoomState`, `startSameRoom`, `answerSameRoom`, `nextSameRoom`, `finishSameRoom`, `resetSameRoom`, plus fixed 2–6 limits.
- The change does not create a second storage, progress, auth, networking, room, or server owner.

FACT — SAFE DATA FLOW
- Same-room state is in-memory only (`sameRoom`) and is not written to Storage, Supabase, Realtime, Progress, XP, leaderboard, or another cloud owner.
- `startSameRoom` builds the existing `mixed-quest` question bank and applies the existing moderation owner when supplied.
- `answerSameRoom` validates a local choice index, increments only the active local player's score, and locks duplicate answers.
- `nextSameRoom` rotates `currentPlayerIndex` modulo player count; completion transitions to `same-room-complete`.
- `finishSameRoom` explicitly completes early; `resetSameRoom`, `showLauncher`, and `leave` clear same-room state.

FACT — AUTHORIZATION / RLS / SERVER TRUST BOUNDARY
- #42's current implementation does not cross an authorization or persistence trust boundary and requires no server/RPC path for its recovered same-device contract.
- No migration/RLS/grant/trusted-function file changed from frozen v3.65 to canonical `3d0d3591...`.
- Therefore no new browser mutation privilege or service-role authority is justified for #42.

RECOMMENDATION — BOUNDARY THAT MUST NOT BE BROADENED
- Keep #42 strictly same-device/local. Do not add Supabase tables, Realtime channels, room codes, membership authorization, reconnect logic, remote scoring, trusted score events, or cloud persistence merely to implement Play Together; those behaviors belong to #43 Live Rooms or already verified owners.
- Do not award normal game XP/progress from same-room answers unless separate authoritative parity evidence requires it. The inspected #42 contract requires player count, turn rotation, scoreboard and finish, not progression writes.
- Keep question moderation composition through the existing Games/Content Moderation path rather than creating a separate question-policy owner.

FACT — LIFECYCLE / CLEANUP
- Same-room state is reset by `resetSameRoom`, `showLauncher`, and `leave`; there are no timers, event listeners, subscriptions, Realtime channels, or network resources introduced by this diff.
- No stale remote-room cleanup requirement exists for #42 as currently scoped.

PRIVACY / SCOPE
- Current player records contain generated IDs, generated display names (`Player 1` etc.) and local scores only. Nothing is persisted or transmitted by the inspected change.
- #43 Live Rooms remains separately Not started in the authoritative inventory and must not be folded into #42.

NON-BLOCKING OBSERVATIONS
- Architecture is appropriately bounded for the recovered #42 contract.
- The same-room state is deliberately separate from the normal single-player `state`, reducing accidental XP/result persistence coupling.

MISSING EVIDENCE
- No `agent/a1-work/042-*` quarantine candidate exists.
- No Actions run exists for canonical `3d0d3591...`; therefore there is no exact-SHA functional or accumulated-suite PASS for #42.
- No #42-specific permanent validator/edge/browser evidence was present in the inspected run evidence. Acceptance still needs executable coverage proving 2 and 6 player bounds, rotation, score isolation, duplicate-answer lock, normal and early finish, reset/leave cleanup, and no #43/network side effects.
- This report does not treat absent runtime verification as an architecture failure; it is simply unverified product behavior.

ARCHITECTURE ACCEPTANCE CHECKS
1. #42 stays inside the existing Games owner with no parallel owner.
2. 2–6 player validation is enforced.
3. Turn ownership rotates deterministically after answered questions.
4. Only the active local player's score changes; duplicate submissions cannot double-score.
5. Full-bank and explicit early finish reach a stable completion state.
6. reset/launcher/leave clear local same-room state.
7. Existing moderation composition is preserved.
8. No storage/cloud/Realtime/auth/RLS/server path is introduced for #42 without new primary evidence and risk reclassification.
9. #43 Live Rooms remains separate.
10. Exact candidate/canonical workflow verification must execute permanent #42 coverage before parity status promotion.

TRIAGE COMPARISON AFTER INDEPENDENT PASS
- Current TRIAGE is repository-state stale in one factual respect: it states no `feature/v3-same*` branch was found and says not to begin #42, while canonical `feature/v3-same-room-play-together` now exists at `3d0d3591...`.
- TRIAGE's separate unresolved #93/#94 HIGH-RISK governance debt is outside #42's local architecture contract. This A3 report does not override A5's firewall authority; it establishes only that the inspected #42 product delta itself does not introduce a new security/trust-boundary blocker.

DISPOSITION
- #42 architecture/security: SAFE PATH EXISTS / NORMAL-RISK on exact canonical `3d0d3591...`, subject to missing executable acceptance evidence and any current A5 firewall block from prior milestones.
- No product or workflow changes made.

STALENESS CONDITIONS
This report becomes stale if canonical `feature/v3-same-room-play-together` moves from `3d0d3591e10abc45cb24687a6ecd32ca4951bd4d`, an `agent/a1-work/042-*` candidate appears or moves, frozen base changes, the implementation adds persistence/network/auth/trusted-server/workflow/dependency/global-owner changes, or new exact run evidence materially changes verification status.