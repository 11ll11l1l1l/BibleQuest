# BibleQuest v3 — Product/Documentation Reconciliation

Status: cumulative product integrated, promoted and live verified
Updated: 2026-09-11 JST

## Current product/release truth

The former divergent post-release lines have been reconciled, exactly verified and released.

- cumulative exact-green product SHA: `cf17f36f9f041aee4715271eaebbe8581fc2c067`
- cumulative verifier run: `34610903807` — **success**
- parent Line A: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`
- parent full Line B: `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`
- docs checkpoint: `675c6181ecc4dc36a47ba410feab142605eba913`; docs contract `34612119469` — success
- live `main` / promoted release commit: `04bd51bfc4ff16a3b42d13e47e95e637999b4880`
- release branch: `release/v3-cumulative-20260911-r1`
- production verifier: `34612873935` — **success**
- prior rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

The historical Line A / Line B merge base was `545b5b98d88ca04001d3675317c37cbcd3306955`. That divergence is resolved. Do not restart the merge unless newer ancestry proves a new divergence.

## What the released cumulative product contains

- Assignment Private Responses;
- Workspace/Cloud Notes deployed-schema compatibility;
- Visual tranche 18;
- Avatar Vault v2;
- Calendar v1.5.

## Product verification earned by `cf17f36...`

Run `34610903807` checked out the exact product SHA and passed:

- exact candidate/two-parent ancestry;
- cumulative cross-line integration contract;
- focused Assignment privacy, Workspace schema, Avatar, Calendar and visual regressions;
- deployment gate;
- complete accumulated architecture validators;
- complete accumulated edge regressions;
- complete accumulated browser/mobile suite.

No PASS transfers to a changed product SHA.

## Promotion and production proof

`04bd51b...` is a history-preserving promotion merge with the same cumulative/docs tree. Its parents preserve both the cumulative line and the former `main` documentation line.

Run `34612873935` independently verified:

- `main` points to the intended promotion commit;
- deployment gate passes;
- key files on both `mybiblequest.pages.dev` and `biblequest-7th.pages.dev` match the promoted release byte-for-byte;
- both hosts pass shell, Assignments, Workspace, Avatar Vault, Calendar, accessibility and offline browser/mobile smoke.

GitHub promotion and Cloudflare propagation were therefore proven separately for this release.

## Production Supabase migration truth

Production project: `zkfmgezvzugchcwppreq`.

All release migrations are **APPLIED + LIVE VERIFIED**:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

### Assignment response presence

The deployed pre-migration helper `private.bible_assignment_visible(uuid,text,uuid)` matched the reviewed migration contract before application. Post-apply evidence proved:

- safe projection columns only;
- RLS enabled;
- anon cannot read;
- authenticated can SELECT under RLS but cannot mutate;
- private sync function not executable by anon/authenticated;
- backfill parity: 1 completed / 1 projected / 0 missing / 0 orphan;
- rollback authorization matrix: intended member 4/4, unrelated member only `all` 1/4, ministry 4/4;
- reopen/recomplete/delete trigger behavior synchronized correctly.

### Calendar

Post-apply evidence proved:

- personal own-row RLS;
- congregation-member shared read and ministry-only shared insert;
- notification trigger is private/non-callable to anon/authenticated;
- ministry could create personal and congregation rows in rollback smoke;
- an ordinary member could read the shared row but not the ministry user's private row;
- no smoke event/notification data persisted after rollback.

The post-migration security advisor added no new release-migration finding; pre-existing findings remain separate follow-up evidence.

## Document authority

When documents disagree:

1. latest explicit user instruction;
2. `DEVELOPMENT_PRIORITY_V3.md` for cross-feature task selection;
3. this file for cumulative product/release ancestry and release truth;
4. `DEVELOPMENT_HANDOFF_V3.md` and `DEVELOPMENT_STATUS_V3.md`;
5. feature-specific contract inside that feature only;
6. exact-SHA/live workflow evidence;
7. historical release/investigator/ledger documents.

## Next safe gate

The cumulative integration/release gate is closed. Future work must start from the current cumulative production base and select the next dependency-safe Priority 1 functionality/visual milestone.

Do not:

- repeat Line A/Line B reconciliation;
- reapply the three release migrations;
- rebuild Calendar v1/v1.5;
- reopen completed visual tranches solely to create work.

Do refresh live refs, confirm incompleteness, preserve ownership, run focused + accumulated exact-SHA verification, and treat later production promotion as a separate evidence-bearing step.
