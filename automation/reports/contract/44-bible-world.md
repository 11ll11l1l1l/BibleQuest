# A2 contract audit — #44 Bible World

Agent: BQ-A2-CONTRACT
Audit date: 2026-09-11 JST

## Exact state

- Canonical: `feature/v3-bible-world` @ `3dbca142f7a0b4789e398804dee1b2200f014981`.
- Frozen base: `release/v3.67-live-rooms` @ `d7b9385ddc814fe0b6587e92626bf6c65aefe5b5`.
- Canonical is four commits ahead of frozen base.
- Dedicated `agent/a1-work/044-*` candidate: not found.
- Authoritative inventory at canonical: #43 Live Rooms = Verified; #44 Bible World = Not started; #45 Bible World artwork = Not started. Inventory #44 requires only `render path; unlock thresholds; route into content`; #45 separately owns `correct assets; responsive layout; missing-asset fallback`.

## Primary evidence inspected before TRIAGE

- `FEATURE_INVENTORY_V3.md` at canonical.
- Frozen/canonical Git refs and frozen→canonical comparison.
- Canonical commit lineage, including `1a09178c...` (projection owner), `f99faf40...` (presentation), `75f1bb95...` (Learn exposure), and `3dbca142...` (route composition).
- `docs/V3_BIBLE_WORLD_CONTRACT.md` at canonical.
- Current permanent `.github/workflows/v3-regression.yml`.
- GitHub Actions runs scoped to `feature/v3-bible-world`.
- Repository searches for retained Journey Path/Bible World source strings.

## FACT

1. Canonical now contains a clean Bible World implementation lineage. The active contract declares a nine-region read-only projection over Adaptive Learning evidence, a 60% explored/next-marker threshold, always-accessible Scripture, Reader handoff, and Open Review handoff. It explicitly keeps persistence, XP/streak/scoring, Bible data, and review algorithms with existing owners.
2. The implementation contract expressly separates #45 artwork from #44; therefore special retained artwork is not required to satisfy #44, and #44 must remain usable without it.
3. The inventory is narrower than the newly added branch-local contract. It proves that #44 needs a rendered path, unlock-threshold behavior, and routing into content. It does not itself prove the exact nine-region taxonomy, the 60% number, the Genesis split formulas, or the chosen anchor passages.
4. The branch-local `docs/V3_BIBLE_WORLD_CONTRACT.md` was introduced as part of the same four-commit implementation lineage. It is therefore useful as the implementation's declared contract, but it is not independent historical evidence for legacy parity by itself.
5. I could not independently locate a retained/v2 source artifact through repository search that proves the branch-local contract's exact 60% threshold, nine-region mapping, Genesis split formulas, or anchor passages. This provenance is presently missing from the evidence I could verify.
6. There are zero Actions runs for `feature/v3-bible-world`; no exact-SHA functional or accumulated-suite PASS exists for `3dbca142...`.
7. The permanent workflow at `3dbca142...` does **not** invoke `scripts/validate-v3-bible-world.mjs`, `tests/v3-bible-world-edge.mjs`, or `tests/v3-bible-world-smoke.mjs`. This is notable because the new validator itself expects those entries to be present in the workflow. Consequently the currently committed branch cannot yet satisfy its own declared accumulated-workflow contract.
8. No dedicated `agent/a1-work/044-*` candidate was found.

## Current owner boundary supported by primary code/contract

- `src/app/adaptive-learning.js`: existing mastery/evidence owner.
- `src/app/bible-world.js`: read-only Bible World projection/orchestration owner only.
- `src/app/reader.js`: Reader state/navigation owner; Bible World may hand off a selected passage but must not duplicate Reader ownership.
- `src/app/open-review.js`: Smart/Open Review owner; Bible World routes to it rather than implementing a second review algorithm.
- `src/features/bible-world/index.js`: presentation and ephemeral selected-region UI state.

## INFERENCE / RECOMMENDATION

- Treat the narrow authoritative #44 acceptance boundary as: render the Bible World path; apply the recovered threshold semantics once provenance is demonstrated; keep Scripture/content reachable rather than permanently locked; route into existing content owners; do not absorb #45 artwork.
- Before parity is promoted, attach primary retained/v2 provenance for the exact historical threshold/mapping details or narrow the implementation contract to what can actually be proven. Do not treat the newly authored branch-local contract as self-authenticating legacy evidence.
- #44 verification should explicitly cover threshold boundaries, always-accessible regions/content, deterministic next-marker behavior, Reader/Open Review handoffs, no duplicate persistence/scoring owners, mobile layout, and teardown/re-entry. The permanent accumulated workflow must actually invoke the #44 validator/edge/smoke coverage before any exact PASS is meaningful.
- #45 is the only immediate dependency-likely follow-on identified here. Its contract should stay limited to retained artwork/assets, responsive presentation, and missing-asset fallback; it must not reopen #44 progression/ownership semantics.

## Missing evidence

- Independently traceable retained/v2 source proving the exact 60% threshold and detailed region/mapping/anchor semantics asserted by the new branch-local contract.
- Authorized #44 quarantine candidate lineage, if required by current control policy for the eventual implementation/promotion path.
- Permanent #44 workflow entries.
- Exact-SHA #44 workflow run evidence.

## TRIAGE read afterward

`automation/TRIAGE.md` is materially repository-state stale: it still identifies #43 as active on v3.66-era state and says #43 product has not begun. Primary repository evidence now shows frozen v3.67 and an active #44 implementation branch four commits ahead at `3dbca142...`. TRIAGE's older conclusions are therefore not used as #44 contract evidence.

## Staleness conditions

This report becomes SHA-stale immediately if `feature/v3-bible-world`, `release/v3.67-live-rooms`, or an `agent/a1-work/044-*` candidate moves/appears. It also requires revision if retained/v2 provenance for the detailed Bible World semantics is located, the authoritative inventory changes, #44 workflow entries are added, or exact run evidence appears.
