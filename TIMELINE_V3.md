# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-09 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`; the inventory remains authoritative. BibleQuest v3 uses rebuild-and-verify rather than patch-and-accumulate.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Inventory states after #65 implementation:** 64 Regression-tested / 1 Verified / 1 Implemented / 34 Not started
- **Implemented or better:** 66 / 100 (**66% strict parity completion**)
- **Official regression stability:** 64 / 100
- **Latest frozen checkpoint:** `release/v3.38-journey-groups` at `7c06c3380eaac0e20e579ae26453611e63ac564d`
- **v3.38 bookkeeping:** `34259986598` — complete accumulated suite green against the frozen SHA
- **#100 Backup/export/import/reset:** Regression-tested after surviving #62; frozen in v3.35
- **#62 Couples/family local tools:** Regression-tested; frozen in v3.36 and green in the later #63 suite
- **#63 Couples cloud:** Regression-tested; frozen in v3.37 and green in the later #64 suite
- **#64 Journey Groups:** Verified; corrected exact functional candidate `c49ce887bd28323292b6f1b60f7689a1aa194615`, run `34258746664`
- **#65 Encouragements:** Implemented; exact remote code candidate `f6272064192201dd95da6945ce10c4003d9418fc`, browser gate pending
- **#15 Japanese furigana and Kids #38–40:** intentionally deferred
- **Production:** v2 remains live; `main` and production Cloudflare remain untouched

## Rebuild sequence

| Milestone | Scope | State | Evidence / next action |
|---:|---|---|---|
| 1 | Shell / navigation | Complete | #1–5 Regression-tested |
| 2 | Authentication / session | Complete | #6–10 Regression-tested |
| 3 | Bible data / Reader language/source | Frozen except deferred furigana | #11–14, #16–23 Regression-tested; #15 deferred |
| 4 | User progress / state | Complete | #24–27 Regression-tested |
| 5 | Lesson engine | Complete | #31 Regression-tested |
| 6 | Daily Mission | Complete | #28–30 Regression-tested |
| 7 | Transform | Frozen complete | #46–48 Regression-tested |
| 8 | Audio / Live Recordings / Media | Frozen complete | #57–61 Regression-tested |
| 9 | Games core | Frozen core | #32–37 and #41 Regression-tested; Kids #38–40 deferred |
| 10 | Bible-study core | Frozen | #49–54 plus #20 Regression-tested |
| 11 | Reader/source completion | Frozen through NLT | v3.24; #15 deferred |
| 12 | Source provenance | Frozen | v3.25; #90 Regression-tested |
| 13 | Doctrinal safety/context | Frozen | v3.26; #89 Regression-tested |
| 14 | Private local notes | Frozen | v3.27; #55 Regression-tested |
| 15 | Cloud Notes | Frozen | v3.28; #56 Regression-tested |
| 16 | Congregation membership/roles | Frozen | v3.29; #66 Regression-tested |
| 17 | Operational recovery/error boundary | Frozen | v3.30; #96 Regression-tested |
| 18 | Client diagnostics | Frozen | v3.31; #95 Regression-tested |
| 19 | PWA install/manifest | Frozen | v3.32; #97 Regression-tested |
| 20 | Offline Shell | Frozen | v3.33; #98 Regression-tested |
| 21 | Offline opened Bible packs | Frozen | v3.34; #99 Regression-tested |
| 22 | Backup/export/import/reset | Frozen | v3.35; #100 Regression-tested after #62 suite |
| 23 | Couples/family local tools | Frozen | v3.36; #62 Regression-tested after #63 suite |
| 24 | Couples cloud | Frozen | v3.37; #63 Regression-tested after #64 suite |
| 25 | Journey Groups | Frozen | v3.38; #64 Verified; bookkeeping `34259986598` |
| 26 | Encouragements | Implemented; functional gate pending | #65 candidate `f6272064192201dd95da6945ce10c4003d9418fc` |
| 27 | Full old-vs-new audit | Later gate | reconcile all 100 rows before final parity declaration |
| 28 | Accumulated mobile regression | Ongoing | every milestone carries browser/mobile coverage |
| 29 | Production deployment | Not started | only after selected parity/stability acceptance gates |

## Frozen release line

