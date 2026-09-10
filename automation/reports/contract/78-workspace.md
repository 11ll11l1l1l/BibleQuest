# A2 contract report — #78 Workspace

Agent: `BQ-A2-CONTRACT`
Date: 2026-09-10 JST

## STATE / PROVENANCE

- Milestone: **#78 Workspace — CLOSED / FROZEN**.
- Canonical branch: `feature/v3-workspace`.
- Canonical exact HEAD at final live recheck: `caf9425fcdfef935560e1d65ff13823c60a7f529`.
- Dedicated `agent/a1-work/078-...` branch: **not found** from live matching-ref inspection.
- Latest frozen v3 release at final recheck: `release/v3.51-workspace` at exact `caf9425fcdfef935560e1d65ff13823c60a7f529`.
- Previous frozen release: `release/v3.50-notification-center` at `fd2409003443f29408342836ae4186a83ed4180b`.
- Exact Workspace bookkeeping verification workflow: run `34465897944`, completed `success`; its isolated workflow explicitly checks out and asserts `caf9425fcdfef935560e1d65ff13823c60a7f529` before running the accumulated suite.

Candidate-specific statements in this report become stale if `feature/v3-workspace` or `release/v3.51-workspace` no longer resolve to `caf9425fcdfef935560e1d65ff13823c60a7f529`, or if a newer frozen release becomes the active baseline. Contract statements become stale if authoritative inventory or `WORKSPACE_V3.md` changes.

## EVIDENCE INSPECTED

Primary evidence inspected independently before reading TRIAGE:

1. Live Git refs for `feature/v3-workspace`, `release/v3.51-workspace`, `release/v3.50-notification-center`, `release/v3.49-ministry-hub`, and matching `agent/a1-work/078...` refs.
2. `FEATURE_INVENTORY_V3.md` at exact `caf9425...`.
3. `WORKSPACE_V3.md` at exact `caf9425...`.
4. Retained root `workspace.js` at exact `caf9425...`.
5. Current v3 `src/app/workspace.js` at exact `caf9425...`.
6. `DEVELOPMENT_HANDOFF_V3.md` at exact `caf9425...` (not authoritative where stale).
7. Isolated verification workflow `verify/v3.51-workspace-bookkeeping-20260910/.github/workflows/v3-regression.yml`.
8. Actions run `34465897944` and job `102834279193`.
9. Only after forming provisional findings: `automation/TRIAGE.md`; it is stale to #77 and does not describe current #78/v3.51 state.

## FACT — AUTHORITATIVE REQUIRED PARITY

The authoritative inventory defines #78 Workspace verification as exactly:

- **open**;
- **save state**;
- **role/session boundary**.

At exact `caf9425...`, the inventory marks #77 Notification Center as Regression-tested and #78 Workspace as Verified, with totals 77 Regression-tested, 1 Verified, 0 Implemented, 22 Not started.

The recovered #78 milestone contract narrows Workspace to a private study orchestration surface over already verified owners. It does not make Workspace a new database or authorization owner.

## FACT — RETAINED USER-VISIBLE INTENT

Retained `workspace.js` shows the old Workspace intent was a signed-in, private/cloud-synced Bible workspace combining study context with notes, highlights, bookmarks, search and Reader context. It directly used a global account/Supabase client, queried `bible_notes`, `bible_highlights` and `bible_bookmarks`, performed browser inserts/upserts/deletes, injected Reader controls and exported global `window.BQWorkspace`.

Those retained implementation mechanics are historical evidence of intent, not a requirement to recreate direct-client ownership. The authoritative #78 contract explicitly rejects copying that ownership model.

## FACT — VERIFIED OWNERS TO COMPOSE

The #78 contract names these existing owners:

- `src/app/workspace.js` — Workspace presentation/orchestration state only.
- `src/app/cloud-notes.js` — sole application owner of cloud-note load/CRUD/cache behavior.
- `src/app/reader.js` — sole Reader passage-state owner.
- `src/app/congregation-membership.js` — sole congregation membership/role projection owner.
- `src/core/storage.js` — sole local persistence boundary.
- `src/features/workspace/index.js` — presentation/event forwarding only.
- `src/app/bootstrap.js` — route composition owner.

Current `src/app/workspace.js` composes session, Cloud Notes, congregation, Reader and storage; it does not instantiate Supabase, query tables directly, or become a separate remote-data owner.

## FACT — SAVE-STATE CONTRACT

The only new Workspace-owned persisted state is low-sensitivity UI state under storage key `workspace-state`:

- schema version;
- active view restricted to `overview` or `notes`.

Workspace must not locally persist note text, search text, account IDs, congregation IDs, auth tokens, or copied cloud rows. Cloud notes remain owned/persisted through Cloud Notes; Reader state remains owned through Reader.

Current `src/app/workspace.js` writes only `{version:1, view:<overview|notes>}` through the injected storage owner.

## FACT — ROLE / SESSION BOUNDARY

Workspace is account-private.

- Signed-out state must fail closed and show no private cloud content.
- Remote-disabled/local-preview state must fail closed for private cloud content.
- Authenticated remote sessions may load Cloud Notes through the existing Cloud Notes owner.
- Congregation membership/role is informational context only.
- Unsupported/missing roles must not unlock shared actions.
- Pastor/admin or any other congregation role does not create Workspace sharing or cross-user access under #78.

Current `src/app/workspace.js` clears Cloud Notes and congregation state on signed-out/remote-disabled paths and does not grant role-based sharing capability.

## FACT — SEARCH / NAVIGATION CONTRACT

Workspace may search already-loaded Cloud Notes in memory. Search text is not persisted.

