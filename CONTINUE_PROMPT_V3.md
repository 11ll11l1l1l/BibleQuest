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

latest user instruction → `DEVELOPMENT_PRIORITY_V3.md` → current handoff/status → milestone contracts/exact-SHA evidence → release-parity ledger → historical release/visual/agent documents.

`RELEASE_6PM_2026-09-11.md` and `RELEASE_AGENT_READONLY_2026-09-11.md` are historical evidence from the completed September 11 release. Do not let them stop valid post-release feature, artwork or Calendar development.

CURRENT PRIORITY

Priority 1 contains three active streams:

- **1A Functional completion/correctness** — finish accepted/currently planned functionality and fix reproduced defects while preserving established owners and contracts.
- **1B Visual/artwork Phase B** — continue the required quality upgrade with real polished icon artwork, illustrations and backgrounds where appropriate. The earlier visual tranche program through tranche 16 is Visual Phase A/first-pass presentation polish, not the final visual target.
- **1C Calendar** — Calendar is active Priority 1 work. Recover existing requirements first; if none exist, define `CALENDAR_V3.md`, then implement through existing architecture. Do not defer Calendar until every cosmetic task is finished.

VISUAL-AUTOMATION RULE

If approved visual work requires a generated image, icon, illustration, background, texture or similar asset: **generate → choose → optimize → implement → test**. Do not stop to ask me to approve the generated image. A generated asset that is not actually wired into the UI does not count as completed work.

REBUILD-AND-VERIFY

- one owner/source of truth per responsibility;
- no competing Supabase/API/state owners;
- focused tests for changed owners/surfaces;
- exact-SHA accumulated architecture, edge/security/static, browser/mobile, PWA/offline and accessibility verification at suitable checkpoints;
- never transfer PASS across changed product SHAs;
- never claim unexecuted tests;
- documentation-only commits are not verified product candidates;
- preserve production Supabase/data until an explicit integration requirement exists;
- do not weaken validators merely to get green;
- do not call the app bug-free.

AGENT FINDINGS

Use investigators as evidence, not automatic orders. Revalidate historical P0/P1 against the current exact product checkpoint before allowing it to interrupt current work. Suppress stale, speculative, duplicate and already-fixed findings.

EXECUTE, DO NOT ONLY REPORT

1. Recover the newest exact-green post-release product SHA and distinguish it from later documentation/verifier HEADs.
2. Identify the highest-value dependency-safe unfinished Priority 1 milestone.
3. Execute it immediately when safe.
4. Implement required artwork directly rather than asking for image approval.
5. Run focused and exact-SHA accumulated verification as appropriate.
6. Preserve/update evidence and continue to the next dependency-safe Priority 1 task while safe executable work remains.

Do not repeatedly ask me to type “continue,” repeat repository context, or re-approve routine implementation choices already authorized here.

Keep production and development separate. A green post-release branch is not automatically production-live; migrations, promotion, Cloudflare propagation and live smoke require a separately selected integration/release step.

Retired #39 Hiragana Match and #40 Kids Bible Who Am I remain retired unless explicitly reopened.

At the end of each response, state factual status only: production/main HEAD, active development branch, newest exact-green product SHA, what was actually completed, verification actually run, credible unresolved blockers, next Priority 1 step, whether production/Supabase were touched, and anything that truly requires my action.

---
