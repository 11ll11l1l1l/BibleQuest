# BibleQuest v3 Development Status

Updated: 2026-09-07

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production v2 remains unchanged.
- `main` and production Cloudflare remain untouched by the v3 rebuild.
- Current development branch: `feature/v3-study-core`.
- Normal v3 GitHub Actions remain manual-only; isolated verification branches may temporarily use a push trigger for one-shot CI execution only.
- Latest frozen checkpoint: `release/v3.21-step-context` at `55f4e5551d73830174eadd2d6dbfaac2a6cb0bcd`.
- #20 STEPBible Context Lab is frozen at v3.21 and is now Regression-tested after surviving the later Japanese 口語訳 full suite.
- #14 Japanese 口語訳 repaired functional run `34120997990` passed completely; exact bookkeeping/freeze gate is pending.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 48 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 51 |
| Total | 100 |

Strict verified-or-better parity is **49/100**. Fully regression-tested stability coverage is **48/100**.

Current promotions:
- #20 STEPBible lexical/context tools — Regression-tested.
- #14 Japanese 口語訳 — Verified.
- #15 Japanese furigana — Not started and intentionally deferred by current priority decision; it must not be marked complete unless explicitly reopened and verified.

## Milestone 11 — Reader language/source completion

### #14 Japanese 口語訳 — Verified

The actually loaded v2 behavior was recovered before rebuilding. v2 used the GetBible `japkougo` chapter endpoint for `口語訳聖書 (1954/1955)`, persisted translation selection, displayed a retry path on source failure, and provided an explicit BSB fallback rather than fabricating or silently substituting Scripture.

Clean v3 behavior:
- `src/core/bible.js` remains the sole Bible-source owner.
- Japanese is declared as a live, chapter-only translation rather than pretending to be a bundled whole-book pack.
- GetBible book numbers are derived from the existing canonical Bible-book order, avoiding a second book map.
- successful chapters are cached by exact live source URL.
- returned verse arrays or object-shaped verse collections are normalized and sorted.
- Scripture text is preserved except surrounding transport whitespace; v3 does not rewrite the 口語訳 text.
- reference navigation/search remains available, but full-text 66-book live search is rejected rather than creating an uncontrolled API fan-out.
- source failure is explicit and offers Retry plus an explicit `Use BSB` action.
- no silent fallback occurs and no missing Japanese text is synthesized.
- selecting/loading Japanese Scripture awards no XP.

Verification coverage:
- `scripts/validate-v3-japanese-kougo.mjs` enforces the live-source boundary.
- `tests/v3-japanese-kougo-edge.mjs` verifies canonical book mapping, payload normalization, exact text preservation, successful caching, source failure/recovery, semantic-invalid-response cache eviction, Reader persistence, and zero invented XP.
- `tests/v3-japanese-kougo-smoke.mjs` verifies the real 390px Reader flow, translation persistence, source/license display, Retry, explicit BSB fallback, no horizontal overflow, and >=44px recovery controls.
- repaired complete functional run `34120997990` passed all architecture checks, all accumulated edge tests, Reader, STEPBible, Japanese 口語訳, and every later browser regression through Games.

### #15 Japanese furigana — intentionally deferred

The old loaded `japanese-learning.js` has been recovered. It provided OFF / difficult-terms-only / all-readings modes, with `kuromoji` used for the all-readings mode and a retained static term list for support mode. The user has explicitly asked to skip this capability for now.

Therefore #15 remains **Not started**. No partial furigana implementation will be introduced, and the current sequence jumps directly from #14 to #16.

## Next major milestone

After the #14 bookkeeping gate is green and the exact state is frozen as `release/v3.22-japanese-kougo`, continue directly to **#16 Japanese vocabulary learning**.

