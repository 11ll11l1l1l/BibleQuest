# A3 architecture/security review — #81 Psychometrics suite

Agent: `BQ-A3-ARCH-SECURITY`
Date: 2026-09-10 JST

## STATE / PROVENANCE

- Active milestone: #81 Psychometrics suite.
- Canonical branch: `feature/v3-psychometrics`.
- Exact canonical HEAD at final live re-read: `e4e126b988131620879d4a7bbf087be5f4f72160`.
- Dedicated `agent/a1-work/081-...` candidate: **not found**.
- Latest frozen base independently verified: `release/v3.53-personality-profile` at `2c62a63e5bbdedae47834714e65751a57d58b696`.
- Prior frozen #79 release independently observed: `release/v3.52-linked-activities` at `38639bd71ffc0fdc2449f9cba3add59a8b88b4b7`.
- Exact complete workflow evidence for current #81 HEAD: **none found** (`head_sha=e4e126b9...` returned zero runs at inspection time).
- This report becomes stale immediately if the canonical SHA moves, an `agent/a1-work/081-...` candidate appears, persistence changes away from `privateStorage`, auth/session ownership changes, schema/RLS/grants/server code is introduced, or the #81 contract changes.

## INSPECTED PRIMARY EVIDENCE

FACT:
- Authoritative inventory at frozen/current lineage defines #81 as `complete assessment; result; persistence; mobile`; #80 is already Verified.
- `release/v3.53-personality-profile` resolves to exact `2c62a63e5bbdedae47834714e65751a57d58b696`.
- Current #81 canonical resolves to exact `e4e126b988131620879d4a7bbf087be5f4f72160` and its inspected commit composes a Psychometrics engine/service/page through the existing bootstrap route table.
- `src/app/psychometrics.js` stores assessment state only through injected `privateStorage`, namespaced by `psychometrics:<owner>` where owner is `account:<authenticated user id>` or `guest`.
- The service reads/writes/removes only the current owner key; it does not call Supabase, central remote API, Edge Functions or RPCs.
- `src/core/storage.js` implements `privateStorage` under `biblequest.v3.private.<encoded-key>` in localStorage and excludes private-prefixed entries from portable backup/export/restore.
- Existing #80 Personality Profile independently uses the same private-storage owner pattern and explicitly states that its local profile is not shared with congregations/leaders/assignments/Couples/Cloud Notes/other signed-in accounts.
- Current #81 route composition does not itself grant any remote role or server authority.

## REQUIRED OWNER / COMPOSITION

RECOMMENDATION:
- Keep the Psychometrics engine as calculation/definition owner and `src/app/psychometrics.js` as the sole persistence/session-scope owner for #81.
- Keep `privateStorage` as the only persisted store unless primary contract evidence later requires cloud sync.
- Keep central bootstrap/router ownership limited to normal route composition; do not add a parallel navigation or persistence owner.

## SAFE DATA FLOW

FACT:
1. Session owner determines the current authenticated user or guest state.
2. Psychometrics service derives a per-owner private local key.
3. Engine receives/normalizes answers and calculates results.
4. Service persists normalized state to the current owner's private local key.
5. Reopen reads only that same owner key.
6. Private-prefixed local data is excluded from ordinary portable backup.

INFERENCE:
- This is a safe bounded architecture for the current contract because #81 requires persistence but does not, from inspected evidence, require congregation sharing, cross-device sync, leader visibility, cloud analytics or trusted scoring.

## AUTHORIZATION / RLS / SERVER TRUST BOUNDARY

FACT:
- No server authorization path is required for the currently inspected local-only persistence model.
- No new RLS/grant/RPC/Edge authorization is evidenced by the inspected #81 composition.
- Owner isolation is an application/session namespace boundary in localStorage, not a server-enforced multi-tenant boundary.

RECOMMENDATION:
- Do not represent local owner namespacing as cryptographic secrecy or server authorization.
- If #81 later adds cloud persistence, sharing, account sync, leader access, score/reward effects, or server-side analytics, reclassify HIGH-RISK before that change and require explicit authenticated server authorization plus schema/RLS/grant review.

