# Task: P0-B V7 navigation and information architecture

Owner: P0-B executor
Branch: `agent/v7-p0-b-information-architecture`
Starting SHA: `7d972a0ecdc048fc435e5ca44f94f6d7d38692d3`
Status: IN PROGRESS — deliverable drafted; P0 integration and scope ratification remain open

## Scope

- Define a proposed V7 app navigation hierarchy and map the current V6 shell and registered page-route keys to product families.
- Define Library shelves and detail paths for Books, Devotionals, and Past Teachings.
- Define the reusable discipleship curriculum path and seven-step lesson flow; preserve mentor/mentee pairing as an open V7/V8 scope decision.
- Define group membership, leader deck setup, active conversation, and wrap-up paths.
- Keep Reader handoffs, session/congregation context, privacy, and centralized Drive media boundaries visible.
- Exclusions: runtime route changes, schema/migration work, security policy changes, feature implementation, and production deployment.

## Execution and evidence

- Draft: `docs/v7/P0_B_NAVIGATION_INFORMATION_ARCHITECTURE.md`.
- Source mapping: `src/ui/shell.js` and `src/app/bootstrap.js` at the starting SHA; 5 current shell IDs and 50 exact page-route keys.
- Cross-lane reconciliation: P0-A and P0-D propose curriculum-only V7 and defer mentor/mentee pairing, which conflicts with the earlier user requirement for full ONE 2 ONE pairing and the later V7 scope question. No owner decision has been inferred.
- Current route keys are recorded; no IDs were invented for Library, curriculum, or deck screens.
- Central Drive media routing follows the later approved project decision. The older ImageKit-first plan remains a separate reconciliation item.
- Documentation check: checked changed Markdown links and trailing whitespace. No runtime behavior changed; runtime tests do not apply.
- PR: https://github.com/11ll11l1l1l/BibleQuest/pull/1124 (draft; do not merge before the integration owner freezes P0-A/B/C/D).

## Handoff

- Current branch head: `0867dd31a107736018f9efb79962f869781d54a3`.
- Authority: `V7_ACTIVE_STATUS.md` records the open P0 state and the P0-B reconciliation blockers.
- Remaining action: integration owner maps route-specific permission/evidence rows with P0-C/D, resolves the V7 discipleship scope and proposed nav placement, then freezes the combined P0 contract. No production impact.
