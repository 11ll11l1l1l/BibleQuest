# A2 Contract Investigation — #38 Kids Memory Match / Memory Meadow

Agent: `BQ-A2-CONTRACT`
Observed: 2026-09-11 JST
Scope: contract/inventory/owner evidence only; product implementation remains read-only.

## Exact state observed

**FACT**

- Canonical milestone branch: `feature/v3-kids-memory-match` @ `918762b11d3487d07880449bb37264da1e33ace3`.
- Dedicated A1 quarantine/candidate matching `agent/a1-work/038*`: not found.
- Latest frozen v3 release independently found: `release/v3.69-bible-world-artwork` @ `368b4e905c94ede38e733585d151891c7bdca96b`.
- No `release/v3.70-kids-memory-match` ref existed at the final state check.
- The #38 canonical lineage is descended from frozen v3.69; an earlier compare from `368b4e905c94ede38e733585d151891c7bdca96b` to the then-current #38 lineage showed that frozen SHA as the merge base and the #38 branch ahead of it.
- Exact product-SHA verifier run `34546962603` was still `in_progress` at the final evidence check. Its verifier head is `64418e97cd5852258cb22222cc4d4d34a45aa8c2`, whose parent is exact product SHA `918762b11d3487d07880449bb37264da1e33ace3`; the verifier workflow explicitly checks out that product SHA and asserts it before running.
- Direct Actions queries for canonical branch / exact product SHA returned zero completed branch-native runs. Therefore no PASS is recorded by this report for `918762b11d3487d07880449bb37264da1e33ace3`.

**Staleness condition:** this exact-state section is stale immediately if the canonical ref, candidate ref, latest frozen release, permanent workflow/test set, or run `34546962603` status changes.

## Authoritative milestone requirement

**FACT**

At the canonical SHA, `FEATURE_INVENTORY_V3.md` still defines #38 as:

- old-version capability: Kids Memory Match;
- old version: Yes;
- v2 availability: Clean;
- v3 status: Not started;
- required verification: recover the exact old-version Memory Match contract and Games-owner boundary before implementation, then run focused plus accumulated browser/mobile verification.

The durable handoff from the frozen lineage likewise says #38 must recover retained behavior, data, timing, scoring/reward, lifecycle, and mobile contract before implementation and should remain under the existing Games owner if dependency-safe.

**FACT:** live product code already exists on `feature/v3-kids-memory-match`, so implementation has overtaken the still-recorded recovery prerequisite and the inventory/handoff are repository-state stale.

## Independent retained/v2 evidence inspection

**FACT**

Primary retained sources inspected independently before TRIAGE included `classic.html`, `app.js`, `extra-games.js`, `bq2-classic-bridge.js`, the frozen v3.69 tree, and current `main` (`6d42c5445a582b55c81e8d925e6d2bc1b92659b9`) tree evidence.

- `classic.html` confirms the retained complete-mode application and its legacy script composition.
- `extra-games.js` contains the retained Who Said It? / What Happens Next? games, not Kids Memory Match.
- The inspected retained `app.js` evidence did not expose a Memory Match contract.
- `bq2-classic-bridge.js` is only a compatibility return-link bridge and contains no Memory Match behavior.
- No independently traceable retained/v2 source was located in this run proving the detailed Memory Meadow constants now present on the #38 branch.

**Missing evidence:** an exact retained/v2 file, historical commit, artifact, or explicit authoritative product decision that independently establishes the detailed #38 behavior. In particular, this run did not independently prove from old-version source:

- the `<420px` = 6 pairs / 3 columns and `>=420px` = 8 pairs / 4 columns breakpoint;
- 350 ms correct-match and 650 ms mismatch delays;
- the exact eight-animal icon set;
- the move-based star curve and `coins = stars * 4` rule;
- zero-XP completion semantics and stars/coins as the retained reward currencies.

The commit `6157443a9fefd967ccf40717ae660fd0d88906bf` is titled `feat(v3): recover Kids Memory Match contract`, but its primary diff *introduces* `src/features/games/memory.js` with those values. That implementation-lineage commit is not independent historical evidence for the claim that the values are old-version parity.

**INFERENCE:** the detailed constants currently function as a proposed/reconstructed contract, not yet as independently proven old-version parity facts.

**RECOMMENDATION:** before labeling those values recovered parity, attach traceable retained/v2 provenance. If the historical source is unavailable and the values are intentionally adopted as a new product decision, record that decision explicitly rather than describing it as recovered old-version behavior.

## Current owner boundary

**FACT**

At exact canonical SHA `918762b11d3487d07880449bb37264da1e33ace3`:

