# BibleQuest v3 generic continue prompt

Use the following prompt in a new ChatGPT/Work development chat.

---

Continue development of my BibleQuest v3 project from the **exact current repository state**.

Repository: `11ll11l1l1l/BibleQuest`

Before writing anything:

1. Read `DEVELOPMENT_PRIORITY_V3.md` first. It is the current post-release task-selection authority.
2. Read `DEVELOPMENT_HANDOFF_V3.md` and `DEVELOPMENT_STATUS_V3.md`.
3. Read `FEATURE_INVENTORY_V3.md` only as the release-parity ledger, not as the complete post-release roadmap.
4. Read `ARCHITECTURE_V3.md` and milestone-specific contracts as needed.
5. Recover live `main`, active `postrelease/v3-*` branches, exact product SHAs, documentation-only HEADs, recent commits and actual GitHub Actions evidence.
6. Recover the newest agent/investigator findings, but revalidate any blocker reported against an older SHA before acting.
7. Repository evidence and the user's latest explicit instruction override stale documentation.

DOCUMENT AUTHORITY

When instructions conflict, use:

latest user instruction → `DEVELOPMENT_PRIORITY_V3.md` → current handoff/status → milestone contracts/exact-SHA evidence → release-parity ledger → historical release/visual/agent documents.

`RELEASE_6PM_2026-09-11.md` and `RELEASE_AGENT_READONLY_2026-09-11.md` are historical evidence from the completed September 11 release. Do not let them stop valid post-release feature, artwork or Calendar development.

CURRENT PRIORITY

Priority 1 contains three active streams:

- **1A Functional completion/correctness** — finish accepted/currently planned functionality and fix reproduced defects while preserving established owners and contracts.
- **1B Visual/artwork Phase B** — continue the required quality upgrade with real polished icon artwork, illustrations and backgrounds where appropriate. The earlier visual tranche program through tranche 16 is only Visual Phase A/first-pass presentation polish; it does not mean the requested artwork upgrade is finished.
- **1C Calendar** — Calendar is active Priority 1 work. Recover existing requirements first; if none exist, define `CALENDAR_V3.md`, then implement it through existing architecture. Do not defer Calendar until every cosmetic task is finished.

Sequence Priority 1 work by dependencies and risk. A prerequisite may be completed before Calendar, and functional + visual work may be completed together on one user-facing surface when safe.

VISUAL-AUTOMATION RULE

If an approved visual improvement requires a generated image, icon, illustration, background, texture or similar asset:

**generate → choose → optimize → implement → test**.

Do **not** stop to ask me whether I like the generated image or whether it should be implemented. Choose the appropriate result yourself and wire it into the real UI. A generated image that is not actually implemented does not count as completed work.

Preserve information architecture, navigation, feature ownership, persistence, backend contracts, accessibility and responsive behavior unless a separately selected product change explicitly requires otherwise.

ICON-ASSET-MAP RULE

For future visual rebuild work, `docs/V3_ICON_ASSET_MAP.md` is the canonical semantic map for the generated PNG icon family stored under `assets/icons/v3/`.

Before generating or assigning an icon:

1. read `docs/V3_ICON_ASSET_MAP.md`;
2. reuse the mapped PNG when it correctly matches the existing feature/action/state;
3. respect `CORE`, `ACTION`, `STATE`, `CONTENT`, and `RESERVE` classifications in that guide;
4. do not invent a feature, route, state, reward, or control merely to use an available PNG;
5. do not change navigation or architecture to force an icon into the product;
6. if a mapped asset is replaced, preserve its semantic role and update the map in the same milestone;
7. implement mapped visual assets directly during a selected visual milestone without asking for routine per-image approval;
8. verify responsive layout, touch targets, accessible names, state accuracy, and focused/accumulated regressions after wiring the asset.

The asset map is a planning contract for the rebuild, not an instruction to install every icon into the live UI at once.

REBUILD-AND-VERIFY

- one owner/source of truth per responsibility;
- no competing Supabase/API/state owners;
- reproduce defects before fixing them;
- focused tests for changed owners/surfaces;
- accumulated architecture, edge/security/static, browser/mobile, PWA/offline and accessibility verification at exact checkpoints;
- never transfer PASS across changed product SHAs;
- never claim an unexecuted test;
- documentation-only commits are not verified product candidates;
- do not weaken validators merely to get green;
- preserve production Supabase/data until an explicit verified integration step requires change;
- do not call the app bug-free.

AGENT FINDINGS

Use investigator results as evidence, not automatic orders. Reject stale, speculative, duplicate, already-fixed or low-impact findings. A historical P0/P1 must be revalidated against the current exact product checkpoint before it interrupts current work.

EXECUTE, DO NOT ONLY REPORT

In this chat:

1. recover the actual current checkpoint and newest exact-green post-release product SHA;
2. distinguish product SHA from later documentation/verifier commits;
3. identify the highest-value dependency-safe unfinished Priority 1 milestone;
4. execute it immediately when safe;
5. implement required artwork directly rather than asking for image approval;
6. run focused verification and exact-SHA accumulated verification as appropriate;
7. preserve/update evidence;
8. reassess Priority 1 and continue to the next dependency-safe task while safe executable work remains.

Do not repeatedly ask me to type “continue.” Do not ask me to repeat repository context already available. Do not ask for routine approval already authorized by these instructions.

Keep production and development separate. A green post-release branch is not automatically production-live; migrations, promotion, Cloudflare propagation and live smoke require a separately selected integration/release step.

Retired #39 Hiragana Match and #40 Kids Bible Who Am I remain retired unless I explicitly reopen them.

At the end of each response, state factual status only: production/main HEAD, active development branch, newest exact-green product SHA, what was actually completed, verification actually run, credible unresolved blockers, next Priority 1 step, whether production/Supabase were touched, and anything that truly requires my action.

---
