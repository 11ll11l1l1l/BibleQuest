# BibleQuest v3 — Current Development Priority

Updated: 2026-09-12 JST after current-production two-host verification.

## Current truth

- exact-green product: `2c601b3289dba891f349801219f49804f85f63cc`
- product ref: `release/v3-phase-b-progress-artwork-20260912`
- product run: `34633247237` — success
- exact-green release-validation SHA: `d0eab188479f20273cbd67cb5b796c74868dc5d4`
- validation ref: `release/v3-final-mobile-width-gate-20260912`
- validation run: `34634460077` — success
- live verified repository `main` at verification time: `452e84cdbe1a63dc86d4079ff3bf0f6a9edc8f8b`
- current-production verifier: run `34637203062`, job `103387887268` — success
- rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

PR #111 is validation/docs/workflow only. Later release-control/docs commits do not replace `2c601b3...` as the exact-green product unless product code changes and earns its own complete verification.

## Authority order

1. latest explicit user instruction;
2. this file for cross-feature priority;
3. `RECONCILIATION_V3.md` for product/release ancestry;
4. `DEVELOPMENT_HANDOFF_V3.md` / `DEVELOPMENT_STATUS_V3.md`;
5. `RELEASE_ACCEPTANCE_MATRIX_V3.md` for final evidence classes;
6. exact workflow/deployment/live evidence;
7. historical inventory/agent evidence.

## Priority 1 — finish field evidence, not feature churn

### 1A — current-v3 correctness firewall

No current-v3 P0/P1 product/security/privacy/data-loss defect is presently reproduced. Any new credible P0/P1 interrupts field-evidence work. Stale issue labels, old root-runtime bugs or advisor warnings without exploitable impact do not.

Do not import PR #88 legacy-root behavior into v3 unless reproduced through current owners.

### 1B — mobile/PWA gate

Automated and hosted headless acceptance is complete:

- `bash build.sh` passed;
- 320/360/390/412/430 current-v3 width matrix passed;
- five current primary routes `Home`, `Learn`, `Play`, `Grow`, `More` fit and remain usable;
- Daily Journey remains discoverable;
- topbar/header fit, touch targets, support/body text floor, no horizontal overflow and no console/page errors passed;
- accumulated PWA install/offline-shell regressions passed;
- run `34637203062` repeated the current five-width and related browser checks directly against both Cloudflare production hosts successfully.

Issue #6 remains open only for field proof that headless CI cannot honestly provide: physical Android Chrome/Brave at 100% zoom and a genuinely installed-PWA device session. Do not regress the product to obsolete four-tab/nine-node structure.

### 1C — multi-account field gate

Issue #68 is now the largest functional release-evidence gap.

Production implementation is present and healthy, but actual Journey Group / Cloud Team / Live Room field relationships are not currently populated. Required next evidence uses multiple real/test accounts and sessions to exercise:

- congregation and Journey Group create/join;
- Cloud Team create/add/remove + assignment targeting;
- Journey Group assignment isolation;
- linked couple assignment and couples challenge shared-day semantics;
- Live Room host/join across sessions/devices;
- reconnect/reload/re-login behavior;
- expected rows/realtime behavior;
- unrelated-account/group/couple read/write denial;
- expired/invalid invite behavior.

Do not mutate production tables directly to simulate this acceptance. Use the actual product UI/API/auth/RLS paths.

### 1D — Visual Phase B

Accepted exact-green visual checkpoints include More, Calendar, Personal Mission, Avatar Vault, Account and Progress/Grow. Do not repeat them.

Run `34637203062` confirmed the checked current Phase-B production files byte-for-byte on both Pages hosts and passed the corresponding hosted browser smokes. Issue #94 remains the release integration tracker, but further product visual work is selected only if current evidence shows a material placeholder, generic, broken or inconsistent surface.

### 1E — provider/production gate

Current production evidence now proves:

- current `main` was fixed at `452e84c...` during verification;
- both `mybiblequest.pages.dev` and `biblequest-7th.pages.dev` returned byte-for-byte matches for the checked current shell/runtime plus accepted Phase-B assets/styles;
- both hosts passed the current live browser/mobile suite, including explicit phone widths and critical current surfaces.

Therefore **independent two-host production-content/browser verification is complete** for the intended product state.

The repository connection does not expose a Cloudflare-internal deployment object/ID. If strict provider metadata is required in addition to content identity, that exact internal provider identity remains external evidence; do not confuse its absence with a deployment failure.

## Security hardening status

- checked poll aggregate `SECURITY DEFINER` RPCs authorize congregation membership; no blocker reproduced;
- checked BibleQuest no-policy server-only tables have anon/authenticated DML closed; do not add permissive RLS policies to silence INFO;
- leaked-password protection is disabled; treat as recommended platform hardening rather than evidence of a current product regression.

## Production migrations

Remain **APPLIED + LIVE VERIFIED** and must not be reapplied:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

## Priority firewall

- P0 — severe reproduced current production/security/privacy/data-loss/core outage.
- P1 — major current user-facing release capability broken without reasonable workaround, or a mandatory release correction proven by field/production evidence.
- P2 — real but nonblocking defect/usability issue.
- P3 — speculative/cosmetic/low-impact work outside the accepted visual plan.

## Non-negotiable rules

Rebuild-and-verify; one source of truth per responsibility; preserve `src/core/api.js` ownership; every product change earns complete verification; never transfer PASS; docs/validation SHA != product SHA; static/headless CI != physical-device or real multi-account field proof; do not weaken tests/RLS/auth to obtain green; preserve frozen refs and rollback; GitHub verification, provider metadata and independent production proof stay separate; do not call the app bug-free.
