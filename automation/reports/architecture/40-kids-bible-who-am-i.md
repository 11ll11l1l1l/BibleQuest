# A3 architecture/security investigation — #40 Kids Bible Who Am I

Agent: `BQ-A3-ARCH-SECURITY`
Inspected: 2026-09-11 JST

## STATE / PROVENANCE

- Active milestone: **#40 Kids Bible Who Am I — pre-implementation**.
- Canonical #40 branch: `feature/v3-kids-bible-who-am-i` **not found** at final freshness check.
- Dedicated A1 quarantine candidate: `agent/a1-work/040-kids-bible-who-am-i` **not found** at final freshness check.
- Frozen base: `release/v3.71-japanese-furigana` @ exact `c631bea8d5177a9a2ff68139cb104b6fbf26015b`.
- Retained parity reference: `release/v2-parity-snapshot` @ exact `825de10b36c7f9b511cc8cab88aa3a6ce79ef939`.
- Frozen-base exact bookkeeping verification: Actions run `34550650269` = `success`; isolated verifier head `9f6bbffc61b13af2a7ca1f0762119586bf08c029` checked out and asserted exact product SHA `c631bea8d5177a9a2ff68139cb104b6fbf26015b` before accumulated architecture, edge/security and browser/mobile phases.
- No #40 implementation SHA or #40 verification run exists yet, so no PASS is transferred from v3.71.

## INSPECTED PRIMARY EVIDENCE — FACT

1. `FEATURE_INVENTORY_V3.md` at frozen v3.71 records #40 as **Not started**, priority reopened, and requires recovery of the old-version Kids Bible Who Am I contract plus the Games-owner boundary before implementation. #39 Hiragana Match remains explicitly deferred.
2. Retained `bq2-games.js` at immutable v2 parity snapshot `825de10b...` renders a Kids `Bible Who Am I?` tile whose `#kidBible` handler directly calls the same `detective()` function used by the ordinary Who Am I game. The retained source therefore provides direct evidence of one shared game engine, not a separate Kids detective owner.
3. Current v3 `src/app/games.js` owns Character Detective lifecycle under `character-detective`: round identity, detective selection, answer validation, duplicate-submit locking, Progress writes, result persistence, replay and launcher teardown. It composes existing verified Progress, Storage and Recall owners and does not require a separate Kids persistence/service owner.
4. Current v3 `src/features/games/detectives.js` is the shared Scripture-referenced character bank. It presently contains David, Joseph, Zacchaeus, Esther and Peter and describes the mode as `Character Detective` / `Who am I?`.
5. Current frozen `supabase/` state contains the existing schema, migrations and trusted Edge/server functions, but no #40-specific table, RLS policy, grant, RPC, Edge Function or trusted server path exists or is required by the retained #40 contract.
6. Exact frozen-base run `34550650269` completed successfully. Its executed verifier workflow pinned/asserted `c631bea...` and ran the accumulated architecture, edge/security and browser/mobile suites. This is baseline evidence only.

## REQUIRED OWNER / COMPOSITION

**FACT:** The correct architecture for #40 is reuse of the already verified Games/Character Detective owner.

Expected composition:
- Kids surface/entry presentation: additive entry only;
- game lifecycle/state/round identity: existing `src/app/games.js` owner;
- detective content bank: existing `src/features/games/detectives.js` owner;
- progress/reward event recording: existing Progress owner through Games;
- result persistence: existing Games -> Storage path;
- navigation/teardown: existing Games/router composition.

**RECOMMENDATION:** Do not introduce a second Kids-only detective state machine, content bank, round-ID owner, score/reward owner, persistence key, Progress path, router path or backend client.

## SAFE DATA FLOW

Supported safe flow:
1. Kids-facing `Bible Who Am I?` entry is selected;
2. the entry delegates into the existing Character Detective start path;
3. Games creates the round identity and exposes the current detective item;
4. answer handling stays in the existing `answerDetective()` path;
5. duplicate submission is rejected by the existing lock;
6. Progress/result writes remain owned by Games/Progress/Storage;
7. replay/leave returns through existing lifecycle cleanup/navigation.

No user/account/congregation/server data is needed to launch or play this bounded feature.

## AUTHORIZATION / RLS

**FACT:** #40's recovered retained contract is local gameplay. No privileged mutation or remote authorization is implicated.

For the bounded implementation, **no RLS/grant/schema change is required**. Existing Supabase policies and grants should remain untouched.

Any attempt to add cloud score sync, shared Kids leaderboard, congregation-scoped Kids rewards, remote character-bank mutation, or account-level Kids state would exceed recovered #40 parity and require a separate architecture/security review.

## SERVER / TRUST BOUNDARY

For current #40 scope, **no new trusted server/RPC/Edge path is required**.

The safe trust boundary is intentionally absent from this local game path: browser gameplay delegates only to verified local owners. Existing trusted functions elsewhere in the app must not be reused as a generic convenience backend for #40.

Must not be broadened into:
- direct Supabase DML from the Kids game;
- new RPC/Edge Function merely for game launch, answer, score or replay;
- broader RLS/grants to support Kids game state;
- server-authoritative score/leaderboard semantics not present in retained evidence;
- cross-account or congregation synchronization;
- separate Kids reward persistence or identity ownership.

