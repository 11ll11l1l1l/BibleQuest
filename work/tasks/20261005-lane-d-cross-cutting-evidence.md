# Lane D — P4 cross-cutting regression evidence

Date: 2026-10-05 JST
Starting SHA: `4a6a2078412ec891dda51294d105133f3313e168`
Target: `v7/development`
Owner: persistent V7 Lane D

## Outcome

Bind the successful P4 cross-cutting regression checks to a durable Lane D evidence record while preserving the distinction between tested source-tree equivalence and Phase-5 exact-SHA release certification.

## Owned surface

- `docs/v7/P4_D_CROSS_CUTTING_EVIDENCE.md`
- this task record

## Evidence used

- V7 Build PWA Performance Gate run `37308126388`: success on source SHA `7c0e7025a1a4c05c738a0f94f026b84b586eae7a`.
- V6 PR Serialization Guard run `37308126842`: success on the same source SHA.
- tested source tree `30fcc9dda4b7b6d216681b41da99b4da7f50b0c3` equals integrated merge tree at `4a6a2078412ec891dda51294d105133f3313e168`.
- focused V7 cross-cutting/localization/content tests already present on the integrated tree.

## Excluded

- no release-candidate freeze or promotion;
- no PWA/service-worker/workflow edits;
- no schema/RLS/router edits;
- no content approval, publication or inferred rights decision;
- no Lane A/B/C implementation;
- no V8 scope.

## Result boundary

P4-D machine-solvable cross-cutting regression may be recorded PASS for the tested/integrated source tree. Representative content remains OPEN at the genuine editorial/rights boundary and P5 must use the eventual exact release-candidate SHA.
