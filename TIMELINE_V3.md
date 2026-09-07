# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-07 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`; the inventory remains authoritative.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Regression-tested:** 48
- **Verified:** 1
- **Implemented:** 0
- **Not started:** 51
- **Verified or better:** 49 / 100 (**49% strict parity completion**)
- **Fully regression-tested:** 48 / 100 (**48% stability coverage**)
- **Latest frozen checkpoint:** `release/v3.21-step-context` at `55f4e5551d73830174eadd2d6dbfaac2a6cb0bcd`
- **Current active feature:** #14 Japanese 口語訳 — Verified after repaired complete functional run `34120997990`; exact bookkeeping/freeze gate pending
- **#20 STEPBible:** Regression-tested after surviving the later #14 full suite
- **#15 Japanese furigana:** intentionally deferred by user; remains Not started and is removed from the active sequence
- **Next target after v3.22 freeze:** #16 Japanese vocabulary learning
- **Then:** #17 NLT live path
- **Kids arcade:** accessible; deeper #38–40 integration remains deferred
- **Later ministry requirement:** see `DEVOTIONAL_MINISTRY_DESIGN_V3.md`
- **Production:** v2 remains live; `main` and production Cloudflare remain untouched

## Rebuild sequence

| Milestone | Scope | State | Evidence / next action |
|---:|---|---|---|
| 1 | Shell / navigation | Complete | #1–5 Regression-tested |
| 2 | Authentication / session | Complete | #6–10 Regression-tested |
| 3 | Bible data / content | Active | #11–14 and #18–23 verified-or-better; #15 deferred; #16–17 remain Reader/source debt |
| 4 | User progress / state | Complete | #24–27 Regression-tested; Progress remains sole XP/counter/event owner |
| 5 | Lesson engine | Complete engine | #31 Regression-tested; shared across verified study workflows |
| 6 | Daily Mission | Complete | #28–30 Regression-tested |
| 7 | Transform | Frozen complete | #46–48 Regression-tested |
| 8 | Audio / Live Recordings / Media | Frozen complete | #57–61 Regression-tested |
| 9 | Games core | Frozen core | #32–37 and #41 Regression-tested |
| 10 | Bible-study core | Frozen through STEPBible | #49–54 plus #20 Regression-tested |
| 11 | Reader language/source completion | Active | #14 Verified → #16 → #17; #15 intentionally deferred |
| 12 | Devotional / Ministry foundation | Designed, not implemented | maps mainly to #66 and #73–78 |
| 13 | Bible World / tutorial / remaining parity | Not started | remaining inventory rows |
| 14 | Full old-vs-new audit | Not started | reconcile all 100 rows |
| 15 | Accumulated mobile regression | Ongoing + final gate later | every milestone carries browser/mobile coverage; final all-feature audit remains |
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
- Guided Study — `release/v3.15-guided-study` at `cf8740e623460f062c321d01d903267e79885c4c`; bookkeeping run `34081724365`
- Deep Questions — `release/v3.16-deep-questions` at `e287fb6179bddece7d9cb31e5496924e524f83fd`; functional run `34082339971`; bookkeeping run `34082727818`
- Story Journey — `release/v3.17-story-journey` at `7690cc18b723fda1bed7802d2a56f49648f7f6b0`; functional run `34083462882`; corrected bookkeeping run `34083885682`
- Wisdom Situations — `release/v3.18-wisdom-situations` at `fd344208e12942d911f05d02b4e99d5b735a7c29`; functional run `34084573320`; bookkeeping run `34084926656`
- Adaptive Learning — `release/v3.19-adaptive-learning` at `39ab8269e4fd83a09138404bd9466df0c70ee30e`; functional run `34105551106`; bookkeeping run `34106252587`
- Open Review — `release/v3.20-open-review` at `2da79e9ab04cb05d63005b6cda7eb4471c149e92`; functional run `34108734009`; exact bookkeeping run `34109591650`
- STEPBible Context Lab — `release/v3.21-step-context` at `55f4e5551d73830174eadd2d6dbfaac2a6cb0bcd`; repaired functional run `34114885252`; exact bookkeeping run `34118918425`

## #14 Japanese 口語訳 — Verified

Recovered old behavior:
1. live chapter source `api.getbible.net/v2/japkougo/<book-number>/<chapter>.json`.
2. 口語訳聖書 (1954/1955) as the selected Japanese translation.
3. persisted translation/book/chapter selection.
4. explicit Retry on source failure.
5. explicit BSB fallback; no silent substitution and no fabricated Scripture.

Clean v3 implementation:
- `src/core/bible.js` remains the only Bible-source owner.
- Japanese is represented as a live chapter-only source; bundled BSB/Tagalog behavior is unchanged.
- canonical GetBible book numbers are derived from the existing book ordering instead of duplicating a map.
- live payloads are normalized, validated, sorted, and cached only after they are semantically usable.
- reference navigation/search works; uncontrolled whole-Bible live text search is rejected.
- source/license/unchanged-text guidance is displayed in Reader.
- loading Japanese Scripture does not award XP.

### Retained #14 defects

`V3-JKO-SEMANTIC-CACHE-001` — the first browser gate showed that an HTTP-200 response containing no readable verses was cached before post-fetch semantic validation. Retry therefore reused invalid data. The Bible service now evicts that source URL when Japanese semantic validation fails; edge and browser tests require a subsequent source request to recover.

`V3-JKO-TOUCH-001` — the repaired run then showed Retry and Use BSB controls at 42px. The Reader recovery/navigation controls now enforce a minimum 44px height and the mobile regression retains that requirement.

Final repaired functional run `34120997990` passed all architecture checks, edge regressions, Reader, STEPBible, Japanese 口語訳, and every accumulated downstream browser test through Games.

## Current bookkeeping

- #14 Japanese 口語訳 — **Verified**
- #15 Japanese furigana — **Not started / intentionally deferred**
- #20 STEPBible lexical/context tools — **Regression-tested**
- #49–54 — **Regression-tested**
- Totals — **48 Regression-tested / 1 Verified / 0 Implemented / 51 Not started**

## Next sequence

1. Run the entire accumulated suite on the exact #14 bookkeeping state.
2. If green, freeze it as `release/v3.22-japanese-kougo`.
3. Skip #15 furigana per user direction; do not implement or promote it.
4. Start #16 Japanese vocabulary learning from the recovered loaded `japanese-learning.js` behavior.
5. After #16, continue #17 NLT live path.
6. Reassess remaining Bible-study/core-content debt before allowing community/ministry work to displace it.

## What remains overall

Literal old-version feature parity has **51 Not started rows remaining** after #14 promotion. One of those, #15 furigana, is intentionally deferred by current priority choice. The immediate active Reader/source path therefore contains only **#16 and #17**. Remaining rows cover Kids, community/ministry/admin, Bible World/tutorial, accessibility/moderation, PWA/offline, diagnostics, notes, and backup/import capabilities.

## Release discipline

- Do not modify `main` during the rebuild line.
- Do not replace production with incomplete v3.
- Do not modify production Cloudflare during the rebuild.
- Each milestone closes only after the exact bookkeeping state passes the accumulated suite and is frozen as a known-good release.
- Every real bug fix records root cause and retains a regression test.
- Normal v3 CI is manual-only; isolated verification branches may temporarily use a push trigger for one-shot CI execution.
