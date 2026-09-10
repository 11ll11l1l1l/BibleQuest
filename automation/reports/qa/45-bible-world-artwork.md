# A4 QA / Regression — #45 Bible World Artwork

STATE: ACCEPTANCE DEFINED / NO PRODUCT CANDIDATE YET
ROLE: BQ-A4-QA
DATE: 2026-09-11 JST

## STATE / PROVENANCE

FACT — live canonical milestone branch: `feature/v3-bible-world-artwork` @ `e8753e8694eb4e7ab690829b1a497dae92776d64`.

FACT — no `agent/a1-work/045-*` branch was found during this inspection. The canonical #45 branch is exactly equal to the latest frozen release and therefore has no #45 product delta yet.

FACT — latest frozen release: `release/v3.68-bible-world` @ `e8753e8694eb4e7ab690829b1a497dae92776d64`.

FACT — immediately preceding frozen base for #44 was `release/v3.67-live-rooms` @ `d7b9385ddc814fe0b6587e92626bf6c65aefe5b5`.

FACT — `automation/CURRENT.md` is stale (#75/v3.48 era) and is not used as live product evidence.

## PRIMARY EVIDENCE INSPECTED

- Exact branch/release refs for `feature/v3-bible-world`, `feature/v3-bible-world-artwork`, and `release/v3.68-bible-world`.
- `DEVELOPMENT_HANDOFF_V3.md` at frozen SHA `e8753e8694eb4e7ab690829b1a497dae92776d64`.
- `.github/workflows/v3-regression.yml` from bookkeeping verifier commit `cde23a3ac2828032a1fe355485d3fee8b09cd751`, which explicitly checks out/asserts frozen product SHA `e8753e8694eb4e7ab690829b1a497dae92776d64`.
- GitHub Actions run `34543395077` and job `103090737796`.
- `tests/v3-bible-world-edge.mjs` and `tests/v3-bible-world-smoke.mjs` at frozen SHA `e8753e8694eb4e7ab690829b1a497dae92776d64`.
- Control-plane role/guardrail files before inspecting TRIAGE.
- `automation/TRIAGE.md` only after provisional QA findings were formed.

## #44 FROZEN BASE QA AUDIT

FACT — bookkeeping verification run `34543395077` completed with conclusion `success`.

FACT — the isolated verification workflow explicitly checked out and asserted exact product SHA `e8753e8694eb4e7ab690829b1a497dae92776d64`; the verifier's own trigger SHA `cde23a3ac2828032a1fe355485d3fee8b09cd751` is not treated as the product candidate.

FACT — all required phases executed and passed: exact-SHA assertion, accumulated architecture validators, accumulated edge regressions, Chromium/Playwright setup, local server startup, and accumulated browser/mobile regressions. No phase was skipped in the successful job.

FACT — the executed accumulated workflow includes #44's `scripts/validate-v3-bible-world.mjs`, `tests/v3-bible-world-edge.mjs`, and `tests/v3-bible-world-smoke.mjs` while retaining the observed prior accumulated architecture, edge/security and browser/mobile entries. No unexplained removal, bypass or timeout narrowing was observed in that exact verifier.

FACT — #44 executable coverage proves: nine accessible regions, 60% threshold behavior, Genesis split projections, next-marker progression, Reader handoff, Open Review handoff, invalid-region rejection, required owner dependencies, 390x844 rendering, no disabled Scripture regions, mobile overflow protection, >=44px touch targets, and zero captured console/page errors.

A4 DISPOSITION FOR FROZEN #44: PRODUCT/BOOKKEEPING QA PASS at exact `e8753e8694eb4e7ab690829b1a497dae92776d64` using run `34543395077`. No PASS is transferred to a different SHA.

## #45 AUTHORITATIVE ACCEPTANCE

FACT — durable handoff records inventory #45 acceptance as: `correct assets; responsive layout; missing-asset fallback`.

FACT — retained artwork pair identified by the handoff is already present in the frozen tree: `assets/world-locked.webp` and `assets/world-revealed.webp`.

FACT — retained presentation behavior is a 16:9 layered reveal, with the revealed layer clipped according to rounded average mastery across Genesis, Exodus, History, Wisdom, Prophets, Gospels, Acts and Letters. Scripture remains accessible while the visual reveal changes with learning evidence.

RECOMMENDATION — #45 permanent QA should prove, at minimum:
1. the exact retained locked/revealed asset paths are used;
2. responsive layered artwork preserves usable 16:9 presentation without viewport overflow at representative mobile widths including 320/360/390/412/430 px;
3. reveal clipping is deterministic from the existing Adaptive mastery projection and does not create a second mastery owner;
4. 0%, partial and 100% reveal states render correctly;
5. failed/missing image loads degrade to a usable Bible World surface and do not block region selection, Reader handoff or Open Review handoff;
6. no direct localStorage/global injector/MutationObserver/`window.BQMedia` compatibility owner is introduced;
7. keyboard/touch navigation and >=44px actionable targets remain intact where #45 adds controls;
8. no console/page errors are introduced in normal and missing-asset scenarios;
9. existing #44 region/routing/accessibility assertions remain green;
10. accumulated architecture, edge/security and browser/mobile suites continue to invoke all prior coverage plus the new #45 validator/edge/browser tests.

INFERENCE — absent any schema/auth/RLS/server/dependency/global-shell or existing-test/workflow modification, #45 appears suitable for NORMAL-RISK treatment because it should remain within the existing Bible World projection/presentation boundary. If implementation touches a HIGH-RISK category or modifies an existing accumulated test/workflow beyond adding #45 invocations, risk must be reclassified before promotion.

## FAILURES

None observed for frozen #44 exact run `34543395077`.

## MISSING EVIDENCE FOR #45

- No #45 work candidate exists yet.
- No #45 product delta exists on canonical `feature/v3-bible-world-artwork` yet.
- No #45-specific validator, edge regression, browser/mobile regression, or exact functional run can therefore be audited yet.
- No exact-candidate functional/bookkeeping PASS exists for #45.

## TRIAGE COMPARISON

FACT — TRIAGE is materially stale for live milestone state. It still identifies #43 Live Rooms at v3.66-era state, while primary evidence now shows #44 frozen as v3.68 and #45 canonical branch created at the same exact SHA.

FACT — stale TRIAGE conclusions are not used as proof for this report.

## READY / NOT READY

#44 frozen release: QA PASS at exact `e8753e8694eb4e7ab690829b1a497dae92776d64` / run `34543395077`.

#45 active milestone: NOT READY for QA promotion because there is no product candidate or executable #45 evidence yet. Acceptance is defined above; audit the exact `agent/a1-work/045-*` SHA first once one exists.

## STALENESS CONDITIONS

This report's #45 state becomes stale immediately if `feature/v3-bible-world-artwork` moves, an `agent/a1-work/045-*` candidate appears or moves, the frozen base changes, #45 modifies any existing accumulated test/workflow, or new exact run evidence is produced. The #44 PASS statement is bound only to frozen SHA `e8753e8694eb4e7ab690829b1a497dae92776d64` and run `34543395077`.