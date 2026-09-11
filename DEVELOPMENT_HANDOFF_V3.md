# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after user-approved Kids/Kana release-scope closeout.

Live GitHub refs and exact executed evidence are authoritative; recover them first.

## Frozen baseline

- Repo: `11ll11l1l1l/BibleQuest`.
- Latest frozen verified baseline: `release/v3.71-japanese-furigana` at `c631bea8d5177a9a2ff68139cb104b6fbf26015b`.
- Exact bookkeeping run `34550650269`: **success** across accumulated architecture, edge/security, and browser/mobile suites.
- Earlier exact functional candidate `5b3891e3a2c5403c4b88087cd6d6dcbae8412b81` passed targeted run `34549872861` and complete functional run `34550018009`.
- `main`, production v2, Cloudflare, data, and Supabase remain untouched.
- Normal product Actions stay dispatch-only; temporary push-trigger verifier workflows stay isolated.

## Release-scope decision

The current verified Kids game set is accepted for the v3 release. Inventory #39 Hiragana Match and #40 Kids Bible Who Am I are retired from the active v3 release scope by explicit user decision. Do not implement them merely to reach the old 100-row historical inventory.

They remain documented as optional future expansion only. Do not mark them implemented or verified. If either is reopened in the future, follow `KIDS_GAMES_EXTENSION_V3.md` and normal rebuild-and-verify discipline.

Current applicable release scope: **98 capabilities**.

- Regression-tested: **97**
- Verified: **1** (#15 Japanese Furigana)
- Implemented: **0**
- Not started in active release scope: **0**
- User-retired legacy rows: **2** (#39, #40)

Active release-scope parity is therefore **98/98 complete**. Regression stability is **97/98** because #15 is still the newest verified product milestone, although its exact v3.71 bookkeeping SHA has already passed the complete suite.

## Existing Kids coverage

The current Games architecture already provides a verified shared Games page and launcher, #38 Kids Memory Match / Memory Meadow, #36 Character Detective / Who Am I, Timeline, Recall and the existing shared game flows. A separate Kids-specific Who Am I duplicate is not required for this release.

Future Kids games must extend the current Games owner rather than create another launcher/runtime. `KIDS_GAMES_EXTENSION_V3.md` defines registration, ownership, cleanup, reward, mobile/accessibility, content-safety and accumulated-regression requirements.

## Current working branch

- Branch: `feature/v3-post-parity-closeout`
- Base: frozen `release/v3.71-japanese-furigana`
- Purpose: record scope closeout and the future Kids-game extension contract, then hand development to the pre-release phase.
- This branch must not be interpreted as production deployment authorization.

## Next executable sequence

1. Reconcile `FEATURE_INVENTORY_V3.md` with the explicit user scope decision: #39/#40 are `Retired from v3 release scope`; applicable parity becomes 98/98.
2. Keep `KIDS_GAMES_EXTENSION_V3.md` as the permanent rule for adding later Kids/Kana games through the existing Games architecture.
3. Begin the **artwork/theme polish phase** previously requested by the user. This phase may improve artwork, icons, colors, visual cohesion and presentation quality, but must not redesign the established interface, navigation model, ownership boundaries or feature architecture.
4. During polish, fix only reproduced defects. Do not add unrelated functionality.
5. After product/artwork changes, run the full accumulated exact-SHA architecture, edge/security, browser/mobile, PWA/offline and relevant accessibility acceptance suite.
6. Freeze the release candidate only at the exact clean SHA that passes the final suite.
7. Production promotion remains a separate explicit step. Do not modify `main`, production v2, production Supabase/data or production Cloudflare without authorization.

## Safety / evidence rule

Do not claim that software is bug-free. The correct statement at this handoff is: frozen v3.71 passed the complete exact-SHA suite and has no known regression blocker in that executed evidence. Any changed SHA must earn its own verification; PASS is never transferred across product changes.
