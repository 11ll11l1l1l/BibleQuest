# BibleQuest V4 Captain Index

This is the central captain-readable status file for the BibleQuest V4 design and UX overhaul.

## Authority and operating model

- Active implementation branch: `v4/modern-ui-overhaul`.
- Governing plan: `V4_MODERN_UI_DEVELOPMENT_PLAN.md`.
- Repository evidence overrides stale chat context.
- The human/chat captain is the only implementation integrator for V4.
- V4 agents are analysis/reporting-only under the current rule and must not autonomously merge runtime changes.
- Preserve the V3 single-owner architecture. V4 presentation work must not create competing owners for auth, routing, storage, Bible data, progress, scoring, media, sessions, or backend calls.
- Rebuild-and-verify remains mandatory. Presentation work and behavior/data/infrastructure work are separate change classes and must not be silently mixed.

## Current active gate

**Infrastructure Safety Net — CERTIFIED.** Checkpoint: `release/v4-infra-safety-net` @ `0a4b7f6873c1955f2c65b5044c81f0180524670b`.

`src/app/bootstrap.js`'s `start()` was split into `start()` (fail-fast wrapper) + `boot(root)` (unchanged original sequence). A startup failure now renders an actionable diagnostic into `#app` instead of a blank/frozen screen. This is the same single bootstrap owner — no second bootstrap path was created.

New regression coverage: `tests/v4-bootstrap-order-edge.mjs` statically parses `bootstrap.js` and asserts no service references a dependency declared later in the file. This was verified to actually catch the known failure class by deliberately reintroducing the historical bug in a scratch copy and confirming the test failed with the exact line/dependency pair, then restoring the correct file before commit. `tests/v4-bootstrap-safety-net-smoke.mjs` confirms normal boot is unaffected.

Verification executed and passed on the exact candidate SHA: Cloudflare deployment gate, full accumulated architecture validators, full accumulated edge regressions, guarded-field-harness syntax checks, and the full accumulated browser/mobile Playwright suite (including 320/375/768/1024px checks via `tests/v3-final-mobile-widths-smoke.mjs`). Run: `34656466994`.

**Two pre-existing regressions in the previously-uncertified Foundation A/B work were found and fixed while closing this gate** (this was the first real CI run this branch has ever had):
1. `v4-foundation.css` hid the entire `.bq-progress-chip` under 640px width (`display:none`), breaking the existing width contract expecting it visible. Fixed to match the established pattern of hiding only the small streak sublabel.
2. Bottom-nav labels (`.bq-nav a small`) were 9px, below the 10px minimum-readable-text contract. Fixed to 10px.

Both fixes are minimal, scoped only to the specific failing rule, and did not touch anything else in Foundation A/B. They do not constitute Foundation certification — Foundation B's remaining form/control primitives and full responsive/accessibility evidence are still pending per the queue below.

**Next gate: V4 Foundation certification** — finish and certify remaining Foundation B form/control primitives, then run the same full verification contract against Foundation's own exact candidate SHA before calling it certified.

## Existing V4 work retained

### Foundation A — implemented

Commit `41caa3650f0060f7b9cb0ec5e77240411bf6a17e` established:

1. V4 semantic color, typography, spacing, radius, motion, focus and elevation tokens;
2. shared surface/button behavior with V3 compatibility aliases;
3. modern responsive shell presentation without changing shell ownership or routes;
4. reduced-motion, stronger-focus and stronger-contrast behavior;
5. the first Home composition migration using shared V4 tokens and existing feature actions.

### Foundation B / Shell icon system — implemented

Commit `a8b6960f418fef766b51c9bde7f7efffcae196f3` established:

- `src/ui/icons.js` as a small trusted presentation-only SVG icon source for shell/navigation;
- the same five primary route IDs and labels with real scalable icons instead of placeholder Unicode glyphs;
- `data-ui-version="4"` while retaining `data-bq-shell="v3"` for architectural/regression compatibility;
- no remote font CDN; typography remains fallback/local-first pending an explicit offline/privacy-compatible asset decision.

The Home/Shell/Foundation changes do not modify Daily Journey, tutorial, recordings, media, progress, routing, storage, scoring, auth, Bible data, or backend service behavior.

## Experience families

| Family | Core pages | V4 personality |
| --- | --- | --- |
| **Explore / Home / Journey** | Home, Daily Mission, Progress, Bible World, Personal Mission, Calendar | Warm, aspirational, quest-like |
| **Learn / Read / Study** | Learn, Reader, Guided Study, Deep Questions, Story Journey, Wisdom, Adaptive/Open Review | Mature, editorial, calm |
| **Play / Games / Avatar** | Games, Memory Meadow, Detective, Timeline, Recall, Kids modes, Avatar Vault | Playful, tactile, collectible |
| **Grow / Reflect** | Transform, Personality, Psychometrics, Private/Cloud Notes | Personal, spacious, contemplative |
| **Community / Relational** | Community, Couples, Journey Groups, Live Rooms, Media/Recordings, Encouragements | Human, warm, trustworthy |
| **Ministry / Ops / Admin** | Ministry Hub, Assignments, Workspace, Notifications, Congregation, Content Review, Admin, Account | Restrained, professional, high-trust |

All families share one icon language, type scale, spacing system, motion language, focus/accessibility baseline, control/status system and surface/elevation model. Family personality may reskin these primitives but must not create incompatible mini design systems.

## Revised execution queue

