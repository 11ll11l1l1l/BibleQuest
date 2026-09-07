# BibleQuest v3 Development Status

Updated: 2026-09-07

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity matrix.

## Deployment safety

- Production v2 remains unchanged.
- `main` and production Cloudflare remain untouched.
- Current development branch: `feature/v3-study-core`.
- Normal v3 GitHub Actions are manual-only. Isolated verification branches may temporarily use a push trigger only for one-shot CI execution, then are reset to the exact candidate SHA.
- Latest frozen checkpoint: `release/v3.22-japanese-kougo` at `06eda2948db3a4c5462bc24a2b79596fa7d275f0`.
- Exact #14 bookkeeping run `34122128228` passed the complete accumulated suite before the v3.22 freeze.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 49 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 50 |
| Total | 100 |

Strict verified-or-better parity is **50/100**. Fully regression-tested stability coverage is **49/100**.

Current promotions:
- #14 Japanese 口語訳 — Regression-tested after surviving the later #16 full suite.
- #16 Japanese vocabulary learning — Verified.
- #15 Japanese furigana — Not started and intentionally deferred by user direction.
- #17 NLT live path — next active Reader/source target after #16 freeze.

## Milestone 11 — Reader language/source completion

### #14 Japanese 口語訳 — Regression-tested

Frozen in `release/v3.22-japanese-kougo` after exact bookkeeping run `34122128228` passed. The Reader loads `口語訳聖書 (1954/1955)` chapter-by-chapter through the single Bible service, persists selection, validates and caches only usable chapter data, exposes Retry and explicit Use BSB recovery, never silently substitutes or fabricates Scripture, and awards no XP for loading Scripture.

Retained defects:
- `V3-JKO-SEMANTIC-CACHE-001` — HTTP-200 but unusable Japanese payloads are evicted so Retry performs a real new request.
- `V3-JKO-TOUCH-001` — Japanese recovery controls remain at least 44px on mobile.

### #15 Japanese furigana — intentionally deferred

The loaded old implementation was recovered, including OFF/support/all modes and its old `kuromoji` path. The user explicitly directed us to skip furigana. #15 therefore remains Not started and does not block #16/#17. No kuromoji/CDN/global furigana runtime is allowed to leak into adjacent features.

### #16 Japanese vocabulary learning — Verified

Recovered old behavior:
- available only while Japanese 口語訳 is active;
- user selects/taps a verse;
- up to three vocabulary notes are shown;
- each retained curated note may include Japanese term, reading, learner-friendly explanation, fuller meaning, and English gloss;
- the learning-panel enabled preference persists;
- notes are explicitly labeled as learning aids, not Scripture;
- no recovered XP reward exists.

Clean v3 implementation:
- `src/app/japanese-vocabulary.js` is the sole vocabulary preference/lookup owner and uses the Storage boundary.
- `src/features/reader/vocabulary-content.js` contains the recovered 27 curated vocabulary definitions only.
- `src/features/reader/vocabulary.js` is presentation-only.
- Reader continues to own verse selection via Verse Peek; vocabulary is composed inside that existing interaction rather than creating another overlay or click owner.
- only Japanese 口語訳 shows the vocabulary ON/OFF control.
- at most three curated notes are shown, with longer matching terms prioritized.
- when no curated note matches, v3 shows a safe no-additional-notes state rather than inventing a reading.
- the skipped furigana/tokenizer runtime is not recreated: no `kuromoji`, CDN injection, MutationObserver, direct localStorage, or `window.BQJapaneseLearning`.
- vocabulary browsing awards no XP.

Verification:
- `scripts/validate-v3-japanese-vocabulary.mjs` — ownership and skipped-furigana boundary.
- `tests/v3-japanese-vocabulary-edge.mjs` — 27-term contract, max-three/longest-first lookup, persistence, malformed state normalization, no fabricated fallback.
- `tests/v3-japanese-vocabulary-smoke.mjs` — 390px Japanese Reader → Verse Peek → vocabulary notes/disclaimer → ON/OFF → reload → safe empty state → switch BSB; no overflow/errors; no XP.
- Complete functional run `34123075200` passed all architecture checks, all accumulated edge tests, the new vocabulary mobile test, and every downstream browser regression through Games.

## Next major milestone

Complete #16 bookkeeping on the exact **50/100 parity / 49/100 stability** state. If the full accumulated suite remains green, freeze `release/v3.23-japanese-vocabulary`.

Then start **#17 NLT live path**. Recover the actually loaded old NLT behavior and source contract before coding. Because NLT is copyrighted, do not bundle or cache redistributed NLT text unless redistribution rights are explicitly verified. Prefer the exact old compatibility/live handoff behavior if that is what production v2 actually used, with controlled unavailable/failure handling and no fabricated text.

After #17, reassess the remaining Bible-study/core-content debt before allowing Kids/community/ministry work to displace priority. #15 remains deferred unless explicitly reopened.

## Defect / root-cause ledger retained

- `V3-ROUTER-001` — single synchronous router fixed URL/view drift.
- `V3-AUTH-GATE-001` — static Supabase version pin is architecture-auditable.
- `V3-SHELL-001` — brand and primary navigation selectors are distinct.
- `V3-TRANSFORM-OWNER-001` — orchestration no longer defines a competing Transform calculation owner.
- `V3-RECORDINGS-FREEZE-001` — one Audio owner + Recordings owner, explicit teardown and one-player regression.
- `V3-MEDIA-OWNER-001` — Media Library composes verified Recordings/Audio owners.
- `V3-GAMES-OWNER-001` — game lifecycle is centralized in `src/app/games.js`.
- `V3-RECALL-PACK-001` — Recall pack loading/validation/cache is isolated.
- `V3-TIMELINE-XP-001` — repeated failed Timeline checks cannot farm XP.
- `V3-STUDY-BOUNDARY-001` — Study public state stays behind orchestration/Lesson boundaries.
- `V3-STORY-BOOKKEEPING-001` — validator protects required status headings.
- `V3-WISDOM-ESCAPE-001` — malformed presentation escaping fixed before promotion.
- `V3-OPEN-REVIEW-OWNER-001` — Open Review cannot directly own Games recall persistence.
- `V3-OPEN-REVIEW-FOCUS-TEST-001` — corrected an invalid deterministic tie-category test fixture.
- `V3-OPEN-REVIEW-SPACING-TEST-001` — isolated spacing fixture from legitimately older overdue items.
- `V3-STEP-PEEK-SELECTOR-001` — Verse Peek metadata is namespaced away from Scripture `[data-verse]`.
- `V3-JKO-SEMANTIC-CACHE-001` — invalid live Japanese payloads are evicted before retry.
- `V3-JKO-TOUCH-001` — Japanese recovery controls enforce >=44px.

## Release rule

#16 passed the complete functional suite on run `34123075200`. Its exact bookkeeping state must pass the complete accumulated suite again before `release/v3.23-japanese-vocabulary` is frozen. Production v2, `main`, and production Cloudflare remain unchanged.
