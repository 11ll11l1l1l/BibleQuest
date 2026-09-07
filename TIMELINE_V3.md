# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-07 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`; the inventory remains authoritative.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Regression-tested:** 47
- **Verified:** 1
- **Implemented:** 0
- **Not started:** 52
- **Verified or better:** 48 / 100 (**48% strict parity completion**)
- **Fully regression-tested:** 47 / 100 (**47% stability coverage**)
- **Latest frozen checkpoint:** `release/v3.20-open-review` at `40013d194015004d763d2fc0cf3a34567e89d003`
- **Current active feature:** #20 STEPBible lexical/context tools — Verified after complete functional run `34114885252`; exact bookkeeping/freeze gate pending
- **#54 Open Review:** Regression-tested after surviving the later #20 full suite
- **Next target after v3.21 freeze:** #14 Japanese 口語訳
- **Reader-language sequence after #14:** #15 Japanese furigana → #16 Japanese vocabulary learning → #17 NLT live path
- **Kids arcade:** accessible; deeper #38–40 integration remains deferred
- **Later ministry requirement:** see `DEVOTIONAL_MINISTRY_DESIGN_V3.md`
- **Production:** v2 remains live; `main` and production Cloudflare remain untouched

## Rebuild sequence

| Milestone | Scope | State | Evidence / next action |
|---:|---|---|---|
| 1 | Shell / navigation | Complete | #1–5 Regression-tested |
| 2 | Authentication / session | Complete | #6–10 Regression-tested |
| 3 | Bible data / content | Active | #11–13, #18–23 verified-or-better; #20 Verified; #14–17 remain reader-language/source debt |
| 4 | User progress / state | Complete | #24–27 Regression-tested; Progress remains sole XP/counter/event owner |
| 5 | Lesson engine | Complete engine | #31 Regression-tested; shared across verified study workflows |
| 6 | Daily Mission | Complete | #28–30 Regression-tested |
| 7 | Transform | Frozen complete | #46–48 Regression-tested |
| 8 | Audio / Live Recordings / Media | Frozen complete | #57–61 Regression-tested |
| 9 | Games core | Frozen core | #32–37 and #41 Regression-tested |
| 10 | Bible-study core | Frozen through Open Review | #49–54 Regression-tested after #20 full suite |
| 11 | Reader language/source completion | Active next | #20 Verified → #14 → #15 → #16 → #17 |
| 12 | Devotional / Ministry foundation | Designed, not implemented | maps mainly to #66 and #73–78 |
| 13 | Bible World / tutorial / remaining parity | Not started | remaining inventory rows |
| 14 | Full old-vs-new audit | Not started | reconcile all 100 rows |
| 15 | Accumulated mobile regression | Ongoing + final gate later | every milestone already carries browser/mobile coverage; final all-feature audit remains |
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
- Open Review — `release/v3.20-open-review` at `40013d194015004d763d2fc0cf3a34567e89d003`; functional run `34108734009`; exact bookkeeping run `34109708245`

## #20 STEPBible lexical/context tools — Verified

The actual old loaded `context-lab.js` was recovered before rebuilding. It proved that #20 was an in-app Hebrew/Greek Context Lab rather than only an external STEP Bible link.

Clean v3 parity now includes:
1. BSB verse context loaded through `src/core/bible.js`.
2. Hebrew/Greek Strong’s identifiers, lemma, transliteration, morphology, and brief glosses from retained context packs.
3. previous/current/next verse context so word study is not isolated from the sentence.
4. same-book Strong’s-tag usage references.
5. source/license/limits display and the old caution against turning a lexicon entry or etymology into doctrine.
6. direct Reader access plus Verse Peek → Context Lab handoff.
7. the existing external STEP lexical/context link remains as a separate secondary handoff.
8. unavailable or malformed context data fails safely without breaking the Reader.
9. no XP/progress reward was invented because the recovered old Context Lab was a study utility, not a scored activity.
10. 390px browser coverage protects layout, touch targets, no horizontal overflow, safe close/return, and unavailable-pack handling.

Architecture boundaries:
- `src/core/bible.js` remains sole Bible/context-pack loader, validator, normalizer, and cache owner.
- `src/app/reader.js` delegates context lookup through the Bible service and remains the Reader-state owner.
- `src/features/reader/context.js` and Reader presentation code render/forward events only; they cannot fetch packs, access storage/backend, award Progress, create globals, or install MutationObservers.
- `src/ui/context.css` owns Context Lab presentation.
- retained context pack paths cannot be addressed outside `src/core/bible.js`.

Functional run `34114885252` passed the entire accumulated suite after one real integration defect was found and corrected.

### Retained #20 defect regression

`V3-STEP-PEEK-SELECTOR-001` — the first integrated Context Lab build stored the current Verse Peek verse on the dialog using `data-verse`, colliding with the existing `[data-verse]` selector owned by Scripture verse buttons. Functional run `34114585936` correctly stopped at the original Reader browser regression before #20 promotion. Root cause was fixed by namespacing the dialog metadata as `data-peek-verse`; the old Reader test was not weakened. Run `34114885252` then passed both the old Reader regression and the new Context Lab browser regression, followed by every accumulated downstream browser test through Games.

## Current bookkeeping

- #49 Story Journey — **Regression-tested**
- #50 Wisdom Situations — **Regression-tested**
- #51 Deep Questions — **Regression-tested**
- #52 Expanded Guided Study — **Regression-tested**
- #53 Adaptive Learning — **Regression-tested**
- #54 Open/weak-area review — **Regression-tested**
- #20 STEPBible lexical/context tools — **Verified**
- Totals — **47 Regression-tested / 1 Verified / 0 Implemented / 52 Not started**

## Next sequence

1. Run the entire accumulated suite on this exact #20 bookkeeping state.
2. If green, freeze the exact commit as `release/v3.21-step-context`.
3. Start #14 Japanese 口語訳 by first recovering the old loaded source/licensing/fallback behavior rather than assuming the retained compatibility path is correct.
4. After #14, continue #15 furigana → #16 Japanese vocabulary → #17 NLT live path unless dependency recovery proves a safer order.
5. Preserve Kids #38–40 as deferred/unpromoted until the priority order calls for them.

## What remains overall

Literal old-version feature parity has **52 capability rows remaining**. They are not all equal-sized blockers. The immediate Reader/source path contains four rows (#14–17). Much of the remaining inventory is later community, ministry/admin, Bible World/tutorial, accessibility/moderation, PWA/offline, diagnostics, and backup/import work. The project is therefore not repeating the same rebuild work: each closed row is frozen and protected by the accumulated suite, while remaining work moves into distinct capability groups.

## Devotional / Ministry later milestone

Future implementation must preserve one ministry post/task identity for Message, Devotional, and Task; Pastor/Admin congregation-scoped response review; member-only access to their own response bodies; aggregate-only peer completion visibility; and backend/API/RLS privacy enforcement. Ministry Hub, Inbox, Assignments, Workspace, and Assignment Push must reuse this same service architecture.

## Release discipline

- Do not modify `main` during the rebuild line.
- Do not replace production with incomplete v3.
- Do not modify production Cloudflare during the rebuild.
- Each milestone closes only after the exact bookkeeping state passes the accumulated suite and is frozen as a known-good release.
- Every bug fix records root cause and retains a regression test.
- Normal v3 CI is manual-only; isolated verification branches may temporarily use a push trigger for one-shot CI execution.
