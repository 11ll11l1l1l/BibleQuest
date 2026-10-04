# Task: P0-B V7 navigation and information architecture

Owner: P0-B executor
Branch: `agent/v7-p0-b-information-architecture`
Starting SHA: `7d972a0ecdc048fc435e5ca44f94f6d7d38692d3`
Status: IN PROGRESS — IA revised to the approved V7 pairing and communication scope; cross-lane reconciliation and P0 integration remain open

## Scope

- Define a proposed V7 app navigation hierarchy and map the current V6 shell and registered page-route keys to product families.
- Define Library shelves and detail paths for Books, Devotionals, and Past Teachings.
- Define the ONE 2 ONE pairing and curriculum journeys, seven-step lesson flow, deep links/QR, and scoped pair communication; align visibility boundaries with P0-A/C.
- Define group membership, leader deck setup, active conversation, scoped small-group communication, and wrap-up paths.
- Keep Reader handoffs, session/congregation context, privacy, and centralized Drive media boundaries visible.
- Exclusions: runtime route changes, schema/migration work, security policy changes, feature implementation, and production deployment.

## Execution and evidence

- Draft: `docs/v7/P0_B_NAVIGATION_INFORMATION_ARCHITECTURE.md`.
- Source mapping: `src/ui/shell.js` and `src/app/bootstrap.js` at the starting SHA; 5 current shell IDs and 50 exact page-route keys.
- Scope reconciliation: P0-D records the approved V7 scope as mentor/mentee pairing, curriculum, deep links/QR, and scoped direct/small-group communication. P0-B now reflects that decision. P0-A still needs pair/message relationships mapped, and P0-C must define pair/group visibility and denial cases.
- Current route keys are recorded; no IDs were invented for Library, curriculum, or deck screens.
- Central Drive media routing follows the later approved project decision. The older ImageKit-first plan remains a separate reconciliation item.
- Documentation check: checked changed Markdown links and trailing whitespace. No runtime behavior changed; runtime tests do not apply.
- PR: https://github.com/11ll11l1l1l/BibleQuest/pull/1124 (draft; do not merge before the integration owner freezes P0-A/B/C/D).

## Handoff

- Current branch head: see PR #1124 for the live head SHA; documentation commits in this update advance it.
- Authority: `V7_ACTIVE_STATUS.md` records the open P0 state and the P0-B reconciliation blockers.
- Remaining action: reconcile pair/message data with P0-A, visibility and denial rules with P0-C, and the route/ownership matrix with P0-D; then the integration owner can freeze the combined P0 contract. V7 pairing/communication scope is recorded; navigation ratification remains with the integration owner. No production impact.
