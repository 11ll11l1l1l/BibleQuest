# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-08 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`; the inventory remains authoritative. BibleQuest v3 uses rebuild-and-verify rather than patch-and-accumulate.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Inventory states after #96 functional verification:** 56 Regression-tested / 1 Verified / 0 Implemented / 43 Not started
- **Verified or better:** 57 / 100 (**57% strict parity completion**)
- **Official regression stability:** 56 / 100
- **Latest frozen checkpoint:** `release/v3.29-congregation-membership` at `7bf024ba4f2b6501f6fb9e87ddc010c84426c7d1`
- **v3.29 bookkeeping:** `34200768014` — all 76 job steps green
- **#66 Congregation membership/roles:** Regression-tested after surviving #96; frozen in v3.29
- **#96 Operational recovery/error boundary:** Verified; clean candidate `90cd1d15db7baeacf9240514d6d8b2da1d68b784`, run `34202531302`
- **#56 Cloud Notes:** Regression-tested after surviving #66; frozen in v3.28
- **#55 Private local notes:** Regression-tested; frozen in v3.27
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
| 12 | Source provenance | Frozen | v3.25; #90 Regression-tested |
| 13 | Doctrinal safety/context | Frozen | v3.26; #89 Regression-tested; functional `34166910207`; bookkeeping `34168229627` |
| 14 | Private local notes | Frozen | v3.27; #55 Regression-tested |
| 15 | Cloud Notes | Frozen | v3.28; #56 Regression-tested after later #66 suite |
| 16 | Congregation membership/roles | Frozen | v3.29; #66 Regression-tested after later #96 suite |
| 17 | Operational recovery/error boundary | Functional gate green; bookkeeping active | #96 Verified; `34202531302` |
| 18 | Remaining parity | Reassess after v3.30 | select by dependency and user value, not row order |
| 19 | Full old-vs-new audit | Not started | reconcile all 100 rows |
| 20 | Accumulated mobile regression | Ongoing + final gate later | each milestone carries browser/mobile coverage |
| 21 | Production deployment | Not started | only after selected parity/stability acceptance gates |

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
- `release/v3.25-source-provenance` — `04f20094a03cd0b189d1626ef4f372917ce599e3`; source-provenance functional `34130447654`; bookkeeping `34160651319`
- `release/v3.26-doctrinal-safety` — `e223ac5e5022db2dc609e8fe15df9f9d020d4e75`; doctrinal functional `34166910207`; bookkeeping `34168229627`
- `release/v3.27-private-local-notes` — `e8b58b1bd9c9053243bb5d394c2d2afae44c9f59`; functional `34169365596`; bookkeeping `34169778300`
- `release/v3.28-cloud-notes` — `1b8cb0a4847b1fc633ce23412982c91c38825148`; functional `34183773524`; bookkeeping `34184699391`
- `release/v3.29-congregation-membership` — `7bf024ba4f2b6501f6fb9e87ddc010c84426c7d1`; functional `34185569051`; bookkeeping `34200768014`

## #90 Source labels/attribution — Regression-tested

Recovered requirement: users must be able to distinguish actual Scripture text, third-party/open reference answers, story retellings, and BibleQuest-authored study/application/game prose.

#90 was frozen in v3.25 and remained green throughout #89 functional verification run `34166910207` and bookkeeping run `34168229627`, including architecture, edge, Reader/source, and 390px browser checks.

## #89 Doctrinal safety/context — Regression-tested

Recovered requirement: factual recall, passage-sensitive comprehension, and disputed/universal doctrinal claims cannot all be treated as the same kind of binary quiz content.

