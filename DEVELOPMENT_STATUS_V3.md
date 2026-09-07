# BibleQuest v3 Development Status

Updated: 2026-09-07

`FEATURE_INVENTORY_V3.md` is the authoritative 100-capability parity matrix.

## Deployment safety

- Production v2 remains unchanged.
- `main` and production Cloudflare remain untouched.
- Current development branch: `feature/v3-study-core`.
- Normal v3 GitHub Actions are manual-only. Isolated verification branches may temporarily use a push trigger only for one-shot CI execution, then are reset to the exact candidate SHA.
- Latest frozen checkpoint: `release/v3.23-japanese-vocabulary` at `7f83415b7d61d8fbc615b8261fca9dc28e2595e7`.
- Exact #16 bookkeeping run `34123607629` passed the complete accumulated suite before the v3.23 freeze.
- #17 NLT licensed-link functional run `34126567141` passed the complete accumulated suite; exact bookkeeping/freeze gate remains.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 50 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 49 |
| Total | 100 |

Strict verified-or-better parity is **51/100**. Fully regression-tested stability coverage is **50/100**.

Current promotions:
- #14 Japanese 口語訳 — Regression-tested.
- #16 Japanese vocabulary learning — Regression-tested after surviving the later #17 full suite.
- #17 NLT live path — Verified as the recovered licensed external-reader path.
- #15 Japanese furigana — Not started and intentionally deferred by user direction.

## Milestone 11 — Reader language/source completion

### #14 Japanese 口語訳 — Regression-tested

Frozen in `release/v3.22-japanese-kougo` after exact bookkeeping run `34122128228`. The Reader loads `口語訳聖書 (1954/1955)` chapter-by-chapter through the single Bible service, persists selection, validates and caches only usable chapter data, exposes Retry and explicit Use BSB recovery, never silently substitutes or fabricates Scripture, and awards no XP for loading Scripture.

Retained defects:
- `V3-JKO-SEMANTIC-CACHE-001` — HTTP-200 but unusable Japanese payloads are evicted so Retry performs a real new request.
- `V3-JKO-TOUCH-001` — Japanese recovery controls remain at least 44px on mobile.

### #15 Japanese furigana — intentionally deferred

The loaded old implementation was recovered, including OFF/support/all modes and its old `kuromoji` path. The user explicitly directed us to skip furigana. #15 therefore remains Not started and does not block adjacent Reader/core work. No kuromoji/CDN/global furigana runtime is allowed to leak into other features.

### #16 Japanese vocabulary learning — Regression-tested

Clean v3 uses `src/app/japanese-vocabulary.js` as the sole vocabulary preference/lookup owner, preserves the recovered 27 curated terms, composes notes inside the existing Verse Peek interaction, persists ON/OFF through the Storage boundary, shows a controlled no-note state rather than inventing readings, labels notes as learning aids rather than Scripture, and awards no XP. The skipped furigana/tokenizer runtime is not recreated.

Functional run `34123075200` and bookkeeping run `34123607629` were fully green. #16 then survived the later complete #17 functional suite `34126567141`, so it is now Regression-tested.

### #17 NLT live path — Verified as licensed-link parity

Recovered loaded v2 behavior before coding:
- NLT was one of the main translation-picker choices.
- It was explicitly `mode:'licensed-link'`, not a bundled or hidden live-text API.
- selected translation/book/chapter were retained by the Reader.
- the selected passage opened on BibleGateway with `version=NLT`.
- v2 explicitly stated that BibleQuest did not redistribute the full copyrighted NLT text or expose a private API key in the browser.

Clean v3 implementation:
- `src/core/bible.js` remains the sole Bible-source/external-translation owner and declares NLT as `licensed-link`.
- `licensedPassage()` builds the exact external passage URL from the canonical Bible book/chapter/verse model.
- `loadChapter('nlt',...)` returns passage metadata, an empty immutable verse collection, and the licensed external handoff. It performs no NLT Scripture fetch.
- NLT pack loading and in-app NLT search are rejected explicitly rather than pretending redistributed text exists.
- `src/app/reader.js` remains the sole translation/book/chapter persistence owner.
- NLT mode retains book/chapter and Previous/Next navigation.
- NLT mode shows no in-app verse list, no in-app NLT text search, and no Mark Read button.
- Reader `markRead()` also blocks licensed-link translations at the service boundary, preventing programmatic XP/read-credit for Scripture BibleQuest did not display.
- the NLT handoff opens safely in a new tab with `noopener noreferrer` and preserves BibleQuest state on return.
- source/license attribution is visible and no XP is awarded for browsing external NLT passages.

Verification:
- `scripts/validate-v3-nlt-licensed.mjs` enforces sole NLT URL/source ownership and forbids UI/storage/global/network bypasses.
- `tests/v3-nlt-licensed-edge.mjs` proves zero hidden fetch, zero redistributed verses, exact passage URLs, pack/search rejection, persistence, navigation, and zero read-credit/XP.
- existing Reader edge/browser tests now retain NLT in the general external-link contract.
- `tests/v3-nlt-licensed-smoke.mjs` verifies the real 390px NLT flow, exact passage changes/reload, safe external attributes, source/license text, no verse/search/read controls, no XP, and no horizontal overflow.
- Complete functional run `34126567141` passed all architecture checks, every accumulated edge regression, Reader/Japanese/NLT mobile paths, and every downstream browser regression through Games.

## Next major milestone

Run the entire accumulated suite on the exact **51/100 parity / 50/100 stability** bookkeeping state. If green, freeze it as `release/v3.24-nlt-licensed`.

After the v3.24 freeze, reassess the remaining Bible-study/core-content debt before selecting another capability. Do not automatically jump to Kids/community/ministry. #15 remains deferred unless explicitly reopened. The remaining core-adjacent candidates include private/cloud notes (#55–56), accessibility (#86), doctrinal safety/context (#89), source labels/attribution (#90), diagnostics/recovery (#95–96), and PWA/offline Bible behavior (#97–99); inspect the recovered old behavior and dependency order before choosing.

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

#17 passed the complete functional suite on run `34126567141`. The exact bookkeeping state must pass the complete accumulated suite again before `release/v3.24-nlt-licensed` may be frozen. Production v2, `main`, and production Cloudflare remain unchanged.