- `src/app/games.js` remains the Games launcher/service owner and imports `createKidsMemoryGame`.
- The Games owner injects the existing Progress owner and shared Games round-identity function into the Memory Meadow child lifecycle.
- Memory Meadow is exposed as a child of the Games service rather than establishing a second launcher.
- Current architecture assertions require Memory Meadow completion to flow through Progress, require zero XP in that event, prohibit child-owned `localStorage` / `sessionStorage`, keep stars/coins under Progress, and keep delayed pair-resolution timers under the mounted Games UI for cleanup.
- The #38 lineage also changes the existing Progress surface to add stars/coins reward balances.

**INFERENCE:** the structural ownership direction is consistent with the authoritative requirement to preserve the existing Games owner and avoid a second persistence/launcher owner. However, reuse of Progress for stars/coins does not by itself prove that the reward currencies/formula match the retained product.

**RECOMMENDATION:** preserve the current one-owner shape—Games for lifecycle/round identity, Progress for reward persistence, mounted Games UI for timer cleanup—and do not create another game launcher, persistence key owner, XP owner, or timer owner merely to emulate legacy code.

## Behavior currently encoded by implementation/tests

**FACT — current v3 behavior, not independently certified old-version parity by this report**

The current lineage encodes:

- mode identity `kids-memory-match`, title `Memory Meadow`, age 3;
- six pairs / three columns below 420 px and eight pairs / four columns from 420 px upward;
- pair resolution delays of 350 ms for matches and 650 ms for mismatches;
- a child lifecycle of `start`, `flip`, `resolve`, `replay`, `leave`, `getState`;
- answer locking while a pair awaits resolution;
- completion rewards through Progress with `xp: 0`;
- stars computed from move count with a 2–5 clamp and coins equal to four times stars;
- responsive rendering and reduced-motion handling;
- browser acceptance across 320, 360, 390, 412, 430, and 480 px, including card count/columns, at-least-44px touch target, reveal behavior, horizontal-overflow check, and browser-error check.

These are suitable exact acceptance targets *if* their product-contract provenance is established or explicitly adopted.

## Permanent workflow and exact execution evidence

**FACT**

The permanent `.github/workflows/v3-regression.yml` at exact canonical SHA remains `workflow_dispatch`-only and invokes:

- `scripts/validate-v3-kids-memory.mjs` in accumulated architecture validators;
- the #38 service/architecture/UI/Progress/round-ID/exit/reward/API/invalid-input/immutability/no-XP/width/delay regressions in the accumulated edge phase;
- `tests/v3-kids-memory-browser.mjs` in accumulated browser/mobile regressions.

The observed workflow retains the prior accumulated lists around those additions.

**FACT:** current canonical commit `918762b11d3487d07880449bb37264da1e33ace3` removes `tests/v3-kids-memory-lazy-progress-capability.mjs`, with the commit message stating that accumulated moderation regression should cover constructor compatibility.

**Missing evidence:** this A2 run did not establish assertion-for-assertion equivalence between the deleted dedicated test and an existing accumulated moderation test. A commit message is not proof of retained coverage.

**RECOMMENDATION:** A4/A5 should independently verify that this deletion does not weaken accumulated regression coverage. If the removed behavior is materially required and no remaining executable test proves it, coverage should be considered missing rather than assumed equivalent.

**FACT:** run `34546962603` is an isolated one-shot verifier that explicitly checks out/asserts exact product SHA `918762b11d3487d07880449bb37264da1e33ace3`, but it was still running when this report was written. No PASS is transferred from any earlier SHA.

## Inventory/handoff and TRIAGE freshness

**FACT**

The live #38 branch's inventory still says #38 is `Not started`, and its durable handoff still describes the post-#45 state and the need to start #38 only after v3.69. Those documents are stale relative to the product branch now containing #38 implementation.

`automation/TRIAGE.md` was read only after the provisional findings above were formed. It is also repository-state stale for active milestone identification: it still describes #45 at `368b4e905c94ede38e733585d151891c7bdca96b` as active and defers #15/#38/#40. Its #93/#94 blocker conclusions are firewall/governance judgments owned by A5; they were not used as primary evidence for this A2 contract finding.

## A2 disposition

**FACT:** #38 now has a real implementation lineage under the existing Games/Progress ownership model and a substantial permanent regression surface, but the authoritative pre-implementation contract-recovery prerequisite is not independently evidenced for several detailed behavioral constants, and exact full-suite execution at current SHA was not yet complete at report time.

**RECOMMENDATION:** do not call the detailed 420 px breakpoint, 350/650 ms timings, icon set, reward curve/currencies, or zero-XP rule “recovered parity” until exact retained/v2 provenance or an explicit new-product decision is attached. Preserve the current owner boundary, obtain exact-green evidence for the unchanged canonical SHA, and have QA verify the dedicated-test deletion did not weaken accumulated coverage.
