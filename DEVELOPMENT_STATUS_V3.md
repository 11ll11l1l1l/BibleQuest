# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after completion and exact-SHA verification of the classified post-release visual-polish program through tranche 16.

`FEATURE_INVENTORY_V3.md` remains the release-parity ledger. `KIDS_GAMES_EXTENSION_V3.md` governs any future Kids-game expansion. `VISUAL_REPLACEMENT_CONTRACT_V3.md`, `VISUAL_SURFACE_INVENTORY_V3.md`, and `VISUAL_POLISH_PROGRESS_V3.md` govern and record the completed replacement-level visual program.

## Production baseline — unchanged

- Production `main`: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.
- Frozen production release: `release/v3-production-20260911-r3` at the same SHA.
- Production release objective: complete.
- Applicable release scope: **98/98 complete**.
- Historical #39 Hiragana Match and #40 Kids Bible Who Am I remain retired from this release scope and are not release debt.
- Production Supabase/data was not changed by the release or by post-release visual development.
- Do not describe automated production verification as physical-device acceptance.

The production release and post-release visual line are intentionally separate. No visual tranche has been promoted to `main` in this development cycle.

## Current exact-green post-release product

- Development branch: `postrelease/v3-visual-shell-tranche16`.
- Exact verified product SHA: `406c34dcdf904b7483bf4381be774a908738e60c`.
- Parent exact-green product SHA: tranche 15 at `62cb86cd48bae683d0be37a2a729127156a0093a`.
- Exact verifier branch: `verify/v3-visual-shell-406c34d`.
- Workflow run: `34585018541`.
- Job: `103217107423`.
- Conclusion: **success**.

The verifier checked out detached exact product SHA `406c34dcdf904b7483bf4381be774a908738e60c` and executed successfully:

- exact-SHA and exact three-file diff hygiene;
- Cloudflare deployment gate, including syntax checks over 267 JavaScript files and production-entry/runtime ownership guards;
- 16 accumulated visual static contracts;
- 53 accumulated v3 architecture validators;
- 86 edge/security/static regressions;
- 68 Playwright browser/mobile regressions plus Kids Memory browser acceptance;
- dedicated global-shell computed-style, strong-contrast, navigation-contract, and horizontal-containment checks at 1280x900 and 390x844.

The exact tranche-16 product delta from tranche 15 consists only of:

- `index.html`: one stylesheet include;
- `src/ui/shell-visual-polish.css`: shell presentation overlay;
- `tests/v3-shell-visual-polish-static.mjs`: shell visual-boundary regression contract.

No JavaScript, feature owner, route, storage, backend, service worker, data, or Supabase file changed in tranche 16.

## Tranche-16 failure/root-cause record

The first shell candidate `b0f2620ef0e0792db0c50a533a438837bbf3b297` was not accepted. Run `34584870801` passed exact-SHA hygiene and the Cloudflare gate but failed the accumulated visual static-contract step because the new shell stylesheet had been inserted between `app.css` and `account-visual-polish.css`, violating the established Account visual load-order contract.

The root cause was corrected by preserving Account directly after `app.css` and loading the shell overlay immediately afterward. Because the product SHA changed, the partial PASS from the failed candidate was discarded and the complete accumulated verifier was rerun from the beginning on `406c34dcdf904b7483bf4381be774a908738e60c`.

## Completed visual program

The cumulative visual line now covers the replacement-level A/B surfaces defined by the visual inventory, including:

- Home/hero;
- global shell/theme;
- Games and Memory Meadow decorative chrome;
- Reader;
- Bible World;
- Progress/Daily Journey;
- PWA/app icons within the existing manifest/install contract;
- Transform;
- Study, Deep Questions, Story Journey, Wisdom Situations;
- Account/Tutorial;
- Context/Japanese/source presentation;
- Private/Cloud Notes;
- Couples;
- Community Bridge;
- Media/Recordings;
- Adaptive Learning/Open Review;
- Accessibility presentation.

`VISUAL_POLISH_PROGRESS_V3.md` is the detailed exact-SHA evidence ledger.

## Post-release boundary now reached

The classified replacement-level visual phase is complete. The remaining inventory areas are Class D architecture/behavior owners, including router/bootstrap/core services, PWA/offline/service-worker behavior, and Supabase/API/storage/security. They are not unfinished visual polish and must not be modified merely to continue development.

The next product phase must therefore be a separately scoped post-release milestone with a concrete objective, isolated branch, defined owner boundaries, acceptance criteria, focused regression protection, and exact-SHA accumulated verification.

## Standing rules

- Preserve `main` and `release/v3-production-20260911-r3` until a later promotion is explicitly part of the selected milestone.
- Preserve exact-green visual product SHA `406c34dcdf904b7483bf4381be774a908738e60c` as the current post-release product checkpoint.
- Documentation-only commits after that SHA do not become verified product SHAs.
- Never transfer PASS across changed product SHAs.
- Never claim unexecuted tests.
- Reproduce defects before product fixes.
- Do not revive retired Kids/Kana scope without a new explicit product decision.
- Do not modify production Supabase/data without a reproduced defect requiring it.
- A GitHub promotion is not proof of Cloudflare propagation; any future production release needs separate deployed-identity and browser verification.

## Next milestone gate

Do not invent another visual tranche or enter Class-D owners by default. The next executable product milestone is the next explicitly selected post-release product objective. Once selected, branch from the appropriate exact-green checkpoint and define the acceptance contract before implementation.
