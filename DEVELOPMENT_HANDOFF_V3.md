# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after exact-SHA completion of the classified post-release visual-polish program through tranche 16.

For new chat instances, `CONTINUE_PROMPT_V3.md` remains the generic resume prompt. Repository evidence overrides stale chat context.

## Production state — preserve

- Repo: `11ll11l1l1l/BibleQuest`.
- Production `main`: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.
- Frozen rollback/reference: `release/v3-production-20260911-r3` at the same SHA.
- The 2026-09-11 production release objective is complete.
- Applicable v3 release scope remains **98/98 complete**.
- Historical #39 Hiragana Match and #40 Kids Bible Who Am I remain retired from the release scope. Do not revive them as backlog by default.
- Production Supabase/data was not changed by post-release visual work.

Do not modify or repoint production merely because later post-release visual branches exist. A future production promotion requires a separately selected milestone, exact-SHA accumulated verification, promotion, Cloudflare propagation confirmation, and live production smoke evidence.

## Current exact-green post-release product checkpoint

- Branch: `postrelease/v3-visual-shell-tranche16`.
- Exact verified product SHA: `406c34dcdf904b7483bf4381be774a908738e60c`.
- Parent exact-green visual product: tranche 15 SHA `62cb86cd48bae683d0be37a2a729127156a0093a`.
- Verifier: `verify/v3-visual-shell-406c34d`.
- Workflow run `34585018541`, job `103217107423`: **success**.

The verifier checked out detached exact product SHA `406c34dcdf904b7483bf4381be774a908738e60c` and passed:

- exact-SHA and exact three-file diff hygiene;
- Cloudflare deployment gate with 267 JavaScript syntax checks and production-entry/runtime ownership guards;
- 16 accumulated visual static contracts;
- 53 accumulated v3 architecture validators;
- 86 edge/security/static regressions;
- 68 Playwright browser/mobile regressions plus Kids Memory browser acceptance;
- dedicated 1280x900 and 390x844 global-shell visual containment checks;
- strong-contrast checks confirming decorative shell shadows are removed while shell geometry and horizontal containment remain intact.

Exact tranche-16 product delta from tranche 15:

1. `index.html` — one shell visual stylesheet include.
2. `src/ui/shell-visual-polish.css` — replacement-level page/topbar/brand/chip/bottom-nav presentation.
3. `tests/v3-shell-visual-polish-static.mjs` — guard preventing layout, navigation, responsive, focus, typography-geometry, motion, interaction, token-owner, or generic-feature-panel takeover.

No JavaScript, route, feature owner, storage, backend, service worker, data, or Supabase file changed in tranche 16.

## Tranche-16 verification history

Do not mistake the first candidate for the verified checkpoint.

- Rejected candidate: `b0f2620ef0e0792db0c50a533a438837bbf3b297`.
- Run `34584870801` passed exact-SHA hygiene and the deployment gate, then failed an existing Account visual load-order contract because the shell stylesheet had been inserted between `app.css` and `account-visual-polish.css`.
- Root cause was corrected by preserving Account directly after `app.css` and loading shell polish immediately afterward.
- The changed product SHA `406c34dcdf904b7483bf4381be774a908738e60c` then earned a fresh complete PASS in run `34585018541`; no PASS was transferred from the failed SHA.

## Visual/artwork phase status

The replacement-level visual phase defined by `VISUAL_REPLACEMENT_CONTRACT_V3.md` and `VISUAL_SURFACE_INVENTORY_V3.md` is complete through tranche 16.

Completed cumulative presentation families include Home/hero, global shell, Games, Reader, Bible World, Progress/Daily Journey, PWA icons, Transform, Study/Deep Questions/Story/Wisdom, Account/Tutorial, Context/Japanese/source presentation, Notes, Couples, Community, Media/Recordings, Adaptive/Open Review, and Accessibility.

`VISUAL_POLISH_PROGRESS_V3.md` contains the cumulative evidence ledger. `VISUAL_SURFACE_INVENTORY_V3.md` now records that the classified replacement-level A/B inventory has been covered.

## Evidence-only branch head

After the exact product SHA passed, documentation-only bookkeeping was added to the tranche-16 branch. Therefore the live branch HEAD may be later than `406c34dcdf904b7483bf4381be774a908738e60c`.

Do not call a later documentation commit the verified product SHA. Recover the live branch ref first, then distinguish:

- exact verified product: `406c34dcdf904b7483bf4381be774a908738e60c`;
- later documentation-only HEAD: evidence/bookkeeping only unless product files changed and were reverified.

## Current development boundary

The visual inventory's remaining areas are Class D architecture/behavior owners: router/bootstrap/core services, PWA/offline/service-worker behavior, Supabase/API/storage/security, and equivalent behavior-coupled responsibilities. They are not unfinished visual polish.

Do **not** continue by making speculative Class-D changes, broad refactors, navigation redesigns, or new features simply to keep development moving.

## What the next development chat should do

1. Recover live refs for `main`, `release/v3-production-20260911-r3`, `postrelease/v3-visual-shell-tranche16`, and any newer post-release branches before writing.
2. Preserve production and the exact-green visual product checkpoint.
3. Read `DEVELOPMENT_STATUS_V3.md`, `VISUAL_POLISH_PROGRESS_V3.md`, `VISUAL_SURFACE_INVENTORY_V3.md`, and `VISUAL_REPLACEMENT_CONTRACT_V3.md`.
4. Check for concurrent branch ownership before creating a new product branch.
5. Begin new product work only when there is a concrete post-release objective; give it an isolated branch, explicit architecture owner, acceptance criteria, regression protection, and exact-SHA accumulated verification.
6. Keep retired Kids/Kana items retired unless explicitly reopened as new scope under `KIDS_GAMES_EXTENSION_V3.md`.
7. Do not modify production Supabase/data without a reproduced defect that requires it.

## Non-negotiable evidence rules

- Rebuild-and-verify; one owner per responsibility.
- Never transfer PASS across changed product SHAs.
- Never claim an unexecuted test.
- Documentation-only commits are not automatically product candidates.
- Preserve the frozen r3 production rollback point.
- A later GitHub merge/promotion is not proof of Cloudflare propagation.
- Do not call the app bug-free.
