# P5-A — Browser, mobile and accessibility evidence preparation

Prepared against development `43bef5ff1f585c7093ccd51bea40bbb3db8757cc`. This is an evidence handoff, not a candidate freeze or release PASS. [Current status](../../V7_ACTIVE_STATUS.md) remains the progress authority; the [acceptance contract](V7_ACCEPTANCE_AND_CONTENT_CONTRACT.md) defines evidence classes.

## Existing evidence and its limits

[Run 37357088648](https://github.com/11ll11l1l1l/BibleQuest/actions/runs/37357088648) completed successfully at 2026-10-05T18:37:53Z for source `e4b07e670a82d6babc857ac9d0848d24f79ee27f`. Its source tree equals the integrated #1248 merge tree; the preparation baseline includes the subsequent status-only update. The run used the pinned workflow toolchain and localhost built preview, with signed-out browser actors and no congregation. It supports development verification; it does not certify the preparation baseline as an exact release SHA.

| Existing check | Observed scope | Remaining limit |
|---|---|---|
| [Library browser](../../tests/v7/library-built-artifact-browser.mjs) | Chromium at 320/390/430 px, each of en/tl/ceb; Learn launcher; search/type filters and Clear; names, Tab order and visible focus; extra-large text/strong contrast/reduced-motion preference application; missing item, offline Retry/reconnect and filter-preserving Back | Signed-out states only. No published item, populated topic/category options, content/Reader handoff, pagination success or interactive language switching |
| [ONE 2 ONE browser](../../tests/v7/one-to-one-built-artifact-browser.mjs) | Overview at 320/360/390/412/430 px; seven direct workspace routes at 390 px; authoring/assignment/invitation launchers and Back; mounted feature and overflow checks | Signed-out English surfaces. No successful role journey, real pairing, lesson persistence, response sharing or resumed progress |
| [Inherited accessibility browser](../../tests/v3-accessibility-smoke.mjs) | Accessibility controls at 390 px; names, text preference, visible focus, preference persistence, system motion, tutorial modal keyboard wrap | Checks the settings/tutorial surfaces. It is not a whole-app accessibility audit, contrast measurement or screen-reader result |
| [Build workflow](../../.github/workflows/v7-build-pwa-performance.yml) | Existing parity, PWA, build identity/performance and the three browser checks above | Headless Chromium viewport evidence does not establish Safari, installed physical-device behavior or live deployment identity |

The workflow artifact `v7-build-pwa-performance-e4b07e670a82d6babc857ac9d0848d24f79ee27f` contains `certification.json`, `build-report.json`, `evidence.sha256` and the built output. Retention is 14 days. Preserve the required candidate evidence before expiration; the run URL alone does not preserve an expired binary artifact.

## Remaining acceptance work

These rows remain OPEN. They describe completion of existing requirements, not new infrastructure or a new acceptance denominator.

| Row | Concrete browser action and expected result | Dependency / evidence owner |
|---|---|---|
| Published Library journeys | Browse each representative type; filter by its real taxonomy; open detail; verify title/source/rights; use the permitted external link or Scripture Reader handoff; return with filters retained; load the next page where enough approved records exist | Genuine approved/published content and a controlled test environment. Content decisions remain Lane D; Lane A records the UI journey |
| Library locale and readability | Change en → tl → ceb through the real language control; revisit browse/detail with the same item and filters; inspect visible labels, denied/error states and source-language fallback; check populated detail at narrow widths and extra-large text | Same approved records; no fabricated translations or injected repository service |
| Authenticated ONE 2 ONE | Exercise mentor invitation/pair lifecycle, authoring/assignment and mentee lesson/Reader/resume/completion; inspect actual keyboard and narrow-layout states; verify the accepted lesson-response sharing boundary | Controlled identities/congregation and approved curriculum. Reuse Lane B's [journey packet](P4_B_ONE_TO_ONE_JOURNEY_EVIDENCE_PREP.md), coordinating with backend evidence owners |
| Changed-surface accessibility | Keyboard-only entry/action/return; focus after loading, denial, Retry and navigation; heading/control names and status announcements; measure changed text/control contrast; inspect populated content with required text scaling | Record the actual browser and assistive tool used. Preference dataset values alone do not establish contrast or announcement quality |
| Device/deployed checks where required | Visit the named changed flow in the supported device/browser or installed-PWA environment; record deployment identity and observed behavior | Serialized release owner selects the deployment/candidate. Preserve applicable inherited V6 evidence under the governing reuse rules |

## Candidate execution and handoff

1. Complete the [representative-content gates](P4_D_REPRESENTATIVE_CONTENT_READINESS.md) and coordinate controlled backend/role journeys before claiming populated browser acceptance. Past Teaching rights research remains [OPEN](P5_D_PAST_TEACHING_RIGHTS_RESEARCH.md).
2. The serialized release owner freezes one full candidate SHA. Dispatch the existing `V7 Build PWA Performance Gate` with `candidate_sha` equal to that SHA, or reuse a successful run only when its exact selected source matches. Keep the resulting certificate, checksums and artifact. Do not create a replacement gate.
3. Record each remaining observed row against that same candidate and environment: actor/role/scope, route/action, browser/device/tool version, UTC timestamp, result and durable sanitized evidence reference. Screenshots should establish the named state without tokens, personal data or private reflection text.
4. Keep OPEN, FAIL and UNVERIFIED distinct from PASS. Report a concrete defect to its existing owner; any resulting source change creates a new candidate and requires affected recertification. No promotion follows from this preparation packet alone.

Preparation verification: existing harness/workflow scopes inspected, successful run identity/timestamp verified, local links and whitespace checked. No runtime, workflow, content decision, production or rollback change.

## Subsequent Lane A hardening

The historical table above remains tied to its named earlier run. Later Lane A work has narrowed several deterministic browser/accessibility gaps without changing the acceptance denominator:

- [Library locale/filter restoration](../../work/tasks/20261006-lane-a-library-locale-filter-restoration.md) exercises the real shell language control across en/tl/ceb, verifies submitted discovery survives reload, and verifies Clear survives reload. This does not establish populated-item translation/fallback quality.
- [Library navigation focus continuity](../../work/tasks/20261006-lane-a4-library-navigation-focus.md) gives item entry a persistent detail-status focus anchor and prevents final-page pagination from leaving focus on a hidden **Load more** control.
- [Library detail return focus](../../work/tasks/20261006-lane-a4-library-return-focus.md) restores focus to the originating Library card after the in-app Back path when that card is rendered, with persistent-status fallback when it is unavailable.
- [Library built-browser focus evidence](../../work/tasks/20261006-lane-a4-library-built-focus-evidence.md) extends the real signed-out Chromium matrix to assert browse/item error `alert` semantics, browse and item Retry focus, missing-ID and item-ID detail focus, preserved filters, and Back fallback focus. Missing-ID entry is also covered by a unit regression that verifies no item read occurs.

[Run 37472368459](https://github.com/11ll11l1l1l/BibleQuest/actions/runs/37472368459) completed successfully for exact source `d5f0eef81a1eacfa94a89a0bd3deccae5af8cda8`: lint/format/typecheck, V7 unit and contract tests, exact build identity/performance, Chromium parity, ONE 2 ONE smoke, the expanded Library 320/390/430 px × en/tl/ceb smoke, PWA acceptance, automated accessibility, certification and evidence upload all passed. PR #1276 merged those A4 changes as development merge `424da45c2e780ffb187a06dccdfdc24130604452`.

The preserved exact-source artifact is `v7-build-pwa-performance-d5f0eef81a1eacfa94a89a0bd3deccae5af8cda8`, artifact ID `11417676493`, digest `sha256:65cf311f47a3ebe5ae187a34c34281ec950ac24f3fbdcaa8815d129e2dc61ce9`, expiring 2026-10-20T13:40:47Z. Preserve it before expiry if this development evidence is required after the workflow retention window.

That successful run is development evidence for the exact source SHA only. The merge commit includes a newer concurrent development parent, so run 37472368459 must not be represented as exact-SHA release certification for `424da45c2e780ffb187a06dccdfdc24130604452` or for a later candidate. If either is selected as the release candidate, the normal candidate exact-SHA rule still applies.

The **Changed-surface accessibility** row therefore remains OPEN, but its unresolved portion is narrower: named assistive-tool/browser observation of announcement quality, measured text/control contrast, and populated-content behavior at required text scaling are still required. The published Library, populated locale/taxonomy/pagination/Reader, authenticated ONE 2 ONE, physical-device/installed-PWA, deployed identity and final candidate rows likewise remain OPEN until their stated dependencies exist and are observed.