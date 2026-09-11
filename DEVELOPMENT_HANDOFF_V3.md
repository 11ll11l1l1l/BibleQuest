# BibleQuest v3 continuation handoff

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
