# P4-D — Cross-cutting regression evidence

Integrated starting SHA: `4a6a2078412ec891dda51294d105133f3313e168`.

This record binds the V7 Lane D Phase-4 cross-cutting acceptance surface to durable repository and CI evidence. It is **Phase 4 evidence only**. It does not freeze, certify or promote a Phase-5 release candidate.

## Source identity

The representative-content readiness tranche was tested at source commit:

- tested commit: `7c0e7025a1a4c05c738a0f94f026b84b586eae7a`
- tested Git tree: `30fcc9dda4b7b6d216681b41da99b4da7f50b0c3`
- integrated merge commit: `4a6a2078412ec891dda51294d105133f3313e168`
- integrated Git tree: `30fcc9dda4b7b6d216681b41da99b4da7f50b0c3`

The tested source tree and integrated source tree are identical. The commit SHAs differ because GitHub created a merge commit. This equivalence is suitable for this P4 regression record only; P5 still requires one exact release-candidate SHA and its required evidence.

## Automated cross-cutting gate

GitHub Actions run `37308126388`, workflow **V7 Build PWA Performance Gate**, completed successfully on `7c0e7025a1a4c05c738a0f94f026b84b586eae7a` on 2026-10-05 JST.

Successful checks included:

- candidate identity validation and exact checkout proof;
- deterministic dependency install from the committed lockfile;
- client-boundary lint and formatting policy;
- typecheck;
- V7 unit and contract tests;
- exact V7 artifact build;
- exact-SHA identity and performance budgets;
- built-artifact Chromium parity;
- V7 ONE 2 ONE narrow/deep-link smoke;
- built-artifact PWA acceptance; and
- built-artifact automated accessibility.

The V6 PR Serialization Guard run `37308126842` also completed successfully for the same source commit.

## Lane D focused regression coverage

`tests/v7/cross-cutting-regression.test.mjs` protects:

- V7 Library and ONE 2 ONE routes through the inherited shell navigation bridge;
- inherited V6 routes used by the changed shell (`home`, `reader`, `assignments`, `calendar`, `learn`, `grow`);
- query/deep-link encoding and history-event behavior; and
- registered V7 UI-label resolution, missing-translation inventory and approved English fallback behavior across supported locales.

Lane D's content/provenance/localization hardening is additionally covered by the V7 tests for:

- content contract validation;
- Library locale boundaries;
- Library rights boundaries and integrity;
- Library source-provenance boundaries;
- Library taxonomy boundaries;
- localization; and
- representative-content readiness.

## P4-D result

**Machine-solvable cross-cutting regression: PASS for the tested/integrated source tree.**

No unresolved Lane-D-owned runtime regression was identified by the covered shell/navigation, build, performance, PWA/offline, accessibility, localization or representative inherited-flow checks.

The representative-content acceptance boundary is intentionally separate and remains OPEN as recorded in `P4_D_REPRESENTATIVE_CONTENT_READINESS.md`:

- representative Books: rights metadata verified, but editorial review/publish approval still pending;
- representative Devotionals: rights metadata verified, but editorial review/publish approval still pending;
- representative Past Teaching: rights unresolved plus editorial review/publish approval still pending.

Those are genuine content-review/rights decisions, not machine defects, and must not be converted to PASS by an automated lane.

## Handoff to Phase 5

When the integration/release owner freezes a V7 release candidate, P5-D must regenerate or revalidate content/provenance/localization evidence against that exact candidate SHA. This P4 record may be reused only where the underlying inputs remain unchanged and the governing release rule permits reuse.
