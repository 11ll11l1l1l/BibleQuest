# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-08 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`; the inventory remains authoritative. BibleQuest v3 uses rebuild-and-verify rather than patch-and-accumulate.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Inventory states after #100 functional verification:** 61 Regression-tested / 1 Verified / 0 Implemented / 38 Not started
- **Verified or better:** 62 / 100 (**62% strict parity completion**)
- **Official regression stability:** 61 / 100
- **Latest frozen checkpoint:** `release/v3.34-offline-bible-packs` at `bfba29fdb500c2f8ea3f466e941f043dae908f26`
- **v3.34 bookkeeping:** `34218225949` — complete accumulated 88-check suite green against the frozen SHA
- **#99 Offline opened Bible packs:** Regression-tested after surviving #100; frozen in v3.34
- **#100 Backup/export/import/reset:** Verified; corrected exact functional candidate `f7419897af9d10af92fd2cbe22e7cfb4ddcd6215`, run `34219329591`
- **#62 Couples/family local tools:** next non-deferred dependency-safe local milestone after v3.35 freeze
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
| 21 | Offline opened Bible packs | Frozen | v3.34; #99 Regression-tested after #100 suite |
| 22 | Backup/export/import/reset | Functional gate green; bookkeeping active | #100 Verified; functional `34219329591` |
| 23 | Couples/family local tools | Next | #62 after exact v3.35 freeze |
| 24 | Full old-vs-new audit | Later gate | reconcile all 100 rows before final parity declaration |
| 25 | Accumulated mobile regression | Ongoing | every milestone carries browser/mobile coverage |
| 26 | Production deployment | Not started | only after selected parity/stability acceptance gates |

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

## #99 Offline opened Bible packs — Regression-tested

- `src/core/bible.js` remains the single bundled Bible pack path/validation/persistence owner.
- Only explicitly opened bundled BSB/Tagalog packs are persisted; search does not bulk-persist, and live/licensed/context/API/cloud/media sources remain outside #99.
- Functional run `34217190770` and v3.34 bookkeeping run `34218225949` were green.
- #99 survived #100 functional run `34219329591` and advanced to Regression-tested.

## #100 Backup/export/import/reset — Verified

- Portable local-state ownership remains in `src/core/storage.js`; versioned backup workflow ownership is in `src/app/backup.js`.
- `device-id`, auth/session keys, cloud/server state, caches and unrelated browser storage are excluded.
- Import prevalidates the full snapshot and attempts rollback if replacement fails.
- The 390px browser acceptance performs Reader +10 XP setup → download backup → reset/reload → import/reload → Reader/Progress restoration.
- Initial candidate `f8fb9e03840cc2c7ba141f19352c79f7bc65e8c1` exposed `V3-BACKUP-LEDGER-TEST-001`, a stale validator wording mismatch.
- Corrected exact candidate `f7419897af9d10af92fd2cbe22e7cfb4ddcd6215` passed complete run `34219329591`.

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
- #100 Backup/export/import/reset — **Verified**
- Inventory states — **61 Regression-tested / 1 Verified / 0 Implemented / 38 Not started**
- Strict parity — **62/100**
- Official regression stability — **61/100**

## Next sequence

1. Run the independent exact #100 bookkeeping gate against the complete accumulated suite.
2. Freeze v3.35 only at the exact bookkeeping SHA that passes.
3. Continue with #62 Couples/family local tools, explicitly keeping #63 Couples cloud separate.
4. Keep Kids #38–40 and Japanese furigana #15 deferred and production deployment out of scope.

## What remains overall

Literal old-version parity has **38 Not started rows** after #100 functional verification. Remaining work includes deferred Japanese/Kids capabilities, Play Together/Live Rooms, Bible World, couples/community/ministry/admin capabilities, accessibility, reporting/moderation, onboarding/avatar/personality/psychometrics, reset/recovery and other inventory-defined workflows.

## Release discipline

- Do not modify `main` or production Cloudflare during rebuild.
- Do not replace production v2 with incomplete v3.
- Freeze only after the exact bookkeeping state passes the complete accumulated suite.
- Every real bug fix records root cause and retains a regression test.
- Normal v3 CI remains manual-only; temporary push triggers are isolated to verification branches and removed afterward.
