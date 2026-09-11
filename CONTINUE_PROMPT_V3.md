# BibleQuest v3 generic continue prompt

Use this in a future BibleQuest development/release chat. Recover live repository truth first and skip milestones already completed by then.

---

Continue development and release preparation of BibleQuest v3 from the **exact current repository state**.

Repository: `11ll11l1l1l/BibleQuest`

## Recover truth first

1. Read `DEVELOPMENT_PRIORITY_V3.md`.
2. Read `RECONCILIATION_V3.md`, `DEVELOPMENT_HANDOFF_V3.md`, and `DEVELOPMENT_STATUS_V3.md`.
3. Read `RELEASE_ACCEPTANCE_MATRIX_V3.md`, `RELEASE_OPERATOR_CHECKLIST_V3.md`, and `RELEASE_FIELD_VALIDATION_V3.md`.
4. Read `FEATURE_INVENTORY_V3.md` and `RELEASE_CLOSEOUT_V3.md` only as historical ledgers where newer authority documents supersede them.
5. Read `ARCHITECTURE_V3.md` and the relevant feature contract only as needed for ownership/boundary decisions.
6. Recover live `main`, recent commits, open PRs, frozen product/validation/rollback refs, exact workflow runs, current Supabase migration state, and current issue/investigator evidence.
7. Repository evidence and my latest explicit instruction override stale prose, old issue wording and older continuation prompts.

Do not repeat a completed milestone merely because an older branch/document describes it as pending.

## Current known checkpoint — re-check live

At the time this prompt was updated:

- repository `main` at field-readiness consolidation start: `ad6c6a7e0afaf9dcb38638f7a3a6fd7c047f2b14`;
- exact-green product SHA: `2c601b3289dba891f349801219f49804f85f63cc`;
- frozen product ref: `release/v3-phase-b-progress-artwork-20260912`;
- product accumulated run: `34633247237` — success;
- exact-green final-mobile validation SHA: `d0eab188479f20273cbd67cb5b796c74868dc5d4`;
- frozen validation ref: `release/v3-final-mobile-width-gate-20260912`;
- validation run: `34634460077` — success;
- latest complete release-control regression head: `6dcf40096df4cb6785ea1a38753887ba9c71859e`;
- latest complete release-control regression run: `34648966867` — success;
- repository `main` during fresh live-production verification: `452e84cdbe1a63dc86d4079ff3bf0f6a9edc8f8b`;
- current-production verifier branch: `verify/v3-production-current-452e84c-20260912`;
- verifier commit: `197056e374f06b59246dcf953405818b89ffde9d`;
- production verifier run `34637203062`, job `103387887268` — success;
- rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.

PR #111 and later release-control commits changed validation/tests/workflows/documentation, not the exact-green product identity unless repository evidence explicitly shows otherwise. A later documentation/workflow HEAD is not a new product SHA. The exact-green product remains `2c601b3...` until product/runtime code changes and earns a new complete verification.

Current `main` contains the exact-green product ancestry. Re-check with repository evidence rather than assuming any hard-coded `main` SHA remains current.

## Completed work — do not repeat automatically

The accepted product already contains the required current v3 feature scope plus accepted visual checkpoints through:

- More Phase B;
- Calendar Phase B;
- Personal Mission Phase B;
- Avatar Vault Phase B;
- Account Phase B;
- Progress/Grow Phase B;
- Calendar creator edit/delete;
- Ministry Hub Calendar;
- accumulated v3 architecture/security/browser/PWA regressions.

The permanent final mobile/build release gate has passed, including 320/360/390/412/430 px acceptance against the current five-tab shell (`Home`, `Learn`, `Play`, `Grow`, `More`). Do not restore obsolete four-tab/nine-node behavior from historical Issue #6 wording.

Independent current-production proof is complete: run `34637203062` byte-matched selected current release files on both Cloudflare Pages hosts and ran the current hosted browser/mobile suite successfully on both. Do not repeat this gate merely because a later docs/test/workflow commit moved `main`; rerun it only if product/runtime bytes change or new evidence invalidates it.

Issue #94 visual integration/polish milestone is **complete and closed**. Do not reopen it or create another cosmetic tranche unless new current field/production evidence demonstrates a material placeholder, broken/generic asset, or inconsistent surface that fails the approved BibleQuest visual direction.

Repository-side Issue #68 field preparation is also complete enough to execute the real field matrix. The current tree contains:

- `tests/v3-field-validation-harness.mjs` for guarded multi-account relationship/isolation field paths;
- `tests/v3-field-linked-assignment-harness.mjs` for guarded linked/group/team assignment field paths;
- `tests/v3-field-live-room-harness.mjs` for guarded current-contract Live Room field paths.

PR #120 made the canonical v3 regression syntax-check all three harnesses. Exact head `ab0b9eba970e4ce2a56ad4793d212a16abf3e351` passed run `34648510971`. PR #121 then reconciled the Live Room field protocol to the shipped Feature Inventory #43 contract; exact head `6dcf40096df4cb6785ea1a38753887ba9c71859e` passed full run `34648966867` and merged as `ad6c6a7...`.

