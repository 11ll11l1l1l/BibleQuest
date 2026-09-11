# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after #15 Japanese furigana complete functional verification and promotion bookkeeping.

`FEATURE_INVENTORY_V3.md` is authoritative. Live GitHub refs and executed Actions evidence supersede stale text.

## Deployment safety

- Current frozen baseline before this bookkeeping gate: `release/v3.70-kids-memory-match` at `ba4394a1c6acaf62a9f24b1883b5ec5ec4d12be9`; exact bookkeeping verification run `34547970159` passed the complete accumulated suite.
- Active branch: `feature/v3-japanese-furigana`.
- #15 clean functional candidate: `5b3891e3a2c5403c4b88087cd6d6dcbae8412b81`.
- Targeted exact-SHA run `34549872861`: **success** across #15 architecture/edge plus Japanese furigana, vocabulary, Kougo, and Reader browser/mobile checks.
- Complete exact-SHA functional run `34550018009`: **success** across the entire accumulated architecture, edge/security, and browser/mobile suites.
- `main`, production v2, Supabase/data, and Cloudflare remain untouched.
- Product regression workflow remains `workflow_dispatch` only; temporary push triggers stay isolated on verifier branches.

## Current promoted state

| State | Count |
|---|---:|
| Regression-tested | 97 |
| Verified | 1 |
| Implemented | 0 |
| Not started | 2 |
| Total | 100 |

Strict parity is **98/100**; regression stability is **97/100**. #15 Japanese furigana is the current Verified frontier. #38 Kids Memory Match and #45 Bible World artwork are Regression-tested. #40 Kids Bible Who Am I is the next reopened parity item. #39 Hiragana Match remains explicitly deferred.

## #15 verified functional boundary

#15 restores the retained Japanese Reader furigana contract without creating a second Reader, vocabulary, storage, or progress owner. Furigana is exposed only for Japanese 口語訳 and persists one preference through the Storage boundary: `off`, `support` (難しい語だけ), or `all` (すべて), defaulting to `support`.

Support mode reuses the already-recovered curated Japanese vocabulary/readings. It does not invent readings for uncurated terms. All mode lazily uses the isolated Kuromoji adapter, normalizes Katakana readings to Hiragana, and falls back to the curated support rendering if tokenizer loading/tokenization fails. Furigana never awards XP and never changes canonical Scripture data; Reader applies ruby as presentation only and cancels stale async rendering across navigation/translation changes/teardown.

Permanent evidence: `src/app/japanese-furigana.js`, `src/app/japanese-furigana-tokenizer.js`, `src/features/reader/furigana.js`, `src/features/reader/index.js`, `src/app/bootstrap.js`, `scripts/validate-v3-japanese-furigana.mjs`, `tests/v3-japanese-furigana-edge.mjs`, `tests/v3-japanese-furigana-smoke.mjs`, the strengthened Japanese Kougo regression, and `.github/workflows/v3-regression.yml`.

## Defect / root-cause ledger

- Isolated author run `34549469205` reached the intended integration commit but GitHub rejected the push solely because the Actions token was not permitted to modify `.github/workflows/v3-regression.yml`; the feature branch was not changed and no product defect was established. Corrected author run `34549531647` separated product writes from workflow writes and succeeded.
- First targeted exact-SHA run `34549642961` rejected the regression expectation that support mode should annotate standalone `神`. Root cause: `神` is not in the recovered curated support list. The test was corrected to require curated `愛`, leave uncurated `神` plain in support/fallback, and still require `神 → かみ` in tokenizer-backed all mode.
- Second targeted exact-SHA run `34549744682` passed #15/#16 behavior but exposed an existing Kougo smoke assertion that compared raw DOM `textContent`. Ruby `<rt>` readings are included in DOM textContent even when the canonical base Scripture is unchanged. The regression now removes `<rt>` annotations before asserting exact live-source base text, preserving the original no-modification guarantee.
- Final clean candidate `5b3891e3a2c5403c4b88087cd6d6dcbae8412b81` passed targeted run `34549872861` and complete accumulated functional run `34550018009`. Temporary verifier commits are not candidates and are not release SHAs.

## Next major milestone

Treat the commit containing this promoted inventory/status/handoff as the #15 bookkeeping candidate. Run a fresh complete exact-SHA bookkeeping gate; do not transfer PASS from functional SHA `5b3891e3...`. On green, freeze `release/v3.71-japanese-furigana` at that exact clean bookkeeping SHA. Then recover/map the exact retained #40 Kids Bible Who Am I contract from the frozen v3.71 baseline and continue focused → complete functional → promotion/bookkeeping → complete bookkeeping → freeze. #39 stays deferred.

## Release rule

Never freeze an untested bookkeeping SHA. Temporary verifier commits are never release SHAs.