Recovered #16 behavior from the loaded old `japanese-learning.js`:
- visible only when Japanese 口語訳 is selected.
- a verse is selected/tapped and the learning panel shows up to three matching vocabulary notes.
- retained static terms include Japanese term, reading, learner-friendly explanation, fuller meaning, and optional English gloss.
- when no retained static term matches, old v2 could use the tokenizer to surface up to three kanji terms with a generic contextual-learning note.
- vocabulary/reading explanations are explicitly labeled as learning aids, not Scripture text.
- learning-panel on/off preference was persisted in the old shared Japanese-learning state.

Clean #16 direction:
1. Do not revive old DOM injection, direct `localStorage`, CDN script injection, `window.BQJapaneseLearning`, or MutationObserver-style behavior.
2. Keep Japanese Scripture text owned by `src/core/bible.js` and Reader passage state owned by `src/app/reader.js`.
3. Add one clean Japanese-learning owner/data boundary for vocabulary notes only if needed; do not create another Bible source or Reader state owner.
4. Preserve the old learning-aid disclaimer and no-XP behavior unless contrary evidence is recovered.
5. Add dedicated edge + 390px browser regressions, then run the entire accumulated suite.

After #16, continue to **#17 NLT live path**. #15 remains deferred until explicitly reopened.

Kids #38–40 remain deferred/unpromoted. Ministry/Devotional remains a later high-priority milestone governed by `DEVOTIONAL_MINISTRY_DESIGN_V3.md`; it does not displace the Reader/core sequence.

## Defect / root-cause ledger retained

- `V3-ROUTER-001` — single synchronous router fixed URL/view drift.
- `V3-AUTH-GATE-001` — static Supabase version pin is architecture-auditable.
- `V3-SHELL-001` — brand and primary navigation selectors are distinct.
- `V3-TRANSFORM-OWNER-001` — orchestration no longer defines a competing Transform calculation owner.
- `V3-RECORDINGS-FREEZE-001` — v3 replaced fragmented global media lifecycle with one Audio owner, one Recordings owner, explicit teardown, bounded requests, and one-player regression.
- `V3-MEDIA-OWNER-001` — Media Library composes verified Recordings/Audio owners instead of creating another player/backend path.
- `V3-GAMES-OWNER-001` — game launch/answer/score/replay/switch/leave/result persistence is centralized in `src/app/games.js`.
- `V3-RECALL-PACK-001` — pack loading/validation/cache is isolated in `src/core/recall-packs.js`.
- `V3-TIMELINE-XP-001` — repeated failed Timeline checks cannot farm XP.
- `V3-STUDY-BOUNDARY-001` — Study public state stays behind its orchestration/Lesson boundary.
- `V3-STORY-BOOKKEEPING-001` — validator protects required status headings.
- `V3-WISDOM-ESCAPE-001` — malformed presentation escaping was corrected before functional promotion.
- `V3-OPEN-REVIEW-OWNER-001` — Open Review cannot read `games-recall` directly; Games remains queue owner.
- `V3-OPEN-REVIEW-FOCUS-TEST-001` — incorrect deterministic tie-category fixture was corrected without changing working logic.
- `V3-OPEN-REVIEW-SPACING-TEST-001` — spacing fixture was isolated from legitimately older overdue items.
- `V3-STEP-PEEK-SELECTOR-001` — Verse Peek metadata was namespaced to avoid collision with Scripture `[data-verse]` buttons.
- `V3-JKO-SEMANTIC-CACHE-001` — first Japanese browser gate found that an HTTP-200 but unusable verse payload remained cached after post-fetch semantic validation. `src/core/bible.js` now evicts invalid Japanese chapter payloads so Retry performs a real source request; the edge and browser tests retain this regression.
- `V3-JKO-TOUCH-001` — the repaired Japanese run then found Retry/Use BSB controls at 42px. Reader recovery/navigation controls now enforce >=44px and the browser regression retains the assertion.

## Release rule

#14 passed the entire repaired accumulated functional suite on run `34120997990`. The exact bookkeeping state must pass the full suite once more before `release/v3.22-japanese-kougo` may be frozen. Production v2, `main`, and production Cloudflare remain unchanged.
