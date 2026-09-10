# BibleQuest v3 Development Status

Updated: 2026-09-10 JST

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity ledger. BibleQuest v3 continues to use rebuild-and-verify rather than patch-and-accumulate.

## Deployment safety

- Production v2 remains unchanged.
- `main`, production Supabase and production Cloudflare remain untouched.
- Active development branch: `feature/v3-linked-activities`.
- Normal v3 GitHub Actions remain manual-only (`workflow_dispatch`).
- Temporary `push:` triggers are allowed only on isolated one-shot verification branches; trigger commits are never release candidates.
- Latest frozen checkpoint: `release/v3.51-workspace` at `caf9425fcdfef935560e1d65ff13823c60a7f529`.
- Exact v3.51 bookkeeping verification run: `34465897944`, complete accumulated architecture, edge/security and browser/mobile suite green against the frozen SHA.
- Safety refs remain untouched.

## Current progress represented by the #79 bookkeeping transaction

| State | Count |
|---|---:|
| Regression-tested | 78 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 21 |
| Total | 100 |

Strict implemented-or-better parity represented by this bookkeeping transaction is **79/100**.
Official regression stability represented by this bookkeeping transaction is **78/100**.

These values are provisional until the exact final #79 bookkeeping SHA passes a new complete accumulated gate and is frozen. No PASS transfers from the functional SHA to a changed bookkeeping SHA.

Current leading rows:
- #77 Notification Center/inbox — Regression-tested.
- #78 Workspace — Regression-tested because it survived the complete #79 functional suite.
- #79 Linked activities/challenges — Verified by exact functional candidate `debc386328d4655977681fcb08b7a345346ea3fc` in complete run `34468348888`.
- #80 Personality profile — next non-deferred inventory row after #79 release closure.
- #81 Psychometrics suite remains a separate later milestone; #80 must not silently absorb or relabel it.
- #15 Japanese furigana and Kids #38–40 remain intentionally deferred by user priority.

## #79 Linked Activities / Challenges — functional gate complete

The milestone is intentionally bounded to the authoritative inventory contract: **launch linked activity; completion handoff**.

Recovered and verified behavior:
- the existing Assignments owner remains authoritative for assignment visibility, start, completion requirements and awarded points;
- linked launch first passes through the trusted assignment `start` boundary and only then requests navigation to a verified v3 destination;
- `src/app/linked-activities.js` is a thin orchestration owner and does not call Supabase, Edge Functions, storage or another persistence writer directly;
- recovered linked kinds are strictly allowlisted rather than treated as arbitrary routes;
- verified mappings cover Reader, Guided Study, Mission/Journey, Wisdom Situations, Couples Cloud, Journey Groups, Cloud Notes/reflection and Open Review/quiz;
- Live Rooms remains fail-closed because deferred inventory row #43 is not rebuilt yet;
- unlinked custom assignments remain instruction-only;
- linked activity completion is not inferred automatically: the recipient returns to Assignments and submits completion there, preserving reflection/evidence/confirmation/minimum-quiz-score requirements;
- linked activities cannot self-award assignment points;
- navigation is owned by the central Router; feature code does not write `location.hash` or History directly;
- ministry-role recipient views remain read-only;
- no schema, migration, RLS, grant, RPC, Edge Function or production-system change was introduced.

Permanent #79 coverage:
- `scripts/validate-v3-linked-activities.mjs` — orchestration ownership, navigation handoff, fail-closed routing and workflow boundary validation;
- `tests/v3-linked-activities-edge.mjs` — mapping allowlist, malformed/unknown metadata rejection, trusted start delegation and completion delegation;
- `tests/v3-linked-activities-smoke.mjs` — real 390px Assignment linked-launch/completion-handoff browser coverage;
- existing `tests/v3-assignments-smoke.mjs` retains the generic unlinked/custom start path;
- `.github/workflows/v3-regression.yml` invokes all #79 checks while retaining the complete prior accumulated suite and remains manual-only on the product branch.

Exact functional candidate `debc386328d4655977681fcb08b7a345346ea3fc` passed run `34468348888`. The isolated verification workflow explicitly checked out and asserted that exact SHA; exact-SHA assertion, accumulated architecture validators, all edge/security regressions and the full browser/mobile regression suite all completed successfully.

## Defect / root-cause ledger

The #79 functional gate reproduced and corrected two issues without weakening application behavior or regression coverage:
- Candidate `b446ea26c190905efa6af2f45727f920eb643cb9`, run `34467161828`: global architecture correctly rejected direct `location.hash` navigation from `src/features/assignments/index.js`. Root cause was navigation ownership leakage. The design was corrected so linked launch requests navigation through the central Router owner; the architecture validator was not weakened.
- Candidate `d6bb001ee6ce29740f61c6f3e40468f2ab5be3c3`, run `34467523354`: architecture and edge phases passed, but the older Assignments browser regression expected the generic Start button for a `reading` fixture. #79 correctly turns Reading into a linked activity, so this was a stale test-fixture contract rather than a product defect. The old generic-start fixture was changed to `custom`; #79's dedicated smoke retains linked-Reading coverage. The full suite then reran green on `debc386328d4655977681fcb08b7a345346ea3fc`.

Two zero-byte verification-preparation artifacts were created accidentally during isolated branch setup and immediately removed. Neither remains in the product candidate or changes runtime behavior. Verification branches remain non-release refs.

Earlier milestone defect regressions remain retained in the accumulated suite.

## Next major milestone

The immediate release gate is #79 bookkeeping and freeze; #80 must not be treated as verified early.

1. Treat the final #79 bookkeeping/status transaction on `feature/v3-linked-activities` as a new exact clean candidate.
2. Verify that exact bookkeeping SHA with an isolated one-shot workflow that explicitly checks out/asserts it and executes the complete accumulated architecture, edge/security and browser/mobile suite.
3. If any phase fails, do not freeze; identify the exact root cause, preserve all prior coverage and rerun a corrected exact SHA.
4. If fully green, create immutable `release/v3.52-linked-activities` at that exact green bookkeeping SHA and close #79 as completed.
5. Only after v3.52 is frozen should `feature/v3-personality-profile` be created and #80 write work begin.
6. #80 Personality Profile must recover the old complete/save/reopen/privacy behavior while preserving the existing Transform owner and account/storage boundaries.
7. The retained cloud wrapper used assessment version `ipip_big_five_50_v1`, while current v3 Transform currently exposes a 20-item personality reflection. Do not falsely label the 20-item result as the 50-item IPIP assessment. Resolve the retained assessment provenance before implementing cloud/profile synchronization.
8. Keep #81 Psychometrics Suite separate from #80; any full standalone psychometric assessment belongs to #81 unless retained evidence proves otherwise.

## Release rule

Never freeze a release until the exact clean bookkeeping SHA has passed the complete accumulated regression workflow. Temporary verification trigger commits are never release SHAs. Production v2, `main`, production Supabase and production Cloudflare remain unchanged throughout the rebuild.
