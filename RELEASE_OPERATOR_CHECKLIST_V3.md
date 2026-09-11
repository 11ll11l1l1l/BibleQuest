# BibleQuest v3 release operator checklist — current

Updated: 2026-09-12 JST after independent current-production two-host verification and field-validation protocol formalization.

This checklist is subordinate to the latest explicit user instruction, `DEVELOPMENT_PRIORITY_V3.md`, `RECONCILIATION_V3.md`, `DEVELOPMENT_HANDOFF_V3.md`, and `DEVELOPMENT_STATUS_V3.md`. The date-specific sequencing in `RELEASE_6PM_2026-09-11.md` is historical release-control context; do not revive expired clock deadlines or old development branches when current repository evidence has advanced.

## Recover truth before writing

- Recover live `main`, recent commits, open PRs, frozen release refs and exact workflow evidence.
- Read `DEVELOPMENT_PRIORITY_V3.md`, `RECONCILIATION_V3.md`, `DEVELOPMENT_HANDOFF_V3.md`, `DEVELOPMENT_STATUS_V3.md`, `RELEASE_ACCEPTANCE_MATRIX_V3.md`, and `RELEASE_FIELD_VALIDATION_V3.md`.
- Treat `FEATURE_INVENTORY_V3.md` and `RELEASE_CLOSEOUT_V3.md` as historical evidence where newer authority documents supersede them.
- Repository evidence and the latest explicit user instruction override stale prose.
- Do not repeat a completed milestone merely because an older branch, issue body, prompt or checklist calls it pending.

## Current verified identities

Re-check live before acting. At this checklist update:

- exact-green product: `2c601b3289dba891f349801219f49804f85f63cc`;
- frozen product ref: `release/v3-phase-b-progress-artwork-20260912`;
- product accumulated run: `34633247237` — success;
- exact-green release-validation integration: `d0eab188479f20273cbd67cb5b796c74868dc5d4`;
- frozen validation ref: `release/v3-final-mobile-width-gate-20260912`;
- validation run: `34634460077` — success;
- repository `main` during fresh production verification: `452e84cdbe1a63dc86d4079ff3bf0f6a9edc8f8b`;
- production verifier: run `34637203062`, job `103387887268` — success;
- rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`.

Later documentation-only commits do not become a new product SHA.

## Product-change firewall

Do not change product/runtime code unless current evidence demonstrates one of the following:

- a reproduced current-v3 P0/P1 functional, security, privacy, data-loss or core-availability defect;
- a mandatory field/production correction revealed by release evidence;
- a material remaining visual gap under Issue #94 that is demonstrated on the current product and can be corrected without architecture/navigation/backend/behavior redesign.

Do not create automatic cosmetic tranches merely because Issue #94 remains open. More, Calendar, Personal Mission, Avatar Vault, Account and Progress/Grow Phase B are already accepted checkpoints and their checked assets/styles are proven live on both production hosts.

If product code changes, establish a new exact candidate and rerun the required complete release cycle. Never transfer PASS from an earlier product SHA.

## Automated candidate gate — green for the current product/validation state

The accumulated exact-candidate workflow has passed:

- `bash build.sh` / Cloudflare deployment gate;
- architecture/ownership validators;
- edge/security/static regressions;
- browser/mobile regressions;
- explicit 320/360/390/412/430 px current-v3 acceptance;
- PWA install and offline-shell checks;
- accessibility/reduced-motion-sensitive checks;
- accepted Phase B focused regressions through Progress/Grow.

Do not claim these results for a changed product SHA without rerunning the required gates.

## Independent two-host production gate — complete

Run `34637203062` provides fresh production proof for the intended current product state:

- current `main` identity was asserted during verification;
- `bash build.sh` passed;
- selected current shell/runtime and accepted Phase-B product files were fetched from both Cloudflare hosts and matched byte-for-byte;
- canonical `https://mybiblequest.pages.dev/` passed the current hosted shell, explicit five-width, Reader, accepted Phase-B surface, Assignments, Ministry Hub, Workspace, accessibility and offline-shell browser checks;
- compatibility `https://biblequest-7th.pages.dev/` passed the same suite.

Do **not** repeat this production-host gate unless product/runtime bytes change or new evidence invalidates it.

## Remaining official-release evidence

Execute the remaining field gates using `RELEASE_FIELD_VALIDATION_V3.md` so account roles, evidence capture, privacy boundaries, negative-isolation checks, failure handling, and release consequences are consistent. The protocol does not replace the acceptance matrix; it operationalizes the field-only evidence already required there.

### Issue #68 — multi-account field validation

Use real/test accounts and actual product UI/API/auth/RLS paths. Required coverage includes congregation/Journey Group creation and joining, Cloud Teams, group/team-targeted assignments, linked-couple assignments and couples challenge semantics, Live Room host/join across sessions/devices, reconnect/reload/re-login behavior, expected rows/realtime behavior, negative isolation, and invalid/expired invite behavior.

Do not insert production rows directly or weaken auth/RLS to manufacture PASS. Static/headless CI does not close this gate.

### Issue #6 — physical mobile/PWA validation

Automated and hosted-headless width coverage for the current five-tab shell is complete. Remaining evidence is a real Android Chrome/Brave session at 100% zoom plus a genuinely installed-PWA **device** check. Do not restore obsolete four-tab/nine-node wording from the historical issue body.

### Cloudflare internal provider metadata — only if strictly required

Current live product-content identity is proven by run `34637203062`. The connected repository tooling does not expose a Cloudflare-internal deployment object/ID. If release policy additionally requires that internal provider metadata, obtain it only through an authorized provider connection that exposes it; do not infer or invent it.

Absence of an internal provider ID in the current toolset is not evidence of deployment failure.

## Production/Supabase boundaries

Known release migrations remain applied and live verified and must not be replayed:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Do not mutate Supabase schema/data/RLS/Edge Functions merely to close a release checklist item. Any backend change requires a reproduced current-v3 defect and its own verification.

## Release completion rule

Do not call the official release complete until the latest release decision's required remaining field evidence is satisfied or explicitly waived/documented. Under the current strict matrix, that means:

1. the intended exact product remains green under the required automated cycle;
2. Issue #68 multi-account field evidence is completed;
3. physical Android/installed-PWA device evidence is completed;
4. independent two-host live-production proof remains valid — currently complete via run `34637203062`;
5. Cloudflare-internal provider metadata is recorded only if policy explicitly requires that additional evidence class;
6. any defect found by remaining gates is fixed in the correct owner and the changed exact candidate is fully reverified.

Do not call the application bug-free.