The current #43 Live Room acceptance is `create/join/leave; reconnect; no stale room state`. Current v3 does **not** expose a room question/answer/scoring loop. Do not invent room scoring/rounds/progression or require `bible_room_responses` activity merely to satisfy stale wording.

The guarded harnesses are supplemental tooling only. Their presence or syntax PASS does not count as real Account A/B/C field PASS and does not replace physical-device/network/PWA evidence.

## Production Supabase state — re-check before any schema work

Production project: `zkfmgezvzugchcwppreq`.

The following release migrations are already applied and live verified and must not be replayed:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Latest read-only field-readiness inspection confirmed an A/B/C-capable account topology but no active linked couple yet. A legitimate test couple must be completed/accepted through the normal product UI before the couples field scenarios can be claimed.

Do not mutate production schema/data/RLS/Edge Functions merely to close release evidence. Any backend change must follow a reproduced current-v3 defect and its own exact verification. Do not direct-insert rows to manufacture field PASS.

## Current Priority 1 — finish field evidence, not feature churn

Unless my latest instruction changes it, the next route is:

1. preserve the current exact-green product separately from later validation/release-control identities;
2. interrupt only for a credible reproduced current-v3 P0/P1 or material release-blocking defect demonstrated by field/production evidence;
3. complete Issue #68 multi-account field validation using legitimate real/test accounts, multiple independent sessions/devices and actual product UI/API/auth/RLS paths; use the guarded field harnesses where they reduce operator error, but never equate harness availability with PASS;
4. complete/accept a legitimate linked test couple through the product UI before the couples scenarios;
5. complete Issue #6 physical Android Chrome and Brave at 100% zoom plus genuinely installed-PWA **device** acceptance;
6. do not rerun independent two-host production verification unless product/runtime bytes change or new evidence invalidates it;
7. if strict release policy additionally requires the Cloudflare-internal deployment object/ID, obtain it only through an authorized provider connection that exposes it; do not infer or invent it;
8. if field/provider evidence exposes a real product defect, fix the true architectural owner, create a new exact product candidate and rerun the complete release cycle and renewed live proof. Never transfer PASS.

Do not manufacture Issue #68 PASS by direct database inserts, privileged backend mutation, synthetic relationship rows, or by weakening auth/RLS. Static/headless CI is not multi-account field proof.

If the current runtime cannot access a physical device, authenticated multi-account sessions, or provider-internal metadata, complete all safe evidence/reconciliation work available, record those gates accurately, and do not pretend they passed or failed.

## Visual/artwork rule

Issue #94 is closed, so visual work is no longer an automatic release tranche. For any genuinely selected visual correction triggered by new current evidence, preserve the existing interface, navigation, feature ownership and behavior. Presentation-level artwork/icons/backgrounds/theme assets may be replaced or improved without asking me for routine image approval.

If artwork is generated as part of an approved visual correction, use the selected asset directly when it meets the requirement; do not stop merely to ask me to approve the image. Ask only when the decision materially changes scope, information architecture, fundamental interaction behavior, privacy/security policy, ownership or another major unresolved product decision.

Use the smallest correct presentation owner. Do not patch around visual defects with speculative global CSS, uncontrolled `!important`, duplicate DOM/components, copied legacy implementations or hidden-control workarounds.

## Rebuild-and-verify rules

- one owner/source of truth per responsibility;
- preserve `src/core/api.js` as the single browser Supabase/backend owner unless intentionally redesigned;
- no competing state/backend systems;
- reproduce defects where applicable;
- fix root cause in the true owner;
- run focused checks, then required accumulated verification;
- every changed product SHA earns its own PASS;
- never transfer PASS;
- never claim unexecuted tests;
- docs/validation/workflow-only commits are not new product candidates;
- a field harness existing or syntax-checking green is not proof that the real field scenario passed;
- never weaken validators, auth or RLS merely to obtain green;
- GitHub validation, provider-internal metadata and independent live-production proof are separate evidence classes;
- static/headless browser CI is not real multi-account/device field proof;
- preserve frozen refs and rollback points;
- do not call the app bug-free.

## Priority firewall

- P0 — severe reproduced current production/security/privacy/data-loss/core outage.
- P1 — major current user-facing release capability broken without a reasonable workaround, or mandatory release correction proven by field/production evidence.
- P2 — real but nonblocking defect/usability issue.
- P3 — speculative/cosmetic/low-impact work outside the accepted visual plan.

Historical findings must be revalidated against the current v3 owners before they interrupt the release route.

## Execute, do not only report

Recover current truth, determine what is already complete, select the highest-value dependency-safe unfinished release gate, execute all safe work available immediately, verify the exact evidence, preserve rollback, update documentation when truth changes, and continue while safe work remains. Do not repeatedly ask me to type “continue”.

Report separately:

- live `main` HEAD;
- exact-green product SHA;
- exact-green validation SHA;
- latest release-control regression evidence;
- active development/verification branch if any;
- work actually completed;
- tests/workflows actually executed;
- production migration state;
- credible unresolved P0/P1 blockers;
- remaining field/provider-internal release gates;
- whether product code, production Supabase or Cloudflare were touched;
- anything that genuinely requires user/device/account action.

Retired #39/#40 remain retired unless explicitly reopened.

---