| Order | Tranche/family | State |
| ---: | --- | --- |
| 1 | Infrastructure safety net | **CERTIFIED** — `release/v4-infra-safety-net` @ `0a4b7f6873c1955f2c65b5044c81f0180524670b` |
| 2 | V4 foundation certification | **NEXT / mandatory gate.** Implemented in part (tokens/primitives, Home migration, icon system); 2 pre-existing regressions fixed during infra-safety-net gating (progress chip visibility, nav label size); controls + full evidence still pending |
| 3 | Global shell/navigation | Implemented in part; full evidence pending |
| 4 | Home | Implemented in part; full evidence pending |
| 5 | Learn hub + Reader | Pending |
| 6 | Games + Avatar Vault | Pending |
| 7 | More hub | Pending |
| 8 | Ministry + Assignments + Workspace + Notifications | Pending |
| 9 | Bible World + Progress + Personal Mission + Calendar | Pending |
| 10 | Study family | Pending |
| 11 | Account + Notes + Transform + Psychometrics + Accessibility | Pending |
| 12 | Community + Couples + Journey Groups + Live Rooms + Media/Recordings + Encouragements | Pending |
| 13 | Admin + Content Review + Congregation + diagnostics/recovery | Pending |

## Change-class rules

- **Class A — route presentation:** route markup/CSS/artwork/accessibility presentation only; no service/state/data ownership changes.
- **Class B — shared presentation foundation:** shell/icons/primitives/type/spacing/motion/surfaces/controls; may have broad visual impact but remains service agnostic.
- **Class C — behavior/data/infrastructure:** bootstrap, services, APIs, state contracts or new data needs; must be isolated and independently verified rather than folded into a visual tranche.

If a visual redesign appears to require new data or service behavior, stop and split that requirement into a Class C tranche.

## Per-tranche delivery rule

Every significant route or tightly related group must be independently recoverable and verifiable:

1. start from the current captain-approved checkpoint;
2. implement one coherent tranche;
3. add/extend static contract protection for critical hooks/ownership boundaries;
4. run applicable architecture validators, edge tests and full browser/mobile Playwright regression against the exact candidate SHA;
5. freeze an explicit `release/v4-*` rollback/checkpoint ref only after the required evidence is complete.

A GitHub push or code inspection is not equivalent to a passing test.

## Game-feel boundary

Use game feel deliberately for Games, Avatar Vault, streak/completion moments, Bible World/progression and similar learning/reward surfaces.

Do **not** apply playful reward styling to Assignments, Ministry, Admin, Account, Content Review, moderation, permissions, private responses or other high-trust workflows. Those must look polished, modern and serious.

Every animation needs a reduced-motion fallback. Essential navigation, status, privacy, permissions, errors and correctness must never be communicated only by decoration or color.

## Parallelism rule

After the shared foundation is certified, later route/family work may be prepared in parallel on isolated branches when file ownership does not overlap. Integration remains captain-controlled and serialized so every accepted checkpoint has a clear parent and evidence set.

Under the current operating rule, V4 agents remain analysis/reporting-only even if multiple analysis lanes run concurrently.

## Agent lanes

- `v4/agent-1-architecture` — architecture / information architecture analysis.
- `v4/agent-2-experience` — responsive UX / accessibility / PWA presentation analysis.
- `v4/agent-3-character` — product character / interaction identity / motion analysis.
- `v4/agent-4-design` — design system / components / visual hierarchy analysis.
- `v4/agent-5-governance` — synthesis / governance analysis.

Agent reports are inputs, not implementation authority. Placeholder/scaffold reports are not completed findings. Recommendations must be reconciled against `V4_MODERN_UI_DEVELOPMENT_PLAN.md` and current repository evidence before adoption.

## Verification contract

For every applicable V4 candidate SHA:

- preserve V3 single-owner architecture and public feature behavior unless a separately approved behavior tranche changes it;
- run existing architecture/single-owner validators;
- run relevant edge/regression tests;
- run the full browser/mobile Playwright suite before a page/family tranche is certified;
- verify representative widths at 320, 375, 768 and 1024 px;
- verify no horizontal overflow on required mobile paths;
- verify approximately 44 px minimum interactive targets where established contracts require them;
- verify visible keyboard focus and logical order;
- verify `prefers-reduced-motion` behavior;
- verify stronger-contrast readability;
- verify status/error/selection/disabled states do not rely only on color/decoration;
- verify existing route/service owners still receive the intended actions;
- preserve or deliberately migrate critical `data-*` hooks together with their tests;
- record any unexecuted browser/test gate explicitly as open.

## Verification evidence currently on record

- Foundation B `icons.js` and modified `shell.js` were syntax-checked with `node --check` before their repository write.
- Navigation route IDs remain `home`, `learn`, `play`, `grow`, `more`; the icon presentation/brand subtitle changed without rerouting them.
- GitHub Actions reported no workflow runs for `v4/modern-ui-overhaul` during the Foundation A/B work; no CI pass is claimed from those pushes.
- A browser checkout was unavailable in the earlier execution environment, so full browser evidence for Foundation/Shell/Home remains open and must be obtained before those tranches are called certified.

## Checkpoint progression

Recommended first checkpoints after verification:

- `release/v4-infra-safety-net`
- `release/v4-foundation`
- `release/v4-shell`
- `release/v4-home`
- then `release/v4-<route-or-family>` as migration proceeds.

A checkpoint name must point to the exact SHA whose required evidence passed.

## Next captain action

1. Implement and verify the isolated bootstrap infrastructure safety-net tranche.
2. Finish/certify remaining Foundation B form/control primitives and responsive/accessibility evidence.
3. Certify Global Shell/Navigation.
4. Certify Home.
5. Begin Learn hub + Reader.

Do not broaden route redesign until the infrastructure safety gate is closed. Do not merge agent branches wholesale; adopt only reconciled, source-backed findings.