# A5 firewall triage — #81 Psychometrics bookkeeping failure

Generated: 2026-09-10 21:02 JST
Identity: `BQ-A5-FIREWALL`

## Exact state
- Canonical: `feature/v3-psychometrics` @ `7eb305d0998654aeb3bcdc987f65ebd960b22e20`.
- Dedicated `agent/a1-work/081-psychometrics`: not found.
- Frozen base: `release/v3.53-personality-profile` @ `2c62a63e5bbdedae47834714e65751a57d58b696`.
- v3.54 release: not found.
- Functional candidate: `5d3446916b8aa809f8a419e3cffa88a312c4bbc5`; exact verifier run `34473640903` succeeded through architecture, edge/security and browser/mobile phases.
- Bookkeeping candidate: `7eb305d0998654aeb3bcdc987f65ebd960b22e20`; exact verifier run `34474359203` failed accumulated architecture; later phases skipped.

## Primary evidence / disposition
- **BLOCKER:** no promotion/freeze of `7eb305d0...`; its exact bookkeeping gate is red.
- **BLOCKER:** `FEATURE_INVENTORY_V3.md` at the candidate legitimately advances #81 to `Verified`, but `scripts/validate-v3-personality-profile.mjs` still requires #81 `Not started`. This is a concrete stale future-state assertion and a likely direct cause of the architecture-stage failure. It must be corrected narrowly while preserving #80 privacy/ownership assertions; deletion/bypass/relaxation would be unacceptable.
- **BLOCKER:** treat #81 as HIGH-RISK because `5d344691...` modified an already accumulated validator. Any subsequent correction to the existing #80 validator is independently HIGH-RISK. Current A4 did not issue READY after the exact green and has not reviewed the future corrected bookkeeping candidate.
- **MILESTONE:** retain exact #81 contract `complete assessment; result; persistence; mobile` and the bounded local-private architecture.
- **MILESTONE:** rerun the complete accumulated suite on the exact corrected bookkeeping SHA with explicit checkout/assertion and unchanged prior coverage.
- **MILESTONE:** before HIGH-RISK promotion, require fresh current A3 trust-boundary satisfaction, A4 READY for the exact candidate and A5 promotion recommendation.
- **DEFER:** #82 Avatar Vault and later rows.
- **IGNORE:** stale missing-run premises from A2/A3 and A4's pre-run NOT READY reason; they do not transfer into READY.

## Report freshness
- A2 #81 analyzed `1bd77237...`: stale against canonical.
- A3 #81 analyzed `e4e126b9...`: stale against canonical.
- A4 #81 analyzed `5d344691...` before run `34473640903`: canonical-stale and execution-evidence-stale; no READY decision exists.
- This report becomes stale if canonical/candidate/frozen refs move, the failed gate is superseded, relevant validator semantics change, or fresh A3/A4 reports land.

## Counterfactual
If the current bookkeeping SHA is promoted, a known failed exact accumulated gate is frozen. If the stale #80 validator is simply removed or weakened, prior regression protection is lost. If a corrected existing-validator candidate is promoted without current HIGH-RISK review, the explicit safeguard for regression-harness changes is bypassed.
