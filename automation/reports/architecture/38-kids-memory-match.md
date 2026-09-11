# A3 Architecture/Security Review — #38 Kids Memory Match

Agent: `BQ-A3-ARCH-SECURITY`
Reviewed: 2026-09-11 JST

## Exact state and freshness

- Canonical: `feature/v3-kids-memory-match` @ `918762b11d3487d07880449bb37264da1e33ace3`.
- Dedicated `agent/a1-work/038*` candidate: **not found**.
- Frozen base: `release/v3.69-bible-world-artwork` @ `368b4e905c94ede38e733585d151891c7bdca96b`.
- Exact complete verifier: run `34546962603` = **SUCCESS**. Its isolated workflow head was `64418e97cd5852258cb22222cc4d4d34a45aa8c2`, but the executed workflow explicitly checked out and asserted product SHA `918762b11d3487d07880449bb37264da1e33ace3` before running accumulated architecture, edge/security, and browser/mobile suites.
- This report is stale immediately if canonical/frozen refs, the #38 product delta, Progress ownership, workflow coverage, or candidate lineage changes.

## Risk classification

**RECOMMENDATION — HIGH-RISK architecture review required for this #38 lineage.**

The Memory Meadow UI/game lifecycle itself is local and bounded, but the implementation also changes the already-verified global `Progress` persistence/event owner by adding persistent `stars` and `coins` balances plus per-event reward semantics. That is a cross-feature persistent-owner expansion, not merely a leaf Games addition. It should therefore receive the independent barriers expected when an active milestone unexpectedly broadens another verified owner.

This is **not** a server-authentication risk finding: no #38 server/RLS/RPC path was found in the canonical delta.

## Primary-evidence findings

### FACT — ownership boundary

- `src/app/games.js` remains the Games launcher/lifecycle owner and instantiates/exposes one `kidsMemory` child using the existing Games round-ID factory.
- `src/app/kids-memory.js` keeps Memory Meadow round/card/move/lock/pending state in memory. It has no direct localStorage/sessionStorage or cloud persistence path.
- Delayed match/mismatch resolution is owned by the mounted Games UI and cleaned on teardown.
- Completion records one `game.memory.complete` event through `Progress`, with `xp: 0` and a reward payload; replay/leave remain within the Games boundary.
- `src/core/progress.js` is extended to own `stars` and `coins`, normalize/validate them, persist them with progress state, include rewards in event identity conflict checks, and return awarded rewards.

### FACT — schema / RLS / grants / trusted-server boundary

The frozen-to-canonical compare contains no Supabase/migration/Edge-Function path in the #38 delta. No #38 schema migration, RLS/grant change, trusted RPC, Edge Function, auth-role expansion, or production-server write path was found.

### FACT — exact executable evidence

Run `34546962603` completed successfully. Its executed workflow explicitly checked out/asserted exact product SHA `918762b11d3487d07880449bb37264da1e33ace3`, then completed:

- accumulated architecture validators, including `validate-v3-kids-memory.mjs`;
- accumulated edge/security regressions, including Progress, Content Moderation, Games and the permanent #38 tests;
- accumulated browser/mobile regressions, including `v3-kids-memory-browser.mjs`.

The canonical permanent workflow is restored to `workflow_dispatch` and retains the observed prior accumulated suites while adding the #38 validator/tests.

### FACT — persistent reward integration

`tests/v3-kids-memory-progress-integration.mjs` executes Memory Meadow with the real Progress service and verifies zero XP, persisted stars/coins, one meaningful completion/streak event, and reward data stored on the completion event.

### FACT — regression deletion requiring explicit accounting

Canonical commit `918762b...` removes `tests/v3-kids-memory-lazy-progress-capability.mjs`, which had been added immediately beforehand in the same #38 lineage. That removed test asserted two things:

1. the Memory child can be constructed with only `progress.record`, without requiring `getState` before launch;
2. launching Memory Meadow without `Progress.getState` fails loudly.

Permanent `v3-content-moderation-edge.mjs` provides assertion-by-execution for the first property because it constructs the Games launcher with a Progress stub exposing only `record()` while the launcher constructs its Memory child. I did **not** find a permanent assertion-equivalent test that explicitly pins the second fail-loud launch behavior. `v3-kids-memory-invalid-input.mjs` uses a complete `getState` implementation and does not cover its absence.

Therefore the deletion is not proven to remove an inherited frozen regression, but one explicit defensive assertion was lost. A4/A5 should judge whether the remaining coverage is sufficient before promotion rather than treating the deletion as automatically harmless.

## Safe trust boundary

**RECOMMENDATION**

Keep #38 entirely inside this boundary:

- Games owns Memory Meadow launch/leave/replay, round identity, in-memory gameplay state, and delayed-resolution lifecycle.
- Progress remains the single persistent owner of stars/coins and completion-event idempotency.
- Memory Meadow may request only a zero-XP reward event through Progress; it must not write storage directly.
- UI owns temporary timers only and must clear them on navigation/unmount.
- No server authorization path is required for the current local-device #38 contract.

If stars/coins later become cross-device, competitive, congregation-visible, leaderboard-relevant, or otherwise server-trusted, that is a separate HIGH-RISK contract. It would require an explicitly authorized server/RPC path and corresponding RLS/auth/idempotency review; the current local Progress event must not be silently promoted into a trusted remote score.

## What must not be broadened

**RECOMMENDATION**

Do not add, under #38 without new contract evidence and review:

- direct localStorage/sessionStorage from the Memory child;
- a second stars/coins persistence owner;
- Supabase/cloud reward sync;
- trusted-score, leaderboard, congregation or cross-account reward publication;
- direct RPC/Edge Function calls;
- XP awards contrary to the current zero-XP boundary;
- a second game launcher, round-ID owner, or timer owner.

## Missing evidence / promotion conditions

### FACT

- No `agent/a1-work/038*` candidate exists, so there is no separate exact quarantine candidate for this implementation lineage.
- The authoritative inventory at canonical still labels #38 `Not started`, despite the implementation and exact full run; this report does not modify bookkeeping.
- The durable handoff at canonical is also older than the live #38 state. Live refs and exact run evidence were therefore used instead.

### RECOMMENDATION

Because the #38 implementation broadens the verified Progress persistence owner, promotion should not treat it as an ordinary leaf-only NORMAL-RISK change. Before autonomous promotion/freeze, require:

1. exact-candidate lineage suitable for HIGH-RISK review, or an explicit governance decision accepting the current canonical lineage;
2. current A4 review of that same exact candidate/state;
3. retention or explicit replacement justification for the removed fail-loud Progress-capability assertion;
4. no later schema/RLS/RPC/cloud expansion beyond the local boundary above;
5. exact accumulated green on the final promoted SHA with no unexplained regression weakening.

## TRIAGE freshness

TRIAGE was read only after the findings above were formed. It is materially stale for repository state: it still describes #45/v3.69-pre-#38 progression and defers #38, while primary evidence now shows #38 canonical implementation at `918762b...` with exact successful run `34546962603`.

Its older #93/#94 firewall items are A5 governance matters and are neither adopted nor waived by this A3 architecture report.

## A3 disposition

**Architecture boundary is coherent but HIGH-RISK due to expansion of the verified persistent Progress owner.** The local Games/Memory trust boundary is acceptable at exact `918762b11d3487d07880449bb37264da1e33ace3`, and the exact accumulated workflow is green. No #38 server/RLS/RPC authorization path is required or present. Promotion readiness still depends on HIGH-RISK candidate/review governance and explicit treatment of the removed fail-loud capability regression.