Clean v3 behavior:
- one pure `src/core/doctrinal-safety.js` classification/admission owner;
- `TEXTUAL_FACT` may enter normal scored recall;
- `PASSAGE_CONTEXT` may enter passage-bound recall with a separate BibleQuest context note;
- `INTERPRETIVE_OR_DOCTRINAL` is quarantined from normal binary/scored play pending rewrite/pastor review;
- imported unfoldingWord Translation Questions are re-evaluated at the Recall boundary and stale embedded allow tags are not trusted;
- missing/unsafe imported safety metadata fails closed;
- imported reference answer, Scripture reference, source/license, and BibleQuest context remain separate fields;
- per-book Recall and Open Smart Review hide BibleQuest context before reveal and show it only with the revealed answer/reference;
- no UI classifier, no `window.BQ_DOCTRINAL_SAFETY`, no global fetch override, no MutationObserver policy injector, no Lesson/Progress doctrinal logic, and no #89 XP change;
- Deep Questions remains non-binary and Wisdom Situations remains strongest-supported-judgment teaching rather than universal doctrinal scoring.

Functional verification history:
- `34166578446` — failed at the general architecture validator. Root cause: obsolete pre-#89 validator requirement for raw imported `allow` admission. The validator was updated to require current `reviewImportedRecall` evaluation, quarantine filtering, trusted context projection, and rejection of raw imported allow-tag admission.
- `34166769435` — reached browser regressions and exposed the global shell account button at 38px. Root cause: `.bq-session-chip{min-height:38px}` outside Wisdom’s already-correct 44px controls. Shell owner fixed to 44px; the existing mobile regression is retained.
- `34166910207` — full accumulated suite green through Games. The new Acts 1:8 real browser path proves the contextual item has no answer/context before reveal, shows a separate BibleQuest context note after reveal, preserves the exact unfoldingWord answer/source/license, then carries the same review item into Open Smart Review safely.

Bookkeeping/release verification:
- Exact candidate `e223ac5e5022db2dc609e8fe15df9f9d020d4e75` added the #89 architecture owner/boundaries and completed the four-document bookkeeping state.
- `verify/v3-doctrinal-safety-bookkeeping` was created from that exact candidate; push was enabled only on the isolated verification branch.
- Run `34168229627` completed fully green across every accumulated architecture, edge, browser, mobile, Transform, recording/media, Recall, and Games step.
- The verification branch was reset to the clean candidate, removing the temporary trigger.
- `release/v3.26-doctrinal-safety` was created and SHA-verified at exactly `e223ac5e5022db2dc609e8fe15df9f9d020d4e75`.

## Current bookkeeping

- #15 Japanese furigana — **Not started / intentionally deferred**
- #90 Source labels/attribution — **Regression-tested**
- #89 Doctrinal safety/context — **Regression-tested**
- #55 Private local notes — **Regression-tested**
- #56 Cloud Notes — **Regression-tested**
- #66 Congregation membership/roles — **Regression-tested**
- #96 Operational recovery/error boundary — **Verified**
- Inventory states — **56 Regression-tested / 1 Verified / 0 Implemented / 43 Not started**
- Strict parity — **57/100**
- Official regression stability — **56/100**

## Next sequence

1. Complete the exact #96 bookkeeping gate.
2. Freeze `release/v3.30-operational-recovery` only at the exact verified bookkeeping SHA.
3. Reassess #67 Community Bridge against accessibility, diagnostics, PWA/offline, backup/import, and remaining user-facing parity debt.
4. Keep Kids #38–40 explicitly deferred and keep production deployment out of scope.

## What remains overall

Literal old-version parity has **43 Not started rows** after #96 functional verification. Remaining work includes the explicitly deferred Kids modes, Play Together/Live Rooms, Bible World, community/ministry/admin capabilities, accessibility, reporting/moderation workbench, client diagnostics, PWA/offline behavior, backup/import, and Japanese furigana.

## Release discipline

- Do not modify `main` or production Cloudflare during rebuild.
- Do not replace production v2 with incomplete v3.
- Freeze only after the exact bookkeeping state passes the complete accumulated suite.
- Every real bug fix records root cause and retains a regression test.
- Normal v3 CI remains manual-only; temporary push triggers are isolated to verification branches and removed afterward.