## LIFECYCLE / CLEANUP

**FACT:** Existing Games state already owns the Character Detective lifecycle and duplicate-answer lock. #40 should enter and leave through this owner rather than mounting an independent listener/timer/state machine.

**RECOMMENDATION:** Permanent #40 coverage should prove that repeated Kids entry, answer, replay and leave do not create duplicate handlers, duplicate Progress events, duplicate result writes or stale detective state.

## PRIVACY / SCOPE

**FACT:** The retained Kids Who Am I behavior does not require identity, child profile, congregation membership, chat, remote content, analytics or server persistence.

**RECOMMENDATION:** Keep #40 account-agnostic and local to existing Games semantics. Do not infer child-specific personal-data storage from the Kids label.

## RISK CLASSIFICATION

**INFERENCE / RECOMMENDATION:** The recovered #40 contract is **NORMAL-RISK architecturally** if implementation is strictly additive presentation/delegation into the existing verified Games/Character Detective owner and adds only new milestone coverage.

Reclassify to **HIGH-RISK before continuing** if the actual diff modifies an existing accumulated test/workflow beyond additive invocation, replaces a verified owner, changes global shell/router ownership, changes Progress/Storage semantics broadly, adds dependencies, touches schema/RLS/grants/trusted functions, or adds remote/cross-account behavior.

## ACTIVE GATING EVIDENCE OUTSIDE #40 — FACT

Independent primary-evidence checks found two current accumulated-harness debts that can affect whether a future #40 baseline is safe to build from:

1. `tests/v3-kids-memory-lazy-progress-capability.mjs` is absent at frozen `c631bea...`. The retained `tests/v3-content-moderation-edge.mjs` constructs Games with a minimal `{ record(){} }` Progress stub but does not launch Memory Meadow, so it does not itself prove the previously asserted fail-loud launch behavior when `Progress.getState()` is unavailable.
2. `tests/v3-admin-operations-edge.mjs` injects a mocked privileged API. The real `supabase/functions/bq-admin-ops/index.ts` independently enforces JWT identity, active platform `owner|admin` role, Owner-only delete, no self-delete, no deletion of another active owner, ownership-transfer preconditions and server-side admin deletion. The current edge regression does not execute that real trusted boundary, so server authorization/delete behavior can change without this client-level test detecting it.

These are not #40 product requirements. They are accumulated verification/trust-boundary evidence concerns for the baseline from which #40 would proceed.

## BLOCKERS / NON-BLOCKING OBSERVATIONS

**#40 architecture blocker:** none established while #40 remains pre-implementation and bounded to the existing Games owner.

**Baseline gating concern:** the two accumulated-harness debts above should be resolved before treating a new post-v3.71 baseline as fully trustworthy. The #93 item is specifically a trusted-boundary evidence gap; the #38 item is regression-coverage integrity rather than a new #40 architecture defect.

`automation/CURRENT.md` remains stale at the historical v3.48/#75 state. It was not used as product evidence after live refs and frozen state were inspected.

`automation/TRIAGE.md` was read only after the independent primary-evidence pass. It agrees that #40 is pre-implementation/provisional NORMAL-RISK and identifies the same two baseline gating debts, but that agreement is not proof and is not used as evidence here.

## MISSING EVIDENCE

- No #40 canonical implementation branch exists.
- No `agent/a1-work/040-kids-bible-who-am-i` candidate exists.
- No actual #40 diff exists to audit for owner/security expansion.
- No #40-specific exact functional or bookkeeping run exists.
- No permanent #40 architecture/edge/browser test exists yet.
- Because no candidate exists, no candidate-specific A3 promotion opinion is possible yet.

## ARCHITECTURE ACCEPTANCE CHECKS FOR FUTURE #40 CANDIDATE

A3 should accept a bounded candidate only if:
- Kids `Bible Who Am I?` delegates to the existing Character Detective owner;
- no parallel detective bank/state machine/persistence/reward owner is introduced;
- Progress/Storage behavior is reused rather than broadened;
- no schema, migration, RLS, grant, RPC, Edge Function or dependency change enters the diff;
- no global router/shell owner changes;
- duplicate-submit/replay/leave lifecycle remains single-owned;
- permanent tests exercise the Kids entry through the real Games owner;
- complete exact-SHA accumulated verification passes on the actual candidate/bookkeeping SHAs.

## DISPOSITION

At frozen `release/v3.71-japanese-furigana` SHA `c631bea8d5177a9a2ff68139cb104b6fbf26015b`: **#40 SAFE PATH EXISTS / PROVISIONAL NORMAL-RISK / NO NEW SERVER OR AUTHORIZATION PATH REQUIRED.**

No implementation candidate exists, so this is a pre-write architecture contract, not promotion authorization.

## STALENESS CONDITIONS

This report becomes stale immediately if: a #40 canonical or `agent/a1-work/040*` branch appears or moves; frozen baseline advances; the actual #40 diff touches Progress/Storage semantics, router/shell, dependencies, schema/RLS/grants, RPC/Edge/server paths or existing accumulated tests/workflow; #38/#93 permanent evidence changes; or exact #40 workflow evidence appears.

A3 made no product/workflow/canonical/work branch/inventory/release/handoff/lease/CURRENT/TRIAGE/`main`/production-system change.