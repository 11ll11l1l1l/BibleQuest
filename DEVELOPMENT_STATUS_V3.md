# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after user-approved Kids/Kana scope closeout.

`FEATURE_INVENTORY_V3.md` remains the parity ledger. `KIDS_GAMES_EXTENSION_V3.md` defines the extension contract for future Kids games. Live GitHub refs and executed Actions evidence supersede stale text.

## Deployment safety

- Latest frozen verified baseline: `release/v3.71-japanese-furigana` at `c631bea8d5177a9a2ff68139cb104b6fbf26015b`.
- v3.71 exact bookkeeping verification run `34550650269`: **success** across accumulated architecture, edge/security, and browser/mobile suites.
- The preceding functional candidate `5b3891e3a2c5403c4b88087cd6d6dcbae8412b81` also passed targeted run `34549872861` and complete accumulated functional run `34550018009`.
- Current closeout branch: `feature/v3-post-parity-closeout`, branched directly from frozen v3.71.
- `main`, production v2, Supabase/data, and Cloudflare remain untouched.
- Normal product regression workflow remains dispatch-only; temporary push triggers stay isolated on verifier branches.

## Current release-scope state

| State | Count |
|---|---:|
| Regression-tested | 97 |
| Verified | 1 |
| Implemented | 0 |
| Not started in active release scope | 0 |
| User-retired from v3 release scope | 2 |
| Legacy inventory total | 100 |
| Applicable v3 release scope | 98 |

Active release-scope parity is **98/98 complete**. Regression stability is **97/98**, because Japanese Furigana is the current Verified frontier and has not yet rolled through a later product milestone. The complete exact-SHA v3.71 bookkeeping suite is green, so there is no known regression blocker in the frozen v3.71 baseline.

Rows #39 Hiragana Match and #40 Kids Bible Who Am I are no longer release blockers. The user explicitly accepted the current Kids game set as sufficient for the v3 release. These rows are retained in the historical inventory as **Retired from v3 release scope**, not falsely marked implemented or verified. They may be reopened later as optional expansion work under `KIDS_GAMES_EXTENSION_V3.md`.

The current Games page already contains verified game infrastructure, #38 Kids Memory Match / Memory Meadow, and #36 Character Detective / Who Am I. A second Kids-specific Who Am I implementation is not required for the current release.

## #15 verified functional boundary

#15 restores the Japanese Reader furigana contract without creating a second Reader, vocabulary, storage, or progress owner. Furigana is exposed only for Japanese 口語訳 and persists one preference through the Storage boundary: `off`, `support` (難しい語だけ), or `all` (すべて), defaulting to `support`.

Support mode reuses the recovered curated Japanese vocabulary/readings. All mode lazily uses the isolated Kuromoji adapter, normalizes Katakana readings to Hiragana, and falls back to curated support rendering if tokenizer loading/tokenization fails. Furigana never awards XP and never changes canonical Scripture data; Reader applies ruby as presentation only and cancels stale async rendering across navigation, translation changes, and teardown.

Permanent evidence: `src/app/japanese-furigana.js`, `src/app/japanese-furigana-tokenizer.js`, `src/features/reader/furigana.js`, `src/features/reader/index.js`, `src/app/bootstrap.js`, `scripts/validate-v3-japanese-furigana.mjs`, `tests/v3-japanese-furigana-edge.mjs`, `tests/v3-japanese-furigana-smoke.mjs`, strengthened Japanese Kougo regression, and `.github/workflows/v3-regression.yml`.

## Kids game extension decision

Future Kids games must extend the existing Games architecture rather than add a competing page/runtime. The extension rules require stable registration IDs, Games-owned lifecycle/cleanup, Progress-owned rewards, Storage-owned persistence, Router-owned navigation, 390px/touch accessibility, duplicate-reward protection, and focused plus accumulated regression verification.

No future Kids/Kana game is part of the current v3 release gate unless explicitly reopened.

## Post-parity pre-release stage

BibleQuest v3 may now proceed to the post-parity phase. The order is:

1. **Scope closeout** — record #39/#40 as user-retired from the v3 release scope and preserve the future extension contract.
2. **Artwork/theme polish** — improve artwork, icons, color treatment, visual cohesion, and polish without changing the established information architecture, navigation model, feature ownership, or core interaction layout.
3. **Regression-only corrections** — fix only reproduced defects found during polish/acceptance; no unrelated feature additions.
4. **Final acceptance** — run the complete accumulated architecture, edge/security, browser/mobile, PWA/offline, and relevant accessibility suites on the exact release-candidate SHA.
5. **Release-candidate freeze** — freeze only the exact clean SHA that passed the final suite.
6. **Deployment/production promotion** — remains separate and requires explicit authorization; do not modify `main`, production v2, production Supabase/data, or production Cloudflare merely because pre-release validation is green.

## Release rule

Do not claim zero bugs; claim only executed evidence. The frozen v3.71 baseline has a successful complete exact-SHA suite and no known regression blocker. Every later product/artwork change must be reverified before release freeze. Temporary verifier commits are never release SHAs.
