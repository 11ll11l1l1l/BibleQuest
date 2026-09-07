# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-07 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`; the inventory remains authoritative.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Regression-tested:** 49
- **Verified:** 1
- **Implemented:** 0
- **Not started:** 50
- **Verified or better:** 50 / 100 (**50% strict parity completion**)
- **Fully regression-tested:** 49 / 100 (**49% stability coverage**)
- **Latest frozen checkpoint:** `release/v3.22-japanese-kougo` at `06eda2948db3a4c5462bc24a2b79596fa7d275f0`
- **v3.22 bookkeeping run:** `34122128228` — fully green
- **Current feature:** #16 Japanese vocabulary learning — Verified after full functional run `34123075200`; bookkeeping/freeze pending
- **#14 Japanese 口語訳:** Regression-tested after surviving the #16 full suite
- **#15 Japanese furigana:** intentionally deferred; remains Not started and does not block the active sequence
- **Next target:** #17 NLT live path
- **Production:** v2 remains live; `main` and production Cloudflare remain untouched

## Rebuild sequence

| Milestone | Scope | State | Evidence / next action |
|---:|---|---|---|
| 1 | Shell / navigation | Complete | #1–5 Regression-tested |
| 2 | Authentication / session | Complete | #6–10 Regression-tested |
| 3 | Bible data / content | Active | Reader core through #16 verified-or-better; #15 deferred; #17 remains active source debt |
| 4 | User progress / state | Complete | #24–27 Regression-tested |
| 5 | Lesson engine | Complete | #31 Regression-tested |
| 6 | Daily Mission | Complete | #28–30 Regression-tested |
| 7 | Transform | Frozen complete | #46–48 Regression-tested |
| 8 | Audio / Live Recordings / Media | Frozen complete | #57–61 Regression-tested |
| 9 | Games core | Frozen core | #32–37 and #41 Regression-tested |
| 10 | Bible-study core | Frozen through STEPBible | #49–54 plus #20 Regression-tested |
| 11 | Reader language/source completion | Active | #14 Regression-tested; #16 Verified; #17 next; #15 deferred |
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

## #16 Japanese vocabulary — Verified

Recovered loaded behavior from legacy `japanese-learning.js`:
1. learning panel available only with Japanese 口語訳;
2. verse selection drives vocabulary notes;
3. up to three matching curated notes;
4. term, reading, simple explanation, fuller meaning, optional English gloss;
5. persisted learning ON/OFF preference;
6. explicit learning-aid/not-Scripture disclaimer;
7. no recovered XP reward.

Clean v3 behavior:
- one `src/app/japanese-vocabulary.js` owner for preference and lookup;
- 27 recovered curated definitions in a static content module;
- Verse Peek remains the one verse-selection interaction;
- notes compose inside Verse Peek and do not mutate Scripture;
- only Japanese 口語訳 shows the vocabulary control;
- unknown text produces a controlled no-notes state instead of an invented reading;
- no kuromoji, CDN injection, direct storage, MutationObserver, or legacy global runtime;
- no XP;
- 390px mobile, >=44px control, no horizontal overflow.

Full functional run `34123075200` passed the new architecture/edge/mobile regressions and every accumulated regression through Games.

## Current bookkeeping

- #14 Japanese 口語訳 — **Regression-tested**
- #15 Japanese furigana — **Not started / intentionally deferred**
- #16 Japanese vocabulary learning — **Verified**
- #20 and #49–54 — **Regression-tested**
- Totals — **49 Regression-tested / 1 Verified / 0 Implemented / 50 Not started**

## Next sequence

1. Run the complete accumulated suite on the exact #16 bookkeeping state.
2. If green, freeze `release/v3.23-japanese-vocabulary`.
3. Start #17 NLT live path by recovering the actual loaded v2 behavior/source/license contract first.
4. Because NLT is copyrighted, do not bundle or redistribute text without verified rights; reproduce only the legacy-compatible live/external behavior supported by evidence.
5. After #17, reassess the remaining Bible-study/core-content debt before changing priority.
6. #15 remains deferred unless explicitly reopened.

## What remains overall

Literal old-version parity has **50 Not started rows** after #16 promotion. #15 is deliberately deferred. The immediate Reader/source sequence now has only **#17** active. The other remaining rows cover notes, Kids, community/ministry/admin, Bible World/tutorial, accessibility/moderation, PWA/offline, diagnostics, and backup/import.

## Release discipline

- Do not modify `main` or production Cloudflare during rebuild.
- Do not replace production v2 with incomplete v3.
- Freeze only after the exact bookkeeping state passes the complete accumulated suite.
- Every real bug fix records root cause and retains a regression test.
- Normal v3 CI remains manual-only; temporary push triggers are isolated to verification branches and removed afterward.