- `release/v3.14-timeline` — `ddc40d54125185bfd47f96765182e76d89cb37c3`
- `release/v3.15-guided-study` — `cf8740e623460f062c321d01d903267e79885c4c`; bookkeeping `34081724365`
- `release/v3.16-deep-questions` — `e287fb6179bddece7d9cb31e5496924e524f83fd`; functional `34082339971`; bookkeeping `34082727818`
- `release/v3.17-story-journey` — `7690cc18b723fda1bed7802d2a56f49648f7f6b0`; functional `34083462882`; bookkeeping `34083885682`
- `release/v3.18-wisdom-situations` — `fd344208e12942d911f05d02b4e99d5b735a7c29`; functional `34084573320`; bookkeeping `34084926656`
- `release/v3.19-adaptive-learning` — `39ab8269e4fd83a09138404bd9466df0c70ee30e`; functional `34105551106`; bookkeeping `34106252587`
- `release/v3.20-open-review` — `2da79e9ab04cb05d63005b6cda7eb4471c149e92`; functional `34108734009`; bookkeeping `34109591650`
- `release/v3.21-step-context` — `55f4e5551d73830174eadd2d6dbfaac2a6cb0bcd`; functional `34114885252`; bookkeeping `34118918425`
- `release/v3.22-japanese-kougo` — `06eda2948db3a4c5462bc24a2b79596fa7d275f0`; repaired functional `34120997990`; bookkeeping `34122128228`
- `release/v3.23-japanese-vocabulary` — `7f83415b7d61d8fbc615b8261fca9dc28e2595e7`; functional `34123075200`; bookkeeping `34123607629`
- `release/v3.24-nlt-licensed` — `37ff989dac122f31a53f9bc771639e3ca59b4b03`; functional `34126567141`; bookkeeping `34127324969`
- `release/v3.25-source-provenance` — `04f20094a03cd0b189d1626ef4f372917ce599e3`; functional `34130447654`; bookkeeping `34160651319`
- `release/v3.26-doctrinal-safety` — `e223ac5e5022db2dc609e8fe15df9f9d020d4e75`; functional `34166910207`; bookkeeping `34168229627`
- `release/v3.27-private-local-notes` — `e8b58b1bd9c9053243bb5d394c2d2afae44c9f59`; bookkeeping `34169778300`
- `release/v3.28-cloud-notes` — `1b8cb0a4847b1fc633ce23412982c91c38825148`; bookkeeping `34184699391`
- `release/v3.29-congregation-membership` — `7bf024ba4f2b6501f6fb9e87ddc010c84426c7d1`; bookkeeping `34200768014`
- `release/v3.30-operational-recovery` — `7ec0290a50086112210c4c301db3288b970a2cc0`; bookkeeping `34203169381`
- `release/v3.31-client-diagnostics` — `61af8aaee121356d6ef0388130df2b545ff943d9`; bookkeeping `34208493773`
- `release/v3.32-pwa-install` — `200d69ec37b9aba48e8b926dfef7f2a8203d4855`; bookkeeping `34213223642`
- `release/v3.33-offline-shell` — `6c7e2e93d07def6e104e48c606dbbb3a7d3e48f7`; bookkeeping `34216091431`
- `release/v3.34-offline-bible-packs` — `bfba29fdb500c2f8ea3f466e941f043dae908f26`; functional `34217190770`; bookkeeping `34218225949`
- `release/v3.35-backup-export-import-reset` — `cb72905992b2549d727b4e74f5887bfc53210a06`; functional `34219329591`; bookkeeping `34220313765`
- `release/v3.36-couples-family-local` — `488fea911cc432c9843a2af39480b6f2cc67711e`; corrected functional `34229105566`; bookkeeping `34236023685`
- `release/v3.37-couples-cloud` — `f706896d8f4e8d2ee19e607a38cc87dada70d671`; functional `34238007365`; bookkeeping `34240373295`
- `release/v3.38-journey-groups` — `7c06c3380eaac0e20e579ae26453611e63ac564d`; corrected functional `34258746664`; bookkeeping `34259986598`

## #100 Backup/export/import/reset — Regression-tested

- Portable local-state ownership remains in `src/core/storage.js`; versioned backup workflow ownership is in `src/app/backup.js`.
- `device-id`, auth/session keys, cloud/server state, caches and unrelated browser storage are excluded.
- Import prevalidates the full snapshot and attempts rollback if replacement fails.
- Corrected functional candidate `f7419897af9d10af92fd2cbe22e7cfb4ddcd6215` passed run `34219329591`.
- Exact bookkeeping candidate `cb72905992b2549d727b4e74f5887bfc53210a06` passed run `34220313765` and is frozen as v3.35.
- #100 survived the complete #62 functional suite and advanced to Regression-tested.

## #62 Couples/family local tools — Regression-tested

- Retained `couples.js` proved eight categories, 32 cards, favorites/discussed state, 7-day practices, listening drills, pass-the-phone check-in, Repair Room, Us & God and Date Night.
- Retained `couple-cloud.js` proves the local/cloud split; #62 does not own Supabase/session/cloud behavior.
- `src/content/couples-family.js` owns recovered static content; `src/app/couples-family.js` owns local state through shared storage; `src/features/couples-family/index.js` owns view behavior.
- BSB references hand off through the existing Reader owner.
- Initial candidate `500d5e86bec2b8a16cfad485d5f3869e9277668b` exposed only an ambiguous strict Playwright selector in the new check-in result.
- Corrected exact candidate `964fde5ad3381e4fe4d571c15591040c4e55fecb` passed complete run `34229105566`.
- Exact bookkeeping candidate `488fea911cc432c9843a2af39480b6f2cc67711e` passed run `34236023685` and is frozen as v3.36.
- #62 survived the later complete #63 functional suite and advanced to Regression-tested.

