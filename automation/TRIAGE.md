# BibleQuest autonomous triage

Owner: Agent 5 (`BQ-A5-FIREWALL`)
Generated: 2026-09-10 22:58 JST

## Freshness
- Active milestone: **#82 Avatar Vault — HIGH-RISK**.
- Canonical/bookkeeping candidate: `feature/v3-avatar-vault` at exact `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`.
- Dedicated autonomous work branch `agent/a1-work/082-avatar-vault`: **not found**.
- Frozen base: `release/v3.54-psychometrics` at exact `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- Exact corrected bookkeeping run: **34484163108 — SUCCESS**. Its verifier checked out/asserted exact `60100f0...`; accumulated architecture, edge/security and browser/mobile phases all passed, and the executed browser loop included `tests/v3-avatar-vault-smoke.mjs`.
- Writer lease observed: **FREE**.
- A2 report is SHA-stale at `589827943...`. A3 and A4 reports are current for exact `60100f0...`; A3 says trust boundary NOT SATISFIED and A4 says NOT READY.
- This triage is stale on any canonical/work/frozen ref movement, #82 product/API/schema/test/workflow change, new exact run evidence, or new A3/A4 exact-candidate review.

## BLOCKER
1. **Cosmetic save destructively replaces structured avatar JSON.** `api.avatarVault.save()` writes `{cosmetic:selectedStyle}` as the entire `bible_congregation_members.avatar` object. Read-only live schema inspection shows `avatar` is structured JSONB with default `{face, outfit, companion, background}`, and current production has 3 multi-key avatar rows. Counterfactual: selecting a cosmetic on such a row erases existing presentation fields. This violates #82 `persist`/data integrity.

2. **Two cloud writes can split permanently with no reopen reconciliation.** Save upserts `bible_avatar_cosmetics` first, then updates congregation avatar. `load()` later reads only `bible_avatar_cosmetics.selected_style`; it neither checks nor repairs the public avatar projection. Counterfactual: first write succeeds, second fails, reopen shows the new local/private style while leaderboard/congregation state stays stale indefinitely.

3. **Repository migration introduces a broader self-update policy than the live verified policy.** Live `members update own public profile` requires both `auth.uid() = user_id` and active congregation membership. Candidate migration adds a second UPDATE policy requiring only `user_id = auth.uid()`. PostgreSQL permissive policies combine with OR semantics, and authenticated UPDATE is granted on both `display_name` and `avatar`. Counterfactual: an authenticated user with an inactive/stale own membership row can regain UPDATE ability for those public-profile columns through the new policy even when the existing active-membership policy denies it. The migration also assumes a fresh-install `{}` avatar default while live authoritative schema has a structured avatar default. Reconcile to one authorization/schema contract before promotion.

4. **HIGH-RISK promotion barrier is unsatisfied despite exact green execution.** Run `34484163108` proves the exercised suite passed at exact `60100f0...`, but current permanent tests do not fail on BLOCKER 1/2 or faithfully prove the earned-cosmetic authorization boundary; A3 trust-boundary review is NOT SATISFIED and A4 is NOT READY for this exact SHA. Counterfactual: promoting now would freeze known untested persistence/auth semantics merely because the current harness is green.

## MILESTONE
- Preserve authoritative #82 scope: **browse; select; persist; render fallback**; do not absorb #83 or invent duplicate progression counters.
- Correct persistence so cosmetic mutation preserves existing avatar fields and has explicit retry/reconciliation or one authoritative transactional path for split cloud state; add permanent regressions capable of failing on both counterfactuals.
- Resolve public-cosmetic trust explicitly: either untrusted self-presentation with no score/rank/permission/achievement authority, or a trusted server/RPC/Edge authorization path backed by authoritative progression facts. Do not claim browser-side XP/streak checks are server authorization.
- Harden `validate-v3-avatar-vault.mjs` so future accumulated workflows are required to invoke `tests/v3-avatar-vault-smoke.mjs`; the exact current run did execute it, so this is retention protection rather than a missing-current-run claim.
- Before any new autonomous product/test/workflow write, create/resume the required `agent/a1-work/082-*` quarantine branch from the reconciled exact canonical state; do not continue autonomous implementation directly on canonical.

## DEFER
- The 10 retained cosmetics whose source metrics have no verified v3 owner remain unavailable/deferred rather than creating duplicate question/Recall/Couples/Community/Assignment/Journey counters.
- #83 Innovation remains separate until #82 freezes.

## IGNORE
- The earlier claim that exact `60100f0...` lacked a complete bookkeeping PASS is obsolete; run `34484163108` is exact green and includes Avatar Vault smoke.
- Functional run `34483151962` remains historical evidence only; no PASS transfer is needed because a later exact bookkeeping run exists.
- `automation/CURRENT.md` and parts of `DEVELOPMENT_HANDOFF_V3.md` are stale relative to live #82 refs/evidence and do not override them.

## Firewall decision
**4 BLOCKER; NO PROMOTION RECOMMENDATION.**

Exact execution is no longer the problem. The current HIGH-RISK candidate has a real destructive persistence path, an unreconciled split-write path, and a migration policy that broadens the live active-membership authorization boundary. A3/A4 exact-candidate promotion requirements are therefore not satisfied.

## Next safe action
Keep #82 active. Work only on a reconciled `agent/a1-work/082-*` quarantine successor: preserve/merge avatar JSON, define/test split-write recovery, reconcile the migration/RLS contract without broadening member UPDATE authority, add faithful permanent regressions, then run the entire accumulated exact-SHA functional gate. After that exact successor is green, require fresh A3 trust-boundary satisfaction and A4 READY before A5 can recommend HIGH-RISK promotion/bookkeeping.