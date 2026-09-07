# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-07 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`; the inventory remains authoritative.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Regression-tested:** 50
- **Verified:** 1
- **Implemented:** 0
- **Not started:** 49
- **Verified or better:** 51 / 100 (**51% strict parity completion**)
- **Fully regression-tested:** 50 / 100 (**50% stability coverage**)
- **Latest frozen checkpoint:** `release/v3.23-japanese-vocabulary` at `7f83415b7d61d8fbc615b8261fca9dc28e2595e7`
- **v3.23 bookkeeping run:** `34123607629` — fully green
- **Current feature:** #17 NLT licensed-link — Verified after complete functional run `34126567141`; bookkeeping/freeze pending
- **#16 Japanese vocabulary:** Regression-tested after surviving the #17 full suite
- **#15 Japanese furigana:** intentionally deferred; remains Not started
- **Next action after v3.24:** reassess remaining Bible-study/core-content debt before selecting another capability
- **Production:** v2 remains live; `main` and production Cloudflare remain untouched

## Rebuild sequence

| Milestone | Scope | State | Evidence / next action |
|---:|---|---|---|
| 1 | Shell / navigation | Complete | #1–5 Regression-tested |
| 2 | Authentication / session | Complete | #6–10 Regression-tested |
| 3 | Bible data / content | Active | Reader core through #17 verified-or-better; #15 deferred; remaining core debt to reassess after v3.24 |
| 4 | User progress / state | Complete | #24–27 Regression-tested |
| 5 | Lesson engine | Complete | #31 Regression-tested |
| 6 | Daily Mission | Complete | #28–30 Regression-tested |
| 7 | Transform | Frozen complete | #46–48 Regression-tested |
| 8 | Audio / Live Recordings / Media | Frozen complete | #57–61 Regression-tested |
| 9 | Games core | Frozen core | #32–37 and #41 Regression-tested |
| 10 | Bible-study core | Frozen through STEPBible | #49–54 plus #20 Regression-tested |
| 11 | Reader language/source completion | Active final gate | #14/#16 Regression-tested; #17 Verified; #15 deferred |
| 12 | Devotional / Ministry foundation | Designed, not implemented | later; maps mainly to #66 and #73–78 |
| 13 | Bible World / tutorial / remaining parity | Not started | remaining inventory rows |
| 14 | Full old-vs-new audit | Not started | reconcile all 100 rows |
| 15 | Accumulated mobile regression | Ongoing + final gate later | each milestone carries browser/mobile coverage |
| 16 | Production deployment | Not started | only after selected parity/stability acceptance gates |

## Frozen release line

- Transform — `release/v3.7-transform-complete`
- Audio/Recordings — `release/v3.8-audio-recordings`
- Media Library — `release/v3.9-media-library`
- Games core — `release/v3.10-games-core`
- Mixed Quest — `release/v3.11-mixed-quest`
- Per-book Recall — `release/v3.12-per-book-recall`
- Character Detective — `release/v3.13-character-detective`
- Timeline — `release/v3.14-timeline` at `ddc40d54125185bfd47f96765182e76d89cb37c3`
- Guided Study — `release/v3.15-guided-study` at `cf8740e623460f062c321d01d903267e79885c4c`; bookkeeping `34081724365`
- Deep Questions — `release/v3.16-deep-questions` at `e287fb6179bddece7d9cb31e5496924e524f83fd`; functional `34082339971`; bookkeeping `34082727818`
- Story Journey — `release/v3.17-story-journey` at `7690cc18b723fda1bed7802d2a56f49648f7f6b0`; functional `34083462882`; bookkeeping `34083885682`
- Wisdom Situations — `release/v3.18-wisdom-situations` at `fd344208e12942d911f05d02b4e99d5b735a7c29`; functional `34084573320`; bookkeeping `34084926656`
- Adaptive Learning — `release/v3.19-adaptive-learning` at `39ab8269e4fd83a09138404bd9466df0c70ee30e`; functional `34105551106`; bookkeeping `34106252587`
- Open Review — `release/v3.20-open-review` at `2da79e9ab04cb05d63005b6cda7eb4471c149e92`; functional `34108734009`; bookkeeping `34109591650`
- STEPBible Context Lab — `release/v3.21-step-context` at `55f4e5551d73830174eadd2d6dbfaac2a6cb0bcd`; functional `34114885252`; bookkeeping `34118918425`
- Japanese 口語訳 — `release/v3.22-japanese-kougo` at `06eda2948db3a4c5462bc24a2b79596fa7d275f0`; repaired functional `34120997990`; bookkeeping `34122128228`
- Japanese vocabulary — `release/v3.23-japanese-vocabulary` at `7f83415b7d61d8fbc615b8261fca9dc28e2595e7`; functional `34123075200`; bookkeeping `34123607629`

## #17 NLT licensed-link — Verified

Recovered loaded v2 behavior:
1. NLT was a main Reader translation choice.
2. It was `licensed-link`, not bundled or in-app live text.
3. Reader selection/book/chapter persisted.
4. selected passage opened externally on BibleGateway with `version=NLT`.
5. BibleQuest explicitly did not redistribute full NLT text or expose a private browser API key.

Clean v3 behavior:
- `src/core/bible.js` owns NLT metadata and exact licensed passage URL construction.
- NLT chapter load returns canonical passage metadata, zero verse text, and the external handoff without any hidden Scripture fetch.
- pack loading and in-app NLT search are explicitly unavailable.
- Reader preserves translation/book/chapter and normal Previous/Next passage navigation.
- no verse list, no Mark Read, no in-app NLT search, and no read-credit/XP are allowed for externally viewed Scripture.
- external link opens safely in a new tab and returns without replacing BibleQuest.
- source/license attribution is shown.
- dedicated edge + 390px browser tests protect no-text/no-fetch/no-XP and no-overflow behavior.

Complete functional run `34126567141` passed the new NLT architecture/edge/mobile regressions and every accumulated regression through Games.

## Current bookkeeping

- #14 Japanese 口語訳 — **Regression-tested**
- #15 Japanese furigana — **Not started / intentionally deferred**
- #16 Japanese vocabulary learning — **Regression-tested**
- #17 NLT live path — **Verified as licensed-link parity**
- #20 and #49–54 — **Regression-tested**
- Totals — **50 Regression-tested / 1 Verified / 0 Implemented / 49 Not started**

## Next sequence

1. Run the complete accumulated suite on the exact #17 bookkeeping state.
2. If green, freeze `release/v3.24-nlt-licensed`.
3. Keep #15 furigana deferred unless explicitly reopened.
4. Reassess remaining Bible-study/core-content debt before selecting the next implementation.
5. Inspect old loaded behavior/dependencies for the strongest core-adjacent candidates instead of automatically jumping to Kids, community, or ministry.

## What remains overall

Literal old-version parity has **49 Not started rows** after #17 promotion. #15 is deliberately deferred. Reader language/source parity is otherwise closed through the recovered NLT behavior. Remaining rows include notes, Kids, Bible World, community/ministry/admin, accessibility/moderation/source labeling, diagnostics/recovery, PWA/offline behavior, and backup/import.

## Release discipline

- Do not modify `main` or production Cloudflare during rebuild.
- Do not replace production v2 with incomplete v3.
- Freeze only after the exact bookkeeping state passes the complete accumulated suite.
- Every real bug fix records root cause and retains a regression test.
- Normal v3 CI remains manual-only; temporary push triggers are isolated to verification branches and removed afterward.