## #63 Couples cloud — Regression-tested

- `src/app/couples-cloud.js` owns authenticated pairing, normalized shared state and fail-closed cloud orchestration; `src/core/api.js` remains the sole Supabase boundary.
- Existing `bq-couple` and RLS-protected `bible_couple_shared` contracts are reused without a new migration.
- Shared history is append-only and limited to journey completions, commitments and read-only challenge history; local/private/Transform/account data is excluded.
- Exact functional candidate `a7fdf3354efb688163d35fec8e2df3a93b4e9294` passed complete run `34238007365`.
- The one-shot functional branch was reset from trigger `936cf0755abcd50ef438761c8bfb91dd019d260d` to the clean candidate after verification.
- Exact bookkeeping candidate `f706896d8f4e8d2ee19e607a38cc87dada70d671` passed run `34240373295` and is frozen as v3.37.
- #63 survived the later complete #64 functional suite and advanced to Regression-tested.

## #64 Journey Groups — Verified

- `src/app/journey-groups.js` owns group normalization, authenticated membership orchestration and fail-closed permissions; `src/core/api.js` remains the sole Supabase boundary.
- Existing `bq-journey-group`, `bible_groups` and `bible_group_members` contracts are reused without a production migration.
- The recovered lifecycle covers create, join, view, invite-code rotation and non-owner leave for 2–6-member groups; owning-leader leave fails closed.
- Initial run `34244782912` exposed only the workflow/validator command-shape mismatch recorded as `V3-WORKFLOW-LOOP-001`.
- Corrected exact candidate `c49ce887bd28323292b6f1b60f7689a1aa194615` passed the complete accumulated architecture, edge and browser/mobile suite in run `34258746664`.
- The one-shot branch was reset from trigger `9f9590b624c1957d31c6d3a4b8c6d65130b27db9` to the clean candidate after verification.
- Exact bookkeeping candidate `7c06c3380eaac0e20e579ae26453611e63ac564d` passed run `34259986598` and is frozen as v3.38.

## #65 Encouragements — Implemented

- Preset-only, group-wide encouragements reuse verified Journey Group membership and retained RLS-protected rows.
- One v3 owner normalizes received rows and blocks duplicate sends; the central API alone reads Supabase and invokes the authenticated send action.
- The server derives the sender and UTC day. An additive partial unique index prevents concurrent identical sends without rewriting retained v2 rows.
- Architecture, inventory, syntax and accumulated edge gates pass locally. The 390px browser regression is accumulated but has not executed against this candidate.
- Remote candidate `f6272064192201dd95da6945ce10c4003d9418fc`; draft PR `#89`.

## Current bookkeeping

- #15 Japanese furigana — **Not started / intentionally deferred**
- Kids #38–40 — **Not started / intentionally deferred**
- #89 Doctrinal safety/context — **Regression-tested**
- #90 Source labels/attribution — **Regression-tested**
- #95 Client diagnostics — **Regression-tested**
- #96 Operational recovery/error boundary — **Regression-tested**
- #97 PWA install/manifest — **Regression-tested**
- #98 Offline Shell — **Regression-tested**
- #99 Offline opened Bible packs — **Regression-tested**
- #100 Backup/export/import/reset — **Regression-tested**
- #62 Couples/family local tools — **Regression-tested**
- #63 Couples cloud — **Regression-tested**
- #64 Journey Groups — **Verified**
- #65 Encouragements — **Implemented**
- Inventory states — **64 Regression-tested / 1 Verified / 1 Implemented / 34 Not started**
- Strict parity — **66/100**
- Official regression stability — **64/100**

## Next sequence

1. Run the complete manual functional workflow on `feature/v3-encouragements`.
2. If green, promote #65 to Verified and #64 to Regression-tested.
3. Run the exact bookkeeping gate and freeze v3.39 only after it passes.
4. Start #67 Community Bridge only after v3.39 freezes.
5. Keep Kids #38–40 and Japanese furigana #15 deferred and production deployment out of scope.

## What remains overall

Literal old-version parity has **34 Not started rows** after #65 implementation. Remaining work includes Play Together/Live Rooms, Bible World, community/ministry/admin capabilities, accessibility, reporting/moderation, onboarding/avatar/personality/psychometrics and other inventory-defined workflows, plus the intentionally deferred Japanese/Kids capabilities.

## Release discipline

- Do not modify `main` or production Cloudflare during rebuild.
- Do not replace production v2 with incomplete v3.
- Freeze only after the exact bookkeeping state passes the complete accumulated suite.
- Every real bug fix records root cause and retains a regression test.
- Normal v3 CI remains manual-only; temporary push triggers are isolated to verification branches and removed afterward.
