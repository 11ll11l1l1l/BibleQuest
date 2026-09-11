from pathlib import Path

EXPECTED='5b3891e3a2c5403c4b88087cd6d6dcbae8412b81'

inv=Path('FEATURE_INVENTORY_V3.md')
text=inv.read_text()
replacements={
'- **Regression-tested:** 96':'- **Regression-tested:** 97',
'- **Not started:** 3':'- **Not started:** 2',
'Priority note (2026-09-11 JST): #38 Kids Memory Match is now verified. #15 Japanese furigana and #40 Kids Bible Who Am I remain reopened for implementation. #39 Hiragana Match remains explicitly deferred.':'Priority note (2026-09-11 JST): #15 Japanese furigana is now verified after exact-SHA targeted and complete accumulated gates. #38 Kids Memory Match has rolled forward to Regression-tested. #40 Kids Bible Who Am I remains the next reopened parity item. #39 Hiragana Match remains explicitly deferred.',
'| 15 | Japanese furigana | Yes | Compatibility | Not started | priority reopened; recover exact old-version furigana contract and owner boundary before implementation; then focused + accumulated browser/mobile verification |':'| 15 | Japanese furigana | Yes | Compatibility | Verified | JKO-only OFF/support/all modes; support uses recovered curated readings; all lazily uses Kuromoji with hiragana normalization and safe curated fallback; Storage persistence; no XP; canonical Scripture preserved beneath ruby presentation; exact-SHA targeted + complete accumulated browser/mobile verification |',
'| 38 | Kids Memory Match | Yes | Clean | Verified | Memory Meadow Games ownership; <420px 6 pairs/3 columns and >=420px 8 pairs/4 columns; 350ms match/650ms mismatch lock; replay/leave cleanup; unique round identity; stars + coins reward through Progress with zero XP; complete accumulated browser/mobile verification |':'| 38 | Kids Memory Match | Yes | Clean | Regression-tested | Memory Meadow Games ownership; <420px 6 pairs/3 columns and >=420px 8 pairs/4 columns; 350ms match/650ms mismatch lock; replay/leave cleanup; unique round identity; stars + coins reward through Progress with zero XP; complete accumulated browser/mobile verification |'
}
for old,new in replacements.items():
    if text.count(old)!=1: raise SystemExit(f'inventory expected one match: {old[:90]!r}; got {text.count(old)}')
    text=text.replace(old,new,1)
inv.write_text(text)

status='''# BibleQuest v3 Development Status

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
'''
Path('DEVELOPMENT_STATUS_V3.md').write_text(status)

handoff='''# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after #15 Japanese furigana complete functional verification and promotion bookkeeping.

Live GitHub refs and exact executed evidence are authoritative; recover them first.

## Frozen baseline

- Repo: `11ll11l1l1l/BibleQuest`.
- Current frozen baseline before the #15 bookkeeping gate: `release/v3.70-kids-memory-match` at `ba4394a1c6acaf62a9f24b1883b5ec5ec4d12be9`.
- v3.70 exact bookkeeping verification run `34547970159`: **success**.
- `main`, production v2, Cloudflare, data, and Supabase remain untouched.
- Normal v3 Actions are dispatch-only; temporary push triggers stay isolated on verifier branches.

## Current #15 state

- Active branch: `feature/v3-japanese-furigana`.
- Green functional candidate: `5b3891e3a2c5403c4b88087cd6d6dcbae8412b81`.
- Exact-SHA targeted run `34549872861`: **success**.
- Exact-SHA complete accumulated functional run `34550018009`: **success** across architecture, edge/security, and browser/mobile suites.
- Promoted state in this bookkeeping candidate: **97 Regression-tested / 1 Verified / 0 Implemented / 2 Not started**; strict parity **98/100**, regression stability **97/100**.
- #15 Japanese furigana is Verified. #38 Kids Memory Match has rolled to Regression-tested. #40 Kids Bible Who Am I remains reopened. #39 Hiragana Match remains explicitly deferred.
- A fresh complete bookkeeping gate is still required on this changed documentation SHA before v3.71 can freeze.

## #15 verified boundary

Furigana remains a Reader presentation aid for Japanese 口語訳 only. One Storage-backed preference supports `off`, `support` (難しい語だけ), and `all` (すべて), with `support` as default. Support mode uses only recovered curated readings. All mode lazily uses the isolated Kuromoji adapter, normalizes Katakana readings to Hiragana, and falls back to curated support output if tokenizer loading/tokenization fails.

No furigana path awards XP or mutates Scripture. Canonical verse data remains unchanged beneath ruby presentation. Reader cancels stale asynchronous furigana passes across navigation, translation changes, and teardown. Existing Japanese vocabulary remains a separate owner and is reused as the curated reading source rather than duplicated.

Permanent evidence: `src/app/japanese-furigana.js`, `src/app/japanese-furigana-tokenizer.js`, `src/features/reader/furigana.js`, `src/features/reader/index.js`, `src/app/bootstrap.js`, `scripts/validate-v3-japanese-furigana.mjs`, `tests/v3-japanese-furigana-edge.mjs`, `tests/v3-japanese-furigana-smoke.mjs`, strengthened Japanese Kougo regression, and `.github/workflows/v3-regression.yml`.

## Verification/root-cause evidence

- `34549469205`: isolated author push was blocked by GitHub Actions workflow-file permission only; feature branch unchanged, no product defect.
- `34549531647`: corrected isolated author run succeeded after workflow writes were separated.
- `34549642961`: regression-spec error expected support ruby for uncurated standalone `神`; corrected to enforce curated-only support/fallback and tokenizer-only full reading.
- `34549744682`: existing Kougo raw-text assertion did not account for `<rt>` annotation text; canonical base Scripture was unchanged. Regression now strips `<rt>` before source-text comparison.
- `34549872861`: corrected exact-SHA targeted gate passed all #15 and neighboring Japanese/Reader checks.
- `34550018009`: exact functional SHA `5b3891e3a2c5403c4b88087cd6d6dcbae8412b81` passed the complete accumulated suite.

## Remaining priority state

#40 Kids Bible Who Am I is the next active parity item and requires exact historical mapping before implementation; the retained standalone Kids Games bundle did not expose a literal display label `Who Am I`, so do not guess the contract. #39 Hiragana Match remains explicitly deferred and must not be silently implemented.

## Exact next executable sequence

1. Recover the exact SHA of the bookkeeping commit containing this promoted handoff/inventory/status.
2. Create an isolated bookkeeping verifier that checks out and asserts that exact SHA, then run the complete accumulated architecture, edge/security, and browser/mobile suite. Do not transfer PASS from functional SHA `5b3891e3...`.
3. On green, freeze `release/v3.71-japanese-furigana` at the clean bookkeeping SHA, not at the temporary verifier commit.
4. Verify the release ref equals the successful bookkeeping SHA.
5. Branch #40 only from frozen v3.71; perform contract/data/ownership recovery first and implement only what retained evidence supports. Keep #39 deferred.
6. Continue focused → complete functional → promotion/bookkeeping → complete bookkeeping → freeze until parity is complete.

## Non-negotiable safety

Rebuild-and-verify; one owner per responsibility; no PASS transfer across changed SHAs; no production or `main` mutation without explicit authorization. Never freeze an untested SHA.
'''
Path('DEVELOPMENT_HANDOFF_V3.md').write_text(handoff)