## PRIVACY / SCOPE

FACT:
- Psychometric answers/results are potentially sensitive personal data even when used only for self-reflection.
- Current persistence is device-local and account/guest namespaced; private-prefixed values are omitted from portable backup.

RECOMMENDATION:
- Keep results out of congregation, assignment, leaderboard, score-event, Couples and general backup flows unless a separately recovered contract explicitly requires disclosure.
- Do not let #81 results silently alter doctrine, Scripture content, permissions, faith scoring, leader decisions, or other users' experience.
- UI should accurately describe this as private device storage, not encrypted storage.

## LIFECYCLE / SESSION BOUNDARY

FACT:
- Authenticated users and guests resolve to different keys; another authenticated user id resolves to a different key.
- Current-owner clear removes only the current owner key.

RECOMMENDATION:
- Preserve session-transition isolation: sign-out/account switch must not cause one account's psychometric state to be rendered as another owner's state.
- Do not automatically claim historical guest data into a later signed-in account without explicit recovered migration semantics.

## UNSAFE APPROACHES

- Moving psychometric answers/results into ordinary portable storage without explicit contract/privacy justification.
- Uploading results to Supabase or analytics merely for convenience.
- Using browser-visible scores as trusted authorization, congregation role, assignment completion or score-event input.
- Exposing another local account's key by enumerating private storage.
- Treating this suite as a clinical diagnosis, employment screening, spiritual maturity score or authoritative psychological assessment without a separately proven product contract and safeguards.
- Broadening bootstrap/router/global-shell ownership beyond the minimum route composition required by #81.

## RISK TIER

INFERENCE/RECOMMENDATION:
- The inspected #81 persistence/trust boundary itself is **NORMAL-RISK** while it remains local-only through existing Session + privateStorage owners and does not change server/schema/auth authority.
- Any modification to shared router/shell ownership beyond additive route composition, existing accumulated tests/workflow semantics, auth/session semantics, package dependencies, server functions, schema/RLS/grants, or cross-feature persistence immediately makes the affected candidate **HIGH-RISK** under the control rules.

## BLOCKERS

Architecture/security blocker: **none established for the bounded inspected implementation**.

Process safeguard: no dedicated `agent/a1-work/081-...` branch was found. Autonomous unverified product work therefore does not satisfy the required quarantine invariant unless live state is reconciled as manual work by A1/A5.

## MISSING EVIDENCE

- No exact complete accumulated workflow run was found for `e4e126b988131620879d4a7bbf087be5f4f72160`.
- No dedicated #81 work-candidate SHA exists for candidate-specific independent review.
- I have not established from primary evidence that cloud sync, congregation sharing, cross-device migration, clinical interpretation, scoring/rewards, or leader visibility belongs to #81; these must not be invented as parity requirements.
- Exact mobile behavior, assessment completion behavior and reopen persistence still require executable QA evidence on the final candidate.

## ARCHITECTURE ACCEPTANCE CHECKS

- Current owner key changes correctly across guest/account/session changes.
- One account cannot render another account's saved local result through normal service APIs.
- Complete assessment -> result -> save -> reopen remains deterministic through engine + service owners.
- Private psychometric state remains excluded from normal portable backup.
- No remote API/Supabase/RLS/grant/Edge path is introduced without explicit HIGH-RISK review.
- No score/authorization/doctrinal behavior is derived from psychometric results.
- Exact accumulated architecture, edge/security and browser/mobile suite is green on the final candidate/bookkeeping SHA.

## TRIAGE RECONCILIATION

After forming the findings above, TRIAGE was read. The inspected TRIAGE still covered #79 at `1b963b8c...` and is stale relative to live #81 state; it was not used as evidence.

## DISPOSITION

INFERENCE/RECOMMENDATION: #81 currently has a safe bounded architecture with no proven trust-boundary blocker. Promotion readiness is **not established** because there is no exact complete run for current `e4e126b9...` and no quarantine candidate. Preserve local-only private persistence and do not broaden into cloud/server/shared-data semantics without new primary evidence and HIGH-RISK review.