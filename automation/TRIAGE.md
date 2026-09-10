# BibleQuest autonomous triage

Owner: Agent 5 (`BQ-A5-FIREWALL`)
Generated: 2026-09-10 JST

## Freshness
- Active milestone: **#82 Avatar Vault — HIGH-RISK**.
- Current canonical: `feature/v3-avatar-vault` at exact `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`.
- Frozen base: `release/v3.54-psychometrics` at `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- Exact product functional candidate `37f1dc671804a1bb67ede2e5104002160b24c9dd` passed run `34483151962`, including architecture, edge/security and browser/mobile/Avatar Vault smoke.
- First bookkeeping candidate `dde924f86f83baf78659f303e442930b38749aca` failed run `34483915685` in accumulated architecture validation because inventory summary counts did not match promoted rows; later phases were skipped. Current lineage contains the bookkeeping-only correction/defect record but requires a new exact complete bookkeeping gate.
- A2/A3/A4 manual investigation reports were produced during this session. Their core product findings were independently rechecked against current API/app/migration behavior; changes after the functional SHA are bookkeeping/docs, so the product findings remain applicable. Any future product/API/migration/workflow movement makes this triage stale.
- A1 Release Captain was not run. Writer lease remained outside this investigation; this triage performs no product/canonical/release mutation.

## BLOCKER
1. **Shared avatar JSON is destructively replaced.** Current `api.avatarVault.save` constructs `avatar={cosmetic:selectedStyle}` and updates the whole `bible_congregation_members.avatar` value. Live production avatar data is structured and retained legacy behavior merged cosmetic into the existing object. Counterfactual: equipping a cosmetic can erase face/outfit/companion/background or other avatar fields used by congregation surfaces. This violates #82 persistence/data-integrity parity.

2. **Cloud save can split into two states with no real reopen retry.** The API writes `bible_avatar_cosmetics` first and congregation avatar second. `load()` reads selected style but does not reconcile the congregation-avatar write, while the UI says failed sync will retry when reopened. Counterfactual: first write succeeds, second fails, and private selection remains newer than congregation-visible avatar indefinitely. #82 persistence/recovery is therefore not proven/correct.

3. **Candidate migration/RLS premise conflicts with live backend authority.** Read-only live inspection shows `bible_congregation_members.avatar` already exists as structured JSONB and an own-public-profile UPDATE policy already exists with congregation-membership qualification. The candidate migration adds an `if not exists` column with a different fresh-environment default and a second self-update policy scoped only by user id. Counterfactual: repository/fresh-install policy semantics diverge from live verified authority and add an unnecessary alternate authorization path. Reconcile migration history/schema rather than deploying this as a missing-column/policy fix.

4. **Current bookkeeping state is not exact-gate green.** Run `34483915685` failed at architecture validation and cannot authorize promotion; edge/browser phases were skipped. Current `60100f0...` differs from that candidate and has no transferable PASS. Even if a later bookkeeping gate turns green, BLOCKER 1–3 remain because the current harness does not faithfully exercise those semantics.

## MILESTONE
- Preserve authoritative #82 boundary: **browse; select; persist; render fallback**. Do not absorb #83 or create duplicate counters.
- The dedicated 390px Avatar Vault smoke is now present and was successfully executed against functional candidate `37f1dc6...`; the earlier browser-smoke absence is resolved.
- Add semantic regressions that can actually fail on (a) loss of existing avatar JSON keys and (b) first-write-success/second-write-failure with reopen reconciliation, then run the full exact-SHA suite again after the product correction.
- Resolve the 10 unavailable legacy unlock rules. Retaining them visibly as unavailable avoids fake counters, but full parity should not silently count missing retained behavior unless an authoritative deferral is explicit.

## DEFER
- #83 Innovation and later rows remain outside #82.
- Do not duplicate question/recall/couples/community/assignment/Journey metric ownership merely to unlock the 10 deferred styles.

## IGNORE / RESOLVED
- The earlier finding that no Avatar Vault browser/mobile smoke existed is resolved.
- Functional run `34483151962` is valid evidence that the exercised suite passed at `37f1dc6...`; it is not evidence for untested cloud merge/reconciliation behavior and is not transferable to bookkeeping SHAs.
- `automation/CURRENT.md` remains stale and does not override live refs/evidence.

## Firewall decision
**4 BLOCKER; NO PROMOTION RECOMMENDATION.**

The most important result of the manual investigation is that #82 currently has a green functional suite that misses two real persistence failures, plus a migration assumption contradicted by the live backend. Those must be corrected before a successful bookkeeping run or a `Verified` ledger label can justify `release/v3.55-avatar-vault`.

## Next safe action
Manual captain should keep A1 disabled, correct only the reproduced #82 persistence/migration defects, add faithful regressions for them, and rerun the full exact functional gate on the new SHA. A3/A4/A5 must then review that exact HIGH-RISK candidate; only afterward should bookkeeping receive its own complete exact-SHA gate and release promotion be considered.