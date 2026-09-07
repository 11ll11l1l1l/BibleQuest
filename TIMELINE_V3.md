# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-07 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`; the inventory remains authoritative.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Regression-tested:** 51
- **Verified:** 1
- **Implemented:** 0
- **Not started:** 48
- **Verified or better:** 52 / 100 (**52% strict parity completion**)
- **Fully regression-tested:** 51 / 100 (**51% stability coverage**)
- **Latest frozen checkpoint:** `release/v3.24-nlt-licensed` at `37ff989dac122f31a53f9bc771639e3ca59b4b03`
- **v3.24 functional:** `34126567141` — fully green
- **v3.24 bookkeeping:** `34127324969` — fully green
- **Current feature:** #90 Source labels/attribution — Verified after corrected full functional run `34130447654`; bookkeeping/freeze pending
- **#17 NLT licensed-link:** Regression-tested after surviving the #90 full suite
- **#15 Japanese furigana:** intentionally deferred; remains Not started
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
| 9 | Games core | Frozen core | #32–37 and #41 Regression-tested |
| 10 | Bible-study core | Frozen through Open Review/STEP | #49–54 plus #20 Regression-tested |
| 11 | Reader language/source completion | Frozen through NLT | v3.24; #15 deferred |
| 12 | Source provenance | Verified, freeze gate active | #90 Verified; exact bookkeeping next |
| 13 | Core-content safety / remaining parity | Reassessment next | #89 leading candidate; inspect dependencies before coding |
| 14 | Devotional / Ministry foundation | Designed, not implemented | later; `DEVOTIONAL_MINISTRY_DESIGN_V3.md` |
| 15 | Full old-vs-new audit | Not started | reconcile all 100 rows |
| 16 | Accumulated mobile regression | Ongoing + final gate later | each milestone carries browser/mobile coverage |
| 17 | Production deployment | Not started | only after selected parity/stability acceptance gates |

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

## #90 Source labels/attribution — Verified

Recovered requirement: users must be able to distinguish actual Scripture text, third-party/open reference answers, story retellings, and BibleQuest-authored study/application/game prose.

Clean v3 behavior:
- one immutable `src/core/content-provenance.js` registry for BibleQuest-authored content types;
- one presentation-only `src/ui/source-labels.js` helper;
- Bible translation attribution remains owned by `src/core/bible.js`;
- unfoldingWord source/license remains owned by `src/core/recall-packs.js` and exposed through immutable `sourceInfo()`;
- Learn source guide consumes owner metadata and keeps exact `Learn` heading;
- Guided Study, Deep Questions, Story Journey, Wisdom, Adaptive, Daily Journey, Quick/Context/Mixed games, Detective and Timeline are labeled according to content type;
- Story Journey differentiates retelling scenes from checkpoint questions;
- Per-book Recall preserves real unfoldingWord source/license rather than receiving a BibleQuest label;
- no MutationObserver/global source-label injector or direct storage/network bypass;
- 390px provenance path has no horizontal overflow.

Functional verification history:
- `34129966606` — stopped at a new edge-test regex that incorrectly rejected valid “not a direct Scripture quotation” wording; application unchanged.
- `34130146826` — reached browser tests but the new provenance smoke used nonexistent `[data-reader-source]`; existing Reader regression had passed, and the test was corrected to `.bq-reader-source`; application unchanged.
- `34130447654` — corrected complete suite fully green through Games.

## Current bookkeeping

- #15 Japanese furigana — **Not started / intentionally deferred**
- #17 NLT live path — **Regression-tested**
- #90 Source labels/attribution — **Verified**
- Totals — **51 Regression-tested / 1 Verified / 0 Implemented / 48 Not started**

## Next sequence

1. Run the full accumulated suite on the exact #90 bookkeeping state.
2. If green, freeze `release/v3.25-source-provenance` at that exact SHA.
3. Reassess the remaining core-content dependency order.
4. #89 Doctrinal safety/context is the leading next candidate because provenance is now available for transparent context notices, but recover the actual old policy behavior and current-v3 integration points before coding.
5. Keep #15 furigana deferred unless explicitly reopened.

## What remains overall

Literal old-version parity has **48 Not started rows** after #90 promotion. Remaining work includes doctrinal/content safety, notes, Kids, Bible World, community/ministry/admin, accessibility, diagnostics/recovery, PWA/offline behavior, and backup/import.

## Release discipline

- Do not modify `main` or production Cloudflare during rebuild.
- Do not replace production v2 with incomplete v3.
- Freeze only after the exact bookkeeping state passes the complete accumulated suite.
- Every real bug fix records root cause and retains a regression test.
- Normal v3 CI remains manual-only; temporary push triggers are isolated to verification branches and removed afterward.