Opening Scripture from a note must delegate passage state to Reader and return the fixed `reader` route. Note editing/creation delegates to the fixed `cloud-notes` route. Stored data must not become an arbitrary URL/route source.

## FACT — LEGACY BEHAVIOR NOT TO COPY

Do not restore as part of #78 without a separately authoritative contract:

- global `BQWorkspace` ownership;
- direct browser Supabase table ownership;
- direct browser bookmark/highlight insert/upsert/delete;
- new `bible_bookmarks` / `bible_highlights` schema, RLS, grants, RPCs or Edge Functions invented solely from dormant retained calls;
- local duplication of Cloud Notes or Reader persistence;
- role-based sharing/cross-user Workspace access.

The recovered contract states that the tracked retained v2 database blueprint did not establish a corresponding authoritative bookmark/highlight table/RLS/grant contract sufficient to safely reintroduce those writes in #78.

## FACT — EXACT WORKFLOW / RELEASE EVIDENCE

Run `34465897944` completed successfully. The verification workflow explicitly checks out/asserts exact `caf9425fcdfef935560e1d65ff13823c60a7f529` and includes #78 coverage additively:

- `scripts/validate-v3-workspace.mjs` in accumulated architecture validators;
- `tests/v3-workspace-edge.mjs` in accumulated edge regressions;
- `tests/v3-workspace-smoke.mjs` in accumulated browser/mobile regressions.

The job record shows success for exact-SHA assertion, accumulated architecture validators, accumulated edge regressions, Playwright/Chromium setup, local server startup, and accumulated browser/mobile regressions.

A final live-ref recheck after the run confirmed immutable `release/v3.51-workspace` now exists at that same exact verified SHA `caf9425...`. Therefore #78 is frozen at the exact green bookkeeping SHA.

## INFERENCE

- #78 is complete as a release transaction because canonical and frozen v3.51 resolve to the same exact SHA that passed the complete configured bookkeeping gate.
- #78's retained bookmark/highlight behavior is intentionally unresolved/deferred rather than silently equivalent to the narrower v3 Workspace contract. The strongest available evidence supports preserving private Workspace intent without inventing unverified database authority.
- Because no dedicated #78 work branch exists now, the live repository reflects a manual/canonical implementation path rather than the autonomous quarantine pattern described in current control text. This is provenance only; A2 does not modify branches or retroactively adjudicate process ownership.

## RECOMMENDATION

- Use `release/v3.51-workspace` / `caf9425...` as the frozen baseline for the next recovery target.
- Recover #79 Linked activities/challenges independently from authoritative inventory, retained source and existing launch/completion owners. Do not infer that Workspace owns linked-activity completion merely because Workspace can navigate to fixed routes.
- Do not reopen/broaden #78 during #79 recovery unless primary evidence proves a real dependency.

## EXPLICITLY OUT OF SCOPE FOR #78

- #79 Linked activities/challenges.
- #80 Personality profile.
- New bookmark/highlight database ownership.
- New schema/RLS/grants/RPC/Edge Functions based only on retained dormant Workspace calls.
- Realtime synchronization, collaboration, congregation sharing, or cross-user Workspace access.
- Broad router/shell refactors or replacement of verified owners.

## NEXT DEPENDENCY-LIKELY MILESTONES

### #79 Linked activities/challenges
FACT: authoritative inventory requirement is **launch linked activity; completion handoff** and status is Not started at frozen `caf9425...`.

RECOMMENDATION: recover retained launch payload, permitted target/activity kinds, completion return/result contract, persistence/duplicate-award behavior, and existing owner boundaries before implementation. Do not allow stored activity data to become arbitrary routes/URLs without evidence.

MISSING EVIDENCE: no dedicated #79 contract or independently recovered retained source was established in this run; therefore no stronger #79 parity claim is made.

### #80 Personality profile
FACT: authoritative inventory requirement is **complete; save; reopen; privacy boundary** and status is Not started at frozen `caf9425...`.

RECOMMENDATION: treat its privacy boundary as unresolved until retained source plus persistence/authorization evidence is independently recovered. Do not merge #80 into #79 or #78.

MISSING EVIDENCE: no dedicated #80 contract or retained implementation was established in this run.

## AMBIGUITIES / BLOCKERS

No product-contract blocker is established for frozen #78 SHA `caf9425...` from the evidence inspected.

`automation/TRIAGE.md` is stale because it still describes #77 at `f911226f...` and says #78 is deferred, while live refs/inventory/workflow evidence now show #77 frozen at v3.50 and #78 frozen at v3.51.

## MISSING EVIDENCE

- No dedicated `agent/a1-work/078-...` candidate ref exists to audit.
- This A2 run did not independently recover a dedicated #79 or #80 retained-source contract; only their authoritative inventory rows were used for dependency preview.

## CONCRETE #78 ACCEPTANCE CHECKLIST

- [x] Workspace has a native open path under existing composition.
- [x] Signed-out Workspace fails closed for private cloud content.
- [x] Remote-disabled/local-preview Workspace fails closed for private cloud content.
- [x] Authenticated Workspace composes Cloud Notes rather than duplicating its backend ownership.
- [x] Workspace-owned saved state is bounded to version + active view through core storage.
- [x] Search operates on already-loaded notes and is not persisted.
- [x] Reader handoff uses existing Reader state plus fixed `reader` route.
- [x] Cloud-note handoff uses fixed `cloud-notes` route.
- [x] Congregation roles remain informational and do not broaden private access.
- [x] No new bookmark/highlight DB authority is invented for #78.
- [x] Permanent validator, edge and browser/mobile coverage are accumulated.
- [x] Exact bookkeeping SHA `caf9425...` passed complete configured accumulated workflow in run `34465897944`.
- [x] Immutable `release/v3.51-workspace` exists at the same exact verified SHA.